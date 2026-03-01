<p align="center">
  <img src="https://img.shields.io/badge/UNO-Online-red?style=for-the-badge&labelColor=000" alt="UNO Online" />
  <br/>
  <strong>🎴 Play UNO with friends — no app download, no sign-up, just share the link!</strong>
</p>

<p align="center">
  <a href="https://uno-online-tjem.onrender.com"><img src="https://img.shields.io/badge/🎮_Play_Now-7c3aed?style=for-the-badge" /></a>
  <a href="#contributing"><img src="https://img.shields.io/badge/Contribute-22c55e?style=for-the-badge" /></a>
  <a href="./ROADMAP.md"><img src="https://img.shields.io/badge/Roadmap-3b82f6?style=for-the-badge" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/kundanpure/uno-online?style=flat-square" />
  <img src="https://img.shields.io/github/stars/kundanpure/uno-online?style=flat-square" />
  <img src="https://img.shields.io/github/forks/kundanpure/uno-online?style=flat-square" />
  <img src="https://img.shields.io/github/issues/kundanpure/uno-online?style=flat-square" />
</p>

---

## ✨ What is this?

A **real-time multiplayer UNO card game** that runs entirely in the browser. Create a room, share the link with friends, and play UNO instantly — perfect for class breaks, work breaks, or anytime you're bored.

### Key Features

| Feature | Description |
|---------|-------------|
| 🔗 **Instant Play** | No sign-up, no download — just open the link and play |
| 👥 **2-10 Players** | Supports 2 to 10 players per room |
| 🤖 **Bot Takeover** | Disconnected players become bots automatically |
| 🔄 **Reconnection** | Rejoin within 3 minutes if you lose connection |
| 💬 **Chat & Reactions** | Quick emoji reactions during gameplay |
| ⏱️ **Turn Timer** | 45-second auto-draw on timeout |
| 🎯 **UNO Button** | Say UNO when you have 1 card or get penalized! |
| 🛡️ **Server-Authoritative** | All rules enforced server-side — no cheating |
| 📱 **Mobile Friendly** | Responsive design works on phones and tablets |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ installed

### Run Locally

```bash
# Clone the repo
git clone https://github.com/kundanpure/uno-online.git
cd uno-online

# Install all dependencies
cd server && npm install
cd ../client && npm install

# Terminal 1 — Start backend
cd server
npm run dev

# Terminal 2 — Start frontend  
cd client
npm run dev
```

Open **http://localhost:5173** and start playing!

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + Vite | Fast SPA with HMR |
| **Backend** | Node.js + Express | HTTP server + API |
| **Real-time** | Socket.io | WebSocket communication |
| **Styling** | Vanilla CSS | Glassmorphism dark theme |
| **State** | In-memory Maps | No database needed |
| **Deployment** | Render.com | Free tier hosting |

---

## 📁 Project Structure

```
uno-online/
├── server/
│   ├── index.js          # Express + Socket.io server
│   ├── game/
│   │   ├── GameEngine.js # Core game logic (turns, validation)
│   │   ├── Room.js       # Room lifecycle & player management
│   │   └── Bot.js        # AI for disconnected players
│   └── utils/
│       └── cardUtils.js  # Deck creation, shuffling, validation
├── client/
│   ├── src/
│   │   ├── pages/        # Home, Lobby, Game screens
│   │   ├── components/   # Card, PlayerHand, GameTable, etc.
│   │   ├── socket.js     # Socket.io client singleton
│   │   └── App.jsx       # Router setup
│   └── index.html
├── render.yaml           # Render deployment config
└── package.json          # Root build scripts
```

---

## 🎮 How to Play

1. **Create Room** — Enter your name, pick max players
2. **Share Link** — Copy the invite link and send to friends
3. **Ready Up** — Everyone clicks Ready, host starts the game
4. **Play Cards** — Match by color or number, use action cards strategically
5. **Say UNO!** — When you have 1 card left, hit the UNO button or draw 2 penalty cards

### Card Rules
- **Skip** — Next player loses their turn
- **Reverse** — Play direction flips
- **Draw 2** — Next player draws 2 and loses turn
- **Wild** — Choose the active color
- **Wild Draw 4** — Choose color + next player draws 4

---

## 🤝 Contributing

We welcome contributions from everyone! Check out our [Contributing Guide](./CONTRIBUTING.md) to get started.

### Good First Issues

Look for issues labeled [`good first issue`](https://github.com/kundanpure/uno-online/labels/good%20first%20issue) — these are perfect for first-time contributors.

### Ideas for Contribution
- 🎨 UI/UX improvements and themes
- 🔊 Sound effects and animations
- 🤖 Smarter bot AI
- 📊 Leaderboard system
- 🎭 Custom card backs and avatars
- 🌐 Multi-language support

---

## 📋 Roadmap

See the full [ROADMAP.md](./ROADMAP.md) for what's planned.

**Coming Soon:**
- [ ] Sound effects & card animations
- [ ] Spectator mode
- [ ] Tournament brackets
- [ ] Custom rules (stacking, 7-0 swap)
- [ ] Mobile PWA (installable)

---

## 🚢 Deployment

This project is configured for one-click deployment on Render:

1. Fork this repo
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your fork
4. Render reads `render.yaml` automatically
5. Deploy!

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

<p align="center">
  <strong>⭐ Star this repo if you enjoyed the game!</strong><br/>
  <a href="https://github.com/kundanpure/uno-online">github.com/kundanpure/uno-online</a>
</p>
