import { io } from 'socket.io-client';

// In production, connect to same origin (server serves both frontend + WS)
// In dev, Vite proxy handles /socket.io → localhost:3001
const URL = import.meta.env.PROD ? window.location.origin : '';

const socket = io(URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['polling', 'websocket'],  // polling FIRST — matches server config for Render
});

export default socket;
