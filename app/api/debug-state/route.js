import { NextResponse } from 'next/server'

export async function GET() {
  const game = global._bingoGame
  if (!game) return NextResponse.json({ error: 'no global._bingoGame' })
  const state = game.getGameState()
  return NextResponse.json({
    hasGlobal: !!game,
    playerCount: state.players.size,
    playerIds: [...state.players.keys()],
  })
}
