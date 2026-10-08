// @ts-check
import { revalidateAll } from '../lib/revalidate.js'

/** @type {import('payload').CollectionConfig} */
export const Education = {
  slug: 'education',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'period', 'sortOrder'],
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
        revalidateAll()
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidateAll()
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Institution Name',
      required: true,
    },
    {
      name: 'description',
      type: 'text',
      label: 'Degree / Certificate & Field',
      required: true,
    },
    {
      name: 'period',
      type: 'text',
      label: 'Period / Duration (e.g. 2026 - Present)',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Institution Logo Upload',
        },
        {
          name: 'logoUrl',
          type: 'text',
          label: 'Logo Fallback URL',
        },
      ],
    },
    {
      name: 'icon',
      type: 'select',
      label: 'Fallback Icon',
      options: ['FaUniversity', 'FaSchool', 'FaGraduationCap', 'FaBookReader'],
      defaultValue: 'FaGraduationCap',
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Sort Order (Highest first)',
      defaultValue: 0,
      admin: {
        description: 'Higher numbers appear first (e.g. 3 > 2 > 1).',
      },
    },
  ],
}
