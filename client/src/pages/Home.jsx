import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../socket'
import './Home.css'

function Home() {
    const navigate = useNavigate()
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('unoPlayerName') || '')
    const [maxPlayers, setMaxPlayers] = useState(4)
    const [joinCode, setJoinCode] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [showJoin, setShowJoin] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!socket.connected) socket.connect()

        // Check URL for room code
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        if (code) {
            setJoinCode(code)
            setShowJoin(true)
        }
    }, [])

    const handleCreate = () => {
        if (!playerName.trim()) {
            setError('Enter your name!')
            return
        }

        setLoading(true)
        setError('')
        localStorage.setItem('unoPlayerName', playerName.trim())

        socket.emit('createRoom', {
            playerName: playerName.trim(),
            maxPlayers
        }, (response) => {
            setLoading(false)
            if (response.success) {
                localStorage.setItem('unoPlayerId', response.playerId)
                localStorage.setItem('unoRoomId', response.roomId)
                navigate(`/room/${response.roomId}`)
            } else {
                setError(response.error || 'Failed to create room')
            }
        })
    }

    const handleJoin = () => {
        if (!playerName.trim()) {
            setError('Enter your name!')
            return
        }
        if (!joinCode.trim()) {
            setError('Enter a room code!')
            return
        }

        setLoading(true)
        setError('')
        localStorage.setItem('unoPlayerName', playerName.trim())

        socket.emit('joinRoom', {
            roomId: joinCode.trim().toUpperCase(),
            playerName: playerName.trim()
        }, (response) => {
            setLoading(false)
            if (response.success) {
                localStorage.setItem('unoPlayerId', response.playerId)
                localStorage.setItem('unoRoomId', response.roomId)
                navigate(`/room/${response.roomId}`)
            } else {
                setError(response.error || 'Failed to join room')
            }
        })
    }

    return (
        <div className="home">
            {/* Animated background */}
            <div className="home-bg">
                <div className="bg-orb bg-orb-1"></div>
                <div className="bg-orb bg-orb-2"></div>
                <div className="bg-orb bg-orb-3"></div>
                <div className="bg-cards">
                    <span className="floating-card" style={{ '--delay': '0s', '--x': '10%', '--y': '20%' }}>🟥</span>
                    <span className="floating-card" style={{ '--delay': '1s', '--x': '80%', '--y': '15%' }}>🟦</span>
                    <span className="floating-card" style={{ '--delay': '2s', '--x': '70%', '--y': '70%' }}>🟩</span>
                    <span className="floating-card" style={{ '--delay': '0.5s', '--x': '20%', '--y': '75%' }}>🟨</span>
                    <span className="floating-card" style={{ '--delay': '1.5s', '--x': '50%', '--y': '10%' }}>🃏</span>
                </div>
            </div>

            <div className="home-content">
                {/* Hero */}
                <div className="hero">
                    <div className="hero-logo">
                        <span className="logo-letter" style={{ '--color': 'var(--uno-red)' }}>U</span>
                        <span className="logo-letter" style={{ '--color': 'var(--uno-blue)' }}>N</span>
                        <span className="logo-letter" style={{ '--color': 'var(--uno-green)' }}>O</span>
                    </div>
                    <h2 className="hero-subtitle">Play with friends, anywhere!</h2>
                    <p className="hero-desc">Create a room, share the link, start playing in seconds 🎴</p>
                </div>

                {/* Actions */}
                <div className="home-actions">
                    {!showCreate && !showJoin && (
                        <div className="action-buttons" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                            <button className="btn btn-primary btn-lg home-btn" onClick={() => setShowCreate(true)}>
                                <span className="btn-emoji">🎮</span>
                                Create Room
                            </button>
                            <button className="btn btn-secondary btn-lg home-btn" onClick={() => setShowJoin(true)}>
                                <span className="btn-emoji">🔗</span>
                                Join Room
                            </button>
                        </div>
                    )}

                    {/* Create Room Form */}
                    {showCreate && (
                        <div className="glass-panel home-form" style={{ animation: 'scaleIn 0.3s ease-out' }}>
                            <h3>Create a Room</h3>
                            <div className="form-group">
                                <label>Your Name</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Enter your name..."
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    maxLength={20}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Max Players: <strong>{maxPlayers}</strong></label>
                                <input
                                    type="range"
                                    min="2"
                                    max="10"
                                    value={maxPlayers}
                                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                                    className="slider"
                                />
                                <div className="slider-labels">
                                    <span>2</span>
                                    <span>10</span>
                                </div>
                            </div>
                            {error && <div className="error-msg">{error}</div>}
                            <div className="form-actions">
                                <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setError('') }}>Back</button>
                                <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
                                    {loading ? <span className="loading-spinner" style={{ width: 20, height: 20 }}></span> : 'Create Room'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Join Room Form */}
                    {showJoin && (
                        <div className="glass-panel home-form" style={{ animation: 'scaleIn 0.3s ease-out' }}>
                            <h3>Join a Room</h3>
                            <div className="form-group">
                                <label>Your Name</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Enter your name..."
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    maxLength={20}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Room Code</label>
                                <input
                                    className="input room-code-input"
                                    type="text"
                                    placeholder="ABCD12"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    maxLength={6}
                                />
                            </div>
                            {error && <div className="error-msg">{error}</div>}
                            <div className="form-actions">
                                <button className="btn btn-secondary" onClick={() => { setShowJoin(false); setError('') }}>Back</button>
                                <button className="btn btn-primary" onClick={handleJoin} disabled={loading}>
                                    {loading ? <span className="loading-spinner" style={{ width: 20, height: 20 }}></span> : 'Join Room'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="home-footer">
                    <p>No login required · Free · Real-time multiplayer</p>
                </footer>
            </div>
        </div>
    )
}

export default Home
