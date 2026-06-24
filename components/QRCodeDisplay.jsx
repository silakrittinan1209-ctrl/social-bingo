'use client'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCodeDisplay({ url, size = 200 }) {
  if (!url) return null
  return (
    <div className="flex justify-center">
      <div className="bg-white p-3 rounded-xl inline-block">
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          includeMargin={false}
        />
      </div>
    </div>
  )
}
