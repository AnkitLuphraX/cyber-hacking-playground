export class CyberBackground {
  constructor() {
    this.canvas = document.getElementById('bg-particles-canvas');
    if (!this.canvas) {
      // Create element dynamically if not present
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'bg-particles-canvas';
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.zIndex = '-3'; // beneath grid
      this.canvas.style.pointerEvents = 'none';
      document.body.prepend(this.canvas);
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = 75;
    this.connectionDist = 110;
    this.animId = null;
    
    // Mouse tracking
    this.mouse = { x: null, y: null, radius: 150 };
  }

  start() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => this.handleMousemove(e));
    window.addEventListener('mouseout', () => this.handleMouseout());

    // Generate particles
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1
      });
    }

    const loop = () => {
      this.update();
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  handleMousemove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  handleMouseout() {
    this.mouse.x = null;
    this.mouse.y = null;
  }

  update() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.particles.forEach(p => {
      // Drift movement
      p.x += p.vx;
      p.y += p.vy;

      // Bounce borders
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      // Mouse interactive attraction/repulsion (subtle gravity pulling toward cursor)
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < this.mouse.radius) {
          // Slowly pull particles toward mouse cursor
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.x += (dx / dist) * force * 0.2;
          p.y += (dy / dist) * force * 0.2;
        }
      }
    });
  }

  render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    this.ctx.clearRect(0, 0, w, h);

    // Read HSL hue value
    const hue = parseInt(document.documentElement.style.getPropertyValue('--primary-hue')) || 190;
    
    // 1. Draw connections
    this.ctx.lineWidth = 0.8;
    for (let i = 0; i < this.particles.length; i++) {
      const pi = this.particles[i];
      
      for (let j = i + 1; j < this.particles.length; j++) {
        const pj = this.particles[j];
        
        const dx = pi.x - pj.x;
        const dy = pi.y - pj.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.connectionDist) {
          const alpha = (1.0 - dist / this.connectionDist) * 0.15;
          this.ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
          this.ctx.beginPath();
          this.ctx.moveTo(pi.x, pi.y);
          this.ctx.lineTo(pj.x, pj.y);
          this.ctx.stroke();
        }
      }

      // Draw mouse line links
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = pi.x - this.mouse.x;
        const dy = pi.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.mouse.radius) {
          const alpha = (1.0 - dist / this.mouse.radius) * 0.25;
          this.ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
          this.ctx.beginPath();
          this.ctx.moveTo(pi.x, pi.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.stroke();
        }
      }
    }

    // 2. Draw particle dots
    this.ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.45)`;
    this.particles.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}
