import { useMemo } from 'react'
import Card from './Card'
import './PlayerHand.css'

function isValidPlay(card, topCard, currentColor) {
    if (card.type === 'wild' || card.type === 'wild_draw4') return true
    if (card.color === currentColor) return true
    if (card.type !== 'number' && card.type === topCard.type) return true
    if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true
    return false
}

function PlayerHand({ cards, isMyTurn, topDiscard, currentColor, onPlayCard }) {
    const sortedCards = useMemo(() => {
        return [...cards].sort((a, b) => {
            const colorOrder = { red: 0, green: 1, blue: 2, yellow: 3, wild: 4 }
            const colorDiff = (colorOrder[a.color] || 0) - (colorOrder[b.color] || 0)
            if (colorDiff !== 0) return colorDiff
            const typeOrder = { number: 0, skip: 1, reverse: 2, draw2: 3, wild: 4, wild_draw4: 5 }
            const typeDiff = (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0)
            if (typeDiff !== 0) return typeDiff
            return (a.value || 0) - (b.value || 0)
        })
    }, [cards])

    return (
        <div className="player-hand-container">
            <div className="hand-count">{cards.length} cards</div>
            <div className="player-hand">
                {sortedCards.map((card, index) => {
                    const playable = isMyTurn && isValidPlay(card, topDiscard, currentColor)
                    return (
                        <Card
                            key={card.id}
                            card={card}
                            playable={playable}
                            onClick={() => onPlayCard(card)}
                            className={!playable && isMyTurn ? 'card-dimmed' : ''}
                            style={{
                                animationDelay: `${index * 0.03}s`,
                                marginLeft: index > 0 ? '-20px' : '0',
                                zIndex: index
                            }}
                        />
                    )
                })}
            </div>
        </div>
    )
}

export default PlayerHand
