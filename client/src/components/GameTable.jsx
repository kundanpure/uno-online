import Card from './Card'
import './GameTable.css'

const COLOR_MAP = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308'
}

function GameTable({ topDiscard, currentColor, deckCount, direction, isMyTurn, onDrawCard, lastAction, turnTimeLeft }) {
    const colorHex = COLOR_MAP[currentColor] || '#a855f7'
    const timerPercent = (turnTimeLeft / 45) * 100
    const timerUrgent = turnTimeLeft <= 10

    return (
        <div className="game-table">
            {/* Direction indicator */}
            <div className={`direction-indicator ${direction === 1 ? 'cw' : 'ccw'}`}>
                {direction === 1 ? '↻' : '↺'}
            </div>

            {/* Turn timer */}
            <div className={`turn-timer ${timerUrgent ? 'urgent' : ''}`}>
                <svg viewBox="0 0 36 36" className="timer-svg">
                    <path
                        className="timer-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                        className="timer-fill"
                        strokeDasharray={`${timerPercent}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        style={{ stroke: timerUrgent ? 'var(--uno-red)' : 'var(--accent-primary)' }}
                    />
                </svg>
                <span className="timer-text">{turnTimeLeft}s</span>
            </div>

            {/* Current color indicator */}
            <div className="current-color" style={{ background: colorHex, boxShadow: `0 0 20px ${colorHex}40` }}>
                <span className="color-label">{currentColor}</span>
            </div>

            {/* Table center */}
            <div className="table-center">
                {/* Draw pile */}
                <div
                    className={`draw-pile ${isMyTurn ? 'draw-pile-active' : ''}`}
                    onClick={isMyTurn ? onDrawCard : undefined}
                    title={isMyTurn ? 'Click to draw a card' : ''}
                >
                    <Card faceDown />
                    <span className="pile-count">{deckCount}</span>
                    {isMyTurn && <span className="draw-label">Draw</span>}
                </div>

                {/* Discard pile */}
                <div className="discard-pile">
                    {lastAction && (
                        <div className="last-action" key={lastAction.timestamp}>
                            {lastAction.action?.type === 'skip' && '⊘ Skip!'}
                            {lastAction.action?.type === 'reverse' && '⟲ Reverse!'}
                            {lastAction.action?.type === 'draw2' && '+2!'}
                            {lastAction.action?.type === 'wild_draw4' && '+4!'}
                        </div>
                    )}
                    <Card card={topDiscard} />
                </div>
            </div>
        </div>
    )
}

export default GameTable
