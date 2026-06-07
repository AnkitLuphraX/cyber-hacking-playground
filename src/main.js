/* Copyright (c) 2026 Ankit LuphraX (AnkitLuphraX) - All Rights Reserved */
import './style.css';
import { CyberAudio } from './modules/audio.js';
import { CyberTerminal } from './modules/terminal.js';
import { CyberOscilloscope } from './modules/oscilloscope.js';
import { CyberRadar } from './modules/radar.js';
import { CyberMinigame } from './modules/minigame.js';
import { CyberThemeController } from './modules/theme.js';
import { CyberBackground } from './modules/background.js';
import { CyberCampaignController } from './modules/campaign.js';

// Setup DOM elements
const clockEl = document.getElementById('hud-clock');
const badgeStatus = document.getElementById('net-status-badge');

// Global Instances
let terminal, oscilloscope, radar, minigame, theme, background, campaign;

/**
 * Initialize all modules
 */
function init() {
  // 1. Initialize interactive background particle layer
  background = new CyberBackground();
  background.start();

  // 2. Initialize core modules
  terminal = new CyberTerminal(CyberAudio);
  oscilloscope = new CyberOscilloscope(CyberAudio);
  radar = new CyberRadar(CyberAudio);
  minigame = new CyberMinigame(CyberAudio);
  theme = new CyberThemeController(CyberAudio);

  // 3. Initialize Campaign controller
  campaign = new CyberCampaignController(terminal, radar);
  campaign.init();

  // 4. Initialize clock
  startClock();

  // 5. Initialize styling config drawer
  theme.init();

  // 6. Initialize terminal shell callbacks
  terminal.init(
    // onMinigameTrigger (starts whichever game mode the active stage needs)
    () => {
      const stage = campaign.getCurrentStage();
      if (stage) {
        // DDoS checking penalty
        if (stage.id === 2 && !campaign.isDdosSpiked) {
          terminal.writeLine('[-] BYPASS BLOCKED: Target satellite buffer registers are active. Perform a DDoS flood sweep first!', 'output-error');
          return;
        }
        minigame.startGame(stage.minigameType);
      } else {
        // Fallback or generic hex game
        minigame.startGame('hex');
      }
    },
    // onThemeChange
    (hue, name) => theme.updateHue(hue),
    // onDdosSpike (spikes oscilloscope)
    () => oscilloscope.triggerDdosSpike(),
    // campaign reference
    campaign
  );

  // 7. Initialize radar map clicks
  radar.start((node) => {
    if (!terminal.isLocked) {
      terminal.executeCommand(`scan ${node.ip}`);
    }
  });

  // 8. Initialize oscilloscope lines
  oscilloscope.start();

  // 9. Initialize minigame solver events
  minigame.init(
    // onSuccess
    () => {
      terminal.writeLine('[+] FIREWALL DECRYPTION COMPLETED!', 'output-success');

      // Advance campaign stage
      const ok = campaign.registerHackSuccess();
      if (!ok) {
        terminal.writeLine('[-] DATA INJECTION HANDSHAKE REJECTED BY HOST.', 'output-error');
      }
      terminal.writeLine('----------------------------------------------------', 'output-dim');
    },
    // onFailure / Aborted
    (isAborted) => {
      // If DDoS stage failed, reset the DDoS overload spike
      const stage = campaign.getCurrentStage();
      if (stage && stage.id === 2) {
        campaign.isDdosSpiked = false;
      }

      if (isAborted) {
        terminal.writeLine('[-] BYPASS INTERRUPTED. SYSTEM INTEGRITY PRESERVED.', 'output-error');
      } else {
        terminal.writeLine('[!] FAIL! SECURITY LOCKDOWN TRIGGERED ON TARGET PORT.', 'output-error');
        terminal.writeLine('[!] COGNITIVE RATIO DECREASED. SHIELD TERMINAL LOCKED FOR 4s.', 'output-error');

        terminal.lock();
        badgeStatus.textContent = 'ALARM_LOCK';
        badgeStatus.className = 'val red-text blink';

        setTimeout(() => {
          terminal.unlock();
          badgeStatus.textContent = 'SECURE_TUNNEL';
          badgeStatus.className = 'val green-text';
          terminal.writeLine('[*] SHELL STAGES RELEASED. RE-TRY DECRYPT BYPASS.', 'output-info');
        }, 4000);
      }
      terminal.writeLine('----------------------------------------------------', 'output-dim');
    }
  );

  // 10. Auto-start Audio context on first click/keydown
  const startAudioContext = () => {
    CyberAudio.init();
    window.removeEventListener('click', startAudioContext);
    window.removeEventListener('keydown', startAudioContext);
  };
  window.addEventListener('click', startAudioContext);
  window.addEventListener('keydown', startAudioContext);
}

/**
 * Clock tick helper
 */
function startClock() {
  const pad = (val) => String(val).padStart(2, '0');

  setInterval(() => {
    const d = new Date();
    const hrs = pad(d.getHours());
    const mins = pad(d.getMinutes());
    const secs = pad(d.getSeconds());
    clockEl.textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

// Kick off
window.addEventListener('DOMContentLoaded', init);
