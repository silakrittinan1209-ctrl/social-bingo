'use client'
import { useEffect, useRef } from 'react'

const BINGO_TYPE_LABELS = {
  row: '🏆 แนวนอน!',
  col: '🏆 แนวตั้ง!',
  diagonal: '🏆 แนวทแยง!',
  fullhouse: '👑 Full House!',
}

const BINGO_TYPE_DESC = {
  row: 'ครบ 4 ช่องแนวนอน',
  col: 'ครบ 4 ช่องแนวตั้ง',
  diagonal: 'ครบ 4 ช่องแนวทแยง',
  fullhouse: 'ครบทุกช่อง 16 ช่อง!',
}

export default function WinModal({ bingoTypes, onClose }) {
  const canvasRef = useRef(null)
  const latestType = bingoTypes[bingoTypes.length - 1]
  const isFullhouse = bingoTypes.includes('fullhouse')

  useEffect(() => {
    let confetti
    async function runConfetti() {
      const mod = await import('canvas-confetti')
      confetti = mod.default

      const canvas = canvasRef.current
      if (!canvas) return

      const myConfetti = confetti.create(canvas, { resize: true })

      const duration = isFullhouse ? 6000 : 3000
      const end = Date.now() + duration

      const colors = isFullhouse
        ? ['#FFD700', '#FFA500', '#FF6347', '#FF1493']
        : ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4']

      function frame() {
        myConfetti({
          particleCount: isFullhouse ? 8 : 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        })
        myConfetti({
          particleCount: isFullhouse ? 8 : 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    }
    runConfetti()
  }, [isFullhouse])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
      />
      <div
        className={`relative rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center transform animate-bounce-in
          ${isFullhouse
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
            : 'bg-gradient-to-br from-indigo-600 to-purple-700'
          }`}
      >
        <div className="text-6xl mb-4">{isFullhouse ? '👑' : '🎉'}</div>

        <h2
          className={`text-3xl font-black mb-2 ${
            isFullhouse ? 'text-yellow-900' : 'text-white'
          }`}
        >
          {isFullhouse ? 'FULL HOUSE!' : 'BINGO!'}
        </h2>

        <div className="space-y-2 mb-6">
          {bingoTypes.map((t) => (
            <div
              key={t}
              className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold mr-2 mb-2
                ${isFullhouse
                  ? 'bg-yellow-900/20 text-yellow-900'
                  : 'bg-white/20 text-white'
                }`}
            >
              {BINGO_TYPE_LABELS[t]}
            </div>
          ))}
        </div>

        <p
          className={`text-sm mb-6 ${
            isFullhouse ? 'text-yellow-900/80' : 'text-white/80'
          }`}
        >
          {BINGO_TYPE_DESC[latestType]}
          <br />
          คุณสร้างความตระหนักรู้ให้ตัวเองแล้ว! 🌟
        </p>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-xl font-bold text-base transition-all active:scale-95
            ${isFullhouse
              ? 'bg-yellow-900 text-yellow-100 hover:bg-yellow-800'
              : 'bg-white text-indigo-700 hover:bg-gray-100'
            }`}
        >
          ยอดเยี่ยม! เล่นต่อ
        </button>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
