export class CyberCampaignController {
  constructor(terminalInstance, radarInstance) {
    this.terminal = terminalInstance;
    this.radar = radarInstance;
    
    // Campaign stages definition
    this.stages = [
      {
        id: 0,
        name: 'NYC GATEWAY BREACH',
        targetIp: '198.51.10.42',
        targetName: 'NYC_GATEWAY',
        objective: 'ScanNYC',
        description: 'Locate open port on NYC_GATEWAY node and bypass firewall.',
        statusText: 'SCAN TERMINAL Node: 198.51.10.42',
        minigameType: 'hex' // Card matching game
      },
      {
        id: 1,
        name: 'TOKYO CORE DATABASE INTRUSION',
        targetIp: '203.0.113.88',
        targetName: 'TKO_DATABASE',
        objective: 'ScanTokyo',
        description: 'Breach the central file registry of TKO_DATABASE. Exploit Port 3000.',
        statusText: 'SCAN DATABASE Node: 203.0.113.88',
        minigameType: 'word' // Fallout word decrypter
      },
      {
        id: 2,
        name: 'CAPE TOWN SATELLITE HIJACK',
        targetIp: '198.51.10.19',
        targetName: 'CPT_SAT_LINK',
        objective: 'DdosCapetown',
        description: 'Saturate CPT_SAT_LINK firewall with DDoS flood, then breach key code.',
        statusText: 'DDOS Node: 198.51.10.19 to overload buffers',
        minigameType: 'hex_fast' // Card matching with only 15 seconds!
      }
    ];

    // Current State
    this.currentStageIdx = 0;
    this.isDdosSpiked = false;
    this.isCompleted = false;

    // UI elements
    this.objectiveBox = null;
  }

  init() {
    // Dynamically inject a Campaign Objectives Box above the terminal card
    const leftPanel = document.getElementById('panel-terminal');
    if (leftPanel) {
      this.objectiveBox = document.createElement('div');
      this.objectiveBox.className = 'glass-card campaign-objective-card';
      this.objectiveBox.style.marginBottom = '16px';
      this.objectiveBox.style.padding = '12px 16px';
      this.objectiveBox.style.display = 'flex';
      this.objectiveBox.style.justifyContent = 'space-between';
      this.objectiveBox.style.alignItems = 'center';
      
      leftPanel.insertBefore(this.objectiveBox, leftPanel.firstChild);
    }

    // Load from local storage
    const saved = localStorage.getItem('cyber_hacker_campaign_state_v2');
    if (saved) {
      const state = JSON.parse(saved);
      this.currentStageIdx = state.currentStageIdx;
      this.isCompleted = state.isCompleted;
      
      // Update nodes compromised state on the radar
      state.compromisedIps.forEach(ip => {
        this.radar.compromiseNode(ip);
      });
    }

    this.updateObjectiveUI();
  }

  getCurrentStage() {
    if (this.isCompleted) return null;
    return this.stages[this.currentStageIdx];
  }

  /**
   * Called when the user completes a task or scan
   */
  registerScan(ip) {
    const stage = this.getCurrentStage();
    if (!stage) return;
    
    if (ip === stage.targetIp) {
      this.terminal.writeLine(`[+] CAMPAIGN UPDATE: Target confirmed. Objectives updated.`, 'output-success');
      this.terminal.writeLine(`[!] INSTRUCTION: Run 'bypass' to initiate the decryption bypass payload.`, 'output-warning');
    }
  }

  registerDdos(ip) {
    const stage = this.getCurrentStage();
    if (!stage) return;

    if (stage.id === 2 && ip === stage.targetIp) {
      this.isDdosSpiked = true;
      this.terminal.writeLine(`[+] SATELLITE FIREWALL OVERLOADED! SECURITY BUFFERS WIPED FOR 15 SECONDS.`, 'output-success');
      this.terminal.writeLine(`[!] RUN 'bypass' IMMEDIATELY BEFORE ALARMS RESET!`, 'output-error');
      
      // Reset DDoS buffer after 15 seconds
      setTimeout(() => {
        if (this.isDdosSpiked && !this.isCompleted) {
          this.isDdosSpiked = false;
          this.terminal.writeLine(`[-] WARNING: Satellite buffer reset. DDoS flood required again.`, 'output-error');
        }
      }, 15000);
    }
  }

