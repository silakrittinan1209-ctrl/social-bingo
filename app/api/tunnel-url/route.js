import { NextResponse } from 'next/server'

export async function GET() {
  // On cloud deployment, tunnel URL is not used — return null
  // QR page will fall back to window.location.origin
  try {
    const logPath = process.platform === 'win32'
      ? 'C:\\Windows\\Temp\\cf-tunnel.log'
      : '/tmp/cf-tunnel.log'
    const { readFileSync } = await import('fs')
    const content = readFileSync(logPath, 'utf8')
    const match = content.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g)
    if (match && match.length > 0) {
      return NextResponse.json({ url: match[match.length - 1] })
    }
  } catch {}
  return NextResponse.json({ url: null })
}
