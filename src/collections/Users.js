// @ts-check
/** @type {import('payload').CollectionConfig} */
export const Users = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: ({ req, token, user }) => {
        const host = req?.headers?.get?.('host')
        const proto = req?.headers?.get?.('x-forwarded-proto') || 'http'
        const origin = req?.headers?.get?.('origin') || (host ? `${proto}://${host}` : null)
        const siteUrl = (origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
        const resetPasswordURL = `${siteUrl}/admin/reset/${token}`

        console.log('\n======================================================')
        console.log('🔑 [PASSWORD RESET LINK GENERATED]')
        console.log(`👤 User:      ${user?.email}`)
        console.log(`🔗 Reset URL: ${resetPasswordURL}`)
        console.log(`🎫 Token:     ${token}`)
        console.log('======================================================\n')

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
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
}
