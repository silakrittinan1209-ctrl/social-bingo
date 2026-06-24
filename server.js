const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const gameStateModule = require('./lib/gameState')
const {
  initGameState,
  handleJoin,
  handleCheck,
  resetGame,
  getAdminData,
  getLeaderboardData,
} = gameStateModule

// Expose to Next.js API routes (different webpack bundle, same Node process)
global._bingoGame = gameStateModule

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    cors: { origin: '*' },
    maxHttpBufferSize: 1e6,
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  global.io = io

  initGameState()

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.emit('admin:update', getAdminData())
    socket.emit('leaderboard:update', getLeaderboardData())

    socket.on('player:join', (data, callback) => {
      try {
        const { nickname, village } = data
        if (!nickname || !village) {
          if (callback) callback({ error: 'Missing nickname or village' })
          return
        }
        const player = handleJoin(socket.id, { nickname, village })
        socket.join(`player:${player.id}`)
        if (callback) callback({ playerId: player.id, cardOrder: player.cardOrder })
      } catch (e) {
        console.error('player:join error:', e)
        if (callback) callback({ error: 'Server error' })
      }
    })

    socket.on('player:check', (data, callback) => {
      try {
        const { playerId, index } = data
        const result = handleCheck(playerId, index)
        if (!result) {
          if (callback) callback({ ok: false })
          return
        }
        const { player, bingoGained } = result
        if (callback) callback({ ok: true, checkedCells: [...player.checkedCells] })

        if (bingoGained && bingoGained.length > 0) {
          io.to(`player:${playerId}`).emit('player:bingo', {
            playerId,
            bingoTypes: player.bingoTypes,
            newTypes: bingoGained,
          })
        }
      } catch (e) {
        console.error('player:check error:', e)
        if (callback) callback({ ok: false })
      }
    })

    socket.on('game:reset', () => {
      resetGame()
      io.emit('game:reset')
      console.log('Game reset by', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://localhost:${port}`)
    console.log(`> Mode: ${dev ? 'development' : 'production'}`)
  })
})
