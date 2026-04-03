const socket = io();

class AmbientEngine {
    constructor() {
        this.time = 0;
        this.cards = [];
        this.init();
    }
    
    init() {
        this.cards = Array.from(document.querySelectorAll('.glass-card'));
        this.animate();
    }
    
    animate() {
        this.time += 0.016;
        
        const hueShift = Math.sin(this.time * 0.067) * 8;
        document.documentElement.style.filter = `hue-rotate(${hueShift}deg)`;
        
        this.cards.forEach((card, index) => {
            const offset = index * 0.5;
            const opacity = 0.15 + Math.sin(this.time * 0.167 + offset) * 0.2;
            card.style.borderColor = `rgba(200, 160, 60, ${opacity})`;
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

const BrushstrokePlugin = {
    id: 'brushstroke',
    afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);
        
        if (!meta || !meta.data || meta.data.length < 2) return;
        
        ctx.save();
        
        for (let i = 0; i < meta.data.length - 1; i++) {
            const point1 = meta.data[i];
            const point2 = meta.data[i + 1];
            
            if (!point1 || !point2) continue;
            
            const wobble = Math.sin(i * 0.8) * 1.5;
            const lineWidth = 2 + Math.sin(i * 0.8) * 1.2;
            
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = chart.data.datasets[0].borderColor;
            ctx.globalAlpha = 0.8;
            
            ctx.beginPath();
            ctx.moveTo(point1.x, point1.y + wobble);
            ctx.quadraticCurveTo(
                (point1.x + point2.x) / 2,
                (point1.y + point2.y) / 2 + wobble,
                point2.x,
                point2.y + wobble
            );
            ctx.stroke();
            
            for (let b = 0; b < 3; b++) {
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(point1.x, point1.y + wobble + b);
                ctx.quadraticCurveTo(
                    (point1.x + point2.x) / 2,
                    (point1.y + point2.y) / 2 + wobble + b,
                    point2.x,
                    point2.y + wobble + b
                );
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
};

Chart.register(BrushstrokePlugin);

let cpuChart, memChart, netChart, diskChart;
let cpuData = [], memData = [], netUpData = [], netDownData = [], diskReadData = [], diskWriteData = [];
const maxDataPoints = 20;

function createChart(canvasId, label, color1, color2) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(maxDataPoints).fill(''),
            datasets: [{
                label: label,
                data: Array(maxDataPoints).fill(0),
                borderColor: gradient,
                backgroundColor: `${color1}20`,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: '#e8c97a', font: { family: 'Crimson Pro' } },
                    grid: { color: 'rgba(200, 160, 60, 0.1)' }
                },
                x: {
                    ticks: { display: false },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    const loadingEl = ctx.parentElement.querySelector('.chart-loading');
    if (loadingEl) {
        setTimeout(() => loadingEl.classList.add('hidden'), 300);
    }
    
    return chart;
}

function initCharts() {
    cpuChart = createChart('cpuChart', 'CPU', '#c8840a', '#ff8800');
    memChart = createChart('memChart', 'Memory', '#1a3a6b', '#3d7abf');
    netChart = createChart('netChart', 'Network', '#00aa66', '#00ff88');
    diskChart = createChart('diskChart', 'Disk', '#aa3333', '#ff6666');
}

function updateChart(chart, newValue) {
    if (!chart) return;
    
    chart.data.datasets[0].data.push(newValue);
    if (chart.data.datasets[0].data.length > maxDataPoints) {
        chart.data.datasets[0].data.shift();
    }
    chart.update('none');
}

function createRipple(element) {
    const ripple = document.createElement('div');
    ripple.className = 'chart-ripple';
    const rect = element.getBoundingClientRect();
    ripple.style.left = `${rect.width / 2}px`;
    ripple.style.top = `${rect.height / 2}px`;
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    element.style.position = 'relative';
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

function animateNumber(element, newValue) {
    if (!element) return;
    
    const oldValue = element.textContent;
    if (oldValue !== newValue.toString()) {
        element.classList.add('digit-rolling');
        element.textContent = newValue;
        setTimeout(() => element.classList.remove('digit-rolling'), 60);
    }
}

function updateMetrics(metrics) {
    if (!metrics) return;
    
    const cpuValue = Math.round(metrics.cpu_percent || 0);
    const memValue = Math.round(metrics.memory_percent || 0);
    
    animateNumber(document.getElementById('cpuValue'), cpuValue);
    animateNumber(document.getElementById('memValue'), memValue);
    
    const cpuProgress = document.getElementById('cpuProgress');
    const memProgress = document.getElementById('memProgress');
    
    if (cpuProgress) cpuProgress.style.width = `${cpuValue}%`;
    if (memProgress) memProgress.style.width = `${memValue}%`;
    
    const cpuBadge = document.getElementById('cpuBadge');
    if (cpuBadge) {
        cpuBadge.className = 'badge ' + (cpuValue > 80 ? 'badge-danger' : cpuValue > 50 ? 'badge-warning' : 'badge-success');
        cpuBadge.textContent = cpuValue > 80 ? 'High' : cpuValue > 50 ? 'Medium' : 'Normal';
    }
    
    const cpuCard = document.querySelector('.metric-card');
    if (cpuValue > 80 && cpuCard) {
        cpuCard.classList.add('cpu-warning');
    } else if (cpuCard) {
        cpuCard.classList.remove('cpu-warning');
    }
    
    const memBadge = document.getElementById('memBadge');
    if (memBadge) {
        memBadge.className = 'badge ' + (memValue > 80 ? 'badge-danger' : memValue > 50 ? 'badge-warning' : 'badge-success');
        memBadge.textContent = memValue > 80 ? 'High' : memValue > 50 ? 'Medium' : 'Normal';
    }
    
    const cpuCores = document.getElementById('cpuCores');
    if (cpuCores) cpuCores.textContent = metrics.cpu_count || '-';
    
    const memUsed = document.getElementById('memUsed');
    const memTotal = document.querySelector('#memUsed + .stat-item .stat-value');
    if (memUsed) memUsed.textContent = `${(metrics.memory_used_mb / 1024).toFixed(1)} GB`;
    if (memTotal) memTotal.textContent = `${(metrics.memory_total_mb / 1024).toFixed(1)} GB`;
    
    const netUpload = document.getElementById('netUpload');
    const netDownload = document.getElementById('netDownload');
    if (netUpload) netUpload.textContent = `${metrics.net_sent_mbps.toFixed(2)} MB/s`;
    if (netDownload) netDownload.textContent = `${metrics.net_recv_mbps.toFixed(2)} MB/s`;
    
    const diskRead = document.getElementById('diskRead');
    const diskWrite = document.getElementById('diskWrite');
    if (diskRead) diskRead.textContent = `${metrics.disk_read_mbps.toFixed(2)} MB/s`;
    if (diskWrite) diskWrite.textContent = `${metrics.disk_write_mbps.toFixed(2)} MB/s`;
    
    updateChart(cpuChart, cpuValue);
    updateChart(memChart, memValue);
    updateChart(netChart, metrics.net_recv_mbps);
    updateChart(diskChart, metrics.disk_read_mbps);
    
    const cpuChartContainer = document.getElementById('cpuChart')?.parentElement;
    if (cpuChartContainer) createRipple(cpuChartContainer);
}

let startTime = null;

function updateUptime() {
    if (!startTime) return;
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    const uptimeEl = document.getElementById('uptime');
    if (uptimeEl) {
        uptimeEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('update', (data) => {
    if (data && data.metrics) {
        updateMetrics(data.metrics);
    }
    
    if (data && data.sample_count) {
        const samplesEl = document.getElementById('samples');
        if (samplesEl) samplesEl.textContent = data.sample_count;
    }
    
    if (data && data.is_trained !== undefined) {
        const learningEl = document.getElementById('learning');
        if (learningEl) {
            learningEl.textContent = data.is_trained ? 'Trained' : `Learning (${data.sample_count || 0}/${data.learning_period || 30})`;
        }
    }
});

socket.on('status', (data) => {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = data.monitoring ? 'Active' : 'Idle';
    }
    
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (startBtn) startBtn.disabled = data.monitoring;
    if (stopBtn) stopBtn.disabled = !data.monitoring;
    
    if (data.monitoring && !startTime) {
        startTime = Date.now();
        setInterval(updateUptime, 1000);
    } else if (!data.monitoring) {
        startTime = null;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    try {
        window.vangoghBg = new VanGoghBackground('vg-canvas');
        window.ambientEngine = new AmbientEngine();
        
        initCharts();
        
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                socket.emit('start_monitoring');
            });
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                socket.emit('stop_monitoring');
            });
        }
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
            });
        }
        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const targetTab = e.target.dataset.tab;
                
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.style.display = 'none';
                    content.classList.remove('active');
                });
                
                const contentMap = {
                    'storage': 'storageContent',
                    'ultimate': 'ultimateContent',
                    'monitoring': 'monitoringContent'
                };
                
                const contentId = contentMap[targetTab];
                if (contentId) {
                    const content = document.getElementById(contentId);
                    if (content) {
                        content.style.display = 'block';
                        setTimeout(() => content.classList.add('active'), 10);
                    }
                }
                
                if (targetTab === 'ultimate' && !window.ultimateStorage) {
                    window.ultimateStorage = new UltimateStorageManager();
                }
            }
        });
        
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                if (data && data.metrics) updateMetrics(data.metrics);
            })
            .catch(err => console.log('Initial stats fetch failed:', err));
        
    } catch (error) {
        console.error('Initialization error:', error);
        document.body.style.background = 'linear-gradient(135deg, #0d2040, #0a0f1e)';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        if (startBtn && !startBtn.disabled) startBtn.click();
        else if (stopBtn && !stopBtn.disabled) stopBtn.click();
    }
    
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const chatbot = document.getElementById('chatbot');
        if (chatbot) chatbot.classList.toggle('hidden');
    }
});
