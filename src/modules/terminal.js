import { CyberAudio } from './audio.js';

export class CyberTerminal {
  constructor(audioEngine) {
    this.audio = audioEngine;
    
    // DOM Elements
    this.output = document.getElementById('terminal-output');
    this.input = document.getElementById('terminal-input');
    this.promptEl = document.getElementById('terminal-prompt');
    this.container = document.getElementById('terminal-output-container');
    this.statusIcon = document.getElementById('terminal-status-icon');
    
    // Command History
    this.history = [];
    this.historyIndex = -1;
    
    // System variables
    this.isLocked = false;
    this.hostname = 'guest@cyber_node:~$';
    this.typingSpeed = 22; // slightly faster typing for snappy feel
    
    // Active animations
    this.activeIntervals = [];

    // Matrix Screensaver
    this.matrixActive = false;
    this.matrixCanvas = null;
    this.matrixCtx = null;
    this.matrixAnimFrame = null;

    // Available commands list for Tab Autocomplete
    this.commandsList = [
      'help', 'scan', 'decrypt', 'ddos', 'bypass', 
      'nodes', 'theme', 'audio', 'matrix', 'clear', 'cheat'
    ];
  }

  init(onMinigameTrigger, onThemeChange, onDdosSpike, campaignInstance) {
    this.onMinigameTrigger = onMinigameTrigger;
    this.onThemeChange = onThemeChange;
    this.onDdosSpike = onDdosSpike;
    this.campaign = campaignInstance;

    // Load history from localStorage
    try {
      const savedHistory = localStorage.getItem('cyber_cli_history_log');
      if (savedHistory) {
        this.history = JSON.parse(savedHistory);
        this.historyIndex = this.history.length;
      }
    } catch (e) {
      console.warn("Could not load terminal history.");
    }

    // Input listeners
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    // Click to focus input
    this.container.addEventListener('click', () => {
      if (!this.matrixActive) this.input.focus();
    });

    // Boot loader
    this.writeBootSequence();
  }

  /**
   * Play startup animation
   */
  async writeBootSequence() {
    this.lock();
    await this.writeLine('====================================================', 'output-info');
    await this.writeLine('     CYBER_NET CORE OS BIND PORTAL v2.0.12', 'output-info');
    await this.writeLine('====================================================', 'output-info');
    await this.writeLine('[*] INITIALIZING RETRO INTERACTIVE CLI WORKSPACE...', 'output-dim');
    await this.sleep(350);
    await this.writeLine('[+] SOCKET HANDSHAKE ENCRYPTED VIA TRIPLE-DES-256', 'output-success');
    await this.writeLine('[+] PARSING GLOBAL TELEMETRY AND RADAR SCAN ENGINE...', 'output-success');
    await this.sleep(250);
    await this.writeLine('[+] WEB AUDIO MECHANICAL AUDIO MATRIX DETECTED', 'output-success');
    await this.writeLine('[!] ALL KEYSTROKE AUDIO PROCEDURE GENERATED DYNAMICALLY', 'output-warning');
    await this.writeLine('[!] TAB AUTO-COMPLETE SUPPORT ENABLED (PRESS TAB ON INPUT)', 'output-info');
    await this.writeLine('----------------------------------------------------', 'output-dim');
    await this.writeLine('SYSTEM INITIALIZATION COMPLETE. CURRENT SECURITY CLEARANCE: LEVEL 0.', 'output-info');
    await this.writeLine('TYPE "help" IN THE INPUT PROMPT BELOW TO BEGIN RECONNAISSANCE.', 'output-warning');
    await this.writeLine('');
    this.unlock();
  }

