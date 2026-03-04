import { useState, useEffect, useRef } from 'react'
import socket from '../socket'
import './Chat.css'

function Chat({ roomId, playerId, messages, onClose }) {
    const [input, setInput] = useState('')
    const messagesEndRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = () => {
        if (!input.trim()) return
        socket.emit('chatMessage', { message: input.trim() })
        setInput('')
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage()
        }
    }

    const sendQuick = (text) => {
        socket.emit('chatMessage', { message: text })
    }

    // Emoji quick taps
    const emojis = ['👍', '😂', '🔥', '😱', '💀', '🎉']

    // Text quick phrases
    const phrases = ['Lapet ishkoo', 'Bhai! Khatm', 'BC', 'Ab tu Dekh', 'Ruk batata hu', 'Gandi marai geli']

    return (
        <div className="chat-panel glass-panel">
            <div className="chat-header">
                <h4>💬 Chat</h4>
                <button className="btn btn-icon btn-sm chat-close" onClick={onClose}>✕</button>
            </div>

            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="chat-empty">No messages yet. Say hi! 👋</div>
                )}
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`chat-msg ${msg.playerId === playerId ? 'chat-msg-mine' : ''}`}
                    >
                        <span className="chat-msg-name">{msg.playerName}</span>
                        <span className="chat-msg-text">{msg.message}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick emojis */}
            <div className="chat-quick-emojis">
                {emojis.map(e => (
                    <button key={e} className="quick-emoji" onClick={() => sendQuick(e)}>
                        {e}
                    </button>
                ))}
            </div>

            {/* Quick text phrases */}
            <div className="chat-quick-phrases">
                {phrases.map(p => (
                    <button key={p} className="quick-phrase" onClick={() => sendQuick(p)}>
                        {p}
                    </button>
                ))}
            </div>

            <div className="chat-input-row">
                <input
                    className="input chat-input"
                    type="text"
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    maxLength={200}
                    autoFocus
                />
                <button className="btn btn-primary btn-sm" onClick={sendMessage}>
                    Send
                </button>
            </div>
        </div>
    )
}

export default Chat
