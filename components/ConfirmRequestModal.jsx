'use client'
import { useState, useEffect } from 'react'

export default function ConfirmRequestModal({ request, onAccept, onDecline }) {
  const { fromNickname, fromVillage, cellText, timeoutSec } = request
  const [timeLeft, setTimeLeft] = useState(timeoutSec)

  useEffect(() => {
    if (timeLeft <= 0) { onDecline(); return }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, onDecline])

  const pct = (timeLeft / timeoutSec) * 100
  const urgent = timeLeft <= 10

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className={`h-full transition-all duration-1000 ${urgent ? 'bg-red-500' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🔔</div>
            <h3 className="font-black text-lg text-gray-800">มีคนเลือกคุณ!</h3>
          </div>

          {/* From player */}
          <div className="bg-indigo-50 rounded-2xl p-3 mb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
              {fromNickname.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-gray-800">{fromNickname}</div>
              <div className="text-xs text-gray-500">{fromVillage}</div>
            </div>
          </div>

          {/* Cell text */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">เลือกคุณสำหรับพฤติกรรม:</p>
            <p className="text-sm font-semibold text-gray-800 leading-snug">"{cellText}"</p>
          </div>

          {/* Timer */}
          <p className={`text-center text-sm mb-4 font-bold ${urgent ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
            ⏱ {timeLeft} วินาที
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 active:scale-95 transition-all"
            >
              ❌ ปฏิเสธ
            </button>
            <button
              onClick={onAccept}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
            >
              ✅ ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
