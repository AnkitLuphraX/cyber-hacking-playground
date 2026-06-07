import { CyberAudio } from './audio.js';

export class CyberMinigame {
  constructor(audioEngine) {
    this.audio = audioEngine;
    
    // DOM Elements
    this.modal = document.getElementById('minigame-modal');
    this.grid = document.getElementById('minigame-grid');
    this.wordListContainer = document.getElementById('minigame-word-list');
    this.lblTimer = document.getElementById('minigame-timer-countdown');
    this.lblMatches = document.getElementById('minigame-matches-counter');
    this.lblProgress = document.getElementById('minigame-progress-label');
    this.lblAlert = document.getElementById('minigame-alert-text');
    this.btnClose = document.getElementById('btn-close-minigame');

    // Game variables
    this.timer = 30.0;
    this.timerInterval = null;
    this.gameType = 'hex'; // 'hex' | 'word' | 'hex_fast'
    
    // Hex Match states
    this.matchesFound = 0;
    this.selectedCell = null;
    this.isChecking = false;
    this.hexValues = ['0xFA', '0x2C', '0xD4', '0x88', '0xBE', '0x1B'];
    this.cards = [];

    // Word Match states
    this.wordPool = [
      'COMPILER', 'COMPUTER', 'REGISTRY', 'RECEIVER', 
      'REPEATER', 'ROUTERS1', 'TERMINAL', 'TELEMETR', 
      'CYBERNET', 'INTERNET', 'FIREWALL', 'PROTOCOL'
    ];
    this.selectedWord = '';
    this.secretWord = '';
    this.attemptsLeft = 4;
    this.activeWords = [];
    
    // Callbacks
    this.onGameSuccess = null;
    this.onGameFailure = null;
  }

  init(onSuccess, onFailure) {
    this.onGameSuccess = onSuccess;
    this.onGameFailure = onFailure;
    this.btnClose.addEventListener('click', () => this.abortGame());
  }

