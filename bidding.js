// bidding.js - Budgivning med Nordisk Standard

class BiddingSystem {
    constructor() {
        this.biddingHistory = [];
        this.contract = null;
        this.trumpSuit = null;
        this.declarer = null;
        this.passes = 0;
        this.currentPlayer = 'N'; // Nord börjar alltid (eftersom Väst delar ut)
    }

    makeBid(player, bid) {
        const bidEntry = { player, bid, position: this.biddingHistory.length };
        this.biddingHistory.push(bidEntry);
        
        if (bid === 'pass') {
            this.passes++;
        } else {
            this.passes = 0;
            // Uppdatera kontrakt om budet är högre
            if (this.isValidBid(bid)) {
                this.contract = bid;
                this.declarer = player;
                const suitMap = { 'C': '♣', 'D': '♦', 'H': '♥', 'S': '♠', 'NT': 'NT' };
                const suit = bid.slice(1);
                this.trumpSuit = suitMap[suit] || null;
            }
        }
        
        return bidEntry;
    }

    isValidBid(bid) {
        if (bid === 'pass') return true;
        
        if (!this.contract) return true; // Första budet är alltid giltigt
        
        const currentLevel = parseInt(this.contract[0]);
        const currentSuit = this.contract.slice(1);
        const newLevel = parseInt(bid[0]);
        const newSuit = bid.slice(1);
        
        const suitOrder = { 'C': 1, 'D': 2, 'H': 3, 'S': 4, 'NT': 5 };
        
        if (newLevel > currentLevel) return true;
        if (newLevel === currentLevel && suitOrder[newSuit] > suitOrder[currentSuit]) return true;
        
        return false;
    }

    isBiddingComplete() {
        // Om 3 pass i rad efter att minst 4 bud har gjorts
        return this.passes >= 3 && this.biddingHistory.length >= 4;
    }

    getNextPlayer(player) {
        const order = ['N', 'E', 'S', 'W']; // Nord -> Öst -> Syd -> Väst (eftersom Väst delar ut)
        const index = order.indexOf(player);
        return order[(index + 1) % 4];
    }

    getPartner(player) {
        const partnerships = { 'N': 'S', 'S': 'N', 'E': 'W', 'W': 'E' };
        return partnerships[player];
    }

    // Hitta spelaren till vänster om declarer (utspelshanden)
    getLead(declarer) {
        const order = ['N', 'E', 'S', 'W'];
        const index = order.indexOf(declarer);
        return order[(index + 1) % 4];
    }

    // Hitta träkarl (declarers partner)
    getDummy(declarer) {
        return this.getPartner(declarer);
    }

    reset() {
        this.biddingHistory = [];
        this.contract = null;
        this.trumpSuit = null;
        this.declarer = null;
        this.passes = 0;
        this.currentPlayer = 'N'; // Nord börjar alltid (eftersom Väst delar ut)
    }
}

class NordicStandardBidding {
    static countHighCardPoints(hand) {
        // Räkna bara högkortspoäng (inte distributionspoäng)
        let points = 0;
        const highCardPoints = { 'A': 4, 'K': 3, 'Q': 2, 'J': 1 };
        
        for (let card of hand) {
            points += highCardPoints[card.rank] || 0;
        }
        
        return points;
    }

    static getDistribution(hand) {
        const dist = { 'S': 0, 'H': 0, 'D': 0, 'C': 0 };
        for (let card of hand) {
            dist[card.suit]++;
        }
        return dist;
    }

    static isBalanced(distribution) {
        const lengths = Object.values(distribution).sort((a, b) => b - a);
        // Balanserad: inga voids, singletons eller dubletter, max 5 kort i längsta färgen
        return lengths[0] <= 5 && lengths[3] >= 2;
    }

    static findOpeningBid(player, hand, biddingHistory) {
        // Kontrollera om spelaren redan har budat
        const hasBid = biddingHistory.some(bid => bid.player === player);
        if (hasBid) {
            return null; // Redan budat, inte öppningsbud
        }
        
        // Kontrollera om någon annan redan har öppnat
        const hasOpening = biddingHistory.some(bid => bid.bid !== 'pass');
        if (hasOpening) {
            return null; // Någon annan har redan öppnat
        }
        
        const points = this.countHighCardPoints(hand);
        const distribution = this.getDistribution(hand);
        const balanced = this.isBalanced(distribution);
        
        // Nordisk Standard öppningsbud:
        
        // 2NT = 20-22 poäng, balanserad
        if (balanced && points >= 20 && points <= 22) {
            return '2NT';
        }
        
        // 2♣ = 18+ poäng, vilken hand som helst
        if (points >= 18) {
            return '2C';
        }
        
        // 1NT = 15-17 poäng, balanserad
        if (balanced && points >= 15 && points <= 17) {
            return '1NT';
        }
        
        // 2♦ = 6-10 poäng, 6+ ruter eller 5+ ruter med 4+ i major
        if (points >= 6 && points <= 10) {
            if (distribution['D'] >= 6) {
                return '2D';
            }
            if (distribution['D'] >= 5 && (distribution['H'] >= 4 || distribution['S'] >= 4)) {
                return '2D';
            }
        }
        
        // 2♥ = 6-10 poäng, 6+ hjärter
        if (points >= 6 && points <= 10 && distribution['H'] >= 6) {
            return '2H';
        }
        
        // 2♠ = 6-10 poäng, 6+ spader
        if (points >= 6 && points <= 10 && distribution['S'] >= 6) {
            return '2S';
        }
        
        // 1-nivå öppningar = 12-14 poäng
        if (points >= 12 && points <= 14) {
            // 1♠ = 5+ spader
            if (distribution['S'] >= 5) {
                return '1S';
            }
            
            // 1♥ = 5+ hjärter
            if (distribution['H'] >= 5) {
                return '1H';
            }
            
            // 1♦ = 4+ ruter eller balanserad
            if (distribution['D'] >= 4 || balanced) {
                return '1D';
            }
            
            // 1♣ = 4+ klöver eller balanserad
            if (distribution['C'] >= 4 || balanced) {
                return '1C';
            }
        }
        
        // För svaga händer, pass
        return null;
    }

