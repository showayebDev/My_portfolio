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
      async ({ doc }) => {
        await revalidateAll()
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
          label: 'Projects Ordering',
          fields: [
            {
              name: 'featuredProjects',
              type: 'relationship',
              relationTo: 'projects',
              hasMany: true,
              label: 'Homepage Featured Projects (Drag & drop)',
              admin: {
                description:
                  'Select and drag-and-drop the projects you want displayed on the HOMEPAGE in your exact desired order. If left empty, all published projects will be displayed automatically.',
              },
            },
            {
              name: 'allProjectsOrder',
              type: 'relationship',
              relationTo: 'projects',
              hasMany: true,
              label: 'All Projects Page Order (Drag & drop for /project page)',
              admin: {
                description:
                  'Select and drag-and-drop projects to set your custom display order on the /project page. Any remaining projects not added here will automatically appear after them, ordered newest first.',
              },
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
              admin: {
                initCollapsed: false,
                components: {
                  RowLabel: '@/components/admin/SocialRowLabel#SocialRowLabel',
                },
              },
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
                    'Reddit',
                    'Twitch',
                    'TikTok',
                    'Threads',
                    'Medium',
                    'Dribbble',
                    'Behance',
                    'Stack Overflow',
                    'GitLab',
                    'CodePen',
                    'Spotify',
                    'Patreon',
                    'Steam',
                    'Pinterest',
                    'Website',
                    'Other',
                  ],
                  defaultValue: 'GitHub',
                  admin: {
                    description: 'Select social or contact platform. The official vector icon will be automatically rendered on your portfolio.',
                  },
                },
                {
                  type: 'row',
                  fields: [
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
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'icon',
                      type: 'upload',
                      relationTo: 'media',
                      label: 'Custom Icon Upload (Optional)',
                      admin: {
                        description: 'Optional custom icon (SVG, PNG) to override the default platform icon',
                      },
                    },
                    {
                      name: 'iconUrl',
                      type: 'text',
                      label: 'Custom Icon URL (Optional)',
                      admin: {
                        description: 'Optional icon URL or path (e.g. /icons/custom.svg or https://...)',
                      },
                    },
                  ],
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
              name: 'transition',
              type: 'select',
              label: 'Page View Transition',
              defaultValue: 'fade',
              required: true,
              options: [
                {
                  label: 'fade - Smooth Crossfade (Built-in Default)',
                  value: 'fade',
                },
                {
                  label: 'slide - Horizontal Slide (Left/Right slide based on navigation)',
                  value: 'slide',
                },
                {
                  label: 'slide-up - Vertical Slide Up (Smooth bottom-to-top rise)',
                  value: 'slide-up',
                },
                {
                  label: 'zoom - Cinematic Scale & Zoom (Expands smoothly into view)',
                  value: 'zoom',
                },
                {
                  label: 'blur - Depth of Field Lens Blur (Cinematic soft blur crossfade)',
                  value: 'blur',
                },
                {
                  label: 'flip - 3D Perspective Card Flip (Subtle 3D angle transition)',
                  value: 'flip',
                },
                {
                  label: 'no transition- top bar loader',
                  value: 'top-loader',
                },
                {
                  label: 'none - Instant Swap (No transition animation)',
                  value: 'none',
                },
                {
                  label: 'initial - Browser Native Default Transition',
                  value: 'initial',
                },
              ],
              admin: {
                description:
                  'Select page view transition animation: "fade" (smooth crossfade), "slide" (horizontal navigation), "slide-up" (vertical motion), "zoom" (cinematic scaling), "blur" (depth blur), "flip" (3D card perspective), "no transition- top bar loader" (instant page swap with top progress bar), "none" (instant switch), or "initial" (browser native).',
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
