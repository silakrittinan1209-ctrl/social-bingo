'use client'
import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

let socketInstance = null
let socketUrl = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin

    // Re-create socket if URL changed (e.g. switched from localhost to tunnel)
    if (socketInstance && socketUrl !== url) {
      socketInstance.disconnect()
      socketInstance = null
      socketUrl = null
    }

    if (!socketInstance) {
      socketUrl = url
      socketInstance = io(url, {
        transports: ['polling'],
        upgrade: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 20,
        timeout: 20000,
      })
    }

    socketRef.current = socketInstance

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    socketInstance.on('connect', onConnect)
    socketInstance.on('disconnect', onDisconnect)

    if (socketInstance.connected) setIsConnected(true)

    return () => {
      socketInstance.off('connect', onConnect)
      socketInstance.off('disconnect', onDisconnect)
    }
  }, [])

  return { socket: socketRef.current, isConnected }
}
