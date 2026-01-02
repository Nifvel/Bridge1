// bridge-game.js - Huvudkontroller som använder alla moduler

class BridgeGame {
    constructor() {
        // Initiera spelare med PlayerHand
        // Under budgivningen är alltid Syd spelaren
        this.players = {
            'N': new PlayerHand('N', 'Nord', true),
            'E': new PlayerHand('E', 'Öst', true),
            'S': new PlayerHand('S', 'Syd', false), // Syd är alltid spelare under budgivning
            'W': new PlayerHand('W', 'Väst', true)
        };
        this.humanPlayer = 'S'; // Under budgivning är alltid Syd spelaren
        
        // Initiera system
        this.biddingSystem = new BiddingSystem();
        this.ai = new BridgeAI();
        this.scoring = new BridgeScoring();
        this.ui = new BridgeUI();
        
        // Spelstatus
        this.currentPlayer = 'N'; // Nord börjar alltid (eftersom Väst delar ut)
        this.currentTrick = [];
        this.trickLeader = null;
        this.gamePhase = 'bidding'; // 'bidding' eller 'playing'
        this.declarer = null;
        this.dummy = null;
        this.lead = null;
        this.dummyRevealed = false; // Flagga för om dummy's kort har lagts ut
        
        this.initializeUI();
    }

    initializeUI() {
        this.ui.initializeControlButtons(
            () => this.newGame(),
            () => this.dealCards()
        );
        
        this.ui.initializeBiddingButtons((bid) => {
            if (this.currentPlayer === 'S' && this.gamePhase === 'bidding') {
                this.makeBid('S', bid);
            }
        });
    }

    newGame() {
        // Rensa alla händer
        Object.values(this.players).forEach(player => player.clear());
        
        // Återställ spelare till robotar (utom Syd som är spelare under budgivning)
        this.players.N.isRobot = true;
        this.players.N.playerName = 'Nord';
        this.players.E.isRobot = true;
        this.players.E.playerName = 'Öst';
        this.players.S.isRobot = false; // Syd är alltid spelare under budgivning
        this.players.S.playerName = 'Syd (Du)';
        this.players.W.isRobot = true;
        this.players.W.playerName = 'Väst';
        
        // Återställ system
        this.biddingSystem.reset();
        this.scoring.reset();
        
        // Återställ spelstatus
        this.currentTrick = [];
        this.trickLeader = null;
        this.gamePhase = 'bidding';
        this.currentPlayer = 'N'; // Nord börjar alltid (eftersom Väst delar ut)
        this.declarer = null;
        this.dummy = null;
        this.lead = null;
        this.humanPlayer = 'S'; // Under budgivning är alltid Syd spelaren
        this.dummyRevealed = false; // Återställ flagga
        
        this.updateUI();
        this.ui.showBiddingArea(false);
    }

    dealCards() {
        const deck = new Deck();
        deck.shuffle();
        
        // Rensa händer först
        Object.values(this.players).forEach(player => player.clear());
        
        // Dela kort
        deck.dealToPlayers(this.players);
        
        // Sortera händerna
        Object.values(this.players).forEach(player => {
            CardSorter.sortHand(player.cards);
        });
        
        // Återställ budgivning
        this.biddingSystem.reset();
        this.gamePhase = 'bidding';
        this.currentPlayer = 'N'; // Nord börjar alltid (eftersom Väst delar ut)
        
        this.ui.showBiddingArea(true);
        this.updateUI();
        this.startBidding();
    }

    startBidding() {
        // Nord börjar alltid automatiskt (robot)
        // Därefter Öst (robot), sedan Syd (spelare)
        // Under budgivningen är alltid Syd spelaren
        if (this.currentPlayer === 'S') {
            // Spelarens tur - vänta på input
            return;
        }
        if (this.players[this.currentPlayer].isRobot) {
            setTimeout(() => {
                this.robotBid();
            }, 1000);
        }
    }

    robotBid() {
        if (this.gamePhase !== 'bidding' || this.currentPlayer === 'S') {
            return;
        }
        
        const player = this.players[this.currentPlayer];
        const partner = this.biddingSystem.getPartner(this.currentPlayer);
        const bid = this.ai.calculateBid(
            this.currentPlayer,
            player.cards,
            this.biddingSystem.biddingHistory,
            partner
        );
        
        this.makeBid(this.currentPlayer, bid);
    }

