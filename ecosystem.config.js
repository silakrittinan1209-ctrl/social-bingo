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
      script: 'C:\\Users\\Admin\\AppData\\Local\\Microsoft\\WinGet\\Links\\ngrok.exe',
      args: 'http --domain=maturing-repeater-proofing.ngrok-free.dev 3000',
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
}
