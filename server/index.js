const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Room = require('./game/Room');
const Bot = require('./game/Bot');

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

const io = new Server(server, {
    cors: {
        origin: isProduction ? '*' : ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['polling', 'websocket'],  // polling FIRST — critical for Render's reverse proxy
    allowUpgrades: true,
    upgradeTimeout: 30000
});

app.use(cors());
app.use(express.json());

// Serve static client build in production
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuild));

// ─── In-memory room store ──────────────────────────
const rooms = new Map();

// ─── Cleanup inactive rooms every 30 minutes ──────
setInterval(() => {
    for (const [roomId, room] of rooms) {
        if (room.isInactive()) {
            room.destroy();
            rooms.delete(roomId);
            console.log(`[cleanup] Room ${roomId} expired`);
        }
    }
}, 30 * 60 * 1000);

// ─── REST endpoints ────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', rooms: rooms.size });
});

// ─── Socket.io connection ──────────────────────────
io.on('connection', (socket) => {
    console.log(`[socket] Connected: ${socket.id}`);

    let currentRoomId = null;
    let currentPlayerId = null;

    // ─── CREATE ROOM ──────────────────────────────────
    socket.on('createRoom', ({ playerName, maxPlayers }, callback) => {
        const playerId = uuidv4();
        const room = new Room(playerId, playerName, maxPlayers);

        // Wire up turn timeout handler
        room.onTurnTimeout = (roomId, timeoutPlayerId) => {
            handleTurnTimeout(roomId, timeoutPlayerId);
        };

        rooms.set(room.id, room);
        room.setPlayerSocket(playerId, socket.id);

        currentRoomId = room.id;
        currentPlayerId = playerId;
        socket.join(room.id);

        console.log(`[room] Created: ${room.id} by ${playerName}`);

        callback({
            success: true,
            roomId: room.id,
            playerId,
            lobby: room.getLobbyState()
        });
    });

    // ─── JOIN ROOM ────────────────────────────────────
    socket.on('joinRoom', ({ roomId, playerName, playerId: existingId }, callback) => {
        const room = rooms.get(roomId);
        if (!room) {
            return callback({ success: false, error: 'Room not found' });
        }

        // Check reconnection
        let playerId = existingId;
        let isReconnect = false;

        if (playerId && room.players.has(playerId)) {
            // Reconnecting
            room.reconnectPlayer(playerId);
            room.setPlayerSocket(playerId, socket.id);
            isReconnect = true;
        } else {
            // New player
            playerId = uuidv4();
            const result = room.addPlayer(playerId, playerName);
            if (!result.success) {
                return callback({ success: false, error: result.error });
            }
            room.setPlayerSocket(playerId, socket.id);
        }

        currentRoomId = room.id;
        currentPlayerId = playerId;
        socket.join(room.id);

        console.log(`[room] ${isReconnect ? 'Reconnected' : 'Joined'}: ${playerName} → ${room.id}`);

        callback({
            success: true,
            roomId: room.id,
            playerId,
            reconnected: isReconnect,
            lobby: room.getLobbyState()
        });

        // Notify others
        socket.to(room.id).emit('roomUpdate', room.getLobbyState());

        if (isReconnect) {
            socket.to(room.id).emit('playerReconnected', { playerId, playerName });
        }

        // If reconnecting to active game, send game state
        if (isReconnect && room.state === 'playing' && room.game) {
            socket.emit('gameStart', room.game.getPublicState());
            socket.emit('yourHand', {
                cards: room.game.getPlayerHand(playerId)
            });
        }
    });

    // ─── PLAYER READY ─────────────────────────────────
    socket.on('playerReady', ({ ready }, callback) => {
        const room = rooms.get(currentRoomId);
        if (!room) return callback?.({ success: false });

        room.setPlayerReady(currentPlayerId, ready);
        io.to(room.id).emit('roomUpdate', room.getLobbyState());
        callback?.({ success: true });
    });

    // ─── START GAME ───────────────────────────────────
    socket.on('startGame', (_, callback) => {
        const room = rooms.get(currentRoomId);
        if (!room) return callback?.({ success: false, error: 'Room not found' });

        if (currentPlayerId !== room.hostId) {
            return callback?.({ success: false, error: 'Only host can start' });
        }

        const result = room.startGame();
        if (!result.success) {
            return callback?.({ success: false, error: result.error });
        }

        console.log(`[game] Started in room ${room.id}`);

        // Send game state to all players
        const publicState = room.game.getPublicState();
        io.to(room.id).emit('gameStart', publicState);

        // Send private hands to each player
        for (const [playerId, player] of room.players) {
            if (player.socketId) {
                io.to(player.socketId).emit('yourHand', {
                    cards: room.game.getPlayerHand(playerId)
                });
            }
        }

        callback?.({ success: true });
    });

    // ─── PLAY CARD ────────────────────────────────────
    socket.on('playCard', ({ cardId, chosenColor }, callback) => {
        const room = rooms.get(currentRoomId);
        if (!room || !room.game) return callback?.({ success: false });

        const result = room.game.playCard(currentPlayerId, cardId, chosenColor);

        if (!result.success) {
            return callback?.({ success: false, error: result.error });
        }

        // Broadcast updated state
        const publicState = room.game.getPublicState();
        io.to(room.id).emit('gameState', publicState);
        io.to(room.id).emit('cardPlayed', {
            playerId: currentPlayerId,
            card: result.card,
            action: result.action
        });

        // Send updated hands to all players
        sendAllHands(room);

        // Check game over
        if (result.gameOver) {
            const scores = room.game.getScores();
            io.to(room.id).emit('gameOver', {
                winnerId: room.game.winner,
                scores,
                players: Array.from(room.players.values()).map(p => ({ id: p.id, name: p.name }))
            });
            room.state = 'finished';
        } else {
            // Check if next player is a bot
            checkBotTurn(room);
        }

        callback?.({ success: true });
    });

    // ─── DRAW CARD ────────────────────────────────────
    socket.on('drawCard', (_, callback) => {
        const room = rooms.get(currentRoomId);
        if (!room || !room.game) return callback?.({ success: false });

        const result = room.game.drawCard(currentPlayerId);

        if (!result.success) {
            return callback?.({ success: false, error: result.error });
        }

        // Broadcast updated state
        io.to(room.id).emit('gameState', room.game.getPublicState());

        // Send updated hands
        sendAllHands(room);

        // Check bot turn
        checkBotTurn(room);

        callback?.({ success: true, card: result.card });
    });

    // ─── SAY UNO ──────────────────────────────────────
    socket.on('sayUno', (_, callback) => {
        const room = rooms.get(currentRoomId);
        if (!room || !room.game) return callback?.({ success: false });

        room.game.sayUno(currentPlayerId);
        const player = room.players.get(currentPlayerId);

        io.to(room.id).emit('unoAlert', {
            type: 'called',
            playerId: currentPlayerId,
            playerName: player?.name
        });

        callback?.({ success: true });
    });

    // ─── CALL UNO (challenge) ─────────────────────────
    socket.on('callUno', ({ targetId }, callback) => {
        const room = rooms.get(currentRoomId);
        if (!room || !room.game) return callback?.({ success: false });

        const result = room.game.callUno(currentPlayerId, targetId);

        if (result.success) {
            const targetPlayer = room.players.get(targetId);
            io.to(room.id).emit('unoAlert', {
                type: 'penalty',
                targetId,
                targetName: targetPlayer?.name,
                callerId: currentPlayerId
            });

            // Update game state and hands
            io.to(room.id).emit('gameState', room.game.getPublicState());
            sendAllHands(room);
        }

        callback?.(result);
    });

    // ─── CHAT ─────────────────────────────────────────
    socket.on('chatMessage', ({ message }, callback) => {
        const room = rooms.get(currentRoomId);
        if (!room) return callback?.({ success: false });

        const msg = room.addChatMessage(currentPlayerId, message);
        if (msg) {
            io.to(room.id).emit('chatUpdate', msg);
        }

        callback?.({ success: true });
    });

    // ─── REMATCH ─────────────────────────────────────
    socket.on('rematch', (_, callback) => {
        const room = rooms.get(currentRoomId);
        if (!room) return callback?.({ success: false });

        room.resetForRematch();
        io.to(room.id).emit('roomUpdate', room.getLobbyState());
        io.to(room.id).emit('rematch', {});

        callback?.({ success: true });
    });

    // ─── DISCONNECT ───────────────────────────────────
    socket.on('disconnect', () => {
        console.log(`[socket] Disconnected: ${socket.id}`);

        if (currentRoomId && currentPlayerId) {
            const room = rooms.get(currentRoomId);
            if (room) {
                const player = room.players.get(currentPlayerId);

                if (room.state === 'lobby') {
                    // Grace period: don't remove immediately (socket might reconnect)
                    if (player) player.isConnected = false;
                    setTimeout(() => {
                        const r = rooms.get(currentRoomId);
                        if (!r) return;
                        const p = r.players.get(currentPlayerId);
                        if (p && !p.isConnected) {
                            r.removePlayer(currentPlayerId);
                            if (r.players.size === 0) {
                                rooms.delete(r.id);
                                console.log(`[room] Deleted empty room: ${r.id}`);
                            } else {
                                io.to(r.id).emit('roomUpdate', r.getLobbyState());
                            }
                        }
                    }, 10000); // 10s grace period for reconnections
                } else {
                    room.handleDisconnect(currentPlayerId);
                    io.to(room.id).emit('playerDisconnected', {
                        playerId: currentPlayerId,
                        playerName: player?.name
                    });

                    // If it's their turn, let bot play
                    if (room.game && room.game.getCurrentPlayerId() === currentPlayerId) {
                        setTimeout(() => checkBotTurn(room), 2000);
                    }
                }
            }
        }
    });
});

