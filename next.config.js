/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_MAX_FILE_SIZE: process.env.NEXT_PUBLIC_MAX_FILE_SIZE,
    NEXT_PUBLIC_ALLOWED_IMAGE_TYPES: process.env.NEXT_PUBLIC_ALLOWED_IMAGE_TYPES,
    NEXT_PUBLIC_ALLOWED_VIDEO_TYPES: process.env.NEXT_PUBLIC_ALLOWED_VIDEO_TYPES,
  },
  serverRuntimeConfig: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  webpack: (config, { isServer }) => {
    // Handle SQL files
    config.module.rules.push({
      test: /\.sql$/,
      use: 'raw-loader',
    });

    // Handle fs and path modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Isolation',
            value: 'require-corp',
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig; 