  /**
   * Called on successful minigame hack
   */
  registerHackSuccess() {
    const stage = this.getCurrentStage();
    if (!stage) return;

    // Check if DDoS stage conditions are met
    if (stage.id === 2 && !this.isDdosSpiked) {
      this.terminal.writeLine('[-] ATTACK REJECTED: Target satellite buffers are still operational. Perform a DDoS flood first!', 'output-error');
      return false;
    }

    // Compromise node
    this.radar.compromiseNode(stage.targetIp);
    this.terminal.writeLine(`[+] STAGE MET: ${stage.name} COMPLETE!`, 'output-success');

    // Move to next stage
    this.currentStageIdx++;
    if (this.currentStageIdx >= this.stages.length) {
      this.isCompleted = true;
      this.triggerGameCompleted();
    } else {
      this.terminal.writeLine(`[*] NEXT PHASE ASSIGNED: ${this.stages[this.currentStageIdx].name}`, 'output-info');
    }

    this.saveState();
    this.updateObjectiveUI();
    return true;
  }

  triggerGameCompleted() {
    this.terminal.writeLine('====================================================', 'output-success');
    this.terminal.writeLine('   [!!!] SYSTEM CONQUEST ACHIEVED - ALL NODES BREACHED [!!!]', 'output-success');
    this.terminal.writeLine('====================================================', 'output-success');
    this.terminal.writeLine('[+] Global satellite array hijacked.', 'output-info');
    this.terminal.writeLine('[+] Access nodes fully synchronized under operator control.', 'output-info');
    this.terminal.writeLine('[+] Decryption logs logged to network registry.', 'output-info');
    this.terminal.writeLine('CONGRATULATIONS OPERATOR. THE WORLD IS YOUR PLAYGROUND.', 'output-success blink');
    this.terminal.writeLine('====================================================', 'output-success');
    
    // Trigger alarm state to locked success
    const badgeStatus = document.getElementById('net-status-badge');
    badgeStatus.textContent = 'SYSTEM_OWNED';
    badgeStatus.className = 'val green-text blink';
  }

  updateObjectiveUI() {
    if (!this.objectiveBox) return;

    // Update style rules for objectives
    if (this.isCompleted) {
      this.objectiveBox.innerHTML = `
        <div>
          <span style="font-weight: 800; font-size: 0.8rem; color: #10b981;">CAMPAIGN COMPLETE</span>
          <p style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 4px;">All regional gateway nodes have been hijacked successfully.</p>
        </div>
        <button class="btn btn-hud" id="btn-reset-campaign-progress">RESET PLAYGROUND</button>
      `;
    } else {
      const stage = this.stages[this.currentStageIdx];
      this.objectiveBox.innerHTML = `
        <div>
          <span style="font-weight: 800; font-size: 0.8rem; color: var(--accent-color);">MISSION OBJECTIVE // STAGE ${stage.id + 1}</span>
          <h4 style="font-size: 0.85rem; font-weight: 700; margin-top: 2px;">${stage.name}</h4>
          <p style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px;">${stage.description} (${stage.statusText})</p>
        </div>
        <div style="font-family: var(--font-terminal); font-size: 0.75rem; color: var(--text-muted); text-align: right;">
          TYPE: <span class="accent-text">${stage.minigameType.toUpperCase()}</span>
        </div>
      `;
    }

    // Bind reset button if completed
    const btnReset = document.getElementById('btn-reset-campaign-progress');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        localStorage.removeItem('cyber_hacker_campaign_state_v2');
        location.reload();
      });
    }
  }

  saveState() {
    const compromisedIps = this.radar.nodes
      .filter(n => n.status === 'COMPROMISED')
      .map(n => n.ip);

    const state = {
      currentStageIdx: this.currentStageIdx,
      isCompleted: this.isCompleted,
      compromisedIps
    };

    localStorage.setItem('cyber_hacker_campaign_state_v2', JSON.stringify(state));
  }
}
