const GameEngine = require('./GameEngine');
const { v4: uuidv4 } = require('uuid');

class Room {
    constructor(hostId, hostName, maxPlayers = 4) {
        this.id = this._generateRoomCode();
        this.hostId = hostId;
        this.maxPlayers = Math.min(Math.max(maxPlayers, 2), 10);
        this.players = new Map();
        this.game = null;
        this.state = 'lobby'; // 'lobby' | 'playing' | 'finished'
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
        this.chatMessages = [];
        this.disconnectedPlayers = new Map(); // playerId → { timeout, playerData }

        // Add host
        this.addPlayer(hostId, hostName);
    }

    _generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    addPlayer(playerId, playerName) {
        if (this.players.size >= this.maxPlayers) {
            return { success: false, error: 'Room is full' };
        }

        if (this.state !== 'lobby') {
            // Check if reconnecting
            if (this.disconnectedPlayers.has(playerId)) {
                return this.reconnectPlayer(playerId);
            }
            return { success: false, error: 'Game already in progress' };
        }

        if (this.players.has(playerId)) {
            return { success: false, error: 'Already in room' };
        }

        this.players.set(playerId, {
            id: playerId,
            name: playerName,
            socketId: null,
            isReady: false,
            isConnected: true,
            isBot: false
        });

        this.lastActivity = Date.now();
        return { success: true };
    }

    removePlayer(playerId) {
        if (this.state === 'playing') {
            // Mark as disconnected, don't remove
            this.handleDisconnect(playerId);
            return { success: true, disconnected: true };
        }

        this.players.delete(playerId);

        // If host left, promote someone
        if (playerId === this.hostId && this.players.size > 0) {
            this.hostId = this.players.keys().next().value;
        }

        this.lastActivity = Date.now();
        return { success: true, empty: this.players.size === 0 };
    }

    setPlayerSocket(playerId, socketId) {
        const player = this.players.get(playerId);
        if (player) {
            player.socketId = socketId;
            player.isConnected = true;
        }
    }

    setPlayerReady(playerId, ready) {
        const player = this.players.get(playerId);
        if (player) {
            player.isReady = ready;
        }
    }

    canStart() {
        if (this.players.size < 2) return false;
        // All players must be ready
        for (const [id, player] of this.players) {
            if (id !== this.hostId && !player.isReady) return false;
        }
        return true;
    }

    startGame() {
        if (this.state !== 'lobby') {
            return { success: false, error: 'Game already started' };
        }

        if (this.players.size < 2) {
            return { success: false, error: 'Need at least 2 players' };
        }

        this.state = 'playing';
        const playerList = Array.from(this.players.values()).map(p => ({
            id: p.id,
            name: p.name
        }));

        this.game = new GameEngine(playerList);

        // Wire up turn timeout
        this.game.onTurnTimeout = (playerId) => {
            if (this.onTurnTimeout) {
                this.onTurnTimeout(this.id, playerId);
            }
        };

        this.lastActivity = Date.now();
        return { success: true };
    }

    handleDisconnect(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        player.isConnected = false;
        player.socketId = null;

        // Set reconnection timeout (3 minutes)
        const timeout = setTimeout(() => {
            this._convertToBot(playerId);
        }, 180000);

        this.disconnectedPlayers.set(playerId, { timeout });
    }

    reconnectPlayer(playerId) {
        const dcInfo = this.disconnectedPlayers.get(playerId);
        if (dcInfo) {
            clearTimeout(dcInfo.timeout);
            this.disconnectedPlayers.delete(playerId);
        }

        const player = this.players.get(playerId);
        if (player) {
            player.isConnected = true;
            player.isBot = false;
        }

        return { success: true, reconnected: true };
    }

    _convertToBot(playerId) {
        const player = this.players.get(playerId);
        if (player && !player.isConnected) {
            player.isBot = true;
            this.disconnectedPlayers.delete(playerId);
        }
    }

    addChatMessage(playerId, message) {
        const player = this.players.get(playerId);
        if (!player) return null;

        const msg = {
            id: uuidv4(),
            playerId,
            playerName: player.name,
            message: message.substring(0, 200), // limit length
            timestamp: Date.now()
        };

        this.chatMessages.push(msg);
        // Keep last 50 messages
        if (this.chatMessages.length > 50) {
            this.chatMessages = this.chatMessages.slice(-50);
        }

        return msg;
    }

    resetForRematch() {
        this.state = 'lobby';
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }

        for (const [, player] of this.players) {
            player.isReady = false;
        }

        // Remove bots
        for (const [id, player] of this.players) {
            if (player.isBot) {
                this.players.delete(id);
            }
        }

        this.lastActivity = Date.now();
    }

    getLobbyState() {
        const players = Array.from(this.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            isReady: p.isReady,
            isConnected: p.isConnected,
            isBot: p.isBot
        }));

        return {
            roomId: this.id,
            hostId: this.hostId,
            maxPlayers: this.maxPlayers,
            state: this.state,
            players
        };
    }

    isInactive(timeoutMs = 3 * 60 * 60 * 1000) {
        return (Date.now() - this.lastActivity) > timeoutMs;
    }

    destroy() {
        if (this.game) {
            this.game.destroy();
        }
        for (const [, dcInfo] of this.disconnectedPlayers) {
            clearTimeout(dcInfo.timeout);
        }
        this.disconnectedPlayers.clear();
    }
}

module.exports = Room;
