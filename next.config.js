/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  turbopack: {},
  images: {
    domains: ['localhost'],
  },
  env: {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    NEXT_PUBLIC_MAX_FILE_SIZE: process.env.NEXT_PUBLIC_MAX_FILE_SIZE,
    NEXT_PUBLIC_ALLOWED_IMAGE_TYPES: process.env.NEXT_PUBLIC_ALLOWED_IMAGE_TYPES,
    NEXT_PUBLIC_ALLOWED_VIDEO_TYPES: process.env.NEXT_PUBLIC_ALLOWED_VIDEO_TYPES,
  },
  serverRuntimeConfig: {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
  },
};

module.exports = nextConfig; 