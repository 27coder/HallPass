/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  skipTrailingSlashRedirect: true,
}

module.exports = nextConfig
