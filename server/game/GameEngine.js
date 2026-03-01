const { createDeck, shuffle, isValidPlay } = require('../utils/cardUtils');

class GameEngine {
    constructor(players) {
        this.players = players; // array of { id, name }
        this.deck = [];
        this.discardPile = [];
        this.hands = new Map();          // playerId → [card]
        this.currentPlayerIndex = 0;
        this.direction = 1;              // 1 = clockwise, -1 = counter
        this.currentColor = null;        // active color (wilds change this)
        this.pendingDraw = 0;            // for draw2/draw4 (MVP: no stacking, immediate)
        this.state = 'playing';          // 'playing' | 'finished'
        this.winner = null;
        this.turnTimer = null;
        this.turnTimeout = 45000;        // 45 seconds per turn
        this.unoCalled = new Set();      // playerIds who called UNO
        this.lastAction = null;
        this.onTurnTimeout = null;       // callback set by Room

        this._init();
    }

    _init() {
        this.deck = createDeck();
        this.deck = shuffle(this.deck);

        // Deal 7 cards to each player
        for (const player of this.players) {
            const hand = this.deck.splice(0, 7);
            this.hands.set(player.id, hand);
        }

        // Flip first card for discard pile
        let firstCard = this.deck.shift();

        // If first card is a wild_draw4, reshuffle until it's not
        while (firstCard.type === 'wild_draw4') {
            this.deck.push(firstCard);
            this.deck = shuffle(this.deck);
            firstCard = this.deck.shift();
        }

        this.discardPile.push(firstCard);
        this.currentColor = firstCard.color === 'wild' ? 'red' : firstCard.color;

        // Apply first card effects
        this._applyFirstCard(firstCard);

        this._startTurnTimer();
    }

    _applyFirstCard(card) {
        switch (card.type) {
            case 'skip':
                this._advanceTurn();
                break;
            case 'reverse':
                if (this.players.length === 2) {
                    this._advanceTurn(); // skip in 2-player
                } else {
                    this.direction *= -1;
                }
                break;
            case 'draw2':
                // First player draws 2 and is skipped
                this._drawCards(this.getCurrentPlayerId(), 2);
                this._advanceTurn();
                break;
            case 'wild':
                // First player picks color — default to red, host can change
                this.currentColor = 'red';
                break;
        }
    }

    getCurrentPlayerId() {
        return this.players[this.currentPlayerIndex].id;
    }

    getTopDiscard() {
        return this.discardPile[this.discardPile.length - 1];
    }

    getPlayerHand(playerId) {
        return this.hands.get(playerId) || [];
    }

    getValidMoves(playerId) {
        const hand = this.hands.get(playerId);
        if (!hand) return [];
        const topCard = this.getTopDiscard();
        return hand.filter(card => isValidPlay(card, topCard, this.currentColor));
    }

    /**
     * Player plays a card. Returns { success, action, error }.
     */
    playCard(playerId, cardId, chosenColor) {
        if (this.state !== 'playing') {
            return { success: false, error: 'Game is not active' };
        }

        if (this.getCurrentPlayerId() !== playerId) {
            return { success: false, error: 'Not your turn' };
        }

        const hand = this.hands.get(playerId);
        const cardIndex = hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) {
            return { success: false, error: 'Card not in hand' };
        }

        const card = hand[cardIndex];
        const topCard = this.getTopDiscard();

        if (!isValidPlay(card, topCard, this.currentColor)) {
            return { success: false, error: 'Invalid play' };
        }

        // Remove card from hand
        hand.splice(cardIndex, 1);
        this.discardPile.push(card);

        // Update current color
        if (card.type === 'wild' || card.type === 'wild_draw4') {
            if (chosenColor && ['red', 'green', 'blue', 'yellow'].includes(chosenColor)) {
                this.currentColor = chosenColor;
            } else {
                this.currentColor = 'red'; // default
            }
        } else {
            this.currentColor = card.color;
        }

        // Check UNO — if player has 1 card and hasn't called UNO
        if (hand.length === 1) {
            // They need to call UNO within 3 seconds — tracked externally
            // Reset their UNO status so they must call again
            this.unoCalled.delete(playerId);
        }

        // Check win
        if (hand.length === 0) {
            this.state = 'finished';
            this.winner = playerId;
            this._clearTurnTimer();
            return {
                success: true,
                action: { type: 'win', playerId, card },
                gameOver: true
            };
        }

        // Apply card action
        const action = this._applyCardAction(card, playerId);

        // Advance turn
        this._advanceTurn();
        this._startTurnTimer();

