// ui.js - Användarinterface hantering

class BridgeUI {
    constructor() {
        this.playerHandElements = {
            'N': 'north-hand',
            'E': 'east-hand',
            'S': 'south-hand',
            'W': 'west-hand'
        };
        this.playerBidElements = {
            'N': 'north-bid',
            'E': 'east-bid',
            'S': 'south-bid',
            'W': 'west-bid'
        };
    }

    // Uppdatera spelarens hand
    updateHand(player, hand, isRobot = false, isDummy = false) {
        const elementId = this.playerHandElements[player];
        if (!elementId) return;
        
        const handEl = document.getElementById(elementId);
        if (!handEl) return;
        
        handEl.innerHTML = '';
        
        if (isRobot && !isDummy) {
            // Visa antal kort för robotar (men inte dummy)
            const countEl = document.createElement('div');
            countEl.textContent = `${hand.length} kort`;
            countEl.style.fontSize = '0.9em';
            countEl.style.color = '#666';
            handEl.appendChild(countEl);
        } else {
            // Visa kort för spelaren eller dummy
            hand.forEach(card => {
                const cardEl = document.createElement('div');
                cardEl.className = `card ${card.isRed() ? 'red' : 'black'}`;
                if (isDummy) {
                    cardEl.classList.add('dummy-card');
                }
                cardEl.textContent = card.toString();
                // Spara kortdata i data-attribut för att kunna identifiera kortet
                cardEl.dataset.suit = card.suit;
                cardEl.dataset.rank = card.rank;
                handEl.appendChild(cardEl);
            });
        }
    }

    // Markera spelbara kort
    updatePlayableCards(player, hand, playableCards, onCardClick) {
        const elementId = this.playerHandElements[player];
        if (!elementId) return;
        
        const handEl = document.getElementById(elementId);
        if (!handEl) return;
        
        // Ta bort alla event handlers och playable-klasser först
        Array.from(handEl.children).forEach(cardEl => {
            cardEl.classList.remove('playable');
            cardEl.onclick = null;
        });
        
        // Lägg till playable-klass och event handlers för spelbara kort
        Array.from(handEl.children).forEach(cardEl => {
            const suit = cardEl.dataset.suit;
            const rank = cardEl.dataset.rank;
            const card = playableCards.find(c => c.suit === suit && c.rank === rank);
            
            if (card) {
                cardEl.classList.add('playable');
                cardEl.onclick = () => onCardClick(card);
            }
        });
    }

