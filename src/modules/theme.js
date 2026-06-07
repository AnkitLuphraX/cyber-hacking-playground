import { CyberAudio } from './audio.js';

export class CyberThemeController {
  constructor(audioEngine) {
    this.audio = audioEngine;
    
    // Drawer elements
    this.drawer = document.getElementById('customizer-drawer');
    this.btnOpen = document.getElementById('btn-toggle-customizer');
    this.btnClose = document.getElementById('btn-close-customizer');
    
    // Customizer controls
    this.hueSlider = document.getElementById('accent-hue-slider');
    this.lblHue = document.getElementById('lbl-hue-val');
    
    this.scanlineSlider = document.getElementById('scanline-opacity');
    this.lblScanline = document.getElementById('lbl-scanline-val');
    
    this.flickerSlider = document.getElementById('flicker-rate');
    this.lblFlicker = document.getElementById('lbl-flicker-val');
    
    this.blurSlider = document.getElementById('glass-blur-slider');
    this.lblBlur = document.getElementById('lbl-blur-val');
    
    this.glowSlider = document.getElementById('glow-radius');
    this.lblGlow = document.getElementById('lbl-glow-val');

    this.muteCheckbox = document.getElementById('audio-mute-checkbox');
    
    this.droneVolumeSlider = document.getElementById('drone-volume');
    this.lblDroneVol = document.getElementById('lbl-drone-vol-val');
    
    this.clicksVolumeSlider = document.getElementById('clicks-volume');
    this.lblClicksVol = document.getElementById('lbl-clicks-vol-val');
    
    this.btnReset = document.getElementById('btn-reset-config');
    this.themeButtons = document.querySelectorAll('.theme-btn');
  }

  init() {
    // Drawer open/close listeners
    this.btnOpen.addEventListener('click', () => this.openDrawer());
    this.btnClose.addEventListener('click', () => this.closeDrawer());
    
    // Close drawer when clicking outside it
    document.addEventListener('mousedown', (e) => {
      if (this.drawer.classList.contains('open') && 
          !this.drawer.contains(e.target) && 
          !this.btnOpen.contains(e.target)) {
        this.closeDrawer();
      }
    });

    // Theme selector buttons
    this.themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const hue = btn.dataset.hue;
        this.updateHue(hue);
        this.themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.audio.playClick();
      });
    });

    // Color hue slider
    this.hueSlider.addEventListener('input', (e) => {
      this.updateHue(e.target.value);
      // Remove active states on color grid
      this.themeButtons.forEach(b => b.classList.remove('active'));
    });

    // Scanline opacity
    this.scanlineSlider.addEventListener('input', (e) => {
      this.updateScanline(e.target.value);
    });

    // Flicker rate
    this.flickerSlider.addEventListener('input', (e) => {
      this.updateFlicker(e.target.value);
    });

    // Glass blur
    this.blurSlider.addEventListener('input', (e) => {
      this.updateBlur(e.target.value);
    });

    // Glow bloom radius
    this.glowSlider.addEventListener('input', (e) => {
      this.updateGlow(e.target.value);
    });

    // Audio Mute toggler
    this.muteCheckbox.addEventListener('change', (e) => {
      this.audio.setMute(e.target.checked);
      this.audio.playClick();
    });

    // Drone volume
    this.droneVolumeSlider.addEventListener('input', (e) => {
      const vol = e.target.value / 100;
      this.audio.setDroneVolume(vol);
      this.lblDroneVol.textContent = `${e.target.value}%`;
    });

    // Click volume
    this.clicksVolumeSlider.addEventListener('input', (e) => {
      const vol = e.target.value / 100;
      this.audio.setClicksVolume(vol);
      this.lblClicksVol.textContent = `${e.target.value}%`;
    });

    // Reset default styling
    this.btnReset.addEventListener('click', () => {
      this.resetToDefaults();
      this.audio.playClick();
    });

    // Load initial flicker class state
    this.updateFlicker(this.flickerSlider.value);
  }

  openDrawer() {
    this.drawer.classList.add('open');
    this.drawer.setAttribute('aria-hidden', 'false');
    this.audio.init(); // Initialize Web Audio Context on first interaction
    this.audio.playClick();
  }

  closeDrawer() {
    this.drawer.classList.remove('open');
    this.drawer.setAttribute('aria-hidden', 'true');
    this.audio.playClick();
  }

  updateHue(value) {
    document.documentElement.style.setProperty('--primary-hue', value);
    this.hueSlider.value = value;
    this.lblHue.textContent = `${value}deg`;
  }

  updateScanline(value) {
    const opacity = value / 100;
    document.documentElement.style.setProperty('--scanline-opacity', opacity);
    this.lblScanline.textContent = `${value}%`;
  }

  updateFlicker(value) {
    const opacity = (value / 100) * 0.15; // Cap flicker intensity
    document.documentElement.style.setProperty('--flicker-opacity', opacity);
    this.lblFlicker.textContent = `${value}%`;

    if (value > 0) {
      document.body.classList.add('flickering');
    } else {
      document.body.classList.remove('flickering');
    }
  }

  updateBlur(value) {
    document.documentElement.style.setProperty('--glass-blur', `${value}px`);
    this.lblBlur.textContent = `${value}px`;
  }

  updateGlow(value) {
    document.documentElement.style.setProperty('--glow-radius', `${value}px`);
    this.lblGlow.textContent = `${value}px`;
  }

  resetToDefaults() {
    // Standard Config defaults
    this.updateHue(190);
    this.updateScanline(35);
    this.updateFlicker(40);
    this.updateBlur(16);
    this.updateGlow(10);
    
    this.muteCheckbox.checked = false;
    this.audio.setMute(false);

    this.audio.setDroneVolume(0.3);
    this.droneVolumeSlider.value = 30;
    this.lblDroneVol.textContent = '30%';

    this.audio.setClicksVolume(0.5);
    this.clicksVolumeSlider.value = 50;
    this.lblClicksVol.textContent = '50%';

    // Active cyan button
    this.themeButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.theme === 'cyan') btn.classList.add('active');
    });
  }
}
