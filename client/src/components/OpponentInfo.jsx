import './OpponentInfo.css'

function OpponentInfo({ player, isCurrentTurn, canCallUno, onCallUno, index }) {
    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#14b8a6', '#ec4899', '#8b5cf6', '#06b6d4']
    const color = colors[index % colors.length]

    return (
        <div className={`opponent ${isCurrentTurn ? 'opponent-active' : ''} ${!player.isConnected ? 'opponent-dc' : ''}`}>
            <div className="opponent-avatar" style={{ background: color }}>
                {player.name.charAt(0).toUpperCase()}
                {isCurrentTurn && <div className="turn-ring" />}
            </div>
            <div className="opponent-details">
                <span className="opponent-name">{player.name}</span>
                <span className="opponent-cards">
                    {player.cardCount} card{player.cardCount !== 1 ? 's' : ''}
                    {player.cardCount === 1 && <span className="uno-warning"> ⚠️</span>}
                </span>
            </div>
            {!player.isConnected && <span className="opponent-dc-badge">DC</span>}
            {canCallUno && (
                <button className="call-uno-btn" onClick={onCallUno} title="Call UNO on this player!">
                    🚨
                </button>
            )}
        </div>
    )
}

export default OpponentInfo
