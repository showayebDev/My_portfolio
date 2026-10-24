// @ts-check
/** @type {import('payload').CollectionConfig} */
export const Users = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  access: {
    // Only authenticated users can query/view user records
    read: ({ req: { user } }) => Boolean(user),
    // Restrict registration: only existing admins can create new users, or bootstrap if 0 users exist
    create: async ({ req }) => {
      if (req.user) return true
      try {
        const count = await req.payload.find({ collection: 'users', limit: 1 })
        return count.totalDocs === 0
      } catch {
        return false
      }
    },
    // Only authenticated users can update user profiles
    update: ({ req: { user } }) => Boolean(user),
    // Only authenticated users can delete user records
    delete: ({ req: { user } }) => Boolean(user),
    // Only authenticated users can access the admin panel
    admin: ({ req: { user } }) => Boolean(user),
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: ({ req, token, user }) => {
        // Enforce trusted configured site URL to prevent password reset poisoning via Host / Origin header injection
        const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const siteUrl = configuredUrl.trim().replace(/\/$/, '')
        const resetPasswordURL = `${siteUrl}/admin/reset/${token}`

        if (process.env.NODE_ENV !== 'production') {
          console.log('\n======================================================')
          console.log('🔑 [PASSWORD RESET LINK GENERATED] (DEV ONLY)')
          console.log(`👤 User:      ${user?.email}`)
          console.log(`🔗 Reset URL: ${resetPasswordURL}`)
          console.log(`🎫 Token:     ${token}`)
          console.log('======================================================\n')
        }

        return `
          <!doctype html>
          <html>
            <body>
              <h2>Reset Your Password</h2>
              <p>Hello ${user.email},</p>
              <p>Click the link below to reset your password:</p>
              <p><a href="${resetPasswordURL}">${resetPasswordURL}</a></p>
              <p>If you did not request this, please ignore this email.</p>
            </body>
          </html>
        `
      },
    },
  },
  fields: [],
}
