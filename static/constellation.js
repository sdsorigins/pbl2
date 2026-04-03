class ConstellationView {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.processes = [];
        this.stars = [];
        this.time = 0;
        this.hoveredStar = null;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.hoveredStar = null);
        
        this.loadMockData();
        this.animate();
    }
    
    loadMockData() {
        const mockProcesses = [
            { name: 'System Idle Process', pid: 0, cpu_percent: 62.8, memory_percent: 0.1 },
            { name: 'svchost.exe', pid: 5432, cpu_percent: 40.4, memory_percent: 12.4 },
            { name: 'msedge.exe', pid: 8765, cpu_percent: 37.2, memory_percent: 15.2 },
            { name: 'Kiro.exe', pid: 3421, cpu_percent: 21.6, memory_percent: 18.9 },
            { name: 'chrome.exe', pid: 9876, cpu_percent: 18.2, memory_percent: 13.1 },
            { name: 'python.exe', pid: 2341, cpu_percent: 12.8, memory_percent: 8.7 },
            { name: 'explorer.exe', pid: 1234, cpu_percent: 8.9, memory_percent: 5.8 },
            { name: 'System', pid: 4, cpu_percent: 4.2, memory_percent: 2.5 }
        ];
        this.updateProcesses(mockProcesses);
    }
    
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 200;
    }
    
    updateProcesses(processes) {
        if (!processes || !Array.isArray(processes)) {
            this.processes = [];
            this.stars = [];
            return;
        }
        
        this.processes = processes;
        this.generateStars();
        this.updateProcessList();
    }
    
    updateProcessList() {
        const listContainer = document.getElementById('processList');
        if (!listContainer) return;
        
        listContainer.innerHTML = this.processes.slice(0, 8).map(proc => {
            const cpu = proc.cpu_percent || 0;
            const color = this.getColorForCPU(cpu);
            const colorStr = `rgb(${color.r}, ${color.g}, ${color.b})`;
            
            return `
                <div style="display: flex; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--card-border); transition: all 0.2s ease;" onmouseover="this.style.background='rgba(200, 132, 10, 0.05)'" onmouseout="this.style.background='transparent'">
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: ${colorStr}; margin-right: 0.75rem; box-shadow: 0 0 12px ${colorStr}, 0 0 4px ${colorStr};"></div>
                    <div style="flex: 1; font-family: 'Crimson Pro', serif; font-style: italic; color: var(--text-primary);">${proc.name}</div>
                    <div style="width: 120px; height: 6px; background: rgba(200, 160, 60, 0.15); margin: 0 1rem; position: relative; border-radius: 3px; overflow: hidden;">
                        <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${Math.min(cpu, 100)}%; background: linear-gradient(90deg, ${colorStr}, ${colorStr}dd); box-shadow: 0 0 8px ${colorStr}; transition: width 0.3s ease;"></div>
                    </div>
                    <div style="font-family: 'Playfair Display', serif; color: var(--vg-wheat); min-width: 70px; text-align: right; font-size: 1rem; font-weight: 600;">${cpu.toFixed(1)}%</div>
                </div>
            `;
        }).join('');
    }
    
    generateStars() {
        this.stars = this.processes.map((proc, index) => {
            const cpu = proc.cpu_percent || 0;
            const mem = proc.memory_percent || 0;
            
            return {
                x: (index / this.processes.length) * this.canvas.width * 0.8 + this.canvas.width * 0.1 + (Math.random() - 0.5) * 50,
                y: this.canvas.height - (cpu / 100) * (this.canvas.height * 0.75) - 25,
                size: 4 + (cpu / 100) * 8,
                brightness: 0.5 + (mem / 100) * 0.5,
                phase: Math.random() * Math.PI * 2,
                cpu: cpu,
                mem: mem,
                name: proc.name || 'Unknown',
                pid: proc.pid || 0,
                color: this.getColorForCPU(cpu)
            };
        });
    }

    getColorForCPU(cpu) {
        if (cpu > 50) return { r: 232, g: 140, b: 40 };
        if (cpu > 20) return { r: 200, g: 180, b: 120 };
        return { r: 160, g: 200, b: 240 };
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.hoveredStar = null;
        for (let star of this.stars) {
            const dist = Math.sqrt((x - star.x) ** 2 + (y - star.y) ** 2);
            if (dist < star.size + 5) {
                this.hoveredStar = star;
                this.canvas.style.cursor = 'pointer';
                return;
            }
        }
        this.canvas.style.cursor = 'default';
    }
    
    drawStar(star) {
        const twinkle = Math.sin(this.time * 0.05 + star.phase) * 0.3 + 0.7;
        const size = star.size * twinkle;
        
        this.ctx.save();
        this.ctx.globalAlpha = star.brightness * twinkle;
        
        // Draw outer glow
        const outerGlow = this.ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, size * 3);
        outerGlow.addColorStop(0, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, 0.4)`);
        outerGlow.addColorStop(0.5, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, 0.2)`);
        outerGlow.addColorStop(1, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, 0)`);
        this.ctx.fillStyle = outerGlow;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, size * 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw star shape
        this.ctx.fillStyle = `rgb(${star.color.r}, ${star.color.g}, ${star.color.b})`;
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const x = star.x + Math.cos(angle) * size;
            const y = star.y + Math.sin(angle) * size;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw inner glow
        const innerGlow = this.ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, size * 1.5);
        innerGlow.addColorStop(0, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, 0.6)`);
        innerGlow.addColorStop(1, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, 0)`);
        this.ctx.fillStyle = innerGlow;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, size * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawConnections() {
        if (this.stars.length < 2) return;
        
        const topStars = [...this.stars]
            .sort((a, b) => b.cpu - a.cpu)
            .slice(0, Math.min(6, this.stars.length));
        
        this.ctx.save();
        this.ctx.setLineDash([4, 4]);
        
        for (let i = 0; i < topStars.length - 1; i++) {
            const gradient = this.ctx.createLinearGradient(
                topStars[i].x, topStars[i].y,
                topStars[i + 1].x, topStars[i + 1].y
            );
            gradient.addColorStop(0, `rgba(${topStars[i].color.r}, ${topStars[i].color.g}, ${topStars[i].color.b}, 0.3)`);
            gradient.addColorStop(1, `rgba(${topStars[i + 1].color.r}, ${topStars[i + 1].color.g}, ${topStars[i + 1].color.b}, 0.3)`);
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(topStars[i].x, topStars[i].y);
            this.ctx.lineTo(topStars[i + 1].x, topStars[i + 1].y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawTooltip() {
        if (!this.hoveredStar) return;
        
        const star = this.hoveredStar;
        const padding = 8;
        const text = [
            star.name,
            `PID: ${star.pid}`,
            `CPU: ${star.cpu.toFixed(1)}%`,
            `MEM: ${star.mem.toFixed(1)}%`
        ];
        
        this.ctx.save();
        this.ctx.font = '12px "Crimson Pro", serif';
        const maxWidth = Math.max(...text.map(t => this.ctx.measureText(t).width));
        const boxWidth = maxWidth + padding * 2;
        const boxHeight = text.length * 16 + padding * 2;
        
        let x = star.x + 15;
        let y = star.y - boxHeight - 10;
        if (x + boxWidth > this.canvas.width) x = star.x - boxWidth - 15;
        if (y < 0) y = star.y + 15;
        
        this.ctx.fillStyle = 'rgba(10, 22, 48, 0.95)';
        this.ctx.strokeStyle = 'rgba(200, 160, 60, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.fillRect(x, y, boxWidth, boxHeight);
        this.ctx.strokeRect(x, y, boxWidth, boxHeight);
        
        this.ctx.fillStyle = '#e8c97a';
        this.ctx.textBaseline = 'top';
        text.forEach((line, i) => {
            this.ctx.fillText(line, x + padding, y + padding + i * 16);
        });
        
        this.ctx.restore();
    }

    animate() {
        try {
            this.time++;
            
            this.ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.drawConnections();
            this.stars.forEach(star => this.drawStar(star));
            this.drawTooltip();
            
            requestAnimationFrame(() => this.animate());
        } catch (error) {
            console.error('Constellation canvas error:', error);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConstellationView;
}
