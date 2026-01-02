// cardLogic.js - Funktioner för att hantera blandning av korten, utdelning, sortering och bestämma vinnare av stick

class Deck {
    constructor() {
        this.cards = [];
        this.initializeDeck();
    }

    initializeDeck() {
        const suits = ['C', 'D', 'H', 'S'];
        const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
        
        for (let suit of suits) {
            for (let rank of ranks) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    shuffle() {
        // Fisher-Yates shuffle algoritm
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        return this.cards.pop();
    }

    dealToPlayers(players) {
        // Dela kort till alla spelare (13 kort var)
        for (let i = 0; i < 52; i++) {
            const playerIndex = i % 4;
            const playerIds = ['N', 'E', 'S', 'W'];
            const playerId = playerIds[playerIndex];
            const card = this.deal();
            if (card && players[playerId]) {
                players[playerId].addCard(card);
            }
        }
    }

    reset() {
        this.cards = [];
        this.initializeDeck();
    }
}

class CardSorter {
    static sortHand(hand, suitOrder = null) {
        // Standard sortering: Spader, Hjärter, Ruter, Klöver
        const defaultSuitOrder = { 'S': 0, 'H': 1, 'D': 2, 'C': 3 };
        const order = suitOrder || defaultSuitOrder;
        
        hand.sort((a, b) => {
            if (a.suit !== b.suit) {
                return order[a.suit] - order[b.suit];
            }
            // Samma färg - sortera efter värde (högst först)
            return b.getValue() - a.getValue();
        });
    }

    static sortBySuit(hand, suit) {
        return hand.filter(card => card.suit === suit)
                   .sort((a, b) => b.getValue() - a.getValue());
    }

    static getHighestCard(cards) {
        if (cards.length === 0) return null;
        return cards.reduce((highest, current) => 
            current.getValue() > highest.getValue() ? current : highest
        );
    }

    static getLowestCard(cards) {
        if (cards.length === 0) return null;
        return cards.reduce((lowest, current) => 
            current.getValue() < lowest.getValue() ? current : lowest
        );
    }
}

class TrickWinner {
    static determineWinner(trick, leadSuit, trumpSuit = null) {
        if (!trick || trick.length === 0) {
            return null;
        }

        let winner = trick[0];
        let highestCard = trick[0].card;
        const trumpSuitCode = trumpSuit ? TrickWinner.getSuitFromSymbol(trumpSuit) : null;

        for (let entry of trick) {
            const card = entry.card;
            
            // Om kortet är trumf och vinnaren inte är trumf
            if (trumpSuitCode && card.suit === trumpSuitCode && highestCard.suit !== trumpSuitCode) {
                winner = entry;
                highestCard = card;
            } 
            // Om kortet är högre i samma färg som ledfärgen
            else if (card.suit === leadSuit && 
                     highestCard.suit === leadSuit && 
                     card.getValue() > highestCard.getValue()) {
                winner = entry;
                highestCard = card;
            }
            // Om kortet är trumf och vinnaren också är trumf, men detta kort är högre
            else if (trumpSuitCode && 
                     card.suit === trumpSuitCode && 
                     highestCard.suit === trumpSuitCode && 
                     card.getValue() > highestCard.getValue()) {
                winner = entry;
                highestCard = card;
            }
        }

        return winner;
    }

    static getSuitFromSymbol(symbol) {
        const map = { '♣': 'C', '♦': 'D', '♥': 'H', '♠': 'S' };
        return map[symbol] || null;
    }

    static getLeadSuit(trick) {
        if (!trick || trick.length === 0) {
            return null;
        }
        return trick[0].card.suit;
    }

    static canFollowSuit(hand, leadSuit) {
        return hand.some(card => card.suit === leadSuit);
    }

    static getFollowCards(hand, leadSuit) {
        return hand.filter(card => card.suit === leadSuit);
    }
}

// Exportera för användning i andra moduler
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Deck, CardSorter, TrickWinner };
}