    static calculateResponse(player, hand, biddingHistory, partner) {
        // Hitta senaste icke-pass bud
        let lastBid = null;
        for (let i = biddingHistory.length - 1; i >= 0; i--) {
            if (biddingHistory[i].bid !== 'pass') {
                lastBid = biddingHistory[i];
                break;
            }
        }
        
        if (!lastBid) {
            return 'pass';
        }
        
        const isPartnerBid = lastBid.player === partner;
        const points = this.countHighCardPoints(hand);
        const distribution = this.getDistribution(hand);
        
        // Om partnern har budat, svar
        if (isPartnerBid) {
            return this.respondToPartner(lastBid.bid, points, distribution);
        }
        
        // Om motståndaren har budat, kontrabud eller pass
        if (points < 6) {
            return 'pass';
        }
        
        // Hitta längsta färgen för kontrabud
        let longestSuit = 'C';
        let maxLength = distribution['C'];
        for (let suit of ['D', 'H', 'S']) {
            if (distribution[suit] > maxLength) {
                maxLength = distribution[suit];
                longestSuit = suit;
            }
        }
        
        // Om vi har styrka, buda över
        if (points >= 10 && maxLength >= 4) {
            const lastLevel = parseInt(lastBid.bid[0]);
            if (lastLevel < 3) {
                return `${lastLevel + 1}${longestSuit}`;
            }
        }
        
        return 'pass';
    }

    static respondToPartner(openingBid, points, distribution) {
        const openingLevel = parseInt(openingBid[0]);
        const openingSuit = openingBid.slice(1);
        
        // Svar på 1-nivå öppningar
        if (openingLevel === 1) {
            // Om vi har 6+ poäng, kan vi svara
            if (points >= 6) {
                // Hitta längsta färgen
                let longestSuit = 'C';
                let maxLength = distribution['C'];
                for (let suit of ['D', 'H', 'S']) {
                    if (distribution[suit] > maxLength) {
                        maxLength = distribution[suit];
                        longestSuit = suit;
                    }
                }
                
                // Om vi har 4+ i en major, svara i den
                if (distribution['S'] >= 4) {
                    return '1S';
                }
                if (distribution['H'] >= 4) {
                    return '1H';
                }
                
                // Annars svara i längsta färgen
                if (maxLength >= 4) {
                    return `1${longestSuit}`;
                }
            }
        }
        
        // Svar på 1NT (15-17)
        if (openingBid === '1NT') {
            // Stayman eller transfer (förenklat: bara pass eller 2NT)
            if (points >= 8 && points <= 9 && this.isBalanced(distribution)) {
                return '2NT';
            }
            if (points >= 10) {
                return '2NT';
            }
        }
        
        // Svar på 2-nivå öppningar
        if (openingLevel === 2) {
            // Om vi har stöd, höj
            if (points >= 8) {
                if (openingSuit === 'C') {
                    // 2♣ är forcing, måste svara
                    let longestSuit = 'C';
                    let maxLength = distribution['C'];
                    for (let suit of ['D', 'H', 'S']) {
                        if (distribution[suit] > maxLength) {
                            maxLength = distribution[suit];
                            longestSuit = suit;
                        }
                    }
                    if (maxLength >= 4) {
                        return `2${longestSuit}`;
                    }
                    return '2D'; // Negativt svar
                }
                // För andra 2-bud, stöd om möjligt
                const supportLength = distribution[openingSuit] || 0;
                if (supportLength >= 3) {
                    return '3' + openingSuit;
                }
            }
        }
        
        return 'pass';
    }

    static calculateBid(player, hand, biddingHistory, partner) {
        // Försök hitta öppningsbud först
        const openingBid = this.findOpeningBid(player, hand, biddingHistory);
        if (openingBid) {
            return openingBid;
        }
        
        // Om det redan finns bud, beräkna svar
        if (biddingHistory.length > 0) {
            return this.calculateResponse(player, hand, biddingHistory, partner);
        }
        
        // Annars pass
        return 'pass';
    }
}

// Exportera för användning i andra moduler
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BiddingSystem, NordicStandardBidding };
}