    makeBid(player, bid) {
        if (this.gamePhase !== 'bidding') return;
        
        const bidEntry = this.biddingSystem.makeBid(player, bid);
        this.ui.updatePlayerBid(player, bid === 'pass' ? 'Pass' : bid);
        
        // Om budgivningen är klar
        if (this.biddingSystem.isBiddingComplete()) {
            this.endBidding();
            return;
        }
        
        this.currentPlayer = this.biddingSystem.getNextPlayer(this.currentPlayer);
        this.updateUI();
        
        // Om nästa spelare är robot, låt dem buda
        if (this.players[this.currentPlayer].isRobot && this.gamePhase === 'bidding') {
            setTimeout(() => this.robotBid(), 1000);
        }
    }

    endBidding() {
        this.gamePhase = 'playing';
        this.ui.showBiddingArea(false);
        
        if (!this.biddingSystem.contract) {
            this.ui.showMessage('Alla passade. Ny delning!');
            this.newGame();
            return;
        }
        
        // Sätt declarer, dummy och lead
        this.declarer = this.biddingSystem.declarer;
        this.dummy = this.biddingSystem.getDummy(this.declarer);
        this.lead = this.biddingSystem.getLead(this.declarer);
        this.dummyRevealed = false; // Dummy's kort ska visas efter första kortet
        
        // Om declarer är Nord eller Syd, gör dem till spelare (inte robot)
        if (this.declarer === 'N' || this.declarer === 'S') {
            this.humanPlayer = this.declarer;
            this.players[this.declarer].isRobot = false;
            // Uppdatera spelarnamnet
            if (this.declarer === 'N') {
                this.players[this.declarer].playerName = 'Nord (Du)';
                // Om Nord är spelare, sätt Syd tillbaka till robot
                this.players['S'].isRobot = true;
                this.players['S'].playerName = 'Syd';
            } else {
                this.players[this.declarer].playerName = 'Syd (Du)';
            }
        } else {
            // Om declarer är robot (Öst eller Väst), sätt Syd som spelare
            this.humanPlayer = 'S';
            this.players['S'].isRobot = false;
            this.players['S'].playerName = 'Syd (Du)';
        }
        
        // Utspelshanden (lead) börjar spelet
        this.trickLeader = this.lead;
        this.currentPlayer = this.lead;
        this.currentTrick = [];
        
        this.updateUI();
        this.startPlaying();
    }

    startPlaying() {
        // Om det är utspelshanden (lead) som börjar
        if (this.currentPlayer === this.lead) {
            if (this.players[this.currentPlayer].isRobot) {
                setTimeout(() => {
                    this.robotPlay();
                }, 1000);
            } else {
                // Spelarens tur att spela ut
                this.updatePlayableCards();
            }
        } else {
            // Om det är någon annans tur
            if (this.players[this.currentPlayer].isRobot) {
                setTimeout(() => {
                    this.robotPlay();
                }, 1000);
            } else {
                // Spelarens tur
                this.updatePlayableCards();
            }
        }
    }

    robotPlay() {
        if (this.gamePhase !== 'playing') {
            return;
        }
        
        // Om det är dummy's tur, vänta på att declarer väljer kort
        if (this.currentPlayer === this.dummy) {
            // Om declarer är robot, låt AI välja från dummy's hand
            if (this.players[this.declarer].isRobot) {
                setTimeout(() => {
                    this.playDummyCard();
                }, 1000);
            } else {
                // Om declarer är spelaren, vänta på att de väljer kort från dummy
                this.updateDummyCards();
            }
            return;
        }
        
        // Om det inte är spelarens tur (och inte dummy)
        if (this.currentPlayer === 'S' && !this.players['S'].isRobot) {
            return; // Vänta på spelarens input
        }
        
        const player = this.players[this.currentPlayer];
        const isDeclarer = this.currentPlayer === this.declarer;
        const partner = this.biddingSystem.getPartner(this.currentPlayer);
        
        const card = this.ai.selectCard(
            this.currentPlayer,
            player.cards,
            this.currentTrick,
            this.biddingSystem.trumpSuit,
            this.biddingSystem.contract,
            isDeclarer
        );
        
        this.playCard(this.currentPlayer, card);
    }

