module.exports = {
    apps: [
        {
            name: "zd-client",
            cwd: "./client",
            script: "npm",
            args: "start",
            env: {
                NODE_ENV: "production",
                PORT: 3000,
                HOSTNAME: "0.0.0.0",
                NEXT_PUBLIC_USE_INTERNAL_PROXY: "false" // Let Nginx handle /api routing
            }
        },
        {
            name: "zd-server",
            cwd: "./server",
            script: "dist/index.js", // Assumes build is done
            env: {
                NODE_ENV: "production",
                PORT: 3001
            }
        }
    ]
};
