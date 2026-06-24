'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import BingoCard from '@/components/BingoCard'
import WinModal from '@/components/WinModal'

export default function GamePage() {
  const router = useRouter()
  const { socket, isConnected } = useSocket()

  const [playerId, setPlayerId] = useState(null)
  const [cardOrder, setCardOrder] = useState([])
  const [nickname, setNickname] = useState('')
  const [village, setVillage] = useState('')
  const [checkedCells, setCheckedCells] = useState(new Set())
  const [bingoTypes, setBingoTypes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newBingoTypes, setNewBingoTypes] = useState([])
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const pid = sessionStorage.getItem('playerId')
    const co = sessionStorage.getItem('cardOrder')
    const nick = sessionStorage.getItem('nickname')
    const vil = sessionStorage.getItem('village')

    if (!pid || !co) {
      router.replace('/register')
      return
    }

    setPlayerId(pid)
    setCardOrder(JSON.parse(co))
    setNickname(nick || '')
    setVillage(vil || '')
  }, [router])

  useEffect(() => {
    if (!socket) return

    const handleBingo = (data) => {
      if (data.playerId === playerId) {
        setBingoTypes(data.bingoTypes || [])
        setNewBingoTypes(data.newTypes || [])
        setShowModal(true)
      }
    }

    const handleReset = () => {
      sessionStorage.clear()
      router.replace('/register')
    }

    socket.on('player:bingo', handleBingo)
    socket.on('game:reset', handleReset)

    return () => {
      socket.off('player:bingo', handleBingo)
      socket.off('game:reset', handleReset)
    }
  }, [socket, playerId, router])

  const handleCheck = useCallback(
    (origIdx) => {
      if (!socket || !isConnected || checking || checkedCells.has(origIdx)) return

      setChecking(true)
      socket.emit('player:check', { playerId, index: origIdx }, (res) => {
        setChecking(false)
        if (res?.ok && res.checkedCells) {
          setCheckedCells(new Set(res.checkedCells))
        }
      })
    },
    [socket, isConnected, checking, checkedCells, playerId]
  )

  if (!playerId || cardOrder.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    )
  }

  const checkedCount = checkedCells.size
  const hasFullhouse = bingoTypes.includes('fullhouse')

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 shadow-lg">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div>
            <div className="font-bold text-lg leading-tight">{nickname}</div>
            <div className="text-indigo-200 text-xs">{village}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black">{checkedCount}/16</div>
            <div className="text-indigo-200 text-xs">ช่องที่เลือก</div>
          </div>
        </div>

        {bingoTypes.length > 0 && (
          <div className="max-w-sm mx-auto mt-2 flex flex-wrap gap-1">
            {bingoTypes.map((t) => (
              <span
                key={t}
                className={`text-xs px-2 py-0.5 rounded-full font-bold
                  ${t === 'fullhouse'
                    ? 'bg-yellow-400 text-yellow-900'
                    : 'bg-white/20 text-white'
                  }`}
              >
                {t === 'row' ? '→ แนวนอน' : t === 'col' ? '↓ แนวตั้ง' : t === 'diagonal' ? '✕ ทแยง' : '👑 Full House'}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-sm mx-auto px-3 pt-4">
        <div className="text-center mb-3">
          <h2 className="text-sm font-semibold text-gray-600">
            กดช่องที่คุณเคยทำ หรือกำลังทำอยู่
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'
              }`}
            />
            <span className="text-xs text-gray-400">
              {isConnected ? 'เชื่อมต่อแล้ว' : 'กำลังเชื่อมต่อ...'}
            </span>
          </div>
        </div>

        {hasFullhouse && (
          <div className="mb-3 bg-yellow-400 rounded-2xl p-3 text-center shadow-lg glow-gold">
            <div className="text-2xl">👑</div>
            <div className="font-black text-yellow-900 text-sm">
              FULL HOUSE! คุณทำสำเร็จแล้ว!
            </div>
          </div>
        )}

        <BingoCard
          cardOrder={cardOrder}
          checkedCells={checkedCells}
          onCheck={handleCheck}
          disabled={!isConnected || checking}
        />

        <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 mb-2">คำแนะนำ</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• กดช่องที่ตรงกับพฤติกรรมของคุณ</li>
            <li>• ครบ 4 ช่องในแนวเดียวกัน = Bingo!</li>
            <li>• ครบทุกช่อง 16 ช่อง = Full House!</li>
          </ul>
        </div>
      </div>

      {showModal && (
        <WinModal
          bingoTypes={newBingoTypes.length > 0 ? newBingoTypes : bingoTypes}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
