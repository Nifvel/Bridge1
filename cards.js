// cards.js - Kortpresentation, lagring och representation av korten för de 4 spelarna

class Card {
    constructor(suit, rank) {
        this.suit = suit; // 'C', 'D', 'H', 'S'
        this.rank = rank; // 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'
    }

    getValue() {
        const values = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
        return values[this.rank] || 0;
    }

    getSuitSymbol() {
        const symbols = { 'C': '♣', 'D': '♦', 'H': '♥', 'S': '♠' };
        return symbols[this.suit];
    }

    isRed() {
        return this.suit === 'H' || this.suit === 'D';
    }

    toString() {
        return this.rank + this.getSuitSymbol();
    }
}

class PlayerHand {
    constructor(playerId, playerName, isRobot = false) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.isRobot = isRobot;
        this.cards = [];
    }

    addCard(card) {
        this.cards.push(card);
    }

    removeCard(card) {
        const index = this.cards.findIndex(c => c.suit === card.suit && c.rank === card.rank);
        if (index !== -1) {
            return this.cards.splice(index, 1)[0];
        }
        return null;
    }

    getCard(suit, rank) {
        return this.cards.find(c => c.suit === suit && c.rank === rank);
    }

    getCardsBySuit(suit) {
        return this.cards.filter(c => c.suit === suit);
    }

    getLength() {
        return this.cards.length;
    }

    isEmpty() {
        return this.cards.length === 0;
    }

    clear() {
        this.cards = [];
    }
}

// Exportera för användning i andra moduler
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Card, PlayerHand };
}

