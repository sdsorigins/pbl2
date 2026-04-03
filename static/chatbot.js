class SimpleChatbot {
    constructor() {
        this.isOpen = false;
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        const chatbotToggle = document.getElementById('chatbotToggle');
        const chatbotOpen = document.getElementById('chatbotOpen');
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        const commandListBtn = document.getElementById('commandListBtn');
        const commandBtns = document.querySelectorAll('.command-btn');
        
        if (chatbotToggle) {
            chatbotToggle.addEventListener('click', () => this.toggleChatbot());
        }
        
        if (chatbotOpen) {
            chatbotOpen.addEventListener('click', () => this.openChatbot());
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
        
        if (commandListBtn) {
            commandListBtn.addEventListener('click', () => this.toggleCommandList());
        }
        
        commandBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.getAttribute('data-command');
                this.executeCommand(command);
            });
        });
    }
    
    toggleChatbot() {
        const chatbot = document.getElementById('chatbot');
        const chatbotOpen = document.getElementById('chatbotOpen');
        
        if (chatbot && chatbotOpen) {
            this.isOpen = !this.isOpen;
            
            if (this.isOpen) {
                chatbot.classList.remove('hidden');
                chatbotOpen.classList.add('hidden');
            } else {
                chatbot.classList.add('hidden');
                chatbotOpen.classList.remove('hidden');
            }
        }
    }
    
    openChatbot() {
        const chatbot = document.getElementById('chatbot');
        const chatbotOpen = document.getElementById('chatbotOpen');
        
        if (chatbot && chatbotOpen) {
            this.isOpen = true;
            chatbot.classList.remove('hidden');
            chatbotOpen.classList.add('hidden');
        }
    }
    
    toggleCommandList() {
        const panel = document.getElementById('commandListPanel');
        if (panel) {
            panel.classList.toggle('hidden');
        }
    }
    
    executeCommand(command) {
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.value = command;
            this.sendMessage();
            this.toggleCommandList();
        }
    }
    
    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) return;
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        this.showMessage(message, 'user');
        chatInput.value = '';
        
        this.showMessage('Thinking...', 'bot', true);
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    context: this.getSystemContext()
                })
            });
            
            const data = await response.json();
            
            this.removeThinkingMessage();
            
            if (data.response) {
                this.showMessage(data.response, 'bot');
            } else {
                this.showMessage('Sorry, I could not process your request.', 'bot');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.removeThinkingMessage();
            this.showMessage('Error connecting to assistant. Please try again.', 'bot');
        }
    }
    
    showMessage(text, type, isThinking = false) {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message ${isThinking ? 'thinking' : ''}`;
        
        if (isThinking) {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <span class="thinking-dots">
                        <span>.</span><span>.</span><span>.</span>
                    </span>
                    ${text}
                </div>
            `;
        } else {
            messageDiv.innerHTML = `<div class="message-content">${text}</div>`;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    removeThinkingMessage() {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;
        
        const thinkingMsg = messagesContainer.querySelector('.thinking');
        if (thinkingMsg) {
            thinkingMsg.remove();
        }
    }
    
    getSystemContext() {
        const cpuValue = document.getElementById('cpuValue')?.textContent || '0';
        const memValue = document.getElementById('memValue')?.textContent || '0';
        return `Current system: CPU ${cpuValue}%, Memory ${memValue}%`;
    }
}

if (typeof window !== 'undefined') {
    window.simpleChatbot = new SimpleChatbot();
}
