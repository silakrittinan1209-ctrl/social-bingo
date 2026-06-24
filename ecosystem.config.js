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
      script: 'C:\\Users\\Admin\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\\ngrok.exe',
      args: 'http 3000 --log stdout --log-format json',
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
}
