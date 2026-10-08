'use client'

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useField, useTheme, FieldLabel, FieldDescription, FieldError } from '@payloadcms/ui'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// Dynamically load MDEditor with SSR disabled to prevent hydration & SSR issues in Next.js
const MDEditor = dynamic(() => import('@uiw/react-md-editor').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 380,
        border: '1px solid var(--theme-elevation-150, #333)',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--theme-elevation-400, #888)',
        background: 'var(--theme-elevation-50, #181818)',
      }}
    >
      Loading Markdown Editor...
    </div>
  ),
})

export const MarkdownEditor = (props) => {
  const { path, field, readOnly } = props
  const { theme } = useTheme()

  const { value = '', setValue, errorMessage, showError } = useField({ path })

  // 1. Maintain local state so keystrokes update synchronously within React's event loop.
  // This prevents asynchronous form-store lag where @uiw/react-md-editor resets caret to the end.
  const [localValue, setLocalValue] = useState(() => (typeof value === 'string' ? value : ''))
  const [previewMode, setPreviewMode] = useState('live')

  const localValueRef = useRef(localValue)
  localValueRef.current = localValue

  const lastDispatchedValueRef = useRef(typeof value === 'string' ? value : '')
  const isFocusedRef = useRef(false)
  const debounceTimerRef = useRef(null)
  const editorWrapperRef = useRef(null)
  const selectionRef = useRef(null)

  const isReadOnly = readOnly || field?.admin?.readOnly

  // 2. Synchronize external value changes (initial load, form reset, discard changes, switching documents).
  useEffect(() => {
    const incoming = typeof value === 'string' ? value : ''
    if (incoming !== lastDispatchedValueRef.current && incoming !== localValueRef.current) {
      setLocalValue(incoming)
      localValueRef.current = incoming
      lastDispatchedValueRef.current = incoming
      selectionRef.current = null
    }
  }, [value])

  // 3. Immediately flush local value to Payload CMS form store (on blur, submit, save shortcut).
  const flushValue = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    const current = localValueRef.current
    if (current !== lastDispatchedValueRef.current) {
      lastDispatchedValueRef.current = current
      setValue(current)
    }
  }, [setValue])

  // 4. Debounced dispatch to prevent continuous form-level re-render thrashing on every keystroke.
  const debouncedSetValue = useCallback(
    (newVal) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null
        if (newVal !== lastDispatchedValueRef.current) {
          lastDispatchedValueRef.current = newVal
          setValue(newVal)
        }
      }, 250)
    },
    [setValue],
  )

  // Flush on unmount so no unsaved text is lost
  useEffect(() => {
    return () => {
      flushValue()
    }
  }, [flushValue])

  // 5. Handle editor changes while preserving caret position
  const handleChange = useCallback(
    (val, event) => {
      if (isReadOnly) return
      const newVal = val ?? ''

      // Track cursor position from event or DOM
      if (event?.target) {
        selectionRef.current = {
          start: event.target.selectionStart,
          end: event.target.selectionEnd,
        }
      } else {
        const textarea = editorWrapperRef.current?.querySelector('textarea')
        if (textarea) {
          selectionRef.current = {
            start: textarea.selectionStart,
            end: textarea.selectionEnd,
          }
        }
      }

      setLocalValue(newVal)
      localValueRef.current = newVal
      debouncedSetValue(newVal)
    },
    [isReadOnly, debouncedSetValue],
  )

  // 6. Caret position restoration safeguard:
  // Runs synchronously before paint so the cursor NEVER jumps to the end.
  useIsomorphicLayoutEffect(() => {
    const textarea = editorWrapperRef.current?.querySelector('textarea')
    if (!textarea) return

    if (
      isFocusedRef.current &&
      document.activeElement === textarea &&
      selectionRef.current !== null
    ) {
      const { start, end } = selectionRef.current
      if (textarea.selectionStart !== start || textarea.selectionEnd !== end) {
        textarea.setSelectionRange(start, end)
      }
    }
  })

  // Helper to record cursor selection on mouse/keyboard interactions
  const updateSelectionFromEvent = (e) => {
    const target = e.currentTarget
    selectionRef.current = {
      start: target.selectionStart,
      end: target.selectionEnd,
    }
  }

  return (
    <div
      className="field-type markdown-editor-field"
      style={{ marginBottom: '1.5rem' }}
      data-color-mode={theme === 'dark' ? 'dark' : 'light'}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}
      >
        {field?.label ? (
          <FieldLabel label={field.label} required={field.required} path={path} />
        ) : (
          <div />
        )}

        {/* View Mode Switcher (Write / Live Split / Preview) */}
        <div
          style={{
            display: 'inline-flex',
            borderRadius: 6,
            background: 'var(--theme-elevation-100, #222)',
            padding: 2,
            border: '1px solid var(--theme-elevation-200, #444)',
            gap: 2,
          }}
        >
          <button
            type="button"
            onClick={() => setPreviewMode('edit')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              background:
                previewMode === 'edit' ? 'var(--theme-elevation-250, #3a3a3a)' : 'transparent',
              color:
                previewMode === 'edit'
                  ? 'var(--theme-text, #fff)'
                  : 'var(--theme-elevation-500, #aaa)',
              transition: 'all 0.15s ease',
            }}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('live')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              background:
                previewMode === 'live' ? 'var(--theme-elevation-250, #3a3a3a)' : 'transparent',
              color:
                previewMode === 'live'
                  ? 'var(--theme-text, #fff)'
                  : 'var(--theme-elevation-500, #aaa)',
              transition: 'all 0.15s ease',
            }}
          >
            Live Split
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('preview')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              background:
                previewMode === 'preview' ? 'var(--theme-elevation-250, #3a3a3a)' : 'transparent',
              color:
                previewMode === 'preview'
                  ? 'var(--theme-text, #fff)'
                  : 'var(--theme-elevation-500, #aaa)',
              transition: 'all 0.15s ease',
            }}
          >
            Preview
          </button>
        </div>
      </div>

      <div
        ref={editorWrapperRef}
        style={{
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid var(--theme-elevation-200, #3b3b3b)',
        }}
      >
        <MDEditor
          value={localValue}
          onChange={handleChange}
          preview={previewMode}
          height={420}
          autoFocusEnd={false}
          visibleDragbar={true}
          textareaProps={{
            placeholder:
              typeof field?.admin?.placeholder === 'string'
                ? field.admin.placeholder
                : 'Write your markdown content here...',
            readOnly: isReadOnly,
            onFocus: (e) => {
              isFocusedRef.current = true
              updateSelectionFromEvent(e)
            },
            onBlur: () => {
              isFocusedRef.current = false
              flushValue()
            },
            onClick: updateSelectionFromEvent,
            onKeyUp: updateSelectionFromEvent,
            onSelect: updateSelectionFromEvent,
            onKeyDown: (e) => {
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                flushValue()
              }
            },
          }}
        />
      </div>

      <FieldError message={errorMessage} showError={showError} />
      <FieldDescription description={field?.admin?.description} path={path} />
    </div>
  )
}

export default MarkdownEditor
