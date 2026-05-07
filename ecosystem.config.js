module.exports = {
  apps: [
    {
      name: 'eduverse-backend',
      cwd: './backend',
      script: 'npm',
      args: 'run start:prod',
      env: {
        PORT: 3008,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'eduverse-frontend',
      cwd: './frontend',
      script: 'npm',
      args: ['run', 'start', '--', '-p', '3009'],
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
