'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'

export default function RegisterPage() {
  const router = useRouter()
  const { socket, isConnected } = useSocket()
  const [nickname, setNickname] = useState('')
  const [village, setVillage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    if (!socket) return

    const handleGameState = (data) => {
      setGameStarted(Boolean(data?.gameStarted))
    }

    socket.on('game:state', handleGameState)

    const handleGameStarted = () => setGameStarted(true)
    socket.on('game:started', handleGameStarted)

    return () => {
      socket.off('game:state', handleGameState)
      socket.off('game:started', handleGameStarted)
    }
  }, [socket])

  // Allow users to register without auto-redirecting if they already have playerId
  // This enables re-registration if needed

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nickname.trim() || !village.trim()) {
      setError('กรุณากรอกชื่อเล่นและชื่อหมู่บ้าน')
      return
    }
    if (!socket || !isConnected) {
      setError('กำลังเชื่อมต่อ... กรุณารอสักครู่')
      return
    }

    setLoading(true)
    setError('')

    socket.emit(
      'player:join',
      { nickname: nickname.trim(), village: village.trim() },
      (res) => {
        if (res?.error) {
          setError(res.error)
          setLoading(false)
          return
        }
        if (res?.playerId) {
          sessionStorage.setItem('playerId', res.playerId)
          sessionStorage.setItem('cardOrder', JSON.stringify(res.cardOrder))
          sessionStorage.setItem('nickname', nickname.trim())
          sessionStorage.setItem('village', village.trim())
          router.push('/game')
        }
      }
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🎯</div>
          <h1 className="text-2xl font-bold text-gray-800 leading-tight">
            Social Bingo
          </h1>
          <p className="text-sm text-gray-500 mt-2 leading-snug">
            พฤติกรรมเสี่ยงบนโซเชียลมีเดีย
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ชื่อเล่น
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="กรอกชื่อเล่นของคุณ"
              maxLength={20}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-indigo-500 transition-colors"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ชื่อหมู่บ้าน
            </label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="กรอกชื่อหมู่บ้านของคุณ"
              maxLength={30}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-indigo-500 transition-colors"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'
                }`}
              />
              {isConnected ? 'เชื่อมต่อแล้ว' : 'กำลังเชื่อมต่อ...'}
            </div>
            <div className="mt-1 font-medium text-gray-700">
              {gameStarted ? 'เกมเริ่มแล้ว คุณสามารถเล่นได้ทันที' : 'รอแอดมินกดเริ่มเกมก่อน'}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isConnected}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'กำลังเข้าร่วม...' : 'เข้าร่วมเกม 🎮'}
          </button>
        </form>
      </div>
    </div>
  )
}
