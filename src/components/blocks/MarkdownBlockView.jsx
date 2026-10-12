import React from 'react'
import MarkdownView from '@/components/MarkdownView'
import { renderMarkdown } from '@/lib/markdown'

/**
 * Frontend Component to render a MarkdownBlock
 * Accepts the raw markdown string seamlessly and renders sanitized syntax-highlighted HTML
 */
export const MarkdownBlockView = ({ block }) => {
  const content = block?.content || ''
  const renderedHtml = renderMarkdown(content)

  if (!content) return null

  return (
    <div className="w-full my-6">
      <MarkdownView html={renderedHtml} />
    </div>
  )
}

export default MarkdownBlockView
