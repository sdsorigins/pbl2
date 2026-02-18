// AI Chatbot with Groq API, Voice Input, and Agentic Capabilities
class SystemChatbot {
    constructor() {
        this.chatbot = document.getElementById('chatbot');
        this.messages = document.getElementById('chatbotMessages');
        this.input = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('chatSend');
        this.micBtn = document.getElementById('micBtn');
        this.openBtn = document.getElementById('chatbotOpen');
        this.toggleBtn = document.getElementById('chatbotToggle');
        
        this.systemInfo = {};
        this.isOpen = false;
        this.isRecording = false;
        this.recognition = null;
        
        this.setupEventListeners();
        this.setupVoiceRecognition();
        this.fetchSystemInfo();
        
        setInterval(() => this.fetchSystemInfo(), 5000);
    }
    
    setupEventListeners() {
        if (this.openBtn) this.openBtn.addEventListener('click', () => this.toggle());
        if (this.toggleBtn) this.toggleBtn.addEventListener('click', () => this.toggle());
        if (this.sendBtn) this.sendBtn.addEventListener('click', () => this.sendMessage());
        if (this.micBtn) this.micBtn.addEventListener('click', () => this.toggleVoiceInput());
        if (this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
    }
    
    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.input.value = transcript;
                this.sendMessage();
            };
            
            this.recognition.onend = () => {
                this.isRecording = false;
                if (this.micBtn) this.micBtn.classList.remove('recording');
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isRecording = false;
                if (this.micBtn) this.micBtn.classList.remove('recording');
            };
        }
    }
    
    toggleVoiceInput() {
        if (!this.recognition) {
            this.addMessage('Voice input is not supported in your browser.', 'bot');
            return;
        }
        
        if (this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
            this.micBtn.classList.remove('recording');
        } else {
            this.recognition.start();
            this.isRecording = true;
            this.micBtn.classList.add('recording');
        }
    }
    
    toggle() {
        this.isOpen = !this.isOpen;
        this.chatbot.classList.toggle('open', this.isOpen);
        if (this.isOpen && this.input) {
            this.input.focus();
        }
    }
    
    async fetchSystemInfo() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            this.systemInfo = data;
        } catch (error) {
            console.error('Failed to fetch system info:', error);
        }
    }
    
    async sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;
        
        this.addMessage(text, 'user');
        this.input.value = '';
        
        const typingId = this.addTypingIndicator();
        
        try {
            // Check for agentic commands
            const action = await this.executeAgenticAction(text);
            if (action) {
                this.removeTypingIndicator(typingId);
                this.addMessage(action, 'bot');
                return;
            }
            
            const response = await this.getGroqResponse(text);
            this.removeTypingIndicator(typingId);
            this.addMessage(response, 'bot');
        } catch (error) {
            this.removeTypingIndicator(typingId);
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
    }
    
    async executeAgenticAction(command) {
        const cmd = command.toLowerCase();
        
        // Magic theme commands (Harry Potter style)
        if (cmd.includes('lumos')) {
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            return '✨ Lumos! Light mode activated!';
        }
        if (cmd.includes('nox') || cmd.includes('knox')) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            return '🌙 Nox! Dark mode activated!';
        }
        
        // Download report
        if (cmd.includes('download report') || cmd.includes('download the report') || cmd.includes('get report')) {
            document.getElementById('downloadReport')?.click();
            return 'Downloading your system report now!';
        }
        
        // Theme control (regular commands)
        if (cmd.includes('dark mode') || cmd.includes('dark theme')) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            return 'Switched to dark mode!';
        }
        if (cmd.includes('light mode') || cmd.includes('light theme')) {
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            return 'Switched to light mode!';
        }
        
        // Start/Stop monitoring
        if (cmd.includes('start monitoring')) {
            document.getElementById('startBtn')?.click();
            return 'Started system monitoring!';
        }
        if (cmd.includes('stop monitoring')) {
            document.getElementById('stopBtn')?.click();
            return 'Stopped system monitoring!';
        }
        
        // Export data
        if (cmd.includes('export') || cmd.includes('send report')) {
            document.getElementById('exportBtn')?.click();
            return 'Opening export dialog. You can send reports via email or SMS!';
        }
        
        // Run diagnostics
        if (cmd.includes('run diagnostics') || cmd.includes('check system') || cmd.includes('scan')) {
            document.getElementById('runDiagnostics')?.click();
            return 'Running full system diagnostics now!';
        }
        
        return null;
    }
    
    async getGroqResponse(userMessage) {
        const metrics = this.systemInfo.metrics || {};
        
        const systemContext = `You are an agentic AI assistant that can control the system monitor dashboard. 
Current System: CPU ${metrics.cpu_percent?.toFixed(1) || 0}%, Memory ${metrics.memory_percent?.toFixed(1) || 0}%, ${metrics.cpu_count || 'N/A'} cores.

You can execute commands like:
- "dark mode" or "light mode" to change theme
- "start monitoring" or "stop monitoring"
- "launch racing" or "launch wwe" to start games
- "export" to open export dialog
- Answer questions about system performance

Be helpful and proactive!`;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, context: systemContext })
            });
            
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            return data.response || 'I apologize, but I could not generate a response.';
        } catch (error) {
            console.error('Groq API error:', error);
            return this.generateLocalResponse(userMessage.toLowerCase());
        }
    }
    
    generateLocalResponse(query) {
        const metrics = this.systemInfo.metrics || {};
        
        if (query.includes('cpu')) {
            return `CPU: ${metrics.cpu_percent?.toFixed(1) || 0}%, ${metrics.cpu_count || 'N/A'} cores at ${metrics.cpu_freq?.toFixed(0) || 'N/A'} MHz`;
        }
        if (query.includes('memory') || query.includes('ram')) {
            return `Memory: ${metrics.memory_percent?.toFixed(1) || 0}%, using ${(metrics.memory_used_mb / 1024).toFixed(1)} GB of ${(metrics.memory_total_mb / 1024).toFixed(1)} GB`;
        }
        if (query.includes('network')) {
            return `Network: Upload ${metrics.net_sent_mbps?.toFixed(2) || 0} MB/s, Download ${metrics.net_recv_mbps?.toFixed(2) || 0} MB/s`;
        }
        if (query.includes('help')) {
            return `I can help you with:
- System stats (CPU, memory, network)
- Control dashboard (dark/light mode, start/stop monitoring)
- Launch games (racing, WWE)
- Export reports
Just ask me!`;
        }
        
        return `I can help with system monitoring and control the dashboard. Try: "dark mode", "start monitoring", "launch racing", or ask about your system!`;
    }
    
    addMessage(text, type) {
        if (!this.messages) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        messageDiv.appendChild(contentDiv);
        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
    }
    
    addTypingIndicator() {
        if (!this.messages) return null;
        const id = 'typing-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.id = id;
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content typing-indicator';
        contentDiv.innerHTML = '<span></span><span></span><span></span>';
        messageDiv.appendChild(contentDiv);
        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
        return id;
    }
    
    removeTypingIndicator(id) {
        if (!id) return;
        const element = document.getElementById(id);
        if (element) element.remove();
    }
}

