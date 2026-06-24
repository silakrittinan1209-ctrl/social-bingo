'use client'
import { useState, useEffect } from 'react'
import QRCodeDisplay from '@/components/QRCodeDisplay'

export default function QRPage() {
  const [registerUrl, setRegisterUrl] = useState('')
  const [isLocalhost, setIsLocalhost] = useState(false)

  useEffect(() => {
    const origin = window.location.origin
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1')
    setIsLocalhost(isLocal)

    if (!isLocal) {
      setRegisterUrl(`${origin}/register`)
      return
    }

    // On localhost: try to get the public tunnel URL
    fetch('/api/tunnel-url')
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          setRegisterUrl(`${data.url}/register`)
        } else {
          setRegisterUrl(`${origin}/register`)
        }
      })
      .catch(() => setRegisterUrl(`${origin}/register`))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="text-5xl mb-6">🎯</div>
        <h1 className="text-white text-4xl font-black mb-2 drop-shadow-lg">
          Social Bingo
        </h1>
        <p className="text-white/80 text-xl mb-10">
          พฤติกรรมเสี่ยงบนโซเชียลมีเดีย
        </p>

        <div className="bg-white rounded-3xl p-8 shadow-2xl inline-block">
          {registerUrl ? (
            <QRCodeDisplay url={registerUrl} size={280} />
          ) : (
            <div className="w-[280px] h-[280px] flex items-center justify-center text-gray-400">
              กำลังโหลด...
            </div>
          )}
        </div>

        <p className="text-white text-2xl font-bold mt-8 drop-shadow">
          สแกนเพื่อเข้าร่วมเกม
        </p>

        {registerUrl && (
          <p className="text-white/70 text-base mt-3 font-mono bg-black/20 px-4 py-2 rounded-xl break-all">
            {registerUrl}
          </p>
        )}

        {isLocalhost && registerUrl && registerUrl.includes('localhost') && (
          <div className="mt-4 bg-yellow-400/90 text-yellow-900 text-sm font-semibold px-4 py-3 rounded-xl max-w-sm mx-auto">
            ⚠️ กำลังแสดง localhost — เปิดหน้านี้ผ่าน URL สาธารณะเพื่อให้ผู้เล่นสแกนได้
          </div>
        )}
      </div>
    </div>
  )
}
