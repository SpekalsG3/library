/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.fallback = { fs: false };

        return config
    },
    pageExtensions: ['p.js', 'p.ts', 'p.tsx'],
}

module.exports = nextConfig
