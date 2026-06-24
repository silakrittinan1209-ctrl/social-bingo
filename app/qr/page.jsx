'use client'
import { useState, useEffect } from 'react'
import QRCodeDisplay from '@/components/QRCodeDisplay'

export default function QRPage() {
  const [registerUrl, setRegisterUrl] = useState('')
  const [mode, setMode] = useState('local') // 'local' | 'tunnel'
  const [localUrl, setLocalUrl] = useState('')
  const [tunnelUrl, setTunnelUrl] = useState('')

  useEffect(() => {
    // Get local IP URL
    fetch('/api/local-url')
      .then((r) => r.json())
      .then((d) => { if (d.url) setLocalUrl(`${d.url}/register`) })
      .catch(() => {})

    // Get tunnel URL
    fetch('/api/tunnel-url')
      .then((r) => r.json())
      .then((d) => { if (d.url) setTunnelUrl(`${d.url}/register`) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (mode === 'local' && localUrl) setRegisterUrl(localUrl)
    else if (mode === 'tunnel' && tunnelUrl) setRegisterUrl(tunnelUrl)
    else setRegisterUrl(localUrl || tunnelUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/register`)
  }, [mode, localUrl, tunnelUrl])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="text-5xl mb-4">🎯</div>
        <h1 className="text-white text-4xl font-black mb-2 drop-shadow-lg">Social Bingo</h1>
        <p className="text-white/80 text-xl mb-6">พฤติกรรมเสี่ยงบนโซเชียลมีเดีย</p>

        {/* Mode selector */}
        <div className="flex gap-2 justify-center mb-6">
          <button
            onClick={() => setMode('local')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'local' ? 'bg-white text-indigo-700 shadow-lg' : 'bg-white/20 text-white'}`}
          >
            📶 WiFi เดียวกัน
          </button>
          <button
            onClick={() => setMode('tunnel')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'tunnel' ? 'bg-white text-indigo-700 shadow-lg' : 'bg-white/20 text-white'}`}
          >
            🌐 อินเทอร์เน็ต
          </button>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl inline-block">
          {registerUrl ? (
            <QRCodeDisplay url={registerUrl} size={280} />
          ) : (
            <div className="w-[280px] h-[280px] flex items-center justify-center text-gray-400 text-sm">
              กำลังโหลด...
            </div>
          )}
        </div>

        <p className="text-white text-2xl font-bold mt-8 drop-shadow">สแกนเพื่อเข้าร่วมเกม</p>

        {registerUrl && (
          <p className="text-white/70 text-sm mt-3 font-mono bg-black/20 px-4 py-2 rounded-xl break-all max-w-md mx-auto">
            {registerUrl}
          </p>
        )}

        {mode === 'local' && (
          <p className="text-white/60 text-xs mt-2">ผู้เล่นต้องต่อ WiFi เดียวกับเครื่องนี้</p>
        )}
        {mode === 'tunnel' && (
          <p className="text-white/60 text-xs mt-2">ผู้เล่นเข้าได้จากทุกเครือข่าย</p>
        )}
      </div>
    </div>
  )
}
