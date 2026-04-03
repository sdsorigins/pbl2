class ShootingStars {
    constructor() {
        this.stars = [];
        this.maxStars = 3;
        this.init();
    }
    
    init() {
        document.addEventListener('click', (e) => this.createShootingStar(e));
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.createShootingStar(e.touches[0]);
            }
        });
    }
    
    createShootingStar(event) {
        if (this.stars.length >= this.maxStars) return;
        
        const star = document.createElement('div');
        star.className = 'shooting-star';
        
        const startX = event.clientX || event.pageX;
        const startY = event.clientY || event.pageY;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 300;
        const endX = startX + Math.cos(angle) * distance;
        const endY = startY + Math.sin(angle) * distance;
        
        star.style.left = `${startX}px`;
        star.style.top = `${startY}px`;
        star.style.setProperty('--end-x', `${endX}px`);
        star.style.setProperty('--end-y', `${endY}px`);
        
        const particles = this.createParticleTrail(startX, startY, endX, endY);
        
        document.body.appendChild(star);
        this.stars.push(star);
        
        particles.forEach((particle, index) => {
            setTimeout(() => {
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 1000);
            }, index * 20);
        });
        
        setTimeout(() => {
            star.remove();
            this.stars = this.stars.filter(s => s !== star);
        }, 800);
    }
    
    createParticleTrail(startX, startY, endX, endY) {
        const particles = [];
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'star-particle';
            
            const progress = i / particleCount;
            const x = startX + (endX - startX) * progress;
            const y = startY + (endY - startY) * progress;
            
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 30;
            
            particle.style.left = `${x + offsetX}px`;
            particle.style.top = `${y + offsetY}px`;
            particle.style.animationDelay = `${i * 0.02}s`;
            
            particles.push(particle);
        }
        
        return particles;
    }
}

if (typeof window !== 'undefined') {
    window.shootingStars = new ShootingStars();
}
