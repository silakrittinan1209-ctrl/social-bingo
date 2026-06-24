import { NextResponse } from 'next/server'
import { networkInterfaces } from 'os'

export async function GET() {
  const nets = networkInterfaces()
  for (const iface of Object.values(nets)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal && !addr.address.startsWith('169.')) {
        return NextResponse.json({ url: `http://${addr.address}:3000` })
      }
    }
  }
  return NextResponse.json({ url: null })
}
