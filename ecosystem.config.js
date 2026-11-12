module.exports = {
  apps: [{
    name: "meta-ai",
    script: "./index.js",
    watch: false,
    ignore_watch: ["node_modules", "auth", "tmp", "*.log"],
    autorestart: true,
    max_restarts: 5,
    restart_delay: 5000,
    env: { NODE_ENV: "production" }
  }]
}
