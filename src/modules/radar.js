import { CyberAudio } from './audio.js';

export class CyberRadar {
  constructor(audioEngine) {
    this.audio = audioEngine;
    
    // Canvas context
    this.canvas = document.getElementById('radar-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Telemetry DOM
    this.lblCompromise = document.getElementById('radar-compromise');
    this.lblFrequency = document.getElementById('radar-frequency');

    // Sweep properties
    this.angle = 0;
    this.sweepSpeed = 0.02;
    this.frequencyValue = 2.44;
    
    // Nodes configuration
    this.nodes = [
      { id: 1, name: 'NYC_GATEWAY', ip: '198.51.10.42', x: 120, y: 90, status: 'VULNERABLE', pulse: 0 },
      { id: 2, name: 'LDN_PROXY', ip: '172.16.8.1', x: 210, y: 75, status: 'SECURED', pulse: 0 },
      { id: 3, name: 'TKO_DATABASE', ip: '203.0.113.88', x: 330, y: 110, status: 'VULNERABLE', pulse: 0 },
      { id: 4, name: 'SYD_MAINBOARD', ip: '192.0.2.14', x: 340, y: 230, status: 'SECURED', pulse: 0 },
      { id: 5, name: 'RIO_TERMINAL', ip: '198.51.10.73', x: 145, y: 200, status: 'VULNERABLE', pulse: 0 },
      { id: 6, name: 'MSW_CORE', ip: '192.0.2.55', x: 260, y: 65, status: 'SECURED', pulse: 0 },
      { id: 7, name: 'CPT_SAT_LINK', ip: '198.51.10.19', x: 235, y: 220, status: 'SECURED', pulse: 0 },
      { id: 8, name: 'NDL_GRID', ip: '203.0.113.104', x: 285, y: 130, status: 'SECURED', pulse: 0 },
    ];

    // Continent vector outlines
    this.continents = [
      // North & South America
      [
        {x: 60, y: 40}, {x: 100, y: 40}, {x: 130, y: 80}, {x: 120, y: 120},
        {x: 150, y: 160}, {x: 155, y: 210}, {x: 135, y: 250}, {x: 120, y: 270},
        {x: 110, y: 230}, {x: 115, y: 180}, {x: 95, y: 130}, {x: 65, y: 110},
        {x: 50, y: 80}
      ],
      // Eurasia & Africa
      [
        {x: 190, y: 50}, {x: 230, y: 40}, {x: 290, y: 35}, {x: 350, y: 55},
        {x: 370, y: 90}, {x: 340, y: 130}, {x: 310, y: 160}, {x: 320, y: 190},
        {x: 290, y: 220}, {x: 265, y: 250}, {x: 245, y: 255}, {x: 235, y: 210},
        {x: 245, y: 160}, {x: 200, y: 140}, {x: 185, y: 95}
      ],
      // Australia
      [
        {x: 320, y: 210}, {x: 350, y: 205}, {x: 360, y: 225}, {x: 330, y: 240}
      ]
    ];

    // Interaction states
    this.hoveredNode = null;
    this.animId = null;
    
    // Callback click
    this.onNodeClick = null;
  }

  start(onNodeClick) {
    this.onNodeClick = onNodeClick;
    this.resize();

    // Event listeners
    this.canvas.addEventListener('mousemove', (e) => this.handleMousemove(e));
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    window.addEventListener('resize', () => this.resize());

    // Loop
    const draw = () => {
      this.render();
      this.angle += this.sweepSpeed;
      if (this.angle >= Math.PI * 2) {
        this.angle = 0;
      }
      this.animId = requestAnimationFrame(draw);
    };

    this.animId = requestAnimationFrame(draw);
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = 250;
  }

  /**
   * Set compromised status on a target node
   */
  compromiseNode(ip) {
    const node = this.nodes.find(n => n.ip === ip);
    if (node) {
      node.status = 'COMPROMISED';
      this.audio.playAccessGranted();
      this.updateCompromiseRatio();
    }
  }

  updateCompromiseRatio() {
    const compromised = this.nodes.filter(n => n.status === 'COMPROMISED').length;
    this.lblCompromise.textContent = `${compromised} / ${this.nodes.length} Nodes`;
    
    // Update ratio badge in HUD
    const ratioVal = ((compromised / this.nodes.length) * 100).toFixed(2);
    document.getElementById('ratio-badge').textContent = `${ratioVal}%`;

    // Threat level based on compromise ratio
    const threatBadge = document.getElementById('threat-badge');
    if (compromised === 0) {
      threatBadge.textContent = 'LOW';
      threatBadge.className = 'val yellow-text';
    } else if (compromised < 4) {
      threatBadge.textContent = 'MEDIUM';
      threatBadge.className = 'val orange-text';
      threatBadge.style.color = '#f97316';
    } else {
      threatBadge.textContent = 'CRITICAL';
      threatBadge.className = 'val red-text blink';
    }
  }

  handleMousemove(e) {
    const rect = this.canvas.getBoundingClientRect();
    // Translate client coords to canvas coordinates scale
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    let found = null;
    for (const node of this.nodes) {
      const dist = Math.hypot(node.x - mouseX, node.y - mouseY);
      if (dist < 10) {
        found = node;
        break;
      }
    }
    
    this.hoveredNode = found;
    this.canvas.style.cursor = found ? 'pointer' : 'default';
  }

  handleCanvasClick(e) {
    if (this.hoveredNode && this.onNodeClick) {
      this.audio.playClick();
      this.onNodeClick(this.hoveredNode);
    }
  }

  render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const maxRadius = Math.min(w, h) * 0.95;

    // Clear with trailing grid decay
    this.ctx.fillStyle = 'rgba(4, 2, 8, 0.2)';
    this.ctx.fillRect(0, 0, w, h);

    // HSL variables
    const hue = parseInt(document.documentElement.style.getPropertyValue('--primary-hue')) || 190;
    
    // Draw geographical continental vector outlines
    this.ctx.strokeStyle = `hsla(${hue}, 80%, 20%, 0.45)`;
    this.ctx.lineWidth = 1.2;
    
    this.continents.forEach(poly => {
      this.ctx.beginPath();
      poly.forEach((pt, i) => {
        if (i === 0) this.ctx.moveTo(pt.x, pt.y);
        else this.ctx.lineTo(pt.x, pt.y);
      });
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.fillStyle = `hsla(${hue}, 80%, 12%, 0.05)`;
      this.ctx.fill();
    });

    // Draw concentric radar lines
    this.ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.08)`;
    this.ctx.lineWidth = 1;
    for (let r = 30; r < maxRadius; r += 40) {
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Radar crosshairs
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - maxRadius, centerY);
    this.ctx.lineTo(centerX + maxRadius, centerY);
    this.ctx.moveTo(centerX, centerY - maxRadius);
    this.ctx.lineTo(centerX, centerY + maxRadius);
    this.ctx.stroke();

    // ----------------------------------------------------
    // Draw Sonar Sweep line
    // ----------------------------------------------------
    const endX = centerX + Math.cos(this.angle) * maxRadius;
    const endY = centerY + Math.sin(this.angle) * maxRadius;

    // Gradient trail for sweeping radar
    const radarGrad = this.ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, maxRadius);
    radarGrad.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.2)`);
    radarGrad.addColorStop(1, 'transparent');
    
    this.ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    // Dynamic radar sweeping sonar blip check
    this.nodes.forEach(node => {
      // Angle between node and center
      let nodeAngle = Math.atan2(node.y - centerY, node.x - centerX);
      if (nodeAngle < 0) nodeAngle += Math.PI * 2;

      // Distance from sweep angle
      const angleDiff = Math.abs(this.angle - nodeAngle);
      
      // If sweep lines up with node, trigger sonar blip highlight
      if (angleDiff < 0.03) {
        node.pulse = 1.0;
        this.audio.playSonar();
        // Dynamic sweep frequency display
        this.frequencyValue = parseFloat((2.4 + Math.random() * 0.2).toFixed(2));
        this.lblFrequency.textContent = `${this.frequencyValue} GHz`;
      }

      // Draw node circle points
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      
      // Set coloring by threat status
      let color = `hsl(${hue}, 100%, 50%)`; // Default cyan
      if (node.status === 'VULNERABLE') color = '#f59e0b'; // Amber
      if (node.status === 'COMPROMISED') color = '#10b981'; // Green
      
      this.ctx.fillStyle = color;
      this.ctx.fill();

      // Pulsing sweeping ring
      if (node.pulse > 0.05) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, 4 + (1.0 - node.pulse) * 16, 0, Math.PI * 2);
        this.ctx.stroke();
        node.pulse *= 0.93; // decay pulse
      }

      // Draw tooltip labels
      if (node.status === 'COMPROMISED') {
        this.ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
        this.ctx.fillRect(node.x - 22, node.y - 12, 44, 6);
      }
    });

    // Tooltip overlay for hovered node
    if (this.hoveredNode) {
      const node = this.hoveredNode;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 1.2;
      this.ctx.stroke();

      // Popup visual HUD info box
      this.ctx.fillStyle = 'rgba(10, 5, 20, 0.9)';
      this.ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      this.ctx.lineWidth = 1;
      
      // Coordinate hover tooltip positioning
      let tipX = node.x + 12;
      let tipY = node.y - 30;
      if (tipX + 110 > w) tipX = node.x - 122;
      
      this.ctx.fillRect(tipX, tipY, 110, 42);
      this.ctx.strokeRect(tipX, tipY, 110, 42);

      this.ctx.font = 'bold 8px monospace';
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText(node.name, tipX + 6, tipY + 12);
      this.ctx.font = '8px monospace';
      this.ctx.fillStyle = varColor(node.status);
      this.ctx.fillText(`IP: ${node.ip}`, tipX + 6, tipY + 24);
      this.ctx.fillText(`STATUS: ${node.status}`, tipX + 6, tipY + 34);
    }

    function varColor(status) {
      if (status === 'SECURED') return '#00d9ff';
      if (status === 'VULNERABLE') return '#f59e0b';
      return '#10b981';
    }
  }
}