class ParticleAnimation {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 80;
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.init();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                radius: Math.random() * 2 + 1
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Just draw simple dots, no lines
        this.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Wrap around edges
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            
            // Draw simple dot
            this.ctx.fillStyle = 'rgba(102, 126, 234, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const intro = document.getElementById('introScreen');
        if (intro) intro.style.display = 'none';
    }, 3000);
    
    new SystemChatbot();
    new ParticleAnimation();
});


// Export functionality
document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('exportBtn');
    const exportModal = document.getElementById('exportModal');
    const closeModal = document.getElementById('closeModal');
    const sendEmail = document.getElementById('sendEmail');
    const sendSMS = document.getElementById('sendSMS');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportModal.classList.remove('hidden');
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            exportModal.classList.add('hidden');
        });
    }
    
    if (sendEmail) {
        sendEmail.addEventListener('click', async () => {
            const email = document.getElementById('emailInput').value;
            if (!email) {
                alert('Please enter an email address');
                return;
            }
            
            try {
                const response = await fetch('/api/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, type: 'email' })
                });
                
                const data = await response.json();
                alert(data.message || 'Report sent successfully!');
                exportModal.classList.add('hidden');
            } catch (error) {
                alert('Failed to send report. Please try again.');
            }
        });
    }
    
    if (sendSMS) {
        sendSMS.addEventListener('click', async () => {
            const phone = document.getElementById('phoneInput').value;
            if (!phone) {
                alert('Please enter a phone number');
                return;
            }
            
            try {
                const response = await fetch('/api/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, type: 'sms' })
                });
                
                const data = await response.json();
                alert(data.message || 'SMS sent successfully!');
                exportModal.classList.add('hidden');
            } catch (error) {
                alert('Failed to send SMS. Please try again.');
            }
        });
    }
});
