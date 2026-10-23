import type { Block } from 'payload'

/**
 * Payload Block Configuration for Rich Markdown Content
 * Uses custom @uiw/react-md-editor component in the admin panel
 */
export const MarkdownBlock: Block = {
  slug: 'markdownBlock',
  labels: {
    singular: 'Markdown Block',
    plural: 'Markdown Blocks',
  },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      label: 'Markdown Content',
      required: true,
      admin: {
        components: {
          Field: '@/components/admin/MarkdownEditor#MarkdownEditor',
        },
        description: 'Supports full Markdown syntax, code blocks, tables, and live preview.',
      },
    },
  ],
}

export default MarkdownBlock
