import { NextResponse } from 'next/server'

export async function POST() {
  try {
    if (global._bingoGame) {
      global._bingoGame.resetGame()
    }
    if (global.io) {
      global.io.emit('game:reset')
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
