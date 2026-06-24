import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'

export async function GET() {
  try {
    const logPath = 'C:\\Windows\\Temp\\cf-tunnel.log'
    const content = readFileSync(logPath, 'utf8')
    const matches = content.match(/"(https:\/\/[^"]+trycloudflare\.com)"/g)
    if (matches && matches.length > 0) {
      const url = matches[matches.length - 1].replace(/"/g, '')
      return NextResponse.json({ url })
    }
  } catch {}
  return NextResponse.json({ url: null })
}
