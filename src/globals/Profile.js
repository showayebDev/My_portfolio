// @ts-check
import { revalidateAll } from '../lib/revalidate.js'

/** @type {import('payload').GlobalConfig} */
export const Profile = {
  slug: 'profile',
  label: 'Profile & Settings',
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidateAll()
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'About Me',
          fields: [
            {
              name: 'name',
              type: 'text',
              label: 'Full Name',
              required: true,
            },
            {
              name: 'greeting',
              type: 'text',
              label: 'Greeting Prefix',
            },
            {
              name: 'bio',
              type: 'textarea',
              label: 'Bio / Intro Description',
            },
            {
              name: 'status',
              type: 'text',
              label: 'Status Message (Badge)',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'showJob',
                  type: 'checkbox',
                  label: 'Show Job',
                  defaultValue: true,
                },
                {
                  name: 'job',
                  type: 'text',
                  label: 'Job Title / Role',
                },
                {
                  name: 'showLocation',
                  type: 'checkbox',
                  label: 'Show Location',
                  defaultValue: true,
                },
                {
                  name: 'location',
                  type: 'text',
                  label: 'Location',
                },
                {
                  name: 'showExperience',
                  type: 'checkbox',
                  label: 'Show Experience',
                  defaultValue: true,
                },
                {
                  name: 'experience',
                  type: 'text',
                  label: 'Experience (Start Year e.g. 2021)',
                  admin: {
                    description:
                      'Enter start year (e.g. 2021). The website automatically calculates: (current year - given year)+ Years.',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'avatar',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Profile Picture Upload',
                },
                {
                  name: 'avatarUrl',
                  type: 'text',
                  label: 'Profile Picture Fallback URL',
                },
              ],
            },
          ],
        },
        {
          label: 'Contact & Socials',
          fields: [
            {
              name: 'email',
              type: 'text',
              label: 'Contact Email',
            },
            {
              name: 'socials',
              type: 'array',
              label: 'Social Profiles',
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  required: true,
                  options: [
                    'GitHub',
                    'Facebook',
                    'LinkedIn',
                    'Instagram',
                    'Twitter',
                    'WhatsApp',
                    'Discord',
                    'YouTube',
                    'Telegram',
                    'Other',
                  ],
                  defaultValue: 'GitHub',
                },
                {
                  name: 'name',
                  type: 'text',
                  label: 'Display Name / Handle',
                  required: true,
                },
                {
                  name: 'url',
                  type: 'text',
                  label: 'Profile URL',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Page Headings & SEO',
          fields: [
            {
              name: 'siteTitle',
              type: 'text',
              label: 'Website Title',
              defaultValue: 'Portfolio',
            },
            {
              name: 'siteDescription',
              type: 'textarea',
              label: 'Meta Description',
              defaultValue:
                'Welcome to my portfolio! Discover my skills, projects, and work.',
            },
            {
              name: 'projectsHeaderSubtitle',
              type: 'text',
              label: 'Projects Page Subtitle',
              defaultValue: 'Browse My Recent',
            },
            {
              name: 'projectsHeaderTitle',
              type: 'text',
              label: 'Projects Page Main Title',
              defaultValue: 'Projects',
            },
            {
              name: 'exploreMoreGitHubUrl',
              type: 'text',
              label: 'Explore More Card Link',
              defaultValue: 'https://github.com',
            },
          ],
        },
        {
          label: 'Theme & Display',
          fields: [
            {
              name: 'theme',
              type: 'select',
              label: 'Portfolio Theme Configuration',
              defaultValue: 'dark',
              required: true,
              options: [
                {
                  label: 'auto - Automatic system detection (User can toggle)',
                  value: 'auto',
                },
                {
                  label: 'dark - Dark mode only (Strict dark mode, toggle disabled)',
                  value: 'dark',
                },
                {
                  label: 'light - Light mode only (Strict light mode, toggle disabled)',
                  value: 'light',
                },
                {
                  label: 'a_dark - Default dark mode (Starts in dark mode, user can toggle)',
                  value: 'a_dark',
                },
                {
                  label: 'a_light - Default light mode (Starts in light mode, user can toggle)',
                  value: 'a_light',
                },
              ],
              admin: {
                description:
                  'Controls default theme and switcher: "auto" detects system theme, "dark" locks to dark mode only, "light" locks to light mode only, "a_dark" starts in dark mode with user switcher enabled, "a_light" starts in light mode with user switcher enabled.',
              },
            },
            {
              name: 'showPercent',
              type: 'checkbox',
              label: 'Show Skill Proficiency Percentages & Animated Progress Rings',
              defaultValue: false,
              admin: {
                description:
                  'When enabled, displays proficiency percentage text and animated circular rings around skill icons. When disabled, displays clean icons and titles.',
              },
            },
          ],
        },
      ],
    },
  ],
}