  /**
   * Starts a mini-game based on the type
   * @param {string} type 'hex' | 'word' | 'hex_fast'
   */
  startGame(type = 'hex') {
    this.audio.resume();
    this.modal.classList.add('open');
    this.modal.setAttribute('aria-hidden', 'false');
    
    this.gameType = type;
    this.lblAlert.textContent = '';
    this.selectedCell = null;
    this.isChecking = false;

    // Adjust timer and displays based on game type
    if (type === 'hex_fast') {
      this.timer = 15.0; // Fast hex bypass
      this.lblProgress.innerHTML = 'MATCHES: <span id="minigame-matches-counter">0 / 6</span>';
      this.lblMatches = document.getElementById('minigame-matches-counter');
      this.initHexGame();
    } else if (type === 'hex') {
      this.timer = 30.0;
      this.lblProgress.innerHTML = 'MATCHES: <span id="minigame-matches-counter">0 / 6</span>';
      this.lblMatches = document.getElementById('minigame-matches-counter');
      this.initHexGame();
    } else if (type === 'word') {
      this.timer = 40.0; // Word decryption gets 40 seconds
      this.lblProgress.innerHTML = 'ATTEMPTS LEFT: <span id="minigame-matches-counter">4</span>';
      this.lblMatches = document.getElementById('minigame-matches-counter');
      this.initWordGame();
    }

    // Start tick counter
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timer -= 0.1;
      if (this.timer <= 0) {
        this.timer = 0;
        this.handleFailure();
      }
      this.lblTimer.textContent = `${Math.max(0, this.timer).toFixed(1)}s`;
    }, 100);
  }

  /**
   * HEX block matching game setup
   */
  initHexGame() {
    this.grid.style.display = 'grid';
    this.wordListContainer.style.display = 'none';

    this.matchesFound = 0;
    this.lblMatches.textContent = `0 / ${this.hexValues.length}`;

    // Scramble values (6 pairs = 12 cells)
    const cardPool = [...this.hexValues, ...this.hexValues];
    for (let i = cardPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPool[i], cardPool[j]] = [cardPool[j], cardPool[i]];
    }

    this.cards = cardPool.map((val, idx) => ({
      id: idx,
      value: val,
      isMatched: false
    }));

    // Populate DOM
    this.grid.innerHTML = '';
    this.cards.forEach(card => {
      const cell = document.createElement('button');
      cell.className = 'minigame-cell';
      cell.textContent = '??';
      cell.dataset.id = card.id;
      cell.addEventListener('click', () => this.handleHexCellClick(cell, card));
      this.grid.appendChild(cell);
    });
  }

  handleHexCellClick(element, card) {
    if (this.isChecking || card.isMatched || element.classList.contains('selected')) {
      return;
    }

    this.audio.playClick();
    element.textContent = card.value;
    element.classList.add('selected');

    if (!this.selectedCell) {
      this.selectedCell = { element, card };
    } else {
      this.isChecking = true;
      const first = this.selectedCell;
      
      if (first.card.value === card.value) {
        // MATCH
        setTimeout(() => {
          first.element.classList.remove('selected');
          first.element.classList.add('matched');
          element.classList.remove('selected');
          element.classList.add('matched');
          
          first.card.isMatched = true;
          card.isMatched = true;

          this.matchesFound++;
          this.lblMatches.textContent = `${this.matchesFound} / ${this.hexValues.length}`;
          this.audio.playChirp();

          this.selectedCell = null;
          this.isChecking = false;

          if (this.matchesFound === this.hexValues.length) {
            this.handleSuccess();
          }
        }, 200);
      } else {
        // MISMATCH
        this.lblAlert.textContent = 'MISMATCH DECRYPT ERROR! TIME PENALTY -5s';
        this.audio.playAccessDenied();

        first.element.style.borderColor = '#ef4444';
        element.style.borderColor = '#ef4444';

        setTimeout(() => {
          first.element.style.borderColor = '';
          element.style.borderColor = '';
          
          first.element.classList.remove('selected');
          element.classList.remove('selected');
          
          first.element.textContent = '??';
          element.textContent = '??';

          this.timer = Math.max(0, this.timer - 5.0);
          this.lblAlert.textContent = '';
          this.selectedCell = null;
          this.isChecking = false;
        }, 700);
      }
    }
  }

  /**
   * FALLOUT Word Association game setup
   */
  initWordGame() {
    this.grid.style.display = 'none';
    this.wordListContainer.style.display = 'flex';

    this.attemptsLeft = 4;
    this.lblMatches.textContent = String(this.attemptsLeft);

    // Pick random target secret word
    const secretIdx = Math.floor(Math.random() * this.wordPool.length);
    this.secretWord = this.wordPool[secretIdx];

    // Select 9 words total (1 secret + 8 decoys)
    const decoys = this.wordPool.filter(w => w !== this.secretWord);
    // Shuffle decoys
    for (let i = decoys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [decoys[i], decoys[j]] = [decoys[j], decoys[i]];
    }

    this.activeWords = [this.secretWord, ...decoys.slice(0, 8)];
    // Shuffle active words list
    for (let i = this.activeWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.activeWords[i], this.activeWords[j]] = [this.activeWords[j], this.activeWords[i]];
    }

    // Update descriptive text in minigame desc panel
    const descText = document.querySelector('.minigame-desc');
    if (descText) {
      descText.innerHTML = `
        [!] INTRUSION DETECTED. CIPHER SYNC LOCK ENFORCED.<br>
        [!] SELECT THE PASSKEY STRING. INCORRECT CODES REVEAL CHARACTER MATCH RATIO (LIKENESS).
      `;
    }

    // Populate words DOM
    this.wordListContainer.innerHTML = '';
    this.activeWords.forEach(word => {
      const btn = document.createElement('button');
      btn.className = 'word-item';
      btn.textContent = word;
      btn.addEventListener('click', () => this.handleWordClick(btn, word));
      this.wordListContainer.appendChild(btn);
    });
  }

  handleWordClick(btn, word) {
    if (this.isChecking || this.attemptsLeft <= 0) return;

    this.audio.playClick();
    
    if (word === this.secretWord) {
      // SUCCESS!
      btn.classList.add('selected-word');
      btn.style.borderColor = '#10b981';
      btn.style.color = '#10b981';
      this.isChecking = true;
      
      setTimeout(() => {
        this.handleSuccess();
      }, 400);
    } else {
      // MISMATCH WRONG PASSWORD
      this.attemptsLeft--;
      this.lblMatches.textContent = String(this.attemptsLeft);
      
      // Calculate likeness
      const likeness = this.calculateLikeness(word, this.secretWord);
      this.lblAlert.textContent = `[!] ERROR: "${word}" REJECTED. LIKENESS: ${likeness} / 8`;
      this.audio.playAccessDenied();

      // Highlight cell border red briefly
      btn.style.borderColor = '#ef4444';
      btn.style.color = '#ef4444';
      
      if (this.attemptsLeft <= 0) {
        this.handleFailure();
      }
    }
  }

  calculateLikeness(wordA, wordB) {
    let match = 0;
    const len = Math.min(wordA.length, wordB.length);
    for (let i = 0; i < len; i++) {
      if (wordA[i] === wordB[i]) {
        match++;
      }
    }
    return match;
  }

  handleSuccess() {
    clearInterval(this.timerInterval);
    this.modal.classList.remove('open');
    this.modal.setAttribute('aria-hidden', 'true');
    this.audio.playAccessGranted();
    
    if (this.onGameSuccess) {
      this.onGameSuccess();
    }
  }

  handleFailure() {
    clearInterval(this.timerInterval);
    this.modal.classList.remove('open');
    this.modal.setAttribute('aria-hidden', 'true');
    this.audio.playAccessDenied();
    
    if (this.onGameFailure) {
      this.onGameFailure();
    }
  }

  abortGame() {
    clearInterval(this.timerInterval);
    this.modal.classList.remove('open');
    this.modal.setAttribute('aria-hidden', 'true');
    this.audio.playClick();
    
    if (this.onGameFailure) {
      this.onGameFailure(true); // aborted flag
    }
  }
}
