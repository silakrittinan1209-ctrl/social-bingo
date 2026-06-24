import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'

export async function GET() {
  try {
    const logPath = 'C:\\Windows\\Temp\\cf-tunnel.log'
    const content = readFileSync(logPath, 'utf8')
    // URL appears anywhere in the log content
    const match = content.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g)
    if (match && match.length > 0) {
      const url = match[match.length - 1]
      return NextResponse.json({ url })
    }
  } catch {}
  return NextResponse.json({ url: null })
}
