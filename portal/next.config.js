/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for deployment
  output: 'standalone',

  async rewrites() {
    return {
      beforeFiles: [
        // proposals.wolfgrey.ai/gobi → /proposals/gobi
        {
          source: '/:slug',
          has: [{ type: 'host', value: 'proposals.wolfgrey.ai' }],
          destination: '/proposals/:slug',
        },
      ],
    }
  },
}

module.exports = nextConfig