    playDummyCard() {
        // AI väljer kort från dummy's hand
        const dummyHand = this.players[this.dummy];
        const isDeclarer = true; // Declarer spelar dummy's hand
        
        const card = this.ai.selectCard(
            this.dummy,
            dummyHand.cards,
            this.currentTrick,
            this.biddingSystem.trumpSuit,
            this.biddingSystem.contract,
            isDeclarer
        );
        
        this.playCard(this.dummy, card);
    }

    playCard(player, card) {
        const playerHand = this.players[player];
        const playedCard = playerHand.removeCard(card);
        
        if (!playedCard) return;
        
        this.currentTrick.push({ player, card: playedCard });
        
        // Om första kortet spelats, visa dummy's kort permanent
        if (this.currentTrick.length === 1 && !this.dummyRevealed && this.dummy !== null) {
            this.dummyRevealed = true;
        }
        
        // Om sticket är komplett (4 kort)
        if (this.currentTrick.length === 4) {
            setTimeout(() => {
                this.completeTrick();
            }, 1500);
        } else {
            this.currentPlayer = this.biddingSystem.getNextPlayer(this.currentPlayer);
            
            // Om det är dummy's tur, hantera det särskilt
            if (this.currentPlayer === this.dummy) {
                if (this.players[this.declarer].isRobot) {
                    setTimeout(() => this.robotPlay(), 1000);
                } else {
                    // Declarer (spelaren) väljer kort från dummy
                    this.updateDummyCards();
                }
            } else if (this.players[this.currentPlayer].isRobot) {
                setTimeout(() => this.robotPlay(), 1000);
            } else {
                this.updatePlayableCards();
            }
        }
        
        this.updateUI();
    }

    updatePlayableCards() {
        // Om det är dummy's tur och declarer är spelaren
        if (this.currentPlayer === this.dummy && this.humanPlayer === this.declarer) {
            this.updateDummyCards();
            return;
        }
        
        // Kontrollera om det är spelarens tur
        if (!this.humanPlayer || this.currentPlayer !== this.humanPlayer) {
            return; // Inte spelarens tur
        }
        
        const playerHand = this.players[this.humanPlayer];
        
        if (this.currentTrick.length === 0) {
            // Kan spela vilket kort som helst
            this.ui.updatePlayableCards(
                this.humanPlayer,
                playerHand.cards,
                playerHand.cards,
                (card) => this.playCard(this.humanPlayer, card)
            );
        } else {
            // Måste följa färg om möjligt
            const leadSuit = TrickWinner.getLeadSuit(this.currentTrick);
            const followCards = TrickWinner.getFollowCards(playerHand.cards, leadSuit);
            
            if (followCards.length > 0) {
                // Kan bara spela kort i färgen
                this.ui.updatePlayableCards(
                    this.humanPlayer,
                    playerHand.cards,
                    followCards,
                    (card) => this.playCard(this.humanPlayer, card)
                );
            } else {
                // Kan spela vilket kort som helst
                this.ui.updatePlayableCards(
                    this.humanPlayer,
                    playerHand.cards,
                    playerHand.cards,
                    (card) => this.playCard(this.humanPlayer, card)
                );
            }
        }
    }

    updateDummyCards() {
        // Visa dummy's kort och låt declarer välja
        const dummyHand = this.players[this.dummy];
        
        if (this.currentTrick.length === 0) {
            // Kan spela vilket kort som helst från dummy
            this.ui.updateDummyCards(
                dummyHand,
                dummyHand.cards,
                (card) => this.playCard(this.dummy, card)
            );
        } else {
            // Måste följa färg om möjligt
            const leadSuit = TrickWinner.getLeadSuit(this.currentTrick);
            const followCards = TrickWinner.getFollowCards(dummyHand.cards, leadSuit);
            
            if (followCards.length > 0) {
                // Kan bara spela kort i färgen
                this.ui.updateDummyCards(
                    dummyHand,
                    followCards,
                    (card) => this.playCard(this.dummy, card)
                );
            } else {
                // Kan spela vilket kort som helst
                this.ui.updateDummyCards(
                    dummyHand,
                    dummyHand.cards,
                    (card) => this.playCard(this.dummy, card)
                );
            }
        }
    }

