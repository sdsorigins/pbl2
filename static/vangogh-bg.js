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
            wheat: '#e8c97a',
            treeBlack: '#1a1a1a',
            cloudWhite: '#d4e4f7'
        };
        
        this.strokes = [];
        this.stars = [];
        this.clouds = [];
        this.flowField = [];
        this.time = 0;
        this.gridSize = 30;
        
        this.initFlowField();
        this.initStrokes();
        this.initStars();
        this.initClouds();
        
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
        for (let i = 0; i < 800; i++) {
            this.strokes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                length: 20 + Math.random() * 25,
                width: 1.8 + Math.random() * 2,
                speed: 0.4 + Math.random() * 0.6,
                opacity: 0.35 + Math.random() * 0.4,
                colorIndex: Math.floor(Math.random() * 4),
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    initStars() {
        this.stars = [];
        for (let i = 0; i < 12; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.5,
                baseRadius: 12 + Math.random() * 18,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5,
                swirlAngle: Math.random() * Math.PI * 2,
                swirlSpeed: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    initClouds() {
        this.clouds = [];
        for (let i = 0; i < 3; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: 80 + Math.random() * 150,
                width: 120 + Math.random() * 80,
                height: 40 + Math.random() * 30,
                speed: 0.1 + Math.random() * 0.2,
                opacity: 0.15 + Math.random() * 0.15
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
        
        star.swirlAngle += star.swirlSpeed;
        const swirlRadius = radius * 0.8;
        
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
        
        for (let i = 0; i < 6; i++) {
            const angle = star.swirlAngle + (Math.PI * 2 / 6) * i;
            const sx = star.x + Math.cos(angle) * swirlRadius;
            const sy = star.y + Math.sin(angle) * swirlRadius;
            
            this.ctx.globalAlpha = 0.6;
            this.ctx.fillStyle = 'rgba(255,220,100,0.8)';
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, radius * 0.15, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.globalAlpha = 0.3;
            this.ctx.strokeStyle = 'rgba(232,180,60,0.6)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(star.x, star.y);
            this.ctx.lineTo(sx, sy);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = '#fff8e0';
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawCloud(cloud) {
        this.ctx.save();
        this.ctx.globalAlpha = cloud.opacity;
        this.ctx.fillStyle = this.palette.cloudWhite;
        
        const segments = 5;
        for (let i = 0; i < segments; i++) {
            const x = cloud.x + (cloud.width / segments) * i;
            const y = cloud.y + Math.sin(i * 0.8) * 10;
            const r = cloud.height / 2 + Math.sin(i * 1.2) * 8;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, r, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
        
        cloud.x += cloud.speed;
        if (cloud.x > this.canvas.width + cloud.width) {
            cloud.x = -cloud.width;
        }
    }
    
    drawTree() {
        const treeX = this.canvas.width * 0.08;
        const treeY = this.canvas.height * 0.85;
        const treeHeight = this.canvas.height * 0.45;
        
        this.ctx.save();
        this.ctx.fillStyle = this.palette.treeBlack;
        this.ctx.strokeStyle = this.palette.treeBlack;
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(treeX, treeY);
        this.ctx.quadraticCurveTo(treeX - 15, treeY - treeHeight * 0.3, treeX - 8, treeY - treeHeight * 0.6);
        this.ctx.quadraticCurveTo(treeX - 12, treeY - treeHeight * 0.8, treeX, treeY - treeHeight);
        this.ctx.quadraticCurveTo(treeX + 12, treeY - treeHeight * 0.8, treeX + 8, treeY - treeHeight * 0.6);
        this.ctx.quadraticCurveTo(treeX + 15, treeY - treeHeight * 0.3, treeX, treeY);
        this.ctx.fill();
        
        for (let i = 0; i < 8; i++) {
            const branchY = treeY - treeHeight * (0.2 + i * 0.1);
            const branchLength = 20 - i * 2;
            const side = i % 2 === 0 ? -1 : 1;
            
            this.ctx.beginPath();
            this.ctx.moveTo(treeX, branchY);
            this.ctx.lineTo(treeX + side * branchLength, branchY - 15);
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
            
            if (this.clouds && this.clouds.length > 0) {
                this.clouds.forEach(cloud => this.drawCloud(cloud));
            }
            
            if (this.stars && this.stars.length > 0) {
                this.stars.forEach(star => this.drawStar(star));
            }
            
            this.drawTree();
            
            requestAnimationFrame(() => this.animate());
        } catch (error) {
            console.error('VanGogh canvas error:', error);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VanGoghBackground;
}
