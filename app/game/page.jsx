'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import BingoCard from '@/components/BingoCard'
import WinModal from '@/components/WinModal'
import PlayerSelectModal from '@/components/PlayerSelectModal'

const BINGO_ITEMS = [
  'เลื่อนดูโซเชียลเป็นเวลานานเกินความจำเป็น (Doom Scrolling)',
  'เช็กมือถือหรือโซเชียลทุกไม่กี่นาที',
  'ใช้โซเชียลก่อนนอนจนดึกเป็นประจำ',
  'ใช้โซเชียลทันทีหลังตื่นนอน',
  'เสพติดยอดไลก์ ยอดแชร์ และยอดผู้ติดตาม',
  'เปรียบเทียบชีวิตตนเองกับคนอื่นบนโซเชียล',
  'ดูคลิปสั้นต่อเนื่องหลายชั่วโมง',
  'เล่นโซเชียลระหว่างเรียนหรือทำงาน',
  'เล่นโทรศัพท์ขณะเดิน ข้ามถนน หรือขับรถ',
  'แชร์ข้อมูลส่วนตัวมากเกินไป',
  'กดลิงก์หรือดาวน์โหลดไฟล์จากแหล่งที่ไม่น่าเชื่อถือ',
  'เชื่อและแชร์ข่าวปลอมโดยไม่ตรวจสอบ',
  'ซื้อสินค้าตามกระแสหรือรีวิวโดยไม่พิจารณาให้รอบคอบ',
  'มีส่วนร่วมในการดราม่าหรือการโจมตีผู้อื่นทางออนไลน์',
  'ใช้คำพูดรุนแรง แสดงความคิดเห็นด้วยอารมณ์',
  'รับเพื่อน ติดตาม หรือพูดคุยกับคนแปลกหน้าโดยไม่ระมัดระวัง',
]

export default function GamePage() {
  const router = useRouter()
  const { socket, isConnected } = useSocket()

  const [playerId, setPlayerId] = useState(null)
  const [cardOrder, setCardOrder] = useState([])
  const [nickname, setNickname] = useState('')
  const [village, setVillage] = useState('')

  // bingo state
  const [checkedCells, setCheckedCells] = useState(new Set())
  const [cellSelections, setCellSelections] = useState({}) // origIdx -> {id, nickname}
  const [playerUsage, setPlayerUsage] = useState({})       // playerId -> count
  const [bingoTypes, setBingoTypes] = useState([])

  // modal state
  const [showWinModal, setShowWinModal] = useState(false)
  const [newBingoTypes, setNewBingoTypes] = useState([])
  const [pendingCell, setPendingCell] = useState(null)      // origIdx waiting for player selection
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const pid = sessionStorage.getItem('playerId')
    const co = sessionStorage.getItem('cardOrder')
    const nick = sessionStorage.getItem('nickname')
    const vil = sessionStorage.getItem('village')
    if (!pid || !co) { router.replace('/register'); return }
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
        setShowWinModal(true)
      }
    }
    const handleReset = () => { sessionStorage.clear(); router.replace('/register') }
    socket.on('player:bingo', handleBingo)
    socket.on('game:reset', handleReset)
    return () => {
      socket.off('player:bingo', handleBingo)
      socket.off('game:reset', handleReset)
    }
  }, [socket, playerId, router])

  // Cell clicked → open player select modal
  const handleCellClick = useCallback((origIdx) => {
    if (!isConnected || submitting || checkedCells.has(origIdx)) return
    setPendingCell(origIdx)
  }, [isConnected, submitting, checkedCells])

  // Player selected from modal → emit check
  const handlePlayerSelect = useCallback((selectedPlayer) => {
    if (!socket || !playerId || pendingCell === null) return
    setPendingCell(null)
    setSubmitting(true)

    socket.emit('player:check', { playerId, index: pendingCell, selectedPlayerId: selectedPlayer.id }, (res) => {
      setSubmitting(false)
      if (res?.ok) {
        setCheckedCells(new Set(res.checkedCells))
        setCellSelections((prev) => ({ ...prev, [pendingCell]: selectedPlayer }))
        setPlayerUsage(res.playerUsage || {})
      } else if (res?.error === 'player_used_max') {
        alert(`"${selectedPlayer.nickname}" ถูกเลือกครบ 2 ช่องแล้ว`)
      }
    })
  }, [socket, playerId, pendingCell])

  if (!playerId || cardOrder.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">กำลังโหลด...</div></div>
  }

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
            <div className="text-2xl font-black">{checkedCells.size}/16</div>
            <div className="text-indigo-200 text-xs">ช่องที่เลือก</div>
          </div>
        </div>
        {bingoTypes.length > 0 && (
          <div className="max-w-sm mx-auto mt-2 flex flex-wrap gap-1">
            {bingoTypes.map((t) => (
              <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-bold
                ${t === 'fullhouse' ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white'}`}>
                {t === 'row' ? '→ แนวนอน' : t === 'col' ? '↓ แนวตั้ง' : t === 'diagonal' ? '✕ ทแยง' : '👑 Full House'}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-sm mx-auto px-3 pt-4">
        <div className="text-center mb-3">
          <h2 className="text-sm font-semibold text-gray-600">
            กดช่อง → เลือกชื่อเพื่อนที่มีพฤติกรรมนั้น
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
            <span className="text-xs text-gray-400">{isConnected ? 'เชื่อมต่อแล้ว' : 'กำลังเชื่อมต่อ...'}</span>
          </div>
        </div>

        {hasFullhouse && (
          <div className="mb-3 bg-yellow-400 rounded-2xl p-3 text-center shadow-lg glow-gold">
            <div className="text-2xl">👑</div>
            <div className="font-black text-yellow-900 text-sm">FULL HOUSE! คุณทำสำเร็จแล้ว!</div>
          </div>
        )}

        <BingoCard
          cardOrder={cardOrder}
          checkedCells={checkedCells}
          cellSelections={cellSelections}
          onCheck={handleCellClick}
          disabled={!isConnected || submitting}
        />

        <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 mb-2">วิธีเล่น</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• กดช่องที่ตรงกับพฤติกรรมของเพื่อน</li>
            <li>• เลือกชื่อเพื่อนที่มีพฤติกรรมนั้น</li>
            <li>• ชื่อคนเดียวกันใช้ได้สูงสุด <strong>2 ช่อง</strong></li>
            <li>• ครบ 4 ช่องในแนวเดียวกัน = Bingo!</li>
          </ul>
        </div>
      </div>

      {/* Player Select Modal */}
      {pendingCell !== null && (
        <PlayerSelectModal
          currentPlayerId={playerId}
          cellText={BINGO_ITEMS[pendingCell]}
          playerUsage={playerUsage}
          onSelect={handlePlayerSelect}
          onClose={() => setPendingCell(null)}
        />
      )}

      {/* Win Modal */}
      {showWinModal && (
        <WinModal
          bingoTypes={newBingoTypes.length > 0 ? newBingoTypes : bingoTypes}
          onClose={() => setShowWinModal(false)}
        />
      )}
    </div>
  )
}
