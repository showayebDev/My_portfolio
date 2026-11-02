// @ts-check
import { revalidateAll } from '../lib/revalidate.js'

/** @type {import('payload').CollectionConfig} */
export const Skills = {
  slug: 'skills',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'categories', 'percent', 'color'],
  },
  access: {
    read: () => true
  },
  hooks: {
    afterChange: [
      async ({ doc }) => {
        await revalidateAll()
        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidateAll()
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Skill Name',
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'skill-categories',
      hasMany: true,
      required: true,
      label: 'Categories',
      admin: {
        description: 'Select one or more categories for this skill',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          label: 'Skill Icon Upload',
        },
        {
          name: 'iconUrl',
          type: 'text',
          label: 'Icon Fallback URL (e.g. /icons/nextjs.svg)',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'percent',
          type: 'number',
          label: 'Proficiency Percentage (0 - 100)',
          min: 0,
          max: 100,
          defaultValue: 80,
        },
        {
          name: 'color',
          type: 'text',
          label: 'Accent Color / Hex Code (e.g. #61dafb)',
          defaultValue: '#38bdf8',
        },
      ],
    },
  ],
}
