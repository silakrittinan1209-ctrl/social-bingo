'use client'
import { useState, useEffect } from 'react'
import QRCodeDisplay from '@/components/QRCodeDisplay'

export default function QRPage() {
  const [registerUrl, setRegisterUrl] = useState('')

  useEffect(() => {
    fetch('/api/tunnel-url')
      .then((r) => r.json())
      .then((data) => {
        const base = data.url || window.location.origin
        setRegisterUrl(`${base}/register`)
      })
      .catch(() => setRegisterUrl(`${window.location.origin}/register`))
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
            <div className="w-[280px] h-[280px] flex items-center justify-center text-gray-400 text-sm">
              กำลังโหลด...
            </div>
          )}
        </div>

        <p className="text-white text-2xl font-bold mt-8 drop-shadow">
          สแกนเพื่อเข้าร่วมเกม
        </p>

        {registerUrl && (
          <p className="text-white/70 text-base mt-3 font-mono bg-black/20 px-4 py-2 rounded-xl break-all max-w-md mx-auto">
            {registerUrl}
          </p>
        )}
      </div>
    </div>
  )
}