  /**
   * Key down events
   */
  handleKeydown(e) {
    if (this.isLocked) {
      e.preventDefault();
      return;
    }

    // Play click sound with key-specific pitch offsets!
    this.audio.playClick(e.key);

    if (e.key === 'Enter') {
      const cmd = this.input.value.trim();
      this.input.value = '';
      if (cmd) {
        this.history.push(cmd);
        // Cap history length to 100 entries
        if (this.history.length > 100) this.history.shift();
        this.historyIndex = this.history.length;
        
        // Persist history
        try {
          localStorage.setItem('cyber_cli_history_log', JSON.stringify(this.history));
        } catch(err) {}

        this.executeCommand(cmd);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault(); // Stop default tab browser focus jump
      this.handleTabAutocomplete();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.history.length > 0 && this.historyIndex > 0) {
        this.historyIndex--;
        this.input.value = this.history[this.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.input.value = this.history[this.historyIndex];
      } else {
        this.historyIndex = this.history.length;
        this.input.value = '';
      }
    }
  }

  /**
   * Handles Tab autocompletion of active shell command inputs
   */
  handleTabAutocomplete() {
    const val = this.input.value.trim().toLowerCase();
    if (!val) return;

    // Filter matched commands
    const matches = this.commandsList.filter(cmd => cmd.startsWith(val));
    
    if (matches.length === 1) {
      // Single match: complete it
      this.input.value = matches[0] + ' ';
    } else if (matches.length > 1) {
      // Multiple matches: display them in terminal as a helper log line
      const matchesStr = matches.join('   ');
      const helperLine = document.createElement('div');
      helperLine.className = 'output-dim font-mono';
      helperLine.textContent = `-> MATCHES: ${matchesStr}`;
      this.output.appendChild(helperLine);
      this.scrollToBottom();
    }
  }

  /**
   * Command executor
   */
  async executeCommand(fullCommand) {
    this.lock();
    
    // Print user input row
    const userRow = document.createElement('div');
    userRow.className = 'terminal-input-row';
    userRow.innerHTML = `<span class="terminal-prompt">${this.hostname}</span> <span>${fullCommand}</span>`;
    this.output.appendChild(userRow);
    this.scrollToBottom();

    const parts = fullCommand.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    await this.sleep(100);

    switch(cmd) {
      case 'help':
        await this.cmdHelp(args);
        break;
      case 'clear':
        this.output.innerHTML = '';
        break;
      case 'scan':
        await this.cmdScan(args);
        break;
      case 'ddos':
        await this.cmdDdos(args);
        break;
      case 'decrypt':
        await this.cmdDecrypt(args);
        break;
      case 'bypass':
        this.cmdBypass();
        break;
      case 'nodes':
        await this.cmdNodes();
        break;
      case 'theme':
        await this.cmdTheme(args);
        break;
      case 'audio':
        await this.cmdAudio();
        break;
      case 'matrix':
        this.cmdMatrix();
        break;
      case 'cheat':
        await this.cmdCheat();
        break;
      default:
        await this.writeLine(`[-] COMMAND NOT FOUND: "${cmd}". Type "help" for active routes catalog.`, 'output-error');
    }

    this.unlock();
  }

  /**
   * Command: Help (supports optional argument help <cmd>)
   */
  async cmdHelp(args) {
    if (args[0]) {
      const topic = args[0].toLowerCase();
      await this.writeLine(`HELP ROUTE MANUAL: ${topic.toUpperCase()}`, 'output-info');
      switch(topic) {
        case 'scan':
          await this.writeLine('Usage: scan [ip_address]', 'output-secondary');
          await this.writeLine('Scans open socket ports on target network servers, returning vulnerabilities status.', 'output-dim');
          break;
        case 'decrypt':
          await this.writeLine('Usage: decrypt [hash]', 'output-secondary');
          await this.writeLine('Invokes dynamic waterfall decryption script to reveal binary hashes keys.', 'output-dim');
          break;
        case 'ddos':
          await this.writeLine('Usage: ddos [ip_address]', 'output-secondary');
          await this.writeLine('Pings target buffer registers in parallel, spiking channels in the visual oscilloscope.', 'output-dim');
          break;
        case 'bypass':
          await this.writeLine('Usage: bypass', 'output-secondary');
          await this.writeLine('Bypasses firewalls of active objective target servers by engaging minigames decryption panels.', 'output-dim');
          break;
        case 'theme':
          await this.writeLine('Usage: theme [cyan | green | purple | amber | crimson]', 'output-secondary');
          await this.writeLine('Adjusts HUD global accent HSL palettes.', 'output-dim');
          break;
        default:
          await this.writeLine(`No custom manual entry for "${topic}". Type "help" to view general commands catalog.`, 'output-warning');
      }
      return;
    }

    await this.writeLine('AVAILABLE HACKING UTILITIES AND CHANNELS:', 'output-info');
    await this.writeLine('  help                   Display this operational index (type "help [cmd]" for details).', 'output-secondary');
    await this.writeLine('  scan [ip]              Conduct vulnerability scan of target host ports.', 'output-secondary');
    await this.writeLine('  decrypt [hash]         Synthesize key bypass with code waterfall animation.', 'output-secondary');
    await this.writeLine('  ddos [ip]              Launch payload flood stress test, spiking network signals.', 'output-secondary');
    await this.writeLine('  bypass                 Engage cryptographic firewall-breach mini-game.', 'output-secondary');
    await this.writeLine('  nodes                  Trace current active subnet connections list.', 'output-secondary');
    await this.writeLine('  theme [cyan|green...]  Alter visual styling (cyan, green, purple, amber, crimson).', 'output-secondary');
    await this.writeLine('  audio                  Mute/Unmute synthesizers and ambient drone.', 'output-secondary');
    await this.writeLine('  matrix                 Activate fullscreen digital rain canvas screensaver.', 'output-secondary');
    await this.writeLine('  clear                  Wipe console logs and screen buffer.', 'output-secondary');
  }

  /**
   * Command: Theme
   */
  async cmdTheme(args) {
    if (!args[0]) {
      await this.writeLine('USAGE: theme [cyan | green | purple | amber | crimson]', 'output-warning');
      return;
    }
    const themeName = args[0];
    const themeMap = {
      cyan: 190,
      green: 120,
      purple: 280,
      amber: 35,
      crimson: 0
    };

    if (themeMap[themeName] !== undefined) {
      this.onThemeChange(themeMap[themeName], themeName);
      await this.writeLine(`[+] ACCENT SYSTEM REDIRECTED TO HUE ANGLE: ${themeMap[themeName]} (${themeName.toUpperCase()})`, 'output-success');
    } else {
      await this.writeLine(`[-] INCOMPATIBLE COLOUR HUE: "${themeName}". Supported: cyan, green, purple, amber, crimson.`, 'output-error');
    }
  }

  /**
   * Command: Audio
   */
  async cmdAudio() {
    const checkEl = document.getElementById('audio-mute-checkbox');
    const currentlyMuted = checkEl.checked;
    checkEl.checked = !currentlyMuted;
    
    this.audio.setMute(!currentlyMuted);
    await this.writeLine(currentlyMuted ? '[+] AUDIO SYNTHESIS ENGINE REACTIVATED' : '[!] ALL AUDIO SYNTHS DEACTIVATED (MUTED)', currentlyMuted ? 'output-success' : 'output-warning');
  }

  /**
   * Command: Nodes list
   */
  async cmdNodes() {
    await this.writeLine('[*] FETCHING ACTIVE COORDINATE NODES IN REGIONAL NET MAP...', 'output-dim');
    await this.sleep(300);
    await this.writeLine('GATEWAY BRIDGE: 172.16.8.1   [ONLINE] LATENCY: 2ms', 'output-success');
    await this.writeLine('TARGET ALPHA  : 198.51.10.42 [ONLINE] SCAN REQUIRED', 'output-warning');
    await this.writeLine('TARGET BETA   : 198.51.10.73 [ONLINE] FIREWALL LOCKED', 'output-warning');
    await this.writeLine('PROXY ROUTER  : 203.0.113.88 [ONLINE] INBOUND SHIELD ACTIVE', 'output-success');
    await this.writeLine('[!] TIP: CLICK NODES ON THE GLOBAL MAP TO TRIGGER AUTO-RECONNAISSANCE.', 'output-info');
  }

  /**
   * Command: Scan
   */
  async cmdScan(args) {
    const target = args[0] || '198.51.10.42';
    await this.writeLine(`[*] INITIATING SCAN PARSER ON TARGET NODE: ${target}`, 'output-warning');
    await this.sleep(300);

    // Register scan event inside campaign controller
    if (this.campaign) {
      this.campaign.registerScan(target);
    }

    const ports = [21, 22, 80, 443, 3000, 3306, 8080];
    
    for (let i = 0; i < ports.length; i++) {
      this.audio.playChirp();
      await this.sleep(150);
      const isVulnerable = ports[i] === 22 || ports[i] === 3000;
      if (isVulnerable) {
        await this.writeLine(`  -> PORT ${ports[i]} : OPEN (VULNERABLE BIND DETECTED)`, 'output-error');
      } else {
        await this.writeLine(`  -> PORT ${ports[i]} : CLOSED (SECURED)`, 'output-success');
      }
    }

    await this.sleep(100);
    await this.writeLine(`[+] SCAN SUMMARY: Target host ${target} responsive. Vulnerable ports are available. Run "bypass" to hijack.`, 'output-info');
  }

  /**
   * Command: Decrypt Matrix waterfall in terminal
   */
  async cmdDecrypt(args) {
    const target = args[0] || 'HASH_ID_0x7FFA';
    await this.writeLine(`[*] CONNECTING TO ENCRYPTION ENGINE FOR KEY CRYPT: ${target}`, 'output-warning');
    await this.sleep(300);
    await this.writeLine('[*] RUNNING CRYPTOGRAPHIC CORRELATION WATERFALL...', 'output-dim');
    await this.sleep(100);

    this.lock();

    const maxLines = 20;
    for (let line = 0; line < maxLines; line++) {
      let lineText = '    ';
      for (let char = 0; char < 60; char++) {
        lineText += Math.random() > 0.5 ? '1' : '0';
      }
      const paragraph = document.createElement('p');
      paragraph.className = 'font-mono output-success';
      paragraph.textContent = lineText;
      this.output.appendChild(paragraph);
      this.scrollToBottom();
      
      this.audio.playClick();
      await this.sleep(50);
    }

    this.audio.playAccessGranted();
    await this.writeLine(`[+] DECRYPTION SUCCESSFUL. KEY EXTRACTED: 0xDEADBEEF68FF2B11`, 'output-success');
  }

  /**
   * Command: DDoS Stress test
   */
  async cmdDdos(args) {
    const ip = args[0] || '203.0.113.88';
    await this.writeLine(`[!] ENGAGING CONCURRENT DDOS PAYLOAD STREAMERS ON DESTINATION: ${ip}`, 'output-error');
    await this.sleep(300);
    this.lock();

    // Register DDoS event in campaign
    if (this.campaign) {
      this.campaign.registerDdos(ip);
    }

    const maxPings = 20;

    for (let i = 0; i < maxPings; i++) {
      this.onDdosSpike();
      this.audio.playChirp();
      
      const latency = Math.floor(Math.random() * 450) + 50;
      await this.writeLine(`  -> PING FLOOD [${i+1}/${maxPings}]: Send 512 bytes to ${ip}. RTT: ${latency}ms. LOSS: 0.0%`, 'output-warning');
      this.scrollToBottom();
      await this.sleep(80);
    }

    await this.writeLine(`[+] FLOOD FLOATING OVERFLOW SHUTDOWN. Target security threshold compromised.`, 'output-success');
  }

  /**
   * Command: Bypass Mini-Game
   */
  cmdBypass() {
    if (this.onMinigameTrigger) {
      this.onMinigameTrigger();
    }
  }

  /**
   * Command: Cheat Bypass (Easter egg)
   */
  async cmdCheat() {
    await this.writeLine('[!] CHEAT DETECTED! INJECTING OPERATOR OVERRIDE CODES...', 'output-warning');
    await this.sleep(500);
    
    if (this.campaign) {
      this.audio.playAccessGranted();
      // Compromise current stage automatically
      const stage = this.campaign.getCurrentStage();
      if (stage) {
        this.campaign.isDdosSpiked = true; // bypass ddos lock
        this.campaign.registerHackSuccess();
      } else {
        await this.writeLine('[-] CHEAT REJECTED: Campaign is already fully completed.', 'output-error');
      }
    }
  }

  /**
   * Command: Matrix Screensaver Mode
   */
  cmdMatrix() {
    this.matrixActive = true;
    
    this.matrixCanvas = document.createElement('canvas');
    this.matrixCanvas.className = 'matrix-mode';
    this.matrixCanvas.style.display = 'block';
    this.output.parentElement.appendChild(this.matrixCanvas);

    this.resizeMatrixCanvas();
    window.addEventListener('resize', () => this.resizeMatrixCanvas());

    this.matrixCtx = this.matrixCanvas.getContext('2d');
    
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=<>#@&%';
    const fontSize = 14;
    const columns = this.matrixCanvas.width / fontSize;
    const rainDrops = [];

    for (let x = 0; x < columns; x++) {
      rainDrops[x] = 1;
    }

    const draw = () => {
      this.matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      this.matrixCtx.fillRect(0, 0, this.matrixCanvas.width, this.matrixCanvas.height);
      
      const hue = parseInt(document.documentElement.style.getPropertyValue('--primary-hue')) || 190;
      this.matrixCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      this.matrixCtx.font = fontSize + 'px monospace';

      for (let i = 0; i < rainDrops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        this.matrixCtx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
        
        if (rainDrops[i] * fontSize > this.matrixCanvas.height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
    };

    const run = () => {
      draw();
      this.matrixAnimFrame = requestAnimationFrame(run);
    };

    run();

    // Click canvas to close screensaver
    this.matrixCanvas.addEventListener('click', () => {
      this.closeMatrix();
    });
    
    const exitTip = document.createElement('p');
    exitTip.className = 'output-info font-mono';
    exitTip.textContent = '[*] EXIT SCREENSAVER: Click anywhere on the falling-code overlay.';
    this.output.appendChild(exitTip);
    this.scrollToBottom();
  }

  resizeMatrixCanvas() {
    if (!this.matrixCanvas) return;
    this.matrixCanvas.width = this.output.clientWidth;
    this.matrixCanvas.height = this.output.clientHeight;
  }

  closeMatrix() {
    if (!this.matrixActive) return;
    this.matrixActive = false;
    cancelAnimationFrame(this.matrixAnimFrame);
    if (this.matrixCanvas) {
      this.matrixCanvas.remove();
      this.matrixCanvas = null;
    }
    this.input.focus();
  }

  lock() {
    this.isLocked = true;
    this.input.disabled = true;
    this.statusIcon.style.color = '#ef4444';
    this.statusIcon.style.textShadow = '0 0 5px #ef4444';
  }

  unlock() {
    this.isLocked = false;
    this.input.disabled = false;
    this.statusIcon.style.color = '#10b981';
    this.statusIcon.style.textShadow = '0 0 5px #10b981';
    this.input.focus();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight;
  }

  writeLine(text, styleClass = '') {
    return new Promise((resolve) => {
      const p = document.createElement('p');
      if (styleClass) p.className = styleClass;
      this.output.appendChild(p);
      this.scrollToBottom();

      let i = 0;
      if (!text) {
        resolve();
        return;
      }

      const printInterval = setInterval(() => {
        if (i < text.length) {
          p.textContent += text.charAt(i);
          i++;
          if (i % 3 === 0) this.audio.playClick(text.charAt(i-1));
        } else {
          clearInterval(printInterval);
          resolve();
        }
      }, this.typingSpeed);

      this.activeIntervals.push(printInterval);
    });
  }
}
