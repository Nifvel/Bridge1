// scoring.js - Poängberäkning

class BridgeScoring {
    constructor() {
        this.tricks = { 'NS': 0, 'EW': 0 };
        this.contract = null;
        this.declarer = null;
        this.vulnerability = { 'NS': false, 'EW': false };
    }

    // Räkna poäng baserat på kontrakt och antal stick
    calculateScore(contract, tricks, declarer, vulnerability) {
        if (!contract || !declarer) {
            return { 'NS': 0, 'EW': 0 };
        }

        const contractLevel = parseInt(contract[0]);
        const contractSuit = contract.slice(1);
        const declarerTeam = (declarer === 'N' || declarer === 'S') ? 'NS' : 'EW';
        const defenderTeam = declarerTeam === 'NS' ? 'EW' : 'NS';
        const isVulnerable = vulnerability[declarerTeam];
        
        const tricksWon = tricks[declarerTeam];
        const tricksNeeded = 6 + contractLevel; // 6 stick + kontraktsnivå
        
        let score = { 'NS': 0, 'EW': 0 };
        
        if (tricksWon >= tricksNeeded) {
            // Kontraktet gjorts
            score = this.calculateContractMade(contract, tricksWon, tricksNeeded, isVulnerable);
            score[declarerTeam] = score.contract;
            score[defenderTeam] = 0;
        } else {
            // Kontraktet sattes
            const undertricks = tricksNeeded - tricksWon;
            const penalty = this.calculatePenalty(undertricks, isVulnerable);
            score[declarerTeam] = -penalty;
            score[defenderTeam] = penalty;
        }
        
        return score;
    }

    calculateContractMade(contract, tricksWon, tricksNeeded, isVulnerable) {
        const contractLevel = parseInt(contract[0]);
        const contractSuit = contract.slice(1);
        
        // Baspoäng för kontraktet
        let baseScore = 0;
        const suitValues = {
            'C': 20,  // Klöver
            'D': 20,  // Ruter
            'H': 30,  // Hjärter
            'S': 30,  // Spader
            'NT': 30  // No Trump (första sticket)
        };
        
        const suitValue = suitValues[contractSuit] || 20;
        baseScore = contractLevel * suitValue;
        
        // Lägg till bonus för första sticket i NT
        if (contractSuit === 'NT') {
            baseScore += 10;
        }
        
        // Bonusar
        let bonus = 0;
        
        // Parti-bonus
        if (baseScore >= 100) {
            bonus += isVulnerable ? 500 : 300; // Game bonus
        } else {
            bonus += 50; // Part-score bonus
        }
        
        // Slam-bonusar
        if (contractLevel === 6) {
            bonus += isVulnerable ? 750 : 500; // Small slam
        } else if (contractLevel === 7) {
            bonus += isVulnerable ? 1500 : 1000; // Grand slam
        }
        
        // Övertrick
        const overtricks = tricksWon - tricksNeeded;
        let overtrickScore = 0;
        if (overtricks > 0) {
            if (contractSuit === 'NT' || contractSuit === 'H' || contractSuit === 'S') {
                // Major eller NT
                overtrickScore = overtricks * (isVulnerable ? 30 : 30);
            } else {
                // Minor
                overtrickScore = overtricks * (isVulnerable ? 20 : 20);
            }
        }
        
        const totalScore = baseScore + bonus + overtrickScore;
        
        return { contract: totalScore };
    }

    calculatePenalty(undertricks, isVulnerable) {
        // Straffpoäng för undertrick
        if (isVulnerable) {
            // Sårbar
            if (undertricks === 1) return 100;
            if (undertricks === 2) return 300;
            if (undertricks === 3) return 500;
            // 4+ undertrick: 500 + 300 per extra
            return 500 + (undertricks - 3) * 300;
        } else {
            // Osårbar
            if (undertricks === 1) return 50;
            if (undertricks === 2) return 100;
            if (undertricks === 3) return 150;
            // 4+ undertrick: 150 + 100 per extra
            return 150 + (undertricks - 3) * 100;
        }
    }

    // Uppdatera totala poäng
    updateScore(newScore) {
        this.tricks.NS += newScore.NS || 0;
        this.tricks.EW += newScore.EW || 0;
    }

    // Räkna stick (tricks)
    addTrick(team) {
        if (team === 'NS' || team === 'EW') {
            this.tricks[team]++;
        }
    }

    getTricks() {
        return { ...this.tricks };
    }

    reset() {
        this.tricks = { 'NS': 0, 'EW': 0 };
        this.contract = null;
        this.declarer = null;
    }

    // Hjälpfunktion för att formatera poäng
    formatScore(score) {
        const nsScore = score.NS || 0;
        const ewScore = score.EW || 0;
        
        if (nsScore > 0 && ewScore === 0) {
            return `NS: +${nsScore} - EW: 0`;
        } else if (ewScore > 0 && nsScore === 0) {
            return `NS: 0 - EW: +${ewScore}`;
        } else if (nsScore < 0) {
            return `NS: ${nsScore} - EW: +${Math.abs(nsScore)}`;
        } else if (ewScore < 0) {
            return `NS: +${Math.abs(ewScore)} - EW: ${ewScore}`;
        }
        
        return `NS: ${nsScore} - EW: ${ewScore}`;
    }

    // Räkna stickpoäng (enklare version för visning)
    getTrickScore() {
        return `NS: ${this.tricks.NS} stick - EW: ${this.tricks.EW} stick`;
    }
}

// Exportera för användning i andra moduler
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BridgeScoring };
}

