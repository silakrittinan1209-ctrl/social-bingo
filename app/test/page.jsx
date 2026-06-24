'use client'
import { useState, useEffect } from 'react'

export default function TestPage() {
  const [logs, setLogs] = useState([])
  const [done, setDone] = useState(false)

  function log(msg, color = 'gray') {
    const t = new Date().toLocaleTimeString('th', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs((prev) => [...prev, { t, msg, color }])
  }

  useEffect(() => {
    const origin = window.location.origin
    log(`URL: ${origin}`, 'blue')
    log('กำลังทดสอบ HTTP...', 'gray')

    // Test 1: basic fetch
    fetch(`${origin}/api/players`)
      .then((r) => r.json())
      .then((d) => log(`✅ HTTP OK — players: ${d.total}`, 'green'))
      .catch((e) => log(`❌ HTTP Error: ${e.message}`, 'red'))

    // Test 2: Socket.IO polling handshake
    log('กำลังทดสอบ Socket.IO polling...', 'gray')
    fetch(`${origin}/socket.io/?EIO=4&transport=polling`)
      .then((r) => r.text())
      .then((t) => {
        if (t.startsWith('0{')) {
          log('✅ Socket.IO polling handshake OK', 'green')
          const sid = JSON.parse(t.slice(1)).sid
          log(`   SID: ${sid}`, 'green')

          // Test 3: Try to join as test player
          log('กำลัง import socket.io-client...', 'gray')
          import('socket.io-client').then(({ io }) => {
            log(`✅ socket.io-client loaded`, 'green')
            const sock = io(origin, {
              transports: ['polling'],
              upgrade: false,
              timeout: 15000,
            })
            sock.on('connect', () => {
              log(`✅ Socket connected: ${sock.id}`, 'green')
              sock.emit('player:join', { nickname: 'MobileTest', village: 'TestVillage' }, (res) => {
                if (res?.playerId) {
                  log(`✅ player:join OK — ID: ${res.playerId}`, 'green')
                  log('🎉 ระบบพร้อมใช้งาน!', 'green')
                } else {
                  log(`❌ player:join failed: ${JSON.stringify(res)}`, 'red')
                }
                sock.disconnect()
                setDone(true)
              })
            })
            sock.on('connect_error', (e) => {
              log(`❌ connect_error: ${e.message}`, 'red')
              setDone(true)
            })
            setTimeout(() => {
              if (!sock.connected) {
                log('❌ Timeout — ไม่สามารถเชื่อมต่อได้ใน 15 วิ', 'red')
                setDone(true)
              }
            }, 15000)
          }).catch((e) => log(`❌ Import error: ${e.message}`, 'red'))
        } else {
          log(`❌ Socket.IO handshake unexpected: ${t.substring(0, 80)}`, 'red')
          setDone(true)
        }
      })
      .catch((e) => {
        log(`❌ Socket.IO polling error: ${e.message}`, 'red')
        setDone(true)
      })
  }, [])

  return (
    <div style={{ fontFamily: 'monospace', padding: 16, background: '#111', minHeight: '100vh', color: '#eee' }}>
      <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#fff' }}>
        🔍 Socket.IO Diagnostic
      </div>
      {logs.map((l, i) => (
        <div key={i} style={{ marginBottom: 4, color: l.color === 'green' ? '#4ade80' : l.color === 'red' ? '#f87171' : l.color === 'blue' ? '#60a5fa' : '#9ca3af', fontSize: 13 }}>
          <span style={{ color: '#6b7280', marginRight: 8 }}>{l.t}</span>{l.msg}
        </div>
      ))}
      {!done && logs.length > 0 && (
        <div style={{ marginTop: 12, color: '#fbbf24' }}>⏳ กำลังทดสอบ...</div>
      )}
    </div>
  )
}
