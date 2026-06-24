module.exports = {
  apps: [
    {
      name: 'social-bingo',
      script: 'server.js',
      cwd: 'D:\\bingGo',
      env: { NODE_ENV: 'production', PORT: 3000 },
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: 'bingo-tunnel',
      script: 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
      args: 'tunnel --url http://localhost:3000 --logfile C:\\Windows\\Temp\\cf-tunnel.log',
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
}
