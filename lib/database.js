const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(process.cwd(), 'bingo-data.json')

function readData() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
    }
  } catch {}
  return { players: [], bingoLog: [] }
}

function writeData(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8')
  } catch (e) {
    console.error('DB write error:', e.message)
  }
}

function savePlayer(player) {
  const data = readData()
  const idx = data.players.findIndex((p) => p.id === player.id)
  const entry = {
    id: player.id,
    nickname: player.nickname,
    village: player.village,
    cardOrder: player.cardOrder,
    joinedAt: Date.now(),
  }
  if (idx >= 0) data.players[idx] = entry
  else data.players.push(entry)
  writeData(data)
}

function saveBingoLog(playerId, bingoType) {
  const data = readData()
  data.bingoLog.push({ playerId, bingoType, loggedAt: Date.now() })
  writeData(data)
}

function clearAllData() {
  writeData({ players: [], bingoLog: [] })
}

module.exports = { savePlayer, saveBingoLog, clearAllData }
