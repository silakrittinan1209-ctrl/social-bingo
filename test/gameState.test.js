const test = require('node:test')
const assert = require('node:assert/strict')

const {
  initGameState,
  handleJoin,
  handleCheck,
  setBingoPlayerLimit,
  setGameStarted,
  getGameState,
  getAdminData,
  resetGame,
} = require('../lib/gameState')

test.beforeEach(() => {
  initGameState()
  setBingoPlayerLimit(2)
})

test.afterEach(() => {
  resetGame()
})

test('allows players to join before the admin starts the game', () => {
  const player = handleJoin('socket-1', { nickname: 'Alice', village: 'A' })

  assert.equal(typeof player.id, 'string')
  assert.equal(getGameState().gameStarted, false)
  assert.equal(getGameState().players.size, 1)
})

test('blocks gameplay until the admin starts the game', () => {
  handleJoin('socket-1', { nickname: 'Alice', village: 'A' })
  const result = handleCheck('missing-player', 0)

  assert.deepEqual(result, { error: 'game_not_started' })

  setGameStarted(true)
  const player = handleJoin('socket-2', { nickname: 'Bob', village: 'B' })
  const startedResult = handleCheck(player.id, 0)

  assert.equal(startedResult.player.id, player.id)
})

test('ends the game when the configured bingo-player limit is reached', () => {
  setGameStarted(true)
  const firstPlayer = handleJoin('socket-1', { nickname: 'Alice', village: 'A' })
  const secondPlayer = handleJoin('socket-2', { nickname: 'Bob', village: 'B' })

  firstPlayer.cardOrder.slice(0, 4).forEach((cellIndex) => {
    handleCheck(firstPlayer.id, cellIndex)
  })

  assert.equal(getAdminData().bingoPlayers, 1)
  assert.equal(getGameState().gameEnded, false)

  secondPlayer.cardOrder.slice(0, 4).forEach((cellIndex) => {
    handleCheck(secondPlayer.id, cellIndex)
  })

  const adminData = getAdminData()
  assert.equal(adminData.bingoPlayers, 2)
  assert.equal(getGameState().gameEnded, true)
  assert.equal(adminData.gameEnded, true)
})
