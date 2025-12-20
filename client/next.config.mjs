/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async rewrites() {
        const isProd = process.env.NODE_ENV === 'production';
        return [
            {
                source: '/api/:path*',
                destination: `http://${isProd ? 'zd-server' : 'localhost'}:3001/api/:path*`,
            },
            {
                source: '/logvault/:path*',
                destination: `http://${isProd ? 'zd-logvault-service' : '127.0.0.1'}:8000/:path*`,
            },
            {
                source: '/:path*',  // Match all paths, not just root
                has: [
                    {
                        type: 'host',
                        value: '(?<subdomain>[a-z0-9-]+)\\.localhost:3000',
                    },
                ],
                destination: '/status/:subdomain/:path*',
            },
            {
                source: '/statuspreview/:subdomain',
                destination: '/status/:subdomain',
            }
        ];
    }
};

export default nextConfig;