    completeTrick() {
        // Hitta vinnaren av sticket
        const leadSuit = TrickWinner.getLeadSuit(this.currentTrick);
        const winner = TrickWinner.determineWinner(
            this.currentTrick,
            leadSuit,
            this.biddingSystem.trumpSuit
        );
        
        if (!winner) return;
        
        // Uppdatera poäng
        const winnerTeam = (winner.player === 'N' || winner.player === 'S') ? 'NS' : 'EW';
        this.scoring.addTrick(winnerTeam);
        
        // Nästa stick börjar med vinnaren
        this.trickLeader = winner.player;
        this.currentPlayer = winner.player;
        this.currentTrick = [];
        
        // Kontrollera om spelet är över
        if (this.players.S.isEmpty()) {
            this.endGame();
            return;
        }
        
        this.updateUI();
        
        // Om det är dummy's tur, hantera det särskilt
        if (this.currentPlayer === this.dummy) {
            if (this.players[this.declarer].isRobot) {
                setTimeout(() => this.robotPlay(), 1000);
            } else {
                // Declarer (spelaren) väljer kort från dummy
                this.updateDummyCards();
            }
        } else if (this.players[this.currentPlayer].isRobot) {
            setTimeout(() => this.robotPlay(), 1000);
        } else {
            this.updatePlayableCards();
        }
    }

    endGame() {
        const tricks = this.scoring.getTricks();
        const finalScore = this.scoring.calculateScore(
            this.biddingSystem.contract,
            tricks,
            this.biddingSystem.declarer,
            this.scoring.vulnerability
        );
        
        this.ui.showMessage(
            `Spelet är över!\n${this.scoring.getTrickScore()}\n${this.scoring.formatScore(finalScore)}`
        );
        this.newGame();
    }

    updateUI() {
        // Skapa gameState objekt
        // Dummy's kort ska visas EFTER att första kortet spelats och sedan förbli synliga
        const isDummyVisible = this.gamePhase === 'playing' && 
                               this.dummy !== null && 
                               this.dummyRevealed;
        
        const gameState = {
            players: {
                'N': { 
                    name: this.players.N.playerName, 
                    cards: this.players.N.cards, 
                    isRobot: this.players.N.isRobot,
                    isDummy: isDummyVisible && this.dummy === 'N'
                },
                'E': { 
                    name: this.players.E.playerName, 
                    cards: this.players.E.cards, 
                    isRobot: this.players.E.isRobot,
                    isDummy: isDummyVisible && this.dummy === 'E'
                },
                'S': { 
                    name: this.players.S.playerName, 
                    cards: this.players.S.cards, 
                    isRobot: this.players.S.isRobot,
                    isDummy: isDummyVisible && this.dummy === 'S'
                },
                'W': { 
                    name: this.players.W.playerName, 
                    cards: this.players.W.cards, 
                    isRobot: this.players.W.isRobot,
                    isDummy: isDummyVisible && this.dummy === 'W'
                }
            },
            biddingHistory: this.biddingSystem.biddingHistory,
            contract: this.biddingSystem.contract,
            trumpSuit: this.biddingSystem.trumpSuit,
            currentTrick: this.currentTrick,
            tricks: this.scoring.getTricks(),
            gamePhase: this.gamePhase
        };
        
        // Uppdatera alla UI-komponenter
        this.ui.updateAll(gameState);
        
        // Aktivera/deaktivera budgivningsknappar baserat på om det är spelarens tur
        if (this.gamePhase === 'bidding') {
            this.ui.setBiddingButtonsEnabled(this.currentPlayer === 'S');
        } else {
            this.ui.setBiddingButtonsEnabled(false);
        }
        
        // Uppdatera spelbara kort EFTER att händerna är uppdaterade
        if (this.gamePhase === 'playing') {
            if (this.humanPlayer && this.currentPlayer === this.humanPlayer && this.currentPlayer !== this.dummy) {
                this.updatePlayableCards();
            } else if (this.currentPlayer === this.dummy && this.humanPlayer === this.declarer) {
                this.updateDummyCards();
            }
        }
    }
}

// Starta spelet när sidan laddas
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new BridgeGame();
});
