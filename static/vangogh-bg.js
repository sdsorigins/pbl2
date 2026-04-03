class VanGoghBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        this.palette = {
            prussianBlue: '#0d2040',
            cobalt: '#1a3a6b',
            skyBlue: '#3d7abf',
            warmBlack: '#0a0f1e',
            gold: '#c8840a',
            wheat: '#e8c97a'
        };
        
        this.strokes = [];
        this.stars = [];
        this.flowField = [];
        this.time = 0;
        this.gridSize = 30;
        
        this.initFlowField();
        this.initStrokes();
        this.initStars();
        
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.initFlowField();
    }
    
    initFlowField() {
        this.flowField = [];
        const cols = Math.ceil(this.canvas.width / this.gridSize);
        const rows = Math.ceil(this.canvas.height / this.gridSize);
        
        this.vortexCenters = [
            { x: this.canvas.width * 0.75, y: this.canvas.height * 0.25, strength: 3 },
            { x: this.canvas.width * 0.25, y: this.canvas.height * 0.35, strength: 2.5 },
            { x: this.canvas.width * 0.5, y: this.canvas.height * 0.15, strength: 2 }
        ];
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const px = x * this.gridSize;
                const py = y * this.gridSize;
                
                let angle = Math.cos(x * 0.05) * Math.sin(y * 0.05) * Math.PI * 2;
                
                this.vortexCenters.forEach(vortex => {
                    const dx = px - vortex.x;
                    const dy = py - vortex.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const influence = Math.exp(-dist / 200) * vortex.strength;
                    angle += Math.atan2(dy, dx) + Math.PI / 2 * influence;
                });
                
                this.flowField.push({ x: px, y: py, angle });
            }
        }
    }

    initStrokes() {
        this.strokes = [];
        for (let i = 0; i < 1500; i++) {
            this.strokes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                length: 20 + Math.random() * 25,
                width: 1.8 + Math.random() * 2,
                speed: 0.4 + Math.random() * 0.6,
                opacity: 0.4 + Math.random() * 0.5,
                colorIndex: Math.floor(Math.random() * 4),
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    initStars() {
        this.stars = [];
        for (let i = 0; i < 20; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.65,
                baseRadius: 10 + Math.random() * 15,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    getFlowAngle(x, y) {
        const col = Math.floor(x / this.gridSize);
        const row = Math.floor(y / this.gridSize);
        const cols = Math.ceil(this.canvas.width / this.gridSize);
        const index = row * cols + col;
        
        if (index >= 0 && index < this.flowField.length) {
            return this.flowField[index].angle + Math.sin(this.time * 0.001) * 0.5;
        }
        return 0;
    }

    drawStroke(stroke) {
        const angle = this.getFlowAngle(stroke.x, stroke.y);
        const colors = [this.palette.prussianBlue, this.palette.cobalt, this.palette.skyBlue, this.palette.warmBlack];
        
        this.ctx.save();
        this.ctx.globalAlpha = stroke.opacity * (0.8 + Math.sin(this.time * 0.002 + stroke.phase) * 0.2);
        this.ctx.strokeStyle = colors[stroke.colorIndex];
        this.ctx.lineWidth = stroke.width;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(stroke.x, stroke.y);
        this.ctx.lineTo(
            stroke.x + Math.cos(angle) * stroke.length,
            stroke.y + Math.sin(angle) * stroke.length
        );
        this.ctx.stroke();
        this.ctx.restore();
        
        stroke.x += Math.cos(angle) * stroke.speed;
        stroke.y += Math.sin(angle) * stroke.speed;
        
        if (stroke.x < -50 || stroke.x > this.canvas.width + 50 || 
            stroke.y < -50 || stroke.y > this.canvas.height + 50) {
            stroke.x = Math.random() * this.canvas.width;
            stroke.y = Math.random() * this.canvas.height;
        }
    }
    
    drawStar(star) {
        const pulse = Math.sin(this.time * 0.001 * star.speed + star.phase);
        const radius = star.baseRadius + pulse * 5;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.8 + pulse * 0.2;
        
        const gradient = this.ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, radius * 2.5);
        gradient.addColorStop(0, 'rgba(255,220,100,1)');
        gradient.addColorStop(0.3, 'rgba(232,180,60,0.8)');
        gradient.addColorStop(0.6, 'rgba(200,132,10,0.4)');
        gradient.addColorStop(1, 'rgba(200,132,10,0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, radius * 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fff8e0';
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + this.time * 0.0005;
            const rayLength = radius * (1.5 + Math.sin(this.time * 0.002 + i) * 0.5);
            
            this.ctx.globalAlpha = 0.3 + pulse * 0.2;
            this.ctx.strokeStyle = 'rgba(232,180,60,0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(star.x, star.y);
            this.ctx.lineTo(
                star.x + Math.cos(angle) * rayLength,
                star.y + Math.sin(angle) * rayLength
            );
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    animate() {
        try {
            this.time++;
            
            const breathe = 0.65 + Math.sin(this.time * 0.0005) * 0.35;
            this.ctx.globalAlpha = 0.06;
            this.ctx.fillStyle = this.palette.warmBlack;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.globalAlpha = breathe;
            
            this.vortexCenters.forEach(vortex => {
                const vortexPulse = Math.sin(this.time * 0.0008) * 0.5 + 0.5;
                const gradient = this.ctx.createRadialGradient(
                    vortex.x, vortex.y, 0,
                    vortex.x, vortex.y, 150 * vortex.strength
                );
                gradient.addColorStop(0, `rgba(61, 122, 191, ${0.15 * vortexPulse})`);
                gradient.addColorStop(0.5, `rgba(26, 58, 107, ${0.08 * vortexPulse})`);
                gradient.addColorStop(1, 'rgba(13, 32, 64, 0)');
                
                this.ctx.globalAlpha = 0.6;
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(vortex.x, vortex.y, 150 * vortex.strength, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            this.ctx.globalAlpha = breathe;
            
            if (this.strokes && this.strokes.length > 0) {
                this.strokes.forEach(stroke => this.drawStroke(stroke));
            }
            
            if (this.stars && this.stars.length > 0) {
                this.stars.forEach(star => this.drawStar(star));
            }
            
            requestAnimationFrame(() => this.animate());
        } catch (error) {
            console.error('VanGogh canvas error:', error);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VanGoghBackground;
}
