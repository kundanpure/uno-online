import { useState, useEffect, useRef } from 'react'
import socket from '../socket'
import './Chat.css'

function Chat({ roomId, playerId, onClose }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const messagesEndRef = useRef(null)

    useEffect(() => {
        socket.on('chatUpdate', (msg) => {
            setMessages(prev => [...prev, msg])
        })

        return () => {
            socket.off('chatUpdate')
        }
    }, [])

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

    // Quick reactions
    const reactions = ['👍', '😂', '😱', '🔥', '💀', '🎉']

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

            {/* Quick reactions */}
            <div className="chat-reactions">
                {reactions.map(r => (
                    <button
                        key={r}
                        className="reaction-btn"
                        onClick={() => {
                            socket.emit('chatMessage', { message: r })
                        }}
                    >
                        {r}
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
                />
                <button className="btn btn-primary btn-sm" onClick={sendMessage}>
                    Send
                </button>
            </div>
        </div>
    )
}

export default Chat
