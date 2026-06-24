'use client'
import BingoCell from './BingoCell'

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

export default function BingoCard({ cardOrder, checkedCells, cellSelections, onCheck, disabled }) {
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="grid grid-cols-4 gap-1.5">
        {cardOrder.map((origIdx, pos) => (
          <BingoCell
            key={pos}
            text={BINGO_ITEMS[origIdx]}
            checked={checkedCells.has(origIdx)}
            selectedPlayer={cellSelections[origIdx] || null}
            onClick={() => onCheck(origIdx)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
