export class CyberOscilloscope {
  constructor(audioEngine) {
    this.audio = audioEngine;
    
    // Canvas context
    this.canvas = document.getElementById('oscilloscope-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // DOM Legends
    this.lblCpu = document.getElementById('val-cpu');
    this.lblNet = document.getElementById('val-net');
    this.lblAudio = document.getElementById('val-audio');
    
    // Telemetry values
    this.cpuLoad = 12;
    this.netPackets = 5;
    this.ddosActive = false;
    this.ddosTimer = 0;
    
    // Time tracker
    this.time = 0;
    
    // Animation frame
    this.animFrameId = null;
    
    // Buffer for audio frequency bin array
    this.audioBuffer = null;
  }

  start() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Loop
    const draw = () => {
      this.render();
      this.time += 0.05;
      
      // Decay DDoS spikes
      if (this.ddosActive) {
        this.ddosTimer -= 16.7; // ms per frame
        if (this.ddosTimer <= 0) {
          this.ddosActive = false;
        }
      }

      this.animFrameId = requestAnimationFrame(draw);
    };
    
    this.animFrameId = requestAnimationFrame(draw);
  }

  stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = 180;
  }

  triggerDdosSpike() {
    this.ddosActive = true;
    this.ddosTimer = 2500; // Spike for 2.5 seconds
  }

  render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Clear canvas
    this.ctx.fillStyle = 'rgba(5, 2, 10, 0.2)'; // trail effect
    this.ctx.fillRect(0, 0, w, h);
    
    // Draw horizontal grid lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    this.ctx.lineWidth = 1;
    for (let y = 20; y < h; y += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }
    
    // Draw vertical sweeps
    for (let x = 40; x < w; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }

    // Get dynamic HSL primary accent color for UI integration
    const hue = parseInt(document.documentElement.style.getPropertyValue('--primary-hue')) || 190;
    
    // ----------------------------------------------------
    // Channel 1: CPU LOAD (Cyan Line)
    // ----------------------------------------------------
    // Fluctuates CPU values dynamically
    if (Math.random() > 0.95) {
      this.cpuLoad = Math.floor(Math.random() * 30) + 10;
      if (this.ddosActive) this.cpuLoad += 45; // load rises during flooding
    }
    this.lblCpu.textContent = `${this.cpuLoad}%`;

    this.ctx.beginPath();
    this.ctx.strokeStyle = `hsl(${hue}, 100%, 55%)`; // Cyan Accent
    this.ctx.lineWidth = 1.5;
    
    for (let x = 0; x < w; x++) {
      const scale = this.cpuLoad * 0.4;
      const noise = (Math.sin(x * 0.05 + this.time * 2) * Math.cos(x * 0.01 + this.time)) * scale;
      const y = h / 3 + noise;
      
      if (x === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();

    // ----------------------------------------------------
    // Channel 2: NETWORK PACKETS (Magenta Line)
    // ----------------------------------------------------
    // Trigger network packets spikes
    let basePackets = 5;
    if (this.ddosActive) {
      basePackets = Math.floor(Math.random() * 1200) + 900;
    } else {
      if (Math.random() > 0.9) {
        basePackets = Math.floor(Math.random() * 30) + 5;
      }
    }
    this.netPackets = Math.floor(this.netPackets * 0.9 + basePackets * 0.1);
    this.lblNet.textContent = `${this.netPackets} pkts/s`;

    this.ctx.beginPath();
    this.ctx.strokeStyle = '#ff00ff'; // Magenta
    this.ctx.lineWidth = 1.5;
    
    for (let x = 0; x < w; x++) {
      // Draw sharp pulse packets
      let pulse = 0;
      const tMod = (x - this.time * 120) % w;
      
      if (tMod > 0 && tMod < 15) {
        // exponential spike
        pulse = Math.sin(tMod * (Math.PI / 15)) * (this.netPackets / 15);
      }
      
      // Clamp noise spikes to fit h
      const y = (h * 2) / 3 - Math.min(pulse, h / 3.5);
      
      if (x === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();

    // ----------------------------------------------------
    // Channel 3: AUDIO SPECTRUM (Yellow frequency bars / waves)
    // ----------------------------------------------------
    const analyser = this.audio.analyserNode;
    
    if (analyser && !this.audio.isMuted) {
      this.lblAudio.textContent = 'ACTIVE';
      this.lblAudio.className = 'val green-text';

      // Read audio data buffer
      const bufferLength = analyser.frequencyBinCount;
      if (!this.audioBuffer || this.audioBuffer.length !== bufferLength) {
        this.audioBuffer = new Uint8Array(bufferLength);
      }
      
      // Get time domain data instead of frequencies for a beautiful glowing oscilloscope wave
      analyser.getByteTimeDomainData(this.audioBuffer);

      this.ctx.beginPath();
      this.ctx.strokeStyle = '#ffff00'; // Yellow
      this.ctx.lineWidth = 1.8;
      
      const sliceWidth = w * 1.0 / bufferLength;
      let waveX = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = this.audioBuffer[i] / 128.0; // 0.0 to 2.0
        const waveY = v * (h * 0.85); // position in canvas

        if (i === 0) {
          this.ctx.moveTo(waveX, waveY);
        } else {
          this.ctx.lineTo(waveX, waveY);
        }

        waveX += sliceWidth;
      }
      this.ctx.lineTo(w, h * 0.85);
      this.ctx.stroke();

    } else {
      this.lblAudio.textContent = 'MUTED';
      this.lblAudio.className = 'val';
      
      // Draw static flat channel
      this.ctx.beginPath();
      this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)'; // Low opacity yellow line
      this.ctx.lineWidth = 1;
      this.ctx.moveTo(0, h * 0.85);
      this.ctx.lineTo(w, h * 0.85);
      this.ctx.stroke();
    }
    
    // Render laser scanning sweeping cathode-ray bar
    const barX = (this.time * 120) % w;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.fillRect(barX, 0, 6, h);
    
    this.ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.4)`;
    this.ctx.fillRect(barX + 5, 0, 1, h);
  }
}
