const { isValidPlay } = require('../utils/cardUtils');

/**
 * Simple bot AI for disconnected players.
 * Strategy: play first valid card (prefer action cards), otherwise draw.
 */
class Bot {
    /**
     * Decide a bot's move.
     * @param {GameEngine} game 
     * @param {string} playerId 
     * @returns {{ action: 'play'|'draw', cardId?: string, chosenColor?: string }}
     */
    static decideMove(game, playerId) {
        const hand = game.getPlayerHand(playerId);
        const topCard = game.getTopDiscard();
        const currentColor = game.currentColor;

        // Find all valid plays
        const validPlays = hand.filter(card => isValidPlay(card, topCard, currentColor));

        if (validPlays.length === 0) {
            return { action: 'draw' };
        }

        // Priority: action cards > matching color > wilds
        const actionCards = validPlays.filter(c =>
            c.type === 'skip' || c.type === 'reverse' || c.type === 'draw2'
        );
        const colorMatch = validPlays.filter(c =>
            c.color === currentColor && c.type === 'number'
        );
        const wilds = validPlays.filter(c =>
            c.type === 'wild' || c.type === 'wild_draw4'
        );
        const numberMatch = validPlays.filter(c =>
            c.type === 'number'
        );

        let chosen;
        if (actionCards.length > 0) {
            chosen = actionCards[0];
        } else if (colorMatch.length > 0) {
            chosen = colorMatch[0];
        } else if (numberMatch.length > 0) {
            chosen = numberMatch[0];
        } else if (wilds.length > 0) {
            chosen = wilds[wilds.length - 1]; // save wilds for last
        } else {
            chosen = validPlays[0];
        }

        // If wild, choose the color with most cards in hand
        let chosenColor = undefined;
        if (chosen.type === 'wild' || chosen.type === 'wild_draw4') {
            chosenColor = Bot._bestColor(hand);
        }

        return { action: 'play', cardId: chosen.id, chosenColor };
    }

    /**
     * Pick the color with the most cards in hand.
     */
    static _bestColor(hand) {
        const counts = { red: 0, green: 0, blue: 0, yellow: 0 };
        for (const card of hand) {
            if (counts[card.color] !== undefined) {
                counts[card.color]++;
            }
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }
}

module.exports = Bot;
