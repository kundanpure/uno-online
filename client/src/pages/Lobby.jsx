import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import socket from '../socket'
import Chat from '../components/Chat'
import './Lobby.css'

function Lobby() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const [lobby, setLobby] = useState(null)
    const [playerId, setPlayerId] = useState(localStorage.getItem('unoPlayerId'))
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState('')
    const [showChat, setShowChat] = useState(false)

    useEffect(() => {
        if (!socket.connected) socket.connect()

        // If we don't have a playerId for this room, redirect to join
        const storedRoom = localStorage.getItem('unoRoomId')
        if (!playerId || storedRoom !== roomId) {
            // Need to join this room
            const name = localStorage.getItem('unoPlayerName')
            if (!name) {
                navigate(`/?code=${roomId}`)
                return
            }

            socket.emit('joinRoom', {
                roomId,
                playerName: name
            }, (response) => {
                if (response.success) {
                    localStorage.setItem('unoPlayerId', response.playerId)
                    localStorage.setItem('unoRoomId', roomId)
                    setPlayerId(response.playerId)
                    setLobby(response.lobby)
                } else {
                    setError(response.error || 'Failed to join')
                }
            })
        } else {
            // Already in room, request state
            socket.emit('joinRoom', {
                roomId,
                playerName: localStorage.getItem('unoPlayerName'),
                playerId: playerId
            }, (response) => {
                if (response.success) {
                    setLobby(response.lobby)
                }
            })
        }

        socket.on('roomUpdate', (data) => {
            setLobby(data)
        })

        socket.on('gameStart', () => {
            navigate(`/game/${roomId}`)
        })

        socket.on('rematch', () => {
            // Stay in lobby
        })

        return () => {
            socket.off('roomUpdate')
            socket.off('gameStart')
            socket.off('rematch')
        }
    }, [roomId, navigate])

    const handleReady = useCallback(() => {
        const player = lobby?.players?.find(p => p.id === playerId)
        socket.emit('playerReady', { ready: !player?.isReady })
    }, [lobby, playerId])

    const handleStart = useCallback(() => {
        socket.emit('startGame', {}, (response) => {
            if (!response.success) {
                setError(response.error || 'Cannot start game')
                setTimeout(() => setError(''), 3000)
            }
        })
    }, [])

    const copyInviteLink = useCallback(() => {
        const link = `${window.location.origin}/room/${roomId}`
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }).catch(() => {
            // Fallback
            const input = document.createElement('input')
            input.value = link
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            document.body.removeChild(input)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }, [roomId])

    const isHost = playerId === lobby?.hostId
    const allReady = lobby?.players?.filter(p => p.id !== lobby.hostId).every(p => p.isReady)
    const canStart = lobby?.players?.length >= 2 && (allReady || lobby?.players?.length === 1)

    if (!lobby) {
        return (
            <div className="lobby-loading">
                <div className="loading-spinner"></div>
                <p>Joining room...</p>
                {error && <div className="error-msg mt-2">{error}</div>}
            </div>
        )
    }

    return (
        <div className="lobby">
            <div className="lobby-bg">
                <div className="bg-orb bg-orb-1"></div>
                <div className="bg-orb bg-orb-2"></div>
            </div>

            <div className="lobby-content">
                {/* Header */}
                <div className="lobby-header">
                    <div className="lobby-title">
                        <h1>Game Lobby</h1>
                        <div className="room-code-display">
                            <span className="room-code-label">Room Code</span>
                            <span className="room-code-value">{roomId}</span>
                        </div>
                    </div>
                </div>

                {/* Invite Section */}
                <div className="glass-panel invite-section">
                    <div className="invite-text">
                        <span>📤</span>
                        <span>Share this link with friends to join!</span>
                    </div>
                    <div className="invite-link-row">
                        <div className="invite-link-box">
                            {window.location.origin}/room/{roomId}
                        </div>
                        <button className="btn btn-primary" onClick={copyInviteLink}>
                            {copied ? '✓ Copied!' : '📋 Copy'}
                        </button>
                    </div>
                </div>

                {/* Players */}
                <div className="glass-panel players-section">
                    <div className="players-header">
                        <h2>Players ({lobby.players.length}/{lobby.maxPlayers})</h2>
                        <div className="player-slots">
                            {Array.from({ length: lobby.maxPlayers }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`player-slot ${i < lobby.players.length ? 'filled' : ''}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="players-list">
                        {lobby.players.map((player, index) => (
                            <div
                                key={player.id}
                                className={`player-item ${player.id === playerId ? 'is-me' : ''} ${player.isReady ? 'is-ready' : ''}`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="player-avatar" style={{
                                    background: ['var(--uno-red)', 'var(--uno-blue)', 'var(--uno-green)', 'var(--uno-yellow)', 'var(--accent-primary)', '#f97316', '#14b8a6', '#ec4899', '#8b5cf6', '#06b6d4'][index % 10]
                                }}>
                                    {player.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="player-info">
                                    <span className="player-name">
                                        {player.name}
                                        {player.id === playerId && <span className="you-badge">You</span>}
                                        {player.id === lobby.hostId && <span className="host-badge">👑 Host</span>}
                                    </span>
                                    <span className={`ready-status ${player.isReady ? 'ready' : ''}`}>
                                        {player.id === lobby.hostId ? 'Host' : player.isReady ? '✓ Ready' : 'Not Ready'}
                                    </span>
                                </div>
                                {!player.isConnected && <span className="dc-badge">Disconnected</span>}
                            </div>
                        ))}

                        {/* Empty slots */}
                        {Array.from({ length: lobby.maxPlayers - lobby.players.length }).map((_, i) => (
                            <div key={`empty-${i}`} className="player-item empty-slot">
                                <div className="player-avatar empty-avatar">?</div>
                                <div className="player-info">
                                    <span className="player-name empty-name">Waiting for player...</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="lobby-actions">
                    {error && <div className="error-msg">{error}</div>}

                    {isHost ? (
                        <button
                            className="btn btn-primary btn-lg lobby-start-btn"
                            onClick={handleStart}
                            disabled={!canStart}
                        >
                            {canStart ? '🚀 Start Game' : `Waiting for players... (${lobby.players.length}/${Math.max(2, 2)})`}
                        </button>
                    ) : (
                        <button
                            className={`btn btn-lg ${lobby.players.find(p => p.id === playerId)?.isReady ? 'btn-success' : 'btn-secondary'}`}
                            onClick={handleReady}
                        >
                            {lobby.players.find(p => p.id === playerId)?.isReady ? '✓ Ready!' : '🙋 Ready Up'}
                        </button>
                    )}
                </div>

                {/* Chat toggle */}
                <button className="btn btn-secondary btn-sm chat-toggle" onClick={() => setShowChat(!showChat)}>
                    💬 Chat
                </button>
            </div>

            {showChat && <Chat roomId={roomId} playerId={playerId} onClose={() => setShowChat(false)} />}
            {copied && <div className="toast">✓ Link copied to clipboard!</div>}
        </div>
    )
}

export default Lobby
