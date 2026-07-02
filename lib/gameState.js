const { savePlayer, saveBingoLog, clearAllData } = require('./database')

const BINGO_ITEMS = [
  'เลื่อนดูโซเชียลเป็นเวลานานเกินความจำเป็น (Doom Scrolling)',
  'เช็กมือถือหรือโซเชียลทุกไม่กี่นาที',
  'ใช้โซเชียลก่อนนอนจนดึกเป็นประจำ',
  'ใช้โซเชียลทันทีหลังตื่นนอน',
  'เสพติดยอดไลก์ ยอดแชร์ และยอดผู้ติดตาม',
  'เปรียบเทียบชีวิตตนเองกับคนอื่นบนโซเชียล',
  'ดูคลิปสั้นต่อเนื่องหลายชั่วโมง',
  'เล่นโซเชียลระหว่างเรียนหรือทำงาน',
  'เล่นโทรศัพท์ขณะเดิน ข้ามถนน หรือขับรถ',
  'แชร์ข้อมูลส่วนตัวมากเกินไป',
  'กดลิงก์หรือดาวน์โหลดไฟล์จากแหล่งที่ไม่น่าเชื่อถือ',
  'เชื่อและแชร์ข่าวปลอมโดยไม่ตรวจสอบ',
  'ซื้อสินค้าตามกระแสหรือรีวิวโดยไม่พิจารณาให้รอบคอบ',
  'มีส่วนร่วมในการดราม่าหรือการโจมตีผู้อื่นทางออนไลน์',
  'ใช้คำพูดรุนแรง แสดงความคิดเห็นด้วยอารมณ์',
  'รับเพื่อน ติดตาม หรือพูดคุยกับคนแปลกหน้าโดยไม่ระมัดระวัง',
]

const state = {
  players: new Map(),
  cellStats: new Array(16).fill(0),
  bingoCount: { row: 0, col: 0, diagonal: 0, fullhouse: 0 },
  bingoPlayerLimit: 0,
  gameStarted: false,
  gameEnded: false,
  gameEndedAt: null,
  gameStartedAt: null,
}

let broadcastAdminTimeout = null
let broadcastLeaderboardTimeout = null

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generatePlayerId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function initGameState() {
  state.players.clear()
  state.cellStats.fill(0)
  state.bingoCount = { row: 0, col: 0, diagonal: 0, fullhouse: 0 }
  state.bingoPlayerLimit = 0
  state.gameStarted = false
  state.gameEnded = false
  state.gameEndedAt = null
  state.gameStartedAt = null
}

function setBingoPlayerLimit(limit) {
  const parsed = Number(limit)
  state.bingoPlayerLimit = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
}

function setGameStarted(started) {
  state.gameStarted = Boolean(started)
  state.gameEnded = false
  state.gameEndedAt = null
  if (state.gameStarted) {
    state.gameStartedAt = Date.now()
  } else {
    state.gameStartedAt = null
  }
  broadcastUpdates()
}

function getGameState() {
  return state
}

function checkBingo(checkedSet, cardOrder) {
  // checkedSet: Set of original item indices that are checked
  // cardOrder: array of 16 original indices in card position order
  const checked = cardOrder.map((origIdx) => checkedSet.has(origIdx))

  const types = []

  // rows
  for (let r = 0; r < 4; r++) {
    if (checked.slice(r * 4, r * 4 + 4).every(Boolean)) {
      types.push('row')
      break
    }
  }

  // cols
  for (let c = 0; c < 4; c++) {
    if ([0, 1, 2, 3].every((r) => checked[r * 4 + c])) {
      types.push('col')
      break
    }
  }

  // diagonals
  if ([0, 5, 10, 15].every((i) => checked[i])) types.push('diagonal')
  if ([3, 6, 9, 12].every((i) => checked[i])) types.push('diagonal')

  // full house
  if (checked.every(Boolean)) types.push('fullhouse')

  return [...new Set(types)]
}

function handleJoin(socketId, { nickname, village }) {
  if (state.gameEnded) return { error: 'game_ended' }

  const playerId = generatePlayerId()
  const cardOrder = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])

  const player = {
    id: playerId,
    nickname,
    village,
    socketId,
    checkedCells: new Set(),
    cellSelections: new Map(),    // origIdx -> selectedPlayerId
    playerUsageOnCard: new Map(), // selectedPlayerId -> count (max 2)
    bingoTypes: [],
    bingoTime: null,
    cardOrder,
  }

  state.players.set(playerId, player)

  try {
    savePlayer({ id: playerId, nickname, village, cardOrder })
  } catch (e) {
    console.error('DB save player error:', e.message)
  }

  broadcastUpdates()
  return player
}

