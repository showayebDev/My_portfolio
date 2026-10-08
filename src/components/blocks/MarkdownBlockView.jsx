import React from 'react'
import MarkdownView from '@/components/MarkdownView'
import { marked } from 'marked'
import hljs from 'highlight.js'

// Custom code block renderer with highlight.js syntax highlighting
const renderer = {
  code({ text, lang }) {
    const validLanguage = lang && hljs.getLanguage(lang) ? lang : null
    const highlighted = validLanguage
      ? hljs.highlight(text, { language: validLanguage }).value
      : hljs.highlightAuto(text).value
    const langClass = validLanguage ? ` class="hljs language-${validLanguage}"` : ' class="hljs"'
    return `<pre><code${langClass}>${highlighted}</code></pre>`
  },
}

marked.use({ renderer, gfm: true, breaks: true })

/**
 * Frontend Component to render a MarkdownBlock
 * Accepts the raw markdown string seamlessly and renders sanitized syntax-highlighted HTML
 */
export const MarkdownBlockView = ({ block }) => {
  const content = block?.content || ''
  const renderedHtml = content ? marked.parse(content) : ''

  if (!content) return null

  return (
    <div className="w-full my-6">
      <MarkdownView html={renderedHtml} />
    </div>
  )
}

export default MarkdownBlockView
