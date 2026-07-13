/** PM2 config — run: pm2 start ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: "whatsapp-listener",
      script: "server.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