function handleCheck(playerId, index, selectedPlayerId) {
  if (state.gameEnded) return { error: 'game_ended' }
  if (!state.gameStarted) return { error: 'game_not_started' }

  const player = state.players.get(playerId)
  if (!player) return null
  if (player.checkedCells.has(index)) return null

  // Validate: each selected player can be used at most 1 time per card
  if (selectedPlayerId) {
    const currentUsage = player.playerUsageOnCard.get(selectedPlayerId) || 0
    if (currentUsage >= 1) return { error: 'player_used_max' }
    player.playerUsageOnCard.set(selectedPlayerId, currentUsage + 1)
    player.cellSelections.set(index, selectedPlayerId)
  }

  player.checkedCells.add(index)
  if (index >= 0 && index < 16) state.cellStats[index]++

  const newBingoTypes = checkBingo(player.checkedCells, player.cardOrder)
  const gained = newBingoTypes.filter((t) => !player.bingoTypes.includes(t))

  let bingoGained = null
  if (gained.length > 0) {
    gained.forEach((t) => {
      if (!player.bingoTypes.includes(t)) {
        player.bingoTypes.push(t)
        state.bingoCount[t] = (state.bingoCount[t] || 0) + 1
        if (!player.bingoTime) player.bingoTime = Date.now()
        try {
          saveBingoLog(playerId, t)
        } catch (e) {
          console.error('DB bingo log error:', e.message)
        }
      }
    })
    bingoGained = gained

    if (state.bingoPlayerLimit > 0) {
      const bingoPlayers = Array.from(state.players.values()).filter((p) => p.bingoTypes.length > 0).length
      if (bingoPlayers >= state.bingoPlayerLimit) {
        endGame()
      }
    }
  }

  broadcastUpdates()
  return {
    player,
    bingoGained,
    playerUsage: Object.fromEntries(player.playerUsageOnCard),
  }
}

function handleBingo(playerId) {
  const player = state.players.get(playerId)
  return player || null
}

function endGame() {
  if (state.gameEnded) return

  state.gameEnded = true
  state.gameEndedAt = Date.now()

  if (global.io) {
    global.io.emit('game:end', {
      reason: 'bingo_limit',
      bingoPlayerLimit: state.bingoPlayerLimit,
      endedAt: state.gameEndedAt,
    })
  }

  broadcastUpdates()
}

function resetGame() {
  state.players.clear()
  state.cellStats.fill(0)
  state.bingoCount = { row: 0, col: 0, diagonal: 0, fullhouse: 0 }
  state.gameStarted = false
  state.gameEnded = false
  state.gameEndedAt = null
  state.gameStartedAt = null
  try {
    clearAllData()
  } catch (e) {
    console.error('DB clear error:', e.message)
  }
  broadcastUpdates()
}

function getAdminData() {
  const players = []
  state.players.forEach((p) => {
    players.push({
      id: p.id,
      nickname: p.nickname,
      village: p.village,
      checkedCount: p.checkedCells.size,
      bingoTypes: p.bingoTypes,
      bingoTime: p.bingoTime,
    })
  })
  players.sort((a, b) => (a.bingoTime || Infinity) - (b.bingoTime || Infinity))

  const topCells = state.cellStats
    .map((count, i) => ({ index: i, label: BINGO_ITEMS[i], count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalPlayers: state.players.size,
    bingoPlayers: players.filter((p) => p.bingoTypes.length > 0).length,
    players,
    topCells,
    bingoCount: state.bingoCount,
    bingoPlayerLimit: state.bingoPlayerLimit,
    gameStarted: state.gameStarted,
    gameEnded: state.gameEnded,
    gameEndedAt: state.gameEndedAt,
    gameStartedAt: state.gameStartedAt,
  }
}

function getLeaderboardData() {
  const winners = []
  state.players.forEach((p) => {
    if (p.bingoTypes.length > 0) {
      winners.push({
        id: p.id,
        nickname: p.nickname,
        village: p.village,
        bingoTypes: p.bingoTypes,
        bingoTime: p.bingoTime,
      })
    }
  })
  winners.sort((a, b) => a.bingoTime - b.bingoTime)
  return {
    totalPlayers: state.players.size,
    winners,
    gameStarted: state.gameStarted,
    gameEnded: state.gameEnded,
    bingoPlayerLimit: state.bingoPlayerLimit,
  }
}

function broadcastUpdates() {
  if (!global.io) return

  clearTimeout(broadcastAdminTimeout)
  broadcastAdminTimeout = setTimeout(() => {
    global.io.emit('admin:update', getAdminData())
    global.io.emit('game:state', {
      gameStarted: state.gameStarted,
      gameEnded: state.gameEnded,
      bingoPlayerLimit: state.bingoPlayerLimit,
    })
  }, 500)

  clearTimeout(broadcastLeaderboardTimeout)
  broadcastLeaderboardTimeout = setTimeout(() => {
    global.io.emit('leaderboard:update', getLeaderboardData())
  }, 500)
}

module.exports = {
  BINGO_ITEMS,
  initGameState,
  getGameState,
  handleJoin,
  handleCheck,
  handleBingo,
  resetGame,
  setBingoPlayerLimit,
  setGameStarted,
  getAdminData,
  getLeaderboardData,
}
