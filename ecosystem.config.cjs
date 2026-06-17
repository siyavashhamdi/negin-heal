module.exports = {
  apps: [
    {
      name: "negin-heal-api",
      cwd: "./api",
      script: "dist/main.js",
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "negin-heal-app",
      cwd: "./app",
      script: "npm",
      args: "run start",
      instances: 1,
      autorestart: true,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
