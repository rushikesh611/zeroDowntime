/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async rewrites() {
        const isProd = process.env.NODE_ENV === 'production';
        return [
            {
                source: '/api/:path*',
                destination: `http://${isProd ? 'zd-api-service': 'localhost'}:3001/api/:path*`,
            },
        ];
    }
};

export default nextConfig;
