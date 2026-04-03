# 🎨 System Monitor - Van Gogh Edition

> A living painting that breathes with your system's heartbeat

![Van Gogh Edition](https://img.shields.io/badge/Edition-Van%20Gogh-FFD700?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-SocketIO-000000?style=for-the-badge&logo=flask)
![AI Powered](https://img.shields.io/badge/AI-Powered-FF6B6B?style=for-the-badge)

---

## ✨ Experience the Masterpiece

Transform system monitoring into an immersive art experience. Watch as your CPU, memory, and network activity paint themselves across a canvas inspired by Van Gogh's *Starry Night* — swirling flow fields, pulsing golden stars, and brushstroke-textured charts that breathe with your system's rhythm.

### 🌌 What Makes This Special

**Living Canvas Background**
- 1200+ flowing brushstrokes following Perlin-noise flow fields
- 15 pulsing golden vortex stars that breathe on a 12-second cycle
- Prussian blues, cobalt skies, and cadmium golds straight from Van Gogh's palette
- Canvas that never repeats — every moment is unique

**Painterly Glassmorphism UI**
- Cards with frosted glass effects and hand-painted gold accents
- Brushstroke SVG decorations on every corner
- Typography: Playfair Display for metrics, Crimson Pro for labels
- Hover effects that lift cards with warm amber glows

**Process Constellation**
- Your running processes become stars in a mini galaxy
- Star size = CPU usage, brightness = memory usage
- Constellation lines connect your top 5 processes
- Interactive tooltips with process details
- Color-coded: amber for high CPU, blue-white for idle

**Brushstroke Charts**
- Chart.js enhanced with custom painted line renderer
- Lines wobble organically like a loaded brush
- Gradient strokes: CPU (yellow→orange), Memory (cobalt→sky), Network (green→emerald), Disk (red→coral)
- Faint bristle lines simulate fan brush texture
- Radial gradient backgrounds for depth

**Ambient Intelligence**
- Master time oscillator drives subtle hue rotation (±8°, 15s cycle)
- Card borders pulse independently (0.15→0.35 opacity, 6s cycle)
- Ripples emanate from chart updates
- CPU >80% triggers crimson heartbeat animation
- Anomaly detection shows red impasto slash
- Number counters roll like slot machines

**AI-Powered Anomaly Detection**
- Isolation Forest machine learning (scikit-learn)
- Learns baseline from first 30 samples
- Real-time root cause analysis with Z-score calculations
- Detects CPU spikes, memory leaks, network floods, disk bottlenecks

---

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the masterpiece
python app.py
```

Visit `http://localhost:5000` and watch your system paint itself.

---

## 🎯 Features at a Glance

| Feature | Description |
|---------|-------------|
| 🎨 **Van Gogh Canvas** | 1200 flowing brushstrokes + 15 pulsing stars |
| 📊 **Real-Time Metrics** | CPU, Memory, Network, Disk I/O |
| 🌟 **Process Galaxy** | Interactive constellation of running processes |
| 🖌️ **Brushstroke Charts** | Organic, hand-painted data visualization |
| 🤖 **AI Detection** | Isolation Forest anomaly detection |
| 💬 **AI Chatbot** | Groq-powered system assistant |
| 💾 **Storage Analysis** | Drive overview, large files, directory scanning |
| ⌨️ **Keyboard Shortcuts** | Ctrl+M (monitor), Ctrl+K (chatbot) |
| 🎭 **Ambient Engine** | Breathing animations, ripples, heartbeats |

---

## 🎨 The Van Gogh Palette

```css
Prussian Blue:  #0d2040  /* Deep night sky */
Cobalt:         #1a3a6b  /* Twilight depth */
Sky Blue:       #3d7abf  /* Starry highlights */
Warm Black:     #0a0f1e  /* Canvas base */
Gold:           #c8840a  /* Star cores */
Wheat:          #e8c97a  /* Moonlight glow */
```

---

## 🛠️ Technology Stack

**Backend**
- Flask + SocketIO for real-time WebSocket communication
- psutil for system metrics collection
- scikit-learn Isolation Forest for anomaly detection
- Threading for background monitoring loops

**Frontend**
- Vanilla JavaScript (no frameworks)
- Chart.js with custom BrushstrokePlugin
- GSAP for smooth animations
- Custom Perlin-noise flow field canvas
- Google Fonts: Playfair Display + Crimson Pro

**AI Integration**
- Groq API for chatbot intelligence
- Real-time anomaly detection with root cause analysis

---

## ⌨️ Keyboard Shortcuts

- `Ctrl + M` — Start/Stop Monitoring
- `Ctrl + K` — Toggle AI Chatbot

---

## 🎭 Performance

- 60 FPS canvas animations with requestAnimationFrame
- Intelligent opacity layering (no clearRect for painterly buildup)
- Chart data capped at 20 points for smooth updates
- Debounced resize handlers
- Hardware-accelerated CSS transforms

---

## 🌐 Browser Support

- ✅ Chrome/Edge (Full support)
- ✅ Firefox (Full support)
- ✅ Safari (Full support with prefixes)
- ❌ IE11 (Not supported - uses modern JS)

---

## 📝 Configuration

Copy `.env.example` to `.env` and add your Groq API key for chatbot:

```env
GROQ_API_KEY=your_api_key_here
```

---

## 🎨 Design Philosophy

This isn't just a dashboard — it's a living painting. Every element breathes:

- **Brushstrokes** drift across the canvas following invisible currents
- **Stars** pulse like distant suns on a 12-second cosmic rhythm
- **Cards** lift and glow when you approach them
- **Charts** paint themselves with organic, hand-drawn lines
- **Numbers** roll into place like vintage mechanical counters
- **Processes** become constellations in a miniature galaxy

The entire interface oscillates gently — hue shifts, border pulses, ambient breathing — creating the feeling of standing inside a Van Gogh painting at 2am in an artist's studio, watching the canvas come alive by candlelight.

---

## 🏛️ Built Like It Belongs in a Museum

Every detail crafted with intention:
- Glassmorphism cards with hand-painted gold accents
- Custom paintbrush cursor that rotates on click
- Ripples that emanate from data updates
- Heartbeat animations when CPU runs hot
- Anomaly slashes that paint across the screen
- Constellation tooltips with process details

---

## 📊 What It Monitors

- **CPU**: Usage %, core count, frequency
- **Memory**: Used/total GB, percentage
- **Network**: Upload/download MB/s
- **Disk I/O**: Read/write MB/s
- **Processes**: Top 10 by CPU usage
- **Anomalies**: AI-detected unusual patterns
- **Storage**: Drive overview, large files, directory trees

---

## 🎯 Use Cases

- **System Administrators**: Monitor server health with style
- **Developers**: Watch your build processes in a living painting
- **Data Scientists**: Visualize ML training runs artistically
- **Artists**: Experience data as art
- **Anyone**: Who wants their system monitor to be beautiful

---

## 🤝 Contributing

This is art. Contributions welcome, but maintain the aesthetic:
- Keep the Van Gogh palette
- Preserve the painterly feel
- No sharp corners (border-radius: 3px max)
- Typography must be Playfair Display or Crimson Pro
- All animations must breathe organically

---

## 📜 License

MIT License - Paint freely

---

## 🎨 Credits

Inspired by Vincent van Gogh's *Starry Night* (1889)

Built with passion for the intersection of art and technology.

---

**"I dream my painting and I paint my dream."** — Vincent van Gogh

Now your system monitor dreams too. 🌟
