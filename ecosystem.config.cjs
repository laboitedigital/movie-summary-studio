module.exports = {
  apps: [
    {
      name: "movie-summary-studio",
      script: "dist/server.cjs",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "1G",
      autorestart: true,
      // Le rendu vidéo peut prendre du temps; on évite que PM2 le tue trop vite s'il redémarre.
      kill_timeout: 15000,
    },
  ],
};
