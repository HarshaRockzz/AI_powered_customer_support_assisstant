/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8080',
  },
  // Enable standalone output for Docker
  output: 'standalone',
}

module.exports = nextConfig
