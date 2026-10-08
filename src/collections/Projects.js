// @ts-check
import { revalidateProject } from '../lib/revalidate.js'

/** @type {import('payload').CollectionConfig} */
export const Projects = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'featured', 'sortOrder'],
  },
  defaultSort: '-sortOrder',
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidateProject(doc.slug || doc.name)
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidateProject(doc.slug || doc.name)
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
              type: 'row',
              fields: [
                {
                  name: 'featured',
                  type: 'checkbox',
                  label: 'Featured on Homepage',
                  defaultValue: true,
                },
                {
                  name: 'sortOrder',
                  type: 'number',
                  label: 'Sort Order (Highest first / Descending)',
                  defaultValue: 0,
                  admin: {
                    description:
                      'Higher numbers appear first (e.g. 8 > 7 > 1). Set to 0 to hide from website completely.',
                  },
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
