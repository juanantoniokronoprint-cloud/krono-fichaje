module.exports = {
  apps: [
    {
      name: 'krono-fichaje',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3001,
        HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      merge_logs: true,
      ignore_watch: ['node_modules', '.next', 'logs'],
    },
  ],
};

