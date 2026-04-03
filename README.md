# System Monitor - Van Gogh Edition

> Real-time system monitoring with AI-powered anomaly detection and artistic visualization

![Van Gogh Edition](https://img.shields.io/badge/Edition-Van%20Gogh-FFD700?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-SocketIO-000000?style=for-the-badge&logo=flask)
![AI Powered](https://img.shields.io/badge/AI-Powered-FF6B6B?style=for-the-badge)

---

## Overview

A sophisticated system monitoring dashboard that combines real-time performance tracking with artistic visualization inspired by Vincent van Gogh's Starry Night. The application features AI-powered anomaly detection using Isolation Forest machine learning, comprehensive storage analysis, and an intelligent chatbot assistant.

### Key Features

**Real-Time System Monitoring**
- CPU, memory, network, and disk I/O metrics with live updates
- Process constellation view displaying running processes as interactive stars
- Brushstroke-style charts with organic, hand-painted visualization
- Ambient animations with breathing effects and dynamic color shifts

**AI-Powered Intelligence**
- Isolation Forest machine learning for anomaly detection
- Baseline learning from initial 30 samples
- Real-time root cause analysis with Z-score calculations
- Groq-powered chatbot for system insights and assistance

**Storage Management**
- Drive overview with usage statistics
- Large file detection and directory analysis
- File type distribution with pie chart visualization
- Directory size analysis with bar graph representation

**Artistic Design**
- 1200+ flowing brushstrokes following Perlin-noise flow fields
- 15 pulsing golden stars with 12-second breathing cycle
- Van Gogh color palette (Prussian blue, cobalt, gold, wheat)
- Glassmorphism UI with painterly effects

---

## Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/sdsorigins/pbl2.git
cd pbl2
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables (optional):
```bash
cp .env.example .env
```
Edit `.env` and add your Groq API key for chatbot functionality:
```
GROQ_API_KEY=your_api_key_here
```

4. Run the application:
```bash
python app.py
```

5. Open your browser and navigate to:
```
http://localhost:5000
```

---

## Architecture

### Technology Stack

**Backend**
- Flask: Web framework for HTTP routing
- Flask-SocketIO: Real-time WebSocket communication
- psutil: System metrics collection
- scikit-learn: Isolation Forest anomaly detection
- Threading: Background monitoring loops

**Frontend**
- Vanilla JavaScript: Core application logic
- Chart.js: Data visualization with custom plugins
- Socket.IO Client: Real-time data streaming
- CSS3: Glassmorphism effects and animations
- HTML5 Canvas: Van Gogh background rendering

**AI Integration**
- Groq API: Chatbot intelligence (Mixtral model)
- Isolation Forest: Unsupervised anomaly detection
- Z-score Analysis: Root cause identification

### System Components

**ResourceMonitor** (`monitor.py`)
- Collects CPU, memory, network, and disk metrics
- Calculates rates for network and disk I/O
- Retrieves top processes by CPU usage

**AnomalyDetector** (`anomaly_detector.py`)
- Implements Isolation Forest machine learning
- Learns baseline from initial samples
- Detects anomalies and analyzes root causes

**SimpleStorageAnalyzer** (`simple_storage.py`)
- Scans drives and directories
- Identifies large files
- Calculates storage usage statistics

**VanGoghBackground** (`vangogh-bg.js`)
- Renders 1200+ flowing brushstrokes
- Implements Perlin noise flow fields
- Animates pulsing star effects

**ProcessConstellation** (`constellation.js`)
- Visualizes processes as stars
- Draws constellation connections
- Provides interactive tooltips

---

## Usage

### Keyboard Shortcuts

- `Ctrl + M` — Start/Stop system monitoring
- `Ctrl + K` — Toggle AI chatbot

### Navigation

**Monitoring Tab**
- View real-time CPU, memory, network, and disk metrics
- Monitor process constellation
- Track anomaly detection status
- Control monitoring with start/stop buttons

**Storage Tab**
- Select drive from dropdown menu
- Analyze directory structure
- View file type distribution
- Identify large files
- Review cleanup suggestions

### Chatbot Commands

The AI chatbot supports natural language queries and preset commands:
- CPU Status
- Memory Check
- Network Stats
- Disk Activity
- Top Processes
- System Health
- Anomaly Report
- Storage Overview

### Monitoring Controls

1. Click "Start Monitoring" to begin real-time data collection
2. AI learns baseline from first 30 samples
3. Anomaly detection activates after training period
4. Click "Stop Monitoring" to pause data collection

---

## Performance Optimization

- 60 FPS canvas animations using requestAnimationFrame
- Chart data limited to 20 points for optimal rendering
- Debounced resize handlers for responsive design
- Hardware-accelerated CSS transforms
- Efficient WebSocket communication for real-time updates

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome/Edge | Full support |
| Firefox | Full support |
| Safari | Full support |
| IE11 | Not supported |

---

## Project Structure

```
pbl2/
├── app.py                      # Flask application and API routes
├── monitor.py                  # System metrics collection
├── anomaly_detector.py         # ML-based anomaly detection
├── simple_storage.py           # Storage analysis utilities
├── requirements.txt            # Python dependencies
├── .env.example               # Environment configuration template
├── templates/
│   └── index-premium.html     # Main application template
└── static/
    ├── app-clean.js           # Core application logic
    ├── chatbot.js             # Chatbot implementation
    ├── constellation.js       # Process constellation view
    ├── storage.js             # Storage management
    ├── vangogh-bg.js          # Van Gogh background renderer
    ├── shooting-stars.js      # Particle effects
    └── style-premium.css      # Application styling
```

---

## Team

**Project Contributors**
- Saurabh: Chatbot and storage analysis
- Pragun: I/O monitoring and isolation forest implementation
- Vedant: CPU monitoring and socket communication
- Ishita: Frontend design and network analysis

---

## License

MIT License - Open source and free to use

---

## Acknowledgments

Inspired by Vincent van Gogh's *Starry Night* (1889)

Built with passion for the intersection of art, technology, and system monitoring.

---

## Support

For issues, questions, or contributions, please visit:
https://github.com/sdsorigins/pbl2

---

**System monitoring reimagined as art.**
