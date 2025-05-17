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
            {
                source: '/logvault/:path*',
                destination: `http://${isProd ? 'zd-logvault-service': '127.0.0.1'}:8000/:path*`,
            }
        ];
    }
};

export default nextConfig;
