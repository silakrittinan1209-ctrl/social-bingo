'use client'
import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'

export default function PlayerSelectModal({ currentPlayerId, cellText, playerUsage, onSelect, onClose }) {
  const { socket } = useSocket()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!socket) return
    socket.emit('players:request', (res) => {
      const list = (res?.players || []).filter((p) => p.id !== currentPlayerId)
      setPlayers(list)
      setLoading(false)
    })
  }, [socket, currentPlayerId])

  const filtered = players.filter(
    (p) =>
      p.nickname.toLowerCase().includes(search.toLowerCase()) ||
      p.village.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 shrink-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-gray-800 text-base">เลือกชื่อผู้เล่น</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none px-1">✕</button>
          </div>
          <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-2 py-1.5 line-clamp-2 mb-3">
            "{cellText}"
          </p>
          <input
            autoFocus
            type="text"
            placeholder="ค้นหาชื่อหรือหมู่บ้าน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              {players.length === 0 ? (
                <div>
                  <div className="text-3xl mb-2">👥</div>
                  <div className="font-semibold text-gray-500 mb-1">รอผู้เล่นคนอื่น</div>
                  <div className="text-xs text-gray-400">ต้องมีผู้เล่นอื่นลงทะเบียนก่อน<br/>ถึงจะสามารถเลือกได้</div>
                </div>
              ) : 'ไม่พบผู้เล่นที่ค้นหา'}
            </div>
          ) : (
            filtered.map((p) => {
              const usageCount = playerUsage[p.id] || 0
              const disabled = usageCount >= 2
              return (
                <button
                  key={p.id}
                  onClick={() => !disabled && onSelect(p)}
                  disabled={disabled}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-left transition-all
                    ${disabled
                      ? 'opacity-40 cursor-not-allowed bg-gray-50'
                      : 'hover:bg-indigo-50 active:scale-95 cursor-pointer'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                    ${disabled ? 'bg-gray-200 text-gray-400' : 'bg-indigo-100 text-indigo-600'}`}>
                    {p.nickname.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 truncate">{p.nickname}</div>
                    <div className="text-xs text-gray-400 truncate">{p.village}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0
                    ${usageCount === 0 ? 'bg-green-100 text-green-600'
                    : usageCount === 1 ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-500'}`}>
                    {usageCount}/2
                  </span>
                </button>
              )
            })
          )}
        </div>

        <div className="p-3 border-t border-gray-100 shrink-0">
          <p className="text-xs text-gray-400 text-center">
            ชื่อ 1 คน ใช้ได้สูงสุด 2 ช่อง • {filtered.length} คนในระบบ
          </p>
        </div>
      </div>
    </div>
  )
}
