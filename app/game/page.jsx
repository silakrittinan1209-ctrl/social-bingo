'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import BingoCard from '@/components/BingoCard'
import WinModal from '@/components/WinModal'
import PlayerSelectModal from '@/components/PlayerSelectModal'
import ConfirmRequestModal from '@/components/ConfirmRequestModal'
import TimerDisplay from '@/components/TimerDisplay'

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
  const [pendingCells, setPendingCells] = useState(new Set())
  const [cellSelections, setCellSelections] = useState({})   // origIdx -> {id, nickname}
  const [playerUsage, setPlayerUsage] = useState({})          // playerId -> count
  const [bingoTypes, setBingoTypes] = useState([])

  // outgoing request tracking: origIdx -> { confirmId, selectedPlayer }
  const outgoingRef = useRef({})

  // modal state
  const [showWinModal, setShowWinModal] = useState(false)
  const [newBingoTypes, setNewBingoTypes] = useState([])
  const [pendingCell, setPendingCell] = useState(null)        // waiting for player pick
  const [incomingRequest, setIncomingRequest] = useState(null) // incoming from another player
  const [toast, setToast] = useState(null)

  // timer state
  const [timer, setTimer] = useState({ running: false, timeLeft: 0, totalTime: 0 })
  const [gameEnded, setGameEnded] = useState(false)

  function showToast(msg, type = 'info') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

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

    const onBingo = (data) => {
      if (data.playerId === playerId) {
        setBingoTypes(data.bingoTypes || [])
        setNewBingoTypes(data.newTypes || [])
        setShowWinModal(true)
      }
    }

    const onReset = () => { sessionStorage.clear(); router.replace('/register') }

    // Incoming confirmation request (Player B)
    const onIncoming = (data) => setIncomingRequest(data)

    // Result of my outgoing request (Player A)
    const onResult = (data) => {
      const { cellIndex, accepted, timeout, checkedCells: newChecked, playerUsage: newUsage, error } = data

      // Remove from pending
      setPendingCells((prev) => { const s = new Set(prev); s.delete(cellIndex); return s })
      const outgoing = outgoingRef.current[cellIndex]
      delete outgoingRef.current[cellIndex]

      if (accepted && newChecked) {
        setCheckedCells(new Set(newChecked))
        setPlayerUsage(newUsage || {})
        if (outgoing?.selectedPlayer) {
          setCellSelections((prev) => ({ ...prev, [cellIndex]: outgoing.selectedPlayer }))
        }
        showToast(`✅ ${outgoing?.selectedPlayer?.nickname || 'ผู้เล่น'} ยืนยันแล้ว!`, 'success')
      } else if (timeout) {
        showToast(`⏱ หมดเวลา — ${outgoing?.selectedPlayer?.nickname || 'ผู้เล่น'} ไม่ตอบ`, 'warning')
      } else if (error === 'player_used_max') {
        showToast('ชื่อนี้ถูกใช้ครบ 2 ช่องแล้ว', 'error')
      } else {
        showToast(`❌ ${outgoing?.selectedPlayer?.nickname || 'ผู้เล่น'} ปฏิเสธ`, 'error')
      }
    }

    const onTimerUpdate = (data) => setTimer(data)
    const onTimerEnd = () => { setGameEnded(true); setTimer((t) => ({ ...t, running: false, timeLeft: 0 })) }

    socket.on('player:bingo', onBingo)
    socket.on('game:reset', onReset)
    socket.on('confirm:incoming', onIncoming)
    socket.on('confirm:result', onResult)
    socket.on('timer:update', onTimerUpdate)
    socket.on('timer:end', onTimerEnd)

    return () => {
      socket.off('player:bingo', onBingo)
      socket.off('game:reset', onReset)
      socket.off('confirm:incoming', onIncoming)
      socket.off('confirm:result', onResult)
      socket.off('timer:update', onTimerUpdate)
      socket.off('timer:end', onTimerEnd)
    }
  }, [socket, playerId, router])

  // Cell clicked → open player pick modal
  const handleCellClick = useCallback((origIdx) => {
    if (!isConnected || checkedCells.has(origIdx) || pendingCells.has(origIdx)) return
    setPendingCell(origIdx)
  }, [isConnected, checkedCells, pendingCells])

  // Player selected → send confirm:request
  const handlePlayerSelect = useCallback((selectedPlayer) => {
    if (!socket || !playerId || pendingCell === null) return
    const cellIndex = pendingCell
    setPendingCell(null)

    socket.emit('confirm:request', { fromPlayerId: playerId, toPlayerId: selectedPlayer.id, cellIndex }, (res) => {
      if (res?.ok) {
        setPendingCells((prev) => new Set([...prev, cellIndex]))
        outgoingRef.current[cellIndex] = { confirmId: res.confirmId, selectedPlayer }
        showToast(`⏳ รอ ${selectedPlayer.nickname} ยืนยัน...`, 'info')
      } else if (res?.error === 'player_used_max') {
        showToast('ชื่อนี้ถูกใช้ครบ 2 ช่องแล้ว', 'error')
      } else {
        showToast('เกิดข้อผิดพลาด ลองใหม่', 'error')
      }
    })
  }, [socket, playerId, pendingCell])

  // Player B: respond to incoming request
  const handleConfirmRespond = useCallback((accepted) => {
    if (!socket || !incomingRequest) return
    const { confirmId } = incomingRequest
    setIncomingRequest(null)
    socket.emit('confirm:respond', { confirmId, accepted })
    showToast(accepted ? '✅ ยืนยันแล้ว' : '❌ ปฏิเสธแล้ว', accepted ? 'success' : 'info')
  }, [socket, incomingRequest])

  if (!playerId || cardOrder.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">กำลังโหลด...</div></div>
  }

  const hasFullhouse = bingoTypes.includes('fullhouse')

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 shadow-lg">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-bold text-lg leading-tight">{nickname}</div>
              <div className="text-indigo-200 text-xs">{village}</div>
            </div>
            <div className="flex items-center gap-3">
              {timer.totalTime > 0 && (
                <TimerDisplay
                  timeLeft={timer.timeLeft}
                  totalTime={timer.totalTime}
                  running={timer.running}
                  compact
                />
              )}
              <div className="text-right">
                <div className="text-2xl font-black">{checkedCells.size}/16</div>
                <div className="text-indigo-200 text-xs">ช่อง</div>
              </div>
            </div>
          </div>

          {bingoTypes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {bingoTypes.map((t) => (
                <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-bold
                  ${t === 'fullhouse' ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white'}`}>
                  {t === 'row' ? '→ แนวนอน' : t === 'col' ? '↓ แนวตั้ง' : t === 'diagonal' ? '✕ ทแยง' : '👑 Full House'}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-sm mx-auto px-3 pt-4">
        {/* Game ended banner */}
        {gameEnded && (
          <div className="mb-3 bg-red-500 rounded-2xl p-3 text-center text-white font-black text-lg shadow-lg">
            ⏹ หมดเวลาแล้ว!
          </div>
        )}

        {hasFullhouse && (
          <div className="mb-3 bg-yellow-400 rounded-2xl p-3 text-center shadow-lg glow-gold">
            <div className="text-2xl">👑</div>
            <div className="font-black text-yellow-900 text-sm">FULL HOUSE! คุณทำสำเร็จแล้ว!</div>
          </div>
        )}

        <div className="text-center mb-3">
          <h2 className="text-sm font-semibold text-gray-600">
            กดช่อง → เลือกชื่อเพื่อน → รอยืนยัน
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
            <span className="text-xs text-gray-400">{isConnected ? 'เชื่อมต่อแล้ว' : 'กำลังเชื่อมต่อ...'}</span>
          </div>
        </div>

        <BingoCard
          cardOrder={cardOrder}
          checkedCells={checkedCells}
          pendingCells={pendingCells}
          cellSelections={cellSelections}
          onCheck={handleCellClick}
          disabled={!isConnected || gameEnded}
        />

        <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 mb-2">วิธีเล่น</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• กดช่อง → เลือกชื่อเพื่อนที่มีพฤติกรรมนั้น</li>
            <li>• <span className="text-yellow-600 font-semibold">⏳ เหลือง</span> = รอเพื่อนยืนยัน (30 วิ)</li>
            <li>• <span className="text-indigo-600 font-semibold">■ น้ำเงิน</span> = ยืนยันแล้ว</li>
            <li>• ชื่อคนเดียวกันใช้ได้สูงสุด <strong>2 ช่อง</strong></li>
          </ul>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white transition-all
          ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : toast.type === 'warning' ? 'bg-orange-400' : 'bg-gray-700'}`}>
          {toast.msg}
        </div>
      )}

      {/* Player Select Modal (Player A picks who to request) */}
      {pendingCell !== null && (
        <PlayerSelectModal
          currentPlayerId={playerId}
          cellText={BINGO_ITEMS[pendingCell]}
          playerUsage={playerUsage}
          onSelect={handlePlayerSelect}
          onClose={() => setPendingCell(null)}
        />
      )}

      {/* Incoming Confirm Request Modal (Player B accepts/declines) */}
      {incomingRequest && (
        <ConfirmRequestModal
          request={incomingRequest}
          onAccept={() => handleConfirmRespond(true)}
          onDecline={() => handleConfirmRespond(false)}
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
