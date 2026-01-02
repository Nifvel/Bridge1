// ai.js - AI för spelföring och försvar

class BridgeAI {
    constructor() {
        this.biddingSystem = NordicStandardBidding;
    }

    // AI för budgivning
    calculateBid(player, hand, biddingHistory, partner) {
        return this.biddingSystem.calculateBid(player, hand, biddingHistory, partner);
    }

    // AI för att välja kort att spela
    selectCard(player, hand, currentTrick, trumpSuit, contract, isDeclarer) {
        if (!currentTrick || currentTrick.length === 0) {
            // Första kortet i sticket - öppningsspel
            return this.selectOpeningCard(hand, trumpSuit, isDeclarer);
        } else {
            // Följ färg eller spela trumf/renons
            return this.selectFollowCard(hand, currentTrick, trumpSuit, isDeclarer);
        }
    }

    selectOpeningCard(hand, trumpSuit, isDeclarer) {
        // Enkel strategi: spela högt kort i längsta färgen
        const distribution = this.getDistribution(hand);
        
        // Hitta längsta färgen
        let longestSuit = 'S';
        let maxLength = distribution['S'];
        for (let suit of ['H', 'D', 'C']) {
            if (distribution[suit] > maxLength) {
                maxLength = distribution[suit];
                longestSuit = suit;
            }
        }
        
        // Spela högt kort i längsta färgen
        const suitCards = hand.filter(c => c.suit === longestSuit);
        if (suitCards.length > 0) {
            // Sortera efter värde (högst först)
            suitCards.sort((a, b) => b.getValue() - a.getValue());
            return suitCards[0];
        }
        
        // Fallback: spela första kortet (högsta kortet)
        return hand[0];
    }

    selectFollowCard(hand, currentTrick, trumpSuit, isDeclarer) {
        const leadSuit = currentTrick[0].card.suit;
        const trumpSuitCode = trumpSuit ? this.getSuitFromSymbol(trumpSuit) : null;
        const followCards = hand.filter(c => c.suit === leadSuit);
        
        // Om vi kan följa färg
        if (followCards.length > 0) {
            return this.selectFollowSuitCard(followCards, currentTrick, trumpSuitCode, isDeclarer);
        }
        
        // Kan inte följa färg - spela trumf eller renons
        return this.selectDiscardCard(hand, currentTrick, trumpSuitCode, isDeclarer);
    }

    selectFollowSuitCard(followCards, currentTrick, trumpSuitCode, isDeclarer) {
        // Sortera kort i följfärgen (högst först)
        followCards.sort((a, b) => b.getValue() - a.getValue());
        
        // Hitta högsta kortet som redan spelats i färgen
        const playedInSuit = currentTrick
            .filter(entry => entry.card.suit === currentTrick[0].card.suit)
            .map(entry => entry.card);
        
        const highestPlayed = playedInSuit.length > 0 
            ? playedInSuit.reduce((max, card) => card.getValue() > max.getValue() ? card : max)
            : null;
        
        // Om vi är declarer och kan vinna, spela högt kort
        if (isDeclarer && highestPlayed) {
            const winningCard = followCards.find(c => c.getValue() > highestPlayed.getValue());
            if (winningCard) {
                return winningCard;
            }
        }
        
        // Annars spela lägsta kortet (försvar)
        return followCards[followCards.length - 1];
    }

    selectDiscardCard(hand, currentTrick, trumpSuitCode, isDeclarer) {
        // Om vi har trumf och vill vinna sticket
        if (trumpSuitCode) {
            const trumpCards = hand.filter(c => c.suit === trumpSuitCode);
            if (trumpCards.length > 0) {
                // Kontrollera om det finns trumf i sticket
                const trumpInTrick = currentTrick.some(entry => entry.card.suit === trumpSuitCode);
                
                if (trumpInTrick) {
                    // Spela högre trumf om möjligt
                    trumpCards.sort((a, b) => b.getValue() - a.getValue());
                    const highestTrumpInTrick = currentTrick
                        .filter(entry => entry.card.suit === trumpSuitCode)
                        .map(entry => entry.card)
                        .reduce((max, card) => card.getValue() > max.getValue() ? card : max, 
                                { getValue: () => 0 });
                    
                    const winningTrump = trumpCards.find(c => c.getValue() > highestTrumpInTrick.getValue());
                    if (winningTrump && isDeclarer) {
                        return winningTrump;
                    }
                } else if (isDeclarer) {
                    // Spela lägsta trumf för att vinna
                    trumpCards.sort((a, b) => a.getValue() - b.getValue());
                    return trumpCards[0];
                }
            }
        }
        
        // Spela lägsta kortet i kortaste färgen (renons)
        const distribution = this.getDistribution(hand);
        let shortestSuit = 'S';
        let minLength = distribution['S'];
        for (let suit of ['H', 'D', 'C']) {
            if (distribution[suit] < minLength) {
                minLength = distribution[suit];
                shortestSuit = suit;
            }
        }
        
        const shortestSuitCards = hand.filter(c => c.suit === shortestSuit);
        if (shortestSuitCards.length > 0) {
            shortestSuitCards.sort((a, b) => a.getValue() - b.getValue());
            return shortestSuitCards[0];
        }
        
        // Fallback: spela lägsta kortet
        hand.sort((a, b) => a.getValue() - b.getValue());
        return hand[0];
    }

    // Hjälpfunktioner
    getDistribution(hand) {
        const dist = { 'S': 0, 'H': 0, 'D': 0, 'C': 0 };
        for (let card of hand) {
            dist[card.suit]++;
        }
        return dist;
    }

    getSuitFromSymbol(symbol) {
        const map = { '♣': 'C', '♦': 'D', '♥': 'H', '♠': 'S' };
        return map[symbol] || null;
    }

    // Avancerad AI för försvar (kan utökas)
    selectDefenseCard(player, hand, currentTrick, trumpSuit, contract, partner) {
        // Försvarsspel - försök att förhindra declarer från att göra kontraktet
        return this.selectCard(player, hand, currentTrick, trumpSuit, contract, false);
    }

    // Avancerad AI för declarer (kan utökas)
    selectDeclarerCard(player, hand, currentTrick, trumpSuit, contract) {
        // Declarer-spel - försök att göra kontraktet
        return this.selectCard(player, hand, currentTrick, trumpSuit, contract, true);
    }
}

// Exportera för användning i andra moduler
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BridgeAI };
}

