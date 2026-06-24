import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const game = global._bingoGame
    if (!game) return NextResponse.json({ players: [], total: 0 })

    const state = game.getGameState()
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
    return NextResponse.json({ players, total: players.length })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
