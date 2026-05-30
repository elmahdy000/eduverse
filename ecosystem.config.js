module.exports = {
  apps: [
    {
      name: 'eduverse-backend',
      cwd: './backend',
      script: 'node',
      args: 'dist/src/main',
      env: {
        PORT: 3008,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'eduverse-frontend',
      cwd: './frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3009',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