        return { success: true, action, card };
    }

    _applyCardAction(card, playerId) {
        const nextPlayerId = this._peekNextPlayer();

        switch (card.type) {
            case 'skip':
                this._advanceTurn(); // extra advance = skip
                return { type: 'skip', playerId, targetId: nextPlayerId, card };

            case 'reverse':
                this.direction *= -1;
                if (this.players.length === 2) {
                    this._advanceTurn(); // acts as skip in 2-player
                }
                return { type: 'reverse', playerId, card };

            case 'draw2':
                this._drawCards(nextPlayerId, 2);
                this._advanceTurn(); // skip the next player
                return { type: 'draw2', playerId, targetId: nextPlayerId, card };

            case 'wild_draw4':
                const target = this._peekNextPlayer();
                this._drawCards(target, 4);
                this._advanceTurn(); // skip the next player
                return { type: 'wild_draw4', playerId, targetId: target, card };

            default:
                return { type: 'play', playerId, card };
        }
    }

    _peekNextPlayer() {
        let nextIndex = this.currentPlayerIndex + this.direction;
        const len = this.players.length;
        nextIndex = ((nextIndex % len) + len) % len;
        return this.players[nextIndex].id;
    }

    /**
     * Draw a card from the deck.
     */
    drawCard(playerId) {
        if (this.state !== 'playing') {
            return { success: false, error: 'Game is not active' };
        }

        if (this.getCurrentPlayerId() !== playerId) {
            return { success: false, error: 'Not your turn' };
        }

        const drawn = this._drawCards(playerId, 1);
        if (!drawn || drawn.length === 0) {
            return { success: false, error: 'No cards available' };
        }

        // After drawing, check if drawn card can be played
        const drawnCard = drawn[0];
        const canPlay = isValidPlay(drawnCard, this.getTopDiscard(), this.currentColor);

        // Advance turn (player must end turn after drawing in MVP)
        this._advanceTurn();
        this._startTurnTimer();

        return { success: true, card: drawnCard, canPlay };
    }

    /**
     * Draw N cards from deck for a player. Reshuffles discard if needed.
     */
    _drawCards(playerId, count) {
        const hand = this.hands.get(playerId);
        if (!hand) return [];

        const drawn = [];
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) {
                this._reshuffleDeck();
            }
            if (this.deck.length === 0) break; // truly out of cards

            const card = this.deck.shift();
            hand.push(card);
            drawn.push(card);
        }
        return drawn;
    }

    _reshuffleDeck() {
        if (this.discardPile.length <= 1) return;

        const topCard = this.discardPile.pop();
        this.deck = shuffle(this.discardPile);
        this.discardPile = [topCard];

        // Reset wild card colors back to 'wild' for deck
        this.deck.forEach(card => {
            if (card.type === 'wild' || card.type === 'wild_draw4') {
                card.color = 'wild';
            }
        });
    }

    /**
     * Player calls UNO.
     */
    sayUno(playerId) {
        this.unoCalled.add(playerId);
        return { success: true };
    }

    /**
     * Another player challenges: "you didn't say UNO!"
     */
    callUno(callerId, targetId) {
        const targetHand = this.hands.get(targetId);
        if (!targetHand || targetHand.length !== 1) {
            return { success: false, error: 'Target does not have 1 card' };
        }

        if (this.unoCalled.has(targetId)) {
            return { success: false, error: 'Target already said UNO' };
        }

        // Penalty: draw 2
        this._drawCards(targetId, 2);
        return { success: true, penalized: targetId };
    }

    _advanceTurn() {
        const len = this.players.length;
        this.currentPlayerIndex = ((this.currentPlayerIndex + this.direction) % len + len) % len;
    }

    _startTurnTimer() {
        this._clearTurnTimer();
        this.turnTimer = setTimeout(() => {
            if (this.onTurnTimeout) {
                this.onTurnTimeout(this.getCurrentPlayerId());
            }
        }, this.turnTimeout);
    }

    _clearTurnTimer() {
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = null;
        }
    }

    /**
     * Handle turn timeout: auto-draw and skip.
     */
    handleTimeout(playerId) {
        if (this.getCurrentPlayerId() !== playerId) return null;
        const result = this.drawCard(playerId);
        return { ...result, timeout: true };
    }

    /**
     * Build sanitized game state for broadcast (no private hands).
     */
    getPublicState() {
        const playerStates = this.players.map(p => ({
            id: p.id,
            name: p.name,
            cardCount: (this.hands.get(p.id) || []).length,
            calledUno: this.unoCalled.has(p.id)
        }));

        return {
            currentPlayerId: this.getCurrentPlayerId(),
            direction: this.direction,
            currentColor: this.currentColor,
            topDiscard: this.getTopDiscard(),
            deckCount: this.deck.length,
            players: playerStates,
            state: this.state,
            winner: this.winner,
            lastAction: this.lastAction
        };
    }

    /**
     * Get the scores for end-of-game.
     */
    getScores() {
        const scores = {};
        for (const player of this.players) {
            const hand = this.hands.get(player.id) || [];
            let score = 0;
            for (const card of hand) {
                if (card.type === 'number') score += card.value;
                else if (card.type === 'skip' || card.type === 'reverse' || card.type === 'draw2') score += 20;
                else if (card.type === 'wild' || card.type === 'wild_draw4') score += 50;
            }
            scores[player.id] = score;
        }
        return scores;
    }

    destroy() {
        this._clearTurnTimer();
    }
}

module.exports = GameEngine;
