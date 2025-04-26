module.exports = {
  apps: [
    {
      name: 'leitner-app',
      script: './server/index.js',
      env: {
        PORT: 8888,
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      interpreter: 'node',
      interpreter_args: '--experimental-specifier-resolution=node --no-warnings'
    }
  ]
}; 