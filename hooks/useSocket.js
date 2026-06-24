'use client'
import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

let socketInstance = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!socketInstance) {
      const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      socketInstance = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
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
