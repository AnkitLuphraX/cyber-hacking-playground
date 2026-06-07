/**
 * Web Audio API Synthesis Engine for Retro Cyber Sounds
 * Generates all mechanical key clicks, alerts, and ambient drones dynamically.
 * Includes procedural loop sequencer.
 */
class CyberAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    
    // Master volume controls (0 to 1)
    this.droneVolumeSetting = 0.3;
    this.clicksVolumeSetting = 0.5;

    // Master Nodes
    this.masterGain = null;
    this.droneGain = null;
    this.analyserNode = null;

    // Active nodes tracking
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneLfo = null;
    this.droneFilter = null;
    this.isDronePlaying = false;

    // Sequencer properties
    this.sequencerInterval = null;
    this.sequencerStep = 0;
  }

  /**
   * Initializes the AudioContext on first user interaction.
   * Browsers restrict audio from starting automatically.
   */
  async init() {
    if (this.ctx) return;
    
    // Create Audio Context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("Web Audio API is not supported in this browser.");
      return;
    }
    
    this.ctx = new AudioContextClass();
    
    // Master Gain Node
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    
    // Analyser Node for the Oscilloscope hook
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 1024;
    
    // Connect master gain -> analyser -> destination
    this.masterGain.connect(this.analyserNode);
    this.analyserNode.connect(this.ctx.destination);

    // Create a sub-gain node for the background drone
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(this.droneVolumeSetting, this.ctx.currentTime);
    this.droneGain.connect(this.masterGain);

    // Auto-start background drone if not muted
    this.startDrone();
  }

  /**
   * Resume audio context if suspended
   */
  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * Toggle mute state
   */
  setMute(isMuted) {
    this.isMuted = isMuted;
    if (!this.ctx) return;
    
    const targetGain = isMuted ? 0 : 0.8;
    this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
  }

  /**
   * Adjust drone volume
   */
  setDroneVolume(vol) {
    this.droneVolumeSetting = Math.max(0, Math.min(1, vol));
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setTargetAtTime(this.droneVolumeSetting, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Adjust clicks volume
   */
  setClicksVolume(vol) {
    this.clicksVolumeSetting = Math.max(0, Math.min(1, vol));
  }

  /**
   * Synthesizes a tactile mechanical keyboard click sound.
   * Leverages highpass noise filter + oscillator click.
   */
  playClick(key = '') {
    if (!this.ctx || this.isMuted || this.clicksVolumeSetting <= 0) return;
    this.resume();

    const now = this.ctx.currentTime;
    
    // Create click master gain
    const clickGain = this.ctx.createGain();
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();

    if (key === 'Enter') {
      // Enter key: Crisp metallic chime ring
      clickGain.gain.setValueAtTime(this.clicksVolumeSetting * 0.22, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.08);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);

      osc.connect(clickGain);
      clickGain.connect(filter);
      filter.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.11);

    } else if (key === ' ' || key === 'Spacebar') {
      // Spacebar key: Low mechanical wood/plastic thud
      clickGain.gain.setValueAtTime(this.clicksVolumeSetting * 0.28, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.04);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);

      osc.connect(clickGain);
      clickGain.connect(filter);
      filter.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.07);

    } else if (key === 'Backspace') {
      // Backspace key: Short mechanical release click
      clickGain.gain.setValueAtTime(this.clicksVolumeSetting * 0.09, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(300, now + 0.03);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(700, now);

      osc.connect(clickGain);
      clickGain.connect(filter);
      filter.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.045);

    } else {
      // Standard key click
      clickGain.gain.setValueAtTime(this.clicksVolumeSetting * 0.12, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.025);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, now);

      osc.connect(clickGain);
      clickGain.connect(filter);
      filter.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.04);
    }
  }

  /**
   * Starts the looping low-frequency ambient spaceship/terminal drone
   */
  startDrone() {
    if (!this.ctx || this.isDronePlaying) return;

    const now = this.ctx.currentTime;

    // Lowpass filter for the drone to make it deep and dark
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(120, now);

    // Osc 1: Deep C1 Note (32.7Hz) sawtooth
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.setValueAtTime(32.70, now);

    // Osc 2: Detuned C1 Note (32.9Hz) sawtooth
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'sawtooth';
    this.droneOsc2.frequency.setValueAtTime(32.95, now);

    // LFO to slowly sweep filter cutoff (0.08Hz sweep rate)
    this.droneLfo = this.ctx.createOscillator();
    this.droneLfo.type = 'sine';
    this.droneLfo.frequency.setValueAtTime(0.08, now);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(45, now); // Modulate filter between 75Hz and 165Hz

    // Connect LFO modulation to filter frequency
    this.droneLfo.connect(lfoGain);
    lfoGain.connect(this.droneFilter.frequency);

    // Connect oscillators to filter -> drone gain
    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);

    // Start nodes
    this.droneOsc1.start(now);
    this.droneOsc2.start(now);
    this.droneLfo.start(now);
    this.isDronePlaying = true;

    // Start procedural synth bassline sequencer
    this.startSequencer();
  }

  /**
   * Stops the ambient drone loops
   */
  stopDrone() {
    if (!this.isDronePlaying) return;
    
    try {
      this.droneOsc1.stop();
      this.droneOsc2.stop();
      this.droneLfo.stop();
    } catch(e) {}

    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneLfo = null;
    this.droneFilter = null;
    this.isDronePlaying = false;

    // Stop sequencer
    this.stopSequencer();
  }

  /**
   * Procedural Audio Sequencer (bassline arpeggios at 110 BPM)
   */
  startSequencer() {
    if (!this.ctx || this.sequencerInterval) return;
    
    const tempo = 110; // BPM
    const noteLength = 60 / tempo / 2; // 8th note duration (~272ms)
    
    // Bass notes: A1 (55.0Hz), A1, C2 (65.4Hz), C2, G1 (49.0Hz), G1, D2 (73.4Hz), E1 (41.2Hz)
    const bassline = [55.0, 55.0, 65.4, 65.4, 49.0, 49.0, 73.42, 41.20];
    
    this.sequencerStep = 0;
    this.sequencerInterval = setInterval(() => {
      if (this.isMuted || this.droneVolumeSetting <= 0 || !this.ctx) return;
      
      const now = this.ctx.currentTime;
      const freq = bassline[this.sequencerStep % bassline.length];
      
      // Synthesize note
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      
      gain.gain.setValueAtTime(this.droneVolumeSetting * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + noteLength * 0.95);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + noteLength);
      
      this.sequencerStep++;
    }, noteLength * 1000);
  }

  stopSequencer() {
    if (this.sequencerInterval) {
      clearInterval(this.sequencerInterval);
      this.sequencerInterval = null;
    }
  }

  /**
   * Sound effect for access granted / successful hack.
   * Plays a pentatonic arpeggio sweep.
   */
  playAccessGranted() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
    const noteDuration = 0.08;

    notes.forEach((freq, idx) => {
      const start = now + (idx * noteDuration);
      
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + 0.35);
    });
  }

  /**
   * Sound effect for access denied / firewalls alerts.
   * Synthesizes a brief siren buzzer.
   */
  playAccessDenied() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    
    osc1.frequency.setValueAtTime(110, now);
    osc2.frequency.setValueAtTime(111.5, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  /**
   * Sound effect for network port scanner.
   * Plays a high-pitched short chirp.
   */
  playChirp() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Network sweeper sonar radar chirp
   */
  playSonar() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.setValueAtTime(1100, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }
}

// Export singleton instance
export const CyberAudio = new CyberAudioEngine();
