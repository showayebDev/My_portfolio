// @ts-check
import { revalidateProject } from '../lib/revalidate.js'

/** @type {import('payload').CollectionConfig} */
export const Projects = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'createdAt'],
  },
  defaultSort: '-createdAt',
  versions: {
    drafts: true,
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return {
        _status: {
          equals: 'published',
        },
      }
    },
  },
  hooks: {
    afterChange: [
      async ({ doc }) => {
        await revalidateProject(doc.slug || doc.name)
        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidateProject(doc.slug || doc.name)
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Card & Overview',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  label: 'Project Title',
                  required: true,
                },
                {
                  name: 'slug',
                  type: 'text',
                  label: 'URL Slug / Name (e.g. thunderDM)',
                  required: true,
                  unique: true,
                },
              ],
            },
            {
              name: 'description',
              type: 'textarea',
              label: 'Short Description (shown on cards and sidebar)',
              required: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Project Thumbnail / Icon Upload',
                },
                {
                  name: 'imageUrl',
                  type: 'text',
                  label: 'Image Fallback URL',
                },
              ],
            },

            {
              name: 'buttons',
              type: 'array',
              label: 'Action Buttons (e.g. GitHub, Marketplace, Live Demo)',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  label: 'Button Label',
                  required: true,
                },
                {
                  name: 'link',
                  type: 'text',
                  label: 'Target URL',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'README / Documentation',
          fields: [
            {
              name: 'readmeContent',
              type: 'textarea',
              label: 'Full Markdown README / Documentation',
              admin: {
                components: {
                  Field: '@/components/admin/MarkdownEditor#MarkdownEditor',
                },
                description:
                  'Write complete markdown with headings (###), bullet points, code blocks (```go ... ```), tables, and links.',
              },
            },
          ],
        },
      ],
    },
  ],
}
