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

    if (socketInstance && socketUrl !== url) {
      socketInstance.disconnect()
      socketInstance = null
      socketUrl = null
    }

    if (!socketInstance) {
      socketUrl = url
      socketInstance = io(url, {
        transports: ['websocket'],
        upgrade: false,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 15,
        timeout: 20000,
        forceNew: false,
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
