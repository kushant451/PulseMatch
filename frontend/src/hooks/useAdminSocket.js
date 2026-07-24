import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// In dev, Vite proxies /api to the backend but Socket.io needs a direct
// WebSocket connection — same host/port as the backend, not through the proxy.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Connects to the backend's Socket.io server and joins the admin room.
 * Calls the provided handlers whenever the backend emits a live update.
 *
 * Usage:
 *   useAdminSocket({
 *     onRequestCreated: (req) => setRequests(prev => [req, ...prev]),
 *     onStockUpdated: (stock) => refetchStock(),
 *   });
 */
export function useAdminSocket({ onRequestCreated, onRequestUpdated, onStockUpdated } = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:admin');
    });

    if (onRequestCreated) socket.on('request:created', onRequestCreated);
    if (onRequestUpdated) socket.on('request:updated', onRequestUpdated);
    if (onStockUpdated) socket.on('stock:updated', onStockUpdated);

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return socketRef;
}
