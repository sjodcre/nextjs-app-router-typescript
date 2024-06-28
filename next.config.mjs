/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: config => {
      config.externals.push('pino-pretty', 'lokijs', 'encoding')
      return config
    },
    reactStrictMode: false,
    images: {
      // domains: ['arweave.net', 'via.placeholder.com'],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'arweave.net',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'via.placeholder.com',
          pathname: '/**',
        },
      ],
    },

  }

export default nextConfig;
