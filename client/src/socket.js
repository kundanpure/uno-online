import { io } from 'socket.io-client';

// In production, connect to same origin (server serves both frontend + WS)
// In dev, Vite proxy handles /socket.io → localhost:3001
const URL = import.meta.env.PROD ? window.location.origin : '';

const socket = io(URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    timeout: 15000,
    transports: ['websocket', 'polling']
});

export default socket;
