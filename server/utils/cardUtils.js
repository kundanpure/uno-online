const { v4: uuidv4 } = require('uuid');

const COLORS = ['red', 'green', 'blue', 'yellow'];

/**
 * Create a standard 108-card UNO deck.
 * Each card has a unique `id` for reliable identification.
 */
function createDeck() {
  const deck = [];

  for (const color of COLORS) {
    // One 0 per color
    deck.push({ id: uuidv4(), color, type: 'number', value: 0 });

    // Two each of 1-9
    for (let v = 1; v <= 9; v++) {
      deck.push({ id: uuidv4(), color, type: 'number', value: v });
      deck.push({ id: uuidv4(), color, type: 'number', value: v });
    }

    // Two each of action cards per color
    for (let i = 0; i < 2; i++) {
      deck.push({ id: uuidv4(), color, type: 'skip', value: null });
      deck.push({ id: uuidv4(), color, type: 'reverse', value: null });
      deck.push({ id: uuidv4(), color, type: 'draw2', value: null });
    }
  }

  // 4 Wild + 4 Wild Draw Four
  for (let i = 0; i < 4; i++) {
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild', value: null });
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild_draw4', value: null });
  }

  return deck;
}

/**
 * Fisher-Yates shuffle (in-place, returns array).
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Check if a card can be played on top of the current discard.
 * @param {object} card - The card being played
 * @param {object} topCard - Current top of discard pile
 * @param {string} currentColor - The active color (may differ from topCard if wild was played)
 * @returns {boolean}
 */
function isValidPlay(card, topCard, currentColor) {
  // Wilds can always be played
  if (card.type === 'wild' || card.type === 'wild_draw4') {
    return true;
  }

  // Match color
  if (card.color === currentColor) {
    return true;
  }

  // Match type for action cards
  if (card.type !== 'number' && card.type === topCard.type) {
    return true;
  }

  // Match number
  if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) {
    return true;
  }

  return false;
}

/**
 * Get the display label for a card.
 */
function cardLabel(card) {
  if (card.type === 'number') return `${card.color} ${card.value}`;
  if (card.type === 'wild') return 'Wild';
  if (card.type === 'wild_draw4') return 'Wild +4';
  return `${card.color} ${card.type}`;
}

module.exports = { createDeck, shuffle, isValidPlay, cardLabel, COLORS };
