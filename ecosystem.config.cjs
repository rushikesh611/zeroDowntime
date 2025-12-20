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
                PORT: 3001,
                COOKIE_SECURE: "false", // Change to true when SSL is enabled
                CLIENT_URL: "http://localhost:3000" // Update this if testing locally on EC2 curl, else Primary Public IP
                // SERVER_HOST env var will need to be passed here if used
            }
        }
    ]
};
