'use client'
import { useState, useEffect, useRef } from 'react'
import { useSocket } from '@/hooks/useSocket'

const BINGO_TYPE_LABELS = {
  row: '→ แนวนอน',
  col: '↓ แนวตั้ง',
  diagonal: '✕ ทแยง',
  fullhouse: '👑 Full House',
}

function formatTime(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function LeaderboardPage() {
  const { socket } = useSocket()
  const [data, setData] = useState({ totalPlayers: 0, winners: [] })
  const prevWinnersRef = useRef([])

  useEffect(() => {
    if (!socket) return

    const handleUpdate = (d) => {
      setData((prev) => {
        prevWinnersRef.current = prev.winners.map((w) => w.id)
        return d
      })
    }

    const handleReset = () => setData({ totalPlayers: 0, winners: [] })

    socket.on('leaderboard:update', handleUpdate)
    socket.on('game:reset', handleReset)

    return () => {
      socket.off('leaderboard:update', handleUpdate)
      socket.off('game:reset', handleReset)
    }
  }, [socket])

  const prevIds = prevWinnersRef.current

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2">
          🏆 LEADERBOARD
        </h1>
        <p className="text-gray-400 text-lg">Social Bingo - พฤติกรรมเสี่ยงบนโซเชียลมีเดีย</p>

        <div className="flex justify-center gap-8 mt-4">
          <div className="text-center">
            <div className="text-4xl font-black text-white">{data.totalPlayers}</div>
            <div className="text-sm text-gray-400">ผู้เล่นทั้งหมด</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-yellow-400">{data.winners.length}</div>
            <div className="text-sm text-gray-400">ได้ Bingo แล้ว</div>
          </div>
        </div>
      </div>

      {/* Winners list */}
      <div className="max-w-4xl mx-auto space-y-3">
        {data.winners.length === 0 && (
          <div className="text-center text-gray-500 text-xl py-20">
            รอผู้เล่น... 🎮
          </div>
        )}

        {data.winners.map((winner, index) => {
          const isNew = !prevIds.includes(winner.id)
          const isFullhouse = winner.bingoTypes.includes('fullhouse')
          const rank = index + 1

          return (
            <div
              key={winner.id}
              className={`
                rounded-2xl p-4 flex items-center gap-4 transition-all
                ${isNew ? 'slide-in' : ''}
                ${isFullhouse
                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500 glow-gold'
                  : rank <= 3
                  ? 'bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-700'
                  : 'bg-gray-800/60 border border-gray-700'
                }
              `}
            >
              {/* Rank */}
              <div
                className={`text-3xl font-black w-12 text-center shrink-0
                  ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-orange-400' : 'text-gray-500'}
                `}
              >
                {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className={`font-black text-xl truncate ${isFullhouse ? 'text-yellow-300' : 'text-white'}`}>
                  {winner.nickname}
                  {isFullhouse && ' 👑'}
                </div>
                <div className="text-gray-400 text-sm">{winner.village}</div>
              </div>

              {/* Bingo types */}
              <div className="flex flex-wrap gap-1 justify-end">
                {winner.bingoTypes.map((t) => (
                  <span
                    key={t}
                    className={`text-xs px-2 py-1 rounded-lg font-bold
                      ${t === 'fullhouse'
                        ? 'bg-yellow-500 text-yellow-900'
                        : 'bg-indigo-700 text-indigo-200'
                      }`}
                  >
                    {BINGO_TYPE_LABELS[t]}
                  </span>
                ))}
              </div>

              {/* Time */}
              <div className="text-right shrink-0">
                <div className={`text-sm font-mono ${isFullhouse ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {formatTime(winner.bingoTime)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
