# 🤝 Contributing to UNO Online

Thanks for your interest in contributing! This guide will help you get started.

## 🚀 Quick Setup

### 1. Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/uno-online.git
cd uno-online
```

### 2. Install Dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Run Locally

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open `http://localhost:5173` to see the app.

---

## 📝 Making Changes

### Branch Naming

```
feature/your-feature-name
fix/bug-description
docs/what-you-updated
```

### Workflow

1. Create a new branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Test locally (open 2 browser tabs to simulate 2 players)
4. Commit with a clear message: `git commit -m "feat: add sound effects for card play"`
5. Push: `git push origin feature/my-feature`
6. Open a Pull Request on GitHub

---

## 🎨 Code Style

- **Frontend**: React functional components with hooks
- **Backend**: Node.js with CommonJS (`require`)
- **CSS**: Vanilla CSS, use existing CSS variables from `App.css`
- **Naming**: camelCase for JS, kebab-case for CSS classes
- **Indentation**: 4 spaces (server), 2 spaces (client)

### CSS Variables (use these!)
```css
var(--uno-red)      /* #ef4444 */
var(--uno-blue)     /* #3b82f6 */
var(--uno-green)    /* #22c55e */
var(--uno-yellow)   /* #eab308 */
var(--accent-primary)   /* purple */
var(--bg-primary)       /* dark background */
var(--bg-glass)         /* glassmorphism */
```

---

## 📁 Where to Add Code

| What you're adding | Where to put it |
|---|---|
| New game mechanic | `server/game/GameEngine.js` |
| Room/lobby feature | `server/game/Room.js` |
| Socket event | `server/index.js` (server) + page component (client) |
| New UI component | `client/src/components/YourComponent.jsx` |
| New page/screen | `client/src/pages/YourPage.jsx` |
| Card utilities | `server/utils/cardUtils.js` |

---

## 🧪 Testing

Currently we test manually:

1. Open `http://localhost:5173` in 2+ browser tabs
2. Create a room in Tab 1
3. Join via invite link in Tab 2
4. Play through a full game

If you add automated tests, that's a welcome contribution!

---

## 💡 What to Work On

### Good First Issues
- Add sound effects (card play, UNO call, turn change)
- Add card play animations (card flying to discard pile)
- Mobile touch improvements
- Dark/light theme toggle

### Intermediate
- Spectator mode
- Player avatars / profile pictures
- Game replay / history
- Custom room rules (stacking +2/+4, 7-0 swap)

### Advanced
- Tournament/bracket system
- Smarter bot AI (difficulty levels)
- Voice chat integration
- PWA (installable mobile app)
- Persistent leaderboard with database

---

## 🐛 Reporting Bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Browser & device info
- Steps to reproduce
- Console errors (if any)

---

## 📜 Commit Messages

Use conventional commits:

```
feat: add sound effects for card plays
fix: prevent room deletion on socket reconnect
docs: update README with deployment guide
style: improve card hover animation
refactor: extract turn timer into separate component
```

---

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make UNO Online better! 🎴**
