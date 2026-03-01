# 🎴 UNO Online - Play with Friends!

A real-time multiplayer UNO game you can play with friends during class breaks.  
Create a room, share the link, and start playing in seconds!

## Quick Start

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Start the servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 3. Open `http://localhost:5173` and play!

## How to Play

1. **Create a Room** — Pick your name, choose max players (2-10), hit Create
2. **Share the Link** — Copy the invite link and send to friends
3. **Join** — Friends open the link & enter their name
4. **Ready Up** — Everyone hits Ready, host clicks Start  
5. **Play UNO!** — Click cards to play, click draw pile to draw

## Features

- 🎮 **Real-time multiplayer** via WebSocket
- 🔗 **One-click invite** — share link, no sign-up
- 🤖 **Bot takeover** — disconnected players become bots
- 🔄 **Reconnection** — rejoin within 3 minutes
- 💬 **Chat & reactions** — emoji reactions during play
- ⏱️ **Turn timer** — 45s auto-draw on timeout
- 🎯 **UNO button** — say UNO or get penalized!
- 📱 **Mobile friendly** — responsive design

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite |
| Backend | Node.js + Express + Socket.io |
| State | In-memory (no database needed) |
| Styling | Vanilla CSS with glassmorphism |

## Game Rules

- Standard 108-card UNO deck
- Match color, number, or type to play
- Wild cards let you choose the color
- Skip, Reverse, Draw 2, Wild Draw 4
- Say UNO when you have 1 card or draw 2 penalty!
- Server-authoritative — no cheating possible
