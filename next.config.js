/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'secure.almostcrackd.ai',
      },
      {
        protocol: 'https',
        hostname: '*.almostcrackd.ai',
      },
    ],
  },
}

module.exports = nextConfig
