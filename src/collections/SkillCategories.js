// @ts-check
import { revalidateAll } from '../lib/revalidate.js'

/** @type {import('payload').CollectionConfig} */
export const SkillCategories = {
  slug: 'skill-categories',
  labels: {
    singular: 'Skill Category',
    plural: 'Skill Categories',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'sortOrder'],
  },
  defaultSort: 'sortOrder',
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
      label: 'Category Name',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Category Slug (e.g. front-end)',
      required: true,
      unique: true,
      admin: {
        description: 'Identifier used for filtering (e.g. front-end, back-end)',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Sort Order (Lowest first)',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first (e.g. 1 before 2).',
      },
    },
  ],
}
