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
  getGameState,
  BINGO_ITEMS,
} = gameStateModule

global._bingoGame = gameStateModule

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// ── Pending confirmations ────────────────────────────────────────
const pendingConfirmations = new Map()
// confirmId -> { fromPlayerId, toPlayerId, cellIndex, timeoutId }

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ── Game timer ───────────────────────────────────────────────────
const timerState = {
  running: false,
  timeLeft: 0,
  totalTime: 0,
  intervalId: null,
}

function broadcastTimer(io) {
  io.emit('timer:update', {
    running: timerState.running,
    timeLeft: timerState.timeLeft,
    totalTime: timerState.totalTime,
  })
}

// ────────────────────────────────────────────────────────────────
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

    // Send current state on connect
    socket.emit('admin:update', getAdminData())
    socket.emit('leaderboard:update', getLeaderboardData())
    socket.emit('timer:update', {
      running: timerState.running,
      timeLeft: timerState.timeLeft,
      totalTime: timerState.totalTime,
    })

    // ── Player join ──────────────────────────────────────────────
    socket.on('player:join', (data, callback) => {
      try {
        const { nickname, village } = data
        if (!nickname || !village) {
          callback?.({ error: 'Missing nickname or village' }); return
        }
        const player = handleJoin(socket.id, { nickname, village })
        socket.join(`player:${player.id}`)
        callback?.({ playerId: player.id, cardOrder: player.cardOrder })
      } catch (e) {
        console.error('player:join error:', e)
        callback?.({ error: 'Server error' })
      }
    })

    // ── Confirm: Player A requests confirmation from Player B ────
    socket.on('confirm:request', (data, callback) => {
      try {
        const { fromPlayerId, toPlayerId, cellIndex } = data
        const state = getGameState()
        const fromPlayer = state.players.get(fromPlayerId)
        const toPlayer = state.players.get(toPlayerId)

        if (!fromPlayer || !toPlayer) {
          callback?.({ ok: false, error: 'player_not_found' }); return
        }
        if (fromPlayer.checkedCells.has(cellIndex)) {
          callback?.({ ok: false, error: 'already_checked' }); return
        }

        // Check usage limit before sending request
        const currentUsage = fromPlayer.playerUsageOnCard.get(toPlayerId) || 0
        if (currentUsage >= 2) {
          callback?.({ ok: false, error: 'player_used_max' }); return
        }

        const confirmId = genId()
        const TIMEOUT_SEC = 30

        const timeoutId = setTimeout(() => {
          pendingConfirmations.delete(confirmId)
          io.to(`player:${fromPlayerId}`).emit('confirm:result', {
            confirmId, cellIndex, accepted: false, timeout: true,
          })
        }, TIMEOUT_SEC * 1000)

        pendingConfirmations.set(confirmId, { fromPlayerId, toPlayerId, cellIndex, timeoutId })

        // Notify Player B
        io.to(`player:${toPlayerId}`).emit('confirm:incoming', {
          confirmId,
          fromNickname: fromPlayer.nickname,
          fromVillage: fromPlayer.village,
          cellIndex,
          cellText: BINGO_ITEMS[cellIndex],
          timeoutSec: TIMEOUT_SEC,
        })

        callback?.({ ok: true, confirmId })
      } catch (e) {
        console.error('confirm:request error:', e)
        callback?.({ ok: false, error: 'server_error' })
      }
    })

    // ── Confirm: Player B responds ───────────────────────────────
    socket.on('confirm:respond', (data, callback) => {
      try {
        const { confirmId, accepted } = data
        const pending = pendingConfirmations.get(confirmId)
        if (!pending) {
          callback?.({ ok: false, error: 'not_found' }); return
        }

        clearTimeout(pending.timeoutId)
        pendingConfirmations.delete(confirmId)

        if (accepted) {
          const result = handleCheck(pending.fromPlayerId, pending.cellIndex, pending.toPlayerId)
          if (result && !result.error) {
            const { player, bingoGained, playerUsage } = result
            io.to(`player:${pending.fromPlayerId}`).emit('confirm:result', {
              confirmId, cellIndex: pending.cellIndex, accepted: true,
              checkedCells: [...player.checkedCells],
              playerUsage: playerUsage || {},
            })
            if (bingoGained && bingoGained.length > 0) {
              io.to(`player:${pending.fromPlayerId}`).emit('player:bingo', {
                playerId: pending.fromPlayerId,
                bingoTypes: player.bingoTypes,
                newTypes: bingoGained,
              })
            }
          } else {
            io.to(`player:${pending.fromPlayerId}`).emit('confirm:result', {
              confirmId, cellIndex: pending.cellIndex, accepted: false,
              error: result?.error || 'check_failed',
            })
          }
        } else {
          io.to(`player:${pending.fromPlayerId}`).emit('confirm:result', {
            confirmId, cellIndex: pending.cellIndex, accepted: false,
          })
        }
        callback?.({ ok: true })
      } catch (e) {
        console.error('confirm:respond error:', e)
        callback?.({ ok: false })
      }
    })

    // ── Timer controls (admin) ───────────────────────────────────
    socket.on('timer:set', ({ totalSeconds }) => {
      if (timerState.intervalId) clearInterval(timerState.intervalId)
      timerState.totalTime = Math.max(0, Math.min(totalSeconds, 7200))
      timerState.timeLeft = timerState.totalTime
      timerState.running = false
      timerState.intervalId = null
      broadcastTimer(io)
    })

    socket.on('timer:start', () => {
      if (timerState.running || timerState.timeLeft === 0) return
      timerState.running = true
      timerState.intervalId = setInterval(() => {
        timerState.timeLeft = Math.max(0, timerState.timeLeft - 1)
        broadcastTimer(io)
        if (timerState.timeLeft === 0) {
          clearInterval(timerState.intervalId)
          timerState.intervalId = null
          timerState.running = false
          io.emit('timer:end')
        }
      }, 1000)
      broadcastTimer(io)
    })

    socket.on('timer:pause', () => {
      if (!timerState.running) return
      clearInterval(timerState.intervalId)
      timerState.intervalId = null
      timerState.running = false
      broadcastTimer(io)
    })

    socket.on('timer:reset', () => {
      clearInterval(timerState.intervalId)
      timerState.intervalId = null
      timerState.timeLeft = timerState.totalTime
      timerState.running = false
      broadcastTimer(io)
    })

    // ── Game reset ───────────────────────────────────────────────
    socket.on('game:reset', () => {
      // Clear all pending confirmations
      pendingConfirmations.forEach((p) => clearTimeout(p.timeoutId))
      pendingConfirmations.clear()
      // Clear timer
      clearInterval(timerState.intervalId)
      Object.assign(timerState, { running: false, timeLeft: 0, totalTime: 0, intervalId: null })

      resetGame()
      io.emit('game:reset')
      broadcastTimer(io)
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