    // Uppdatera dummy's kort (synliga för declarer att välja från)
    updateDummyCards(dummyHand, playableCards, onCardClick) {
        // Hitta dummy's position och visa korten
        const dummyElementId = this.playerHandElements[dummyHand.playerId];
        if (!dummyElementId) return;
        
        const dummyEl = document.getElementById(dummyElementId);
        if (!dummyEl) return;
        
        // Visa alla dummy's kort (synliga)
        dummyEl.innerHTML = '';
        dummyHand.cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = `card ${card.isRed() ? 'red' : 'black'}`;
            cardEl.textContent = card.toString();
            cardEl.dataset.suit = card.suit;
            cardEl.dataset.rank = card.rank;
            
            // Markera spelbara kort
            const isPlayable = playableCards.find(c => c.suit === card.suit && c.rank === card.rank);
            if (isPlayable) {
                cardEl.classList.add('playable');
                cardEl.classList.add('dummy-card');
                cardEl.onclick = () => onCardClick(card);
            }
            
            dummyEl.appendChild(cardEl);
        });
    }

    // Uppdatera budgivningshistorik
    updateBiddingHistory(biddingHistory, players) {
        const historyEl = document.getElementById('bidding-history');
        if (!historyEl) return;
        
        historyEl.innerHTML = '';
        biddingHistory.forEach(entry => {
            const bidEl = document.createElement('span');
            bidEl.className = 'bid-entry';
            const playerName = players[entry.player]?.name || entry.player;
            bidEl.textContent = `${playerName}: ${entry.bid === 'pass' ? 'Pass' : entry.bid}`;
            historyEl.appendChild(bidEl);
        });
    }

    // Uppdatera kontraktinformation
    updateContract(contract, trumpSuit) {
        const contractEl = document.getElementById('contract');
        const trumpEl = document.getElementById('trump-suit');
        
        if (contractEl) {
            contractEl.textContent = contract || '-';
        }
        if (trumpEl) {
            trumpEl.textContent = trumpSuit || '-';
        }
    }

    // Uppdatera stickområdet
    updateTrick(currentTrick, players, gamePhase) {
        const trickEl = document.getElementById('trick-area');
        if (!trickEl) return;
        
        trickEl.innerHTML = '';
        
        if (!currentTrick || currentTrick.length === 0) {
            if (gamePhase === 'playing') {
                trickEl.innerHTML = '<div style="color: #999; text-align: center; padding: 15px; grid-column: 1 / -1;">Väntar på kort...</div>';
            } else {
                trickEl.innerHTML = '<div style="color: #999; text-align: center; padding: 15px; grid-column: 1 / -1;">Inget kort spelat ännu</div>';
            }
            return;
        }
        
        // Placera korten i rätt position baserat på spelare (grid: N överst vänster, E överst höger, W nederst vänster, S nederst höger)
        const positions = { 
            'N': { gridColumn: 1, gridRow: 1, label: 'Nord' },
            'E': { gridColumn: 2, gridRow: 1, label: 'Öst' },
            'W': { gridColumn: 1, gridRow: 2, label: 'Väst' },
            'S': { gridColumn: 2, gridRow: 2, label: 'Syd' }
        };
        
        // Hitta första kortet (lead)
        const leadPlayer = currentTrick.length > 0 ? currentTrick[0].player : null;
        
        // Skapa en array med 4 platser
        const trickCards = {
            'N': null,
            'E': null,
            'S': null,
            'W': null
        };
        
        currentTrick.forEach(entry => {
            trickCards[entry.player] = entry;
        });
        
        // Visa korten i rätt position med labels
        ['N', 'E', 'S', 'W'].forEach(playerId => {
            const entry = trickCards[playerId];
            const pos = positions[playerId];
            
            if (entry) {
                const container = document.createElement('div');
                container.className = 'trick-card-container';
                container.style.gridColumn = pos.gridColumn;
                container.style.gridRow = pos.gridRow;
                
                // Label
                const label = document.createElement('div');
                label.className = 'trick-card-label';
                label.textContent = pos.label;
                container.appendChild(label);
                
                // Kort
                const cardEl = document.createElement('div');
                const isLead = entry.player === leadPlayer;
                cardEl.className = `trick-card ${entry.card.isRed() ? 'red' : 'black'} ${isLead ? 'lead-card' : ''}`;
                cardEl.textContent = entry.card.toString();
                cardEl.title = `${players[entry.player]?.name || entry.player} spelade`;
                container.appendChild(cardEl);
                
                trickEl.appendChild(container);
            } else {
                // Tom plats för spelare som inte spelat ännu
                const container = document.createElement('div');
                container.className = 'trick-card-container';
                container.style.gridColumn = pos.gridColumn;
                container.style.gridRow = pos.gridRow;
                container.style.opacity = '0.3';
                
                const label = document.createElement('div');
                label.className = 'trick-card-label';
                label.textContent = pos.label;
                container.appendChild(label);
                
                const placeholder = document.createElement('div');
                placeholder.style.width = '45px';
                placeholder.style.height = '65px';
                placeholder.style.border = '2px dashed #ccc';
                placeholder.style.borderRadius = '6px';
                container.appendChild(placeholder);
                
                trickEl.appendChild(container);
            }
        });
    }

    // Uppdatera poäng
    updateScore(tricks) {
        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.textContent = `NS: ${tricks.NS} - EW: ${tricks.EW}`;
        }
    }

    // Uppdatera fas
    updatePhase(gamePhase) {
        const phaseEl = document.getElementById('bidding-phase');
        if (phaseEl) {
            phaseEl.textContent = gamePhase === 'bidding' ? 'Budgivning' : 'Spel';
        }
    }

    // Visa/dölj budgivningsområde
    showBiddingArea(show = true) {
        const biddingArea = document.getElementById('bidding-area');
        if (biddingArea) {
            if (show) {
                biddingArea.classList.add('active');
            } else {
                biddingArea.classList.remove('active');
            }
        }
    }

    // Initiera budgivningsknappar
    initializeBiddingButtons(onBidClick) {
        const bidButtons = document.querySelectorAll('.bid-btn');
        bidButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const bid = btn.dataset.bid;
                onBidClick(bid);
            });
        });
    }

    // Aktivera/deaktivera budgivningsknappar
    setBiddingButtonsEnabled(enabled) {
        const bidButtons = document.querySelectorAll('.bid-btn');
        bidButtons.forEach(btn => {
            btn.disabled = !enabled;
        });
    }

    // Initiera kontrollknappar
    initializeControlButtons(onNewGame, onDealCards) {
        const newGameBtn = document.getElementById('new-game-btn');
        const dealBtn = document.getElementById('deal-btn');
        
        if (newGameBtn) {
            newGameBtn.addEventListener('click', onNewGame);
        }
        if (dealBtn) {
            dealBtn.addEventListener('click', onDealCards);
        }
    }

    // Visa meddelande
    showMessage(message, type = 'info') {
        // Enkel alert för nu, kan förbättras med en modal
        if (type === 'error') {
            alert('Fel: ' + message);
        } else {
            alert(message);
        }
    }

    // Uppdatera spelarens bud
    updatePlayerBid(player, bid) {
        const bidEl = document.getElementById(this.playerBidElements[player]);
        if (bidEl) {
            bidEl.textContent = bid || '';
        }
    }

    // Uppdatera hela UI
    updateAll(gameState) {
        const { players, biddingHistory, contract, trumpSuit, currentTrick, tricks, gamePhase } = gameState;
        
        // Uppdatera spelarnamn
        Object.keys(players).forEach(playerId => {
            const nameEl = document.getElementById(`${playerId === 'N' ? 'north' : playerId === 'E' ? 'east' : playerId === 'S' ? 'south' : 'west'}-name`);
            if (nameEl) {
                nameEl.textContent = players[playerId].name;
            }
        });
        
        // Uppdatera händer
        Object.keys(players).forEach(playerId => {
            const player = players[playerId];
            this.updateHand(playerId, player.cards, player.isRobot, player.isDummy || false);
        });
        
        // Uppdatera budgivning
        this.updateBiddingHistory(biddingHistory, players);
        this.updateContract(contract, trumpSuit);
        
        // Uppdatera stick
        this.updateTrick(currentTrick, players, gamePhase);
        
        // Uppdatera poäng
        this.updateScore(tricks);
        
        // Uppdatera fas
        this.updatePhase(gamePhase);
    }
}

// Exportera för användning i andra moduler
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BridgeUI };
}

