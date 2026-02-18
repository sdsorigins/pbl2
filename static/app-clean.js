// SYSTEM MONITOR - IMMERSIVE BACKGROUND
const socket = io();

// Theme Management
let currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);

// IMMERSIVE CONSTELLATION PARTICLE SYSTEM
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 200; // More particles for denser constellation

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 4 + 2; // Bigger, more visible particles
            this.speedX = Math.random() * 0.3 - 0.15;
            this.speedY = Math.random() * 0.3 - 0.15;
            this.opacity = Math.random() * 0.7 + 0.4; // Much brighter
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }

        draw() {
            const theme = document.documentElement.getAttribute('data-theme');
            const color = theme === 'dark' ? '167, 139, 250' : '124, 58, 237'; // Brighter purple
            
            // Draw particle with strong glow
            ctx.shadowBlur = 20;
            ctx.shadowColor = `rgba(${color}, 1)`;
            ctx.fillStyle = `rgba(${color}, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add extra bright center
            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.6})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function connectParticles() {
        const theme = document.documentElement.getAttribute('data-theme');
        const primaryColor = theme === 'dark' ? '167, 139, 250' : '124, 58, 237'; // Bright purple
        const secondaryColor = theme === 'dark' ? '196, 181, 253' : '139, 92, 246'; // Very light purple
        const accentColor = theme === 'dark' ? '139, 92, 246' : '59, 130, 246'; // Deep purple accent
        
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Extended range for more visible constellation patterns
                if (distance < 280) {
                    const opacity = (1 - distance / 280);
                    
                    // Vary line thickness and color based on distance - MUCH MORE VISIBLE
                    if (distance < 120) {
                        // Close connections - very bright with strong glow
                        ctx.strokeStyle = `rgba(${secondaryColor}, ${opacity * 0.7})`;
                        ctx.lineWidth = 2.5;
                        ctx.shadowBlur = 12;
                        ctx.shadowColor = `rgba(${secondaryColor}, ${opacity * 0.9})`;
                    } else if (distance < 200) {
                        // Medium connections - bright purple
                        ctx.strokeStyle = `rgba(${primaryColor}, ${opacity * 0.5})`;
                        ctx.lineWidth = 2;
                        ctx.shadowBlur = 8;
                        ctx.shadowColor = `rgba(${primaryColor}, ${opacity * 0.7})`;
                    } else {
                        // Far connections - visible light purple
                        ctx.strokeStyle = `rgba(${accentColor}, ${opacity * 0.35})`;
                        ctx.lineWidth = 1.5;
                        ctx.shadowBlur = 5;
                        ctx.shadowColor = `rgba(${accentColor}, ${opacity * 0.5})`;
                    }
                    
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        connectParticles();
        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // Mouse interaction - repulsion effect
    let mouse = { x: null, y: null, radius: 150 };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
        particles.forEach(particle => {
            const dx = mouse.x - particle.x;
            const dy = mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius) {
                const force = (mouse.radius - distance) / mouse.radius;
                const angle = Math.atan2(dy, dx);
                particle.x -= Math.cos(angle) * force * 2;
                particle.y -= Math.sin(angle) * force * 2;
            }
        });
    });
}

// Initialize particle system
initParticles();

// Theme toggle
document.getElementById('themeToggle')?.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
});

// Chart configurations
const chartConfig = {
    type: 'line',
    options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
            duration: 750,
            easing: 'easeInOutQuart'
        },
        plugins: { 
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                cornerRadius: 8,
                titleColor: '#fff',
                bodyColor: '#fff'
            }
        },
        scales: {
            y: { 
                beginAtZero: true, 
                max: 100,
                grid: { 
                    color: 'rgba(167, 139, 250, 0.05)',
                    drawBorder: false
                },
                ticks: { 
                    color: 'rgba(255, 255, 255, 0.5)',
                    font: { size: 11 }
                }
            },
            x: { 
                display: false 
            }
        }
    }
};

// Initialize charts
const cpuChart = new Chart(document.getElementById('cpuChart'), {
    ...chartConfig,
    data: {
        labels: [],
        datasets: [{
            label: 'CPU %',
            data: [],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6
        }]
    }
});

const memChart = new Chart(document.getElementById('memChart'), {
    ...chartConfig,
    data: {
        labels: [],
        datasets: [{
            label: 'Memory %',
            data: [],
            borderColor: '#a78bfa',
            backgroundColor: 'rgba(167, 139, 250, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6
        }]
    }
});

const netChart = new Chart(document.getElementById('netChart'), {
    ...chartConfig,
    data: {
        labels: [],
        datasets: [
            {
                label: 'Upload',
                data: [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            },
            {
                label: 'Download',
                data: [],
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            }
        ]
    },
    options: {
        ...chartConfig.options,
        plugins: { 
            legend: { 
                display: true, 
                position: 'top',
                labels: { 
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: { size: 11 },
                    usePointStyle: true
                }
            } 
        }
    }
});

const diskChart = new Chart(document.getElementById('diskChart'), {
    ...chartConfig,
    data: {
        labels: [],
        datasets: [
            {
                label: 'Read',
                data: [],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            },
            {
                label: 'Write',
                data: [],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            }
        ]
    },
    options: {
        ...chartConfig.options,
        plugins: { 
            legend: { 
                display: true, 
                position: 'top',
                labels: { 
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: { size: 11 },
                    usePointStyle: true
                }
            } 
        }
    }
});

// State
let isMonitoring = false;
const maxDataPoints = 50;
let startTime = null;
let uptimeInterval = null;

// UI Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');

// Event listeners
startBtn?.addEventListener('click', () => {
    socket.emit('start_monitoring');
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusEl.textContent = 'Active';
    statusEl.style.color = '#10b981';
    
    startTime = Date.now();
    uptimeInterval = setInterval(updateUptime, 1000);
});

stopBtn?.addEventListener('click', () => {
    socket.emit('stop_monitoring');
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusEl.textContent = 'Stopped';
    statusEl.style.color = '#ef4444';
    
    if (uptimeInterval) {
        clearInterval(uptimeInterval);
        uptimeInterval = null;
    }
});

function updateUptime() {
    if (!startTime) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('uptime').textContent = `${hours}:${minutes}:${seconds}`;
}

// Socket handlers
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('status', (data) => {
    isMonitoring = data.monitoring;
    if (data.monitoring) {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusEl.textContent = 'Active';
        statusEl.style.color = '#10b981';
    } else {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        statusEl.textContent = 'Idle';
        statusEl.style.color = '#94a3b8';
    }
});

socket.on('update', (data) => {
    updateMetrics(data.metrics);
    updateCharts(data.metrics);
    updateSystemInfo(data);
    
    if (data.anomaly) {
        handleAnomaly(data.anomaly);
    }
});

function updateMetrics(metrics) {
    if (!isMonitoring) return;
    
    // CPU
    document.getElementById('cpuValue').textContent = Math.round(metrics.cpu_percent);
    document.getElementById('cpuProgress').style.width = `${metrics.cpu_percent}%`;
    updateBadge('cpuBadge', metrics.cpu_percent, 70, 90);
    
    // Memory
    document.getElementById('memValue').textContent = Math.round(metrics.memory_percent);
    document.getElementById('memProgress').style.width = `${metrics.memory_percent}%`;
    updateBadge('memBadge', metrics.memory_percent, 75, 90);
    
    // Network
    document.getElementById('netUpload').textContent = `${metrics.net_sent_mbps.toFixed(2)} MB/s`;
    document.getElementById('netDownload').textContent = `${metrics.net_recv_mbps.toFixed(2)} MB/s`;
    
    // Disk
    document.getElementById('diskRead').textContent = `${metrics.disk_read_mbps.toFixed(2)} MB/s`;
    document.getElementById('diskWrite').textContent = `${metrics.disk_write_mbps.toFixed(2)} MB/s`;
}

function updateBadge(elementId, value, warningThreshold, dangerThreshold) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.classList.remove('badge-success', 'badge-warning', 'badge-danger');
    
    if (value >= dangerThreshold) {
        element.textContent = 'Critical';
        element.classList.add('badge-danger');
    } else if (value >= warningThreshold) {
        element.textContent = 'Warning';
        element.classList.add('badge-warning');
    } else {
        element.textContent = 'Normal';
        element.classList.add('badge-success');
    }
}

function updateCharts(metrics) {
    const time = new Date().toLocaleTimeString();
    
    addDataPoint(cpuChart, time, metrics.cpu_percent);
    addDataPoint(memChart, time, metrics.memory_percent);
    addDataPoint(netChart, time, [metrics.net_sent_mbps, metrics.net_recv_mbps]);
    addDataPoint(diskChart, time, [metrics.disk_read_mbps, metrics.disk_write_mbps]);
}

function addDataPoint(chart, label, data) {
    chart.data.labels.push(label);
    
    if (Array.isArray(data)) {
        data.forEach((value, index) => {
            chart.data.datasets[index].data.push(value);
        });
    } else {
        chart.data.datasets[0].data.push(data);
    }
    
    if (chart.data.labels.length > maxDataPoints) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(dataset => dataset.data.shift());
    }
    
    chart.update('none');
}

function updateSystemInfo(data) {
    if (data.is_trained) {
        const learningEl = document.getElementById('learning');
        if (learningEl) {
            learningEl.textContent = 'Complete ✓';
            learningEl.style.color = '#10b981';
        }
    } else if (data.sample_count && data.learning_period) {
        const progress = Math.round((data.sample_count / data.learning_period) * 100);
        const learningEl = document.getElementById('learning');
        if (learningEl) {
            learningEl.textContent = `${progress}%`;
            learningEl.style.color = '#f59e0b';
        }
    }
    
    document.getElementById('samples').textContent = data.sample_count || 0;
}

function handleAnomaly(anomaly) {
    const countEl = document.getElementById('anomalyCount');
    if (countEl) {
        const currentCount = parseInt(countEl.textContent);
        countEl.textContent = currentCount + 1;
    }
}

// Update process list
function updateProcessList(processes) {
    const listEl = document.getElementById('processList');
    const countEl = document.getElementById('processCount');
    
    if (!processes || processes.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No processes to display</p>';
        countEl.textContent = '0 Active';
        return;
    }
    
    countEl.textContent = `${processes.length} Active`;
    
    listEl.innerHTML = processes.map((proc) => `
        <div class="process-item">
            <div class="process-name">${proc.name || 'Unknown Process'}</div>
            <div class="process-stats">
                <span>PID: ${proc.pid}</span>
                <span>CPU: ${(proc.cpu_percent || 0).toFixed(1)}%</span>
                <span>MEM: ${(proc.memory_percent || 0).toFixed(1)}%</span>
            </div>
        </div>
    `).join('');
}

// Fetch and update processes periodically
setInterval(() => {
    if (isMonitoring) {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                if (data.processes) {
                    updateProcessList(data.processes);
                }
            })
            .catch(err => console.error('Failed to fetch processes:', err));
    }
}, 3000);

// Chatbot toggle
const chatbot = document.getElementById('chatbot');
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotOpen = document.getElementById('chatbotOpen');

if (chatbotToggle) {
    chatbotToggle.addEventListener('click', () => {
        chatbot.classList.add('minimized');
        chatbotOpen.classList.remove('hidden');
    });
}

if (chatbotOpen) {
    chatbotOpen.addEventListener('click', () => {
        chatbot.classList.remove('minimized');
        chatbotOpen.classList.add('hidden');
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (chatbot.classList.contains('minimized')) {
            chatbotOpen.click();
        } else {
            chatbotToggle.click();
        }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        if (!startBtn.disabled) {
            startBtn.click();
        } else if (!stopBtn.disabled) {
            stopBtn.click();
        }
    }
});

console.log('System Monitor loaded - Clean version with no entrance animations');
