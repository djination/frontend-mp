module.exports = {
  apps: [
    {
      name: 'frontend-mp',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/customerdb/frontend-mp',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      // Restart strategy
      min_uptime: '10s',
      max_restarts: 5,
      // Graceful shutdown
      kill_timeout: 5000,
      // Health check
      health_check_grace_period: 3000,
      // Node.js specific
      node_args: '--max-old-space-size=1024'
    }
  ],

  deploy: {
    production: {
      user: 'merahputihtech',
      host: 'merahputih-id.com',
      ref: 'origin/main',
      repo: 'git@github.com:djination/frontend-mp.git',
      path: '/var/www/customerdb/frontend-mp',
      'pre-deploy-local': '',
      'post-deploy': 'source ~/.nvm/nvm.sh && nvm use 20 && npm install && npm run build:prod && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
