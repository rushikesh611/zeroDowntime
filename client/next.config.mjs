/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async rewrites() {
        const isProd = process.env.NODE_ENV === 'production';
        const useInternalProxy = process.env.NEXT_PUBLIC_USE_INTERNAL_PROXY === 'true' || !isProd;

        if (!useInternalProxy) {
            return [];
        }

        const serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
        const logVaultUrl = process.env.LOGVAULT_URL || 'http://127.0.0.1:8000';

        return [
            {
                source: '/api/:path*',
                destination: `${serverUrl}/api/:path*`,
            },
            {
                source: '/logvault/:path*',
                destination: `${logVaultUrl}/:path*`,
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
