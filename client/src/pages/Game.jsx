import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import socket from '../socket'
import Card from '../components/Card'
import PlayerHand from '../components/PlayerHand'
import OpponentInfo from '../components/OpponentInfo'
import GameTable from '../components/GameTable'
import ColorPicker from '../components/ColorPicker'
import Scoreboard from '../components/Scoreboard'
import Chat from '../components/Chat'
import './Game.css'

function Game() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const playerId = localStorage.getItem('unoPlayerId')

    const [gameState, setGameState] = useState(null)
    const [myHand, setMyHand] = useState([])
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [pendingWildCard, setPendingWildCard] = useState(null)
    const [lastAction, setLastAction] = useState(null)
    const [showScoreboard, setShowScoreboard] = useState(false)
    const [gameOverData, setGameOverData] = useState(null)
    const [showChat, setShowChat] = useState(false)
    const [notification, setNotification] = useState(null)
    const [turnTimeLeft, setTurnTimeLeft] = useState(45)
    const [unreadCount, setUnreadCount] = useState(0)
    const turnTimerRef = useRef(null)
    const showChatRef = useRef(false)

    // Keep ref in sync so socket listener sees latest value
    useEffect(() => { showChatRef.current = showChat }, [showChat])

    // Connect and listen for events
    useEffect(() => {
        if (!socket.connected) socket.connect()

        // Reconnect if needed
        socket.emit('joinRoom', {
            roomId,
            playerName: localStorage.getItem('unoPlayerName'),
            playerId
        }, (response) => {
            if (!response.success) {
                navigate('/')
            }
        })

        socket.on('gameStart', (state) => {
            setGameState(state)
            setShowScoreboard(false)
            setGameOverData(null)
            resetTurnTimer()
        })

        socket.on('gameState', (state) => {
            setGameState(state)
            resetTurnTimer()
        })

        socket.on('yourHand', ({ cards }) => {
            setMyHand(cards)
        })

        socket.on('cardPlayed', ({ playerId: pid, card, action }) => {
            setLastAction({ playerId: pid, card, action, timestamp: Date.now() })
            setTimeout(() => setLastAction(null), 2000)
        })

        socket.on('invalidMove', ({ reason }) => {
            showNotification(`❌ ${reason}`, 'error')
        })

        socket.on('unoAlert', ({ type, playerName, targetName }) => {
            if (type === 'called') {
                showNotification(`🎯 ${playerName} called UNO!`, 'info')
            } else if (type === 'penalty') {
                showNotification(`⚠️ ${targetName} didn't say UNO! +2 cards penalty!`, 'warning')
            }
        })

        socket.on('turnTimeout', ({ playerId: pid }) => {
            const name = gameState?.players?.find(p => p.id === pid)?.name || 'Player'
            showNotification(`⏰ ${name} ran out of time!`, 'warning')
        })

        socket.on('playerDisconnected', ({ playerName }) => {
            showNotification(`😢 ${playerName} disconnected`, 'warning')
        })

        socket.on('playerReconnected', ({ playerName }) => {
            showNotification(`🎉 ${playerName} reconnected!`, 'info')
        })

        socket.on('gameOver', (data) => {
            setGameOverData(data)
            setShowScoreboard(true)
            clearTurnTimer()
        })

        // Track unread messages when chat is closed
        socket.on('chatUpdate', () => {
            if (!showChatRef.current) {
                setUnreadCount(prev => prev + 1)
            }
        })

        return () => {
            socket.off('gameStart')
            socket.off('gameState')
            socket.off('yourHand')
            socket.off('cardPlayed')
            socket.off('invalidMove')
            socket.off('unoAlert')
            socket.off('turnTimeout')
            socket.off('playerDisconnected')
            socket.off('playerReconnected')
            socket.off('gameOver')
            socket.off('chatUpdate')
        }
    }, [roomId, navigate])

    // Turn timer countdown
    const resetTurnTimer = useCallback(() => {
        clearTurnTimer()
        setTurnTimeLeft(45)
        turnTimerRef.current = setInterval(() => {
            setTurnTimeLeft(prev => {
                if (prev <= 1) {
                    clearTurnTimer()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }, [])

    const clearTurnTimer = useCallback(() => {
        if (turnTimerRef.current) {
            clearInterval(turnTimerRef.current)
            turnTimerRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => clearTurnTimer()
    }, [])

    const showNotification = (text, type = 'info') => {
        setNotification({ text, type })
        setTimeout(() => setNotification(null), 3000)
    }

    // Game actions
    const handlePlayCard = useCallback((card) => {
        if (card.type === 'wild' || card.type === 'wild_draw4') {
            setPendingWildCard(card)
            setShowColorPicker(true)
            return
        }

        socket.emit('playCard', { cardId: card.id }, (response) => {
            if (!response.success) {
                showNotification(`❌ ${response.error}`, 'error')
            }
        })
    }, [])

    const handleColorChosen = useCallback((color) => {
        if (!pendingWildCard) return

        socket.emit('playCard', {
            cardId: pendingWildCard.id,
            chosenColor: color
        }, (response) => {
            if (!response.success) {
                showNotification(`❌ ${response.error}`, 'error')
            }
        })

        setPendingWildCard(null)
        setShowColorPicker(false)
    }, [pendingWildCard])

    const handleDrawCard = useCallback(() => {
        socket.emit('drawCard', {}, (response) => {
            if (!response.success) {
                showNotification(`❌ ${response.error}`, 'error')
            }
        })
    }, [])

    const handleSayUno = useCallback(() => {
        socket.emit('sayUno', {}, (response) => {
            if (response.success) {
                showNotification('🎯 UNO!', 'success')
            }
        })
    }, [])

    const handleCallUno = useCallback((targetId) => {
        socket.emit('callUno', { targetId }, (response) => {
            if (!response.success) {
                showNotification(`❌ ${response.error}`, 'error')
            }
        })
    }, [])

    const handleRematch = useCallback(() => {
        socket.emit('rematch', {}, () => {
            navigate(`/room/${roomId}`)
        })
    }, [roomId, navigate])

    // Derived state
    const isMyTurn = gameState?.currentPlayerId === playerId
    const me = gameState?.players?.find(p => p.id === playerId)
    const opponents = gameState?.players?.filter(p => p.id !== playerId) || []
    // Show UNO button: before playing (2 cards, my turn) OR after playing (1 card, didn't call yet)
    const showUnoBtn = (myHand.length === 2 && isMyTurn) || (myHand.length === 1 && me && !me.calledUno)
    const canCallUno = opponents.some(p => p.cardCount === 1 && !p.calledUno)

    if (!gameState) {
        return (
            <div className="game-loading">
                <div className="loading-spinner"></div>
                <p>Loading game...</p>
            </div>
        )
    }

    // Build play order list in actual turn sequence
    const allPlayers = gameState?.players || []
    const directionSymbol = gameState?.direction === 1 ? '→' : '←'

    return (
        <div className={`game ${isMyTurn ? 'my-turn' : ''}`}>
            {/* Turn indicator glow */}
            {isMyTurn && <div className="turn-glow" />}

            {/* Top: Opponents */}
            <div className="game-opponents">
                {opponents.map((opponent, i) => (
                    <OpponentInfo
                        key={opponent.id}
                        player={opponent}
                        isCurrentTurn={opponent.id === gameState.currentPlayerId}
                        canCallUno={opponent.cardCount === 1 && !opponent.calledUno}
                        onCallUno={() => handleCallUno(opponent.id)}
                        index={i}
                    />
                ))}
            </div>

            {/* Play Order Bar */}
            <div className="play-order">
                <span className="play-order-label">Order:</span>
                {allPlayers.map((p, i) => (
                    <span key={p.id} className="play-order-item-wrap">
                        <span className={`play-order-item${p.id === gameState.currentPlayerId ? ' play-order-current' : ''}${p.id === playerId ? ' play-order-me' : ''}`}>
                            <span className="play-order-num">{i + 1}</span>
                            <span className="play-order-name">{p.id === playerId ? 'You' : p.name}</span>
                        </span>
                        {i < allPlayers.length - 1 && <span className="play-order-arrow">{directionSymbol}</span>}
                    </span>
                ))}
            </div>

            {/* Center: Game Table */}
            <GameTable
                topDiscard={gameState.topDiscard}
                currentColor={gameState.currentColor}
                deckCount={gameState.deckCount}
                direction={gameState.direction}
                isMyTurn={isMyTurn}
                onDrawCard={handleDrawCard}
                lastAction={lastAction}
                turnTimeLeft={turnTimeLeft}
            />

            {/* Turn indicator - above hand */}
            <div className={`turn-indicator ${isMyTurn ? 'active' : ''}`}>
                {isMyTurn ? '🎯 Your Turn!' : `⏳ ${gameState.players.find(p => p.id === gameState.currentPlayerId)?.name || 'Opponent'}'s turn`}
            </div>

            {/* UNO Button */}
            {showUnoBtn && (
                <button className="uno-button" onClick={handleSayUno}>
                    UNO!
                </button>
            )}

            {/* Bottom: My Hand */}
            <PlayerHand
                cards={myHand}
                isMyTurn={isMyTurn}
                topDiscard={gameState.topDiscard}
                currentColor={gameState.currentColor}
                onPlayCard={handlePlayCard}
            />

            {/* Color Picker Modal */}
            {showColorPicker && (
                <ColorPicker
                    onSelect={handleColorChosen}
                    onClose={() => { setShowColorPicker(false); setPendingWildCard(null) }}
                />
            )}

            {/* Scoreboard */}
            {showScoreboard && gameOverData && (
                <Scoreboard
                    data={gameOverData}
                    playerId={playerId}
                    onRematch={handleRematch}
                    onHome={() => navigate('/')}
                />
            )}

            {/* Chat */}
            <button className="btn btn-icon chat-float-btn" onClick={() => { setShowChat(!showChat); setUnreadCount(0) }}>
                💬
                {unreadCount > 0 && <span className="chat-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {showChat && (
                <>
                    <div className="chat-overlay-bg" onClick={() => setShowChat(false)} />
                    <Chat roomId={roomId} playerId={playerId} onClose={() => setShowChat(false)} />
                </>
            )}

            {/* Notification */}
            {notification && (
                <div className={`game-notification ${notification.type}`}>
                    {notification.text}
                </div>
            )}
        </div>
    )
}

export default Game