// ─── Helper Functions ──────────────────────────────

function sendAllHands(room) {
    if (!room.game) return;

    for (const [playerId, player] of room.players) {
        if (player.socketId && player.isConnected) {
            io.to(player.socketId).emit('yourHand', {
                cards: room.game.getPlayerHand(playerId)
            });
        }
    }
}

function checkBotTurn(room) {
    if (!room.game || room.game.state !== 'playing') return;

    const currentId = room.game.getCurrentPlayerId();
    const player = room.players.get(currentId);

    if (player && (player.isBot || !player.isConnected)) {
        // Bot plays after a short delay (feel natural)
        setTimeout(() => {
            if (!room.game || room.game.state !== 'playing') return;
            if (room.game.getCurrentPlayerId() !== currentId) return;

            const move = Bot.decideMove(room.game, currentId);

            if (move.action === 'play') {
                const result = room.game.playCard(currentId, move.cardId, move.chosenColor);
                if (result.success) {
                    io.to(room.id).emit('gameState', room.game.getPublicState());
                    io.to(room.id).emit('cardPlayed', {
                        playerId: currentId,
                        card: result.card,
                        action: result.action,
                        isBot: true
                    });
                    sendAllHands(room);

                    if (result.gameOver) {
                        const scores = room.game.getScores();
                        io.to(room.id).emit('gameOver', {
                            winnerId: room.game.winner,
                            scores,
                            players: Array.from(room.players.values()).map(p => ({ id: p.id, name: p.name }))
                        });
                        room.state = 'finished';
                    } else {
                        checkBotTurn(room); // chain if next is also bot
                    }
                }
            } else {
                room.game.drawCard(currentId);
                io.to(room.id).emit('gameState', room.game.getPublicState());
                sendAllHands(room);
                checkBotTurn(room);
            }
        }, 1500);
    }
}

function handleTurnTimeout(roomId, playerId) {
    const room = rooms.get(roomId);
    if (!room || !room.game) return;

    const result = room.game.handleTimeout(playerId);
    if (result) {
        io.to(roomId).emit('gameState', room.game.getPublicState());
        io.to(roomId).emit('turnTimeout', { playerId });
        sendAllHands(room);
        checkBotTurn(room);
    }
}

// ─── SPA fallback ──────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
});

// ─── Start server ──────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🎴 UNO Server running on http://0.0.0.0:${PORT}\n`);
});
