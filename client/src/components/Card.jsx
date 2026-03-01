import './Card.css'

const CARD_SYMBOLS = {
    skip: '⊘',
    reverse: '⟲',
    draw2: '+2',
    wild: '★',
    wild_draw4: '+4'
}

const CARD_COLORS = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
    wild: '#1a1a2e'
}

const CARD_GRADIENTS = {
    red: 'linear-gradient(135deg, #ef4444, #dc2626)',
    blue: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    green: 'linear-gradient(135deg, #22c55e, #16a34a)',
    yellow: 'linear-gradient(135deg, #eab308, #ca8a04)',
    wild: 'linear-gradient(135deg, #ef4444, #3b82f6, #22c55e, #eab308)'
}

function Card({ card, playable, small, faceDown, onClick, style, className = '' }) {
    if (faceDown) {
        return (
            <div
                className={`card card-back ${small ? 'card-sm' : ''} ${className}`}
                style={style}
            >
                <div className="card-back-inner">
                    <span className="card-back-logo">UNO</span>
                </div>
            </div>
        )
    }

    const isWild = card.color === 'wild' || card.type === 'wild' || card.type === 'wild_draw4'
    const displayValue = card.type === 'number' ? card.value : CARD_SYMBOLS[card.type] || '?'
    const bgGradient = CARD_GRADIENTS[card.color] || CARD_GRADIENTS.wild

    return (
        <div
            className={`card ${small ? 'card-sm' : ''} ${playable ? 'card-playable' : ''} ${isWild ? 'card-wild' : ''} ${className}`}
            style={{
                background: bgGradient,
                ...style
            }}
            onClick={playable ? onClick : undefined}
        >
            <div className="card-inner">
                {/* Corner values */}
                <span className="card-corner card-corner-top">{displayValue}</span>
                <span className="card-corner card-corner-bottom">{displayValue}</span>

                {/* Center */}
                <div className="card-center">
                    <span className="card-value">{displayValue}</span>
                </div>

                {/* Oval */}
                <div className="card-oval"></div>
            </div>
        </div>
    )
}

export default Card
