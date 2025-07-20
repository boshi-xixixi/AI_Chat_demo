# AI Persona Chat Application

<div align="center">

![AI Chat](https://img.shields.io/badge/AI-Chat-blue)
![Build Status](https://github.com/your-username/enhanced-ai-chat/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Active-brightgreen)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![DaisyUI](https://img.shields.io/badge/DaisyUI-5A0EF8?logo=daisyui&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![GitHub Issues](https://img.shields.io/github/issues/your-username/enhanced-ai-chat)
![GitHub Stars](https://img.shields.io/github/stars/your-username/enhanced-ai-chat)
![GitHub Forks](https://img.shields.io/github/forks/your-username/enhanced-ai-chat)

A multi-persona AI chat system focused on natural conversation experience, making AI chat like talking to real people

**🌟 Supports Volcano Engine API and local Ollama, with complete local data storage for privacy protection**

[🚀 Live Demo](https://your-username.github.io/ai-chat) | [📱 Mobile Responsive](#responsive-design) | [📖 User Guide](#user-guide) | [🤝 Contributing](#contributing)

</div>

## ✨ Key Features

### 🎭 Multi-Persona AI System
- **Personalized Persona Creation** - Customize AI personality, background, and speaking style
- **Smart Persona Switching** - Use `/persona` commands to quickly switch between different AI characters
- **Preset Dialog System** - Set opening conversations and style imitation dialogs for each persona
- **Avatar Management** - Support custom avatars with automatic letter avatar generation

### 🧠 Intelligent Conversation Experience
- **Long-term Memory** - AI remembers complete conversation history and context
- **Natural Dialogue** - Based on advanced AI models for smooth and natural chat experience
- **Emotional Understanding** - AI can understand and respond to user emotional states
- **Context Continuity** - Support long conversations while maintaining topic coherence

### 🔄 Dual API Architecture
- **Volcano Engine API** - Using doubao-1.5-pro-32k-250115 model with powerful performance
- **Local Ollama Support** - Completely offline usage for privacy protection
- **Smart Switching** - Automatic fallback to backup service when API fails
- **Performance Optimization** - Request caching, retry mechanisms, load balancing

### 🌐 Real-time Information Integration
- **MCP Protocol Support** - Get real weather, time and other information
- **Smart Information Detection** - Automatically identify user information needs
- **Multi-source Data** - Integrate multiple data sources for accurate information
- **Graceful Degradation** - Friendly prompts when services are unavailable

### 💾 Local Data Storage
- **IndexedDB Storage** - High-performance local database supporting massive data
- **Data Compression** - Smart compression algorithms saving 50-70% storage space
- **Automatic Backup** - LocalStorage backup mechanism preventing data loss
- **Privacy Protection** - All data stored locally only, never uploaded to servers

### 📱 Responsive Design
- **Mobile Optimization** - Perfect adaptation for phones and tablets
- **Touch Friendly** - Optimized touch interaction experience
- **Adaptive Layout** - Automatically adjust interface based on screen size
- **PWA Support** - Installable as desktop application

### 🎨 Modern Interface
- **DaisyUI Components** - Beautiful chat interface and interactive components
- **Theme System** - Support light/dark theme switching
- **Animation Effects** - Smooth transition animations and loading effects
- **Accessibility Design** - WCAG compliant accessibility design

## 🚀 Quick Start

### Method 1: Online Usage (Recommended)
Visit directly: [https://your-username.github.io/ai-chat](https://your-username.github.io/ai-chat)

No installation required, works in all modern browsers.

### Method 2: Local Deployment
```bash
# Method 1: Direct download
# Download project files, double-click index.html

# Method 2: Git clone
git clone https://github.com/your-username/ai-chat.git
cd ai-chat
# Double-click index.html or start local server

# Method 3: Local server (recommended)
python -m http.server 8000
# or
npx serve .
# Visit http://localhost:8000
```

### Method 3: Desktop Version Download (Coming Soon)
- [Windows Version](releases/latest) - Supports Windows 10/11
- [macOS Version](releases/latest) - Supports macOS 10.15+
- [Linux Version](releases/latest) - Supports Ubuntu/Debian/CentOS

### First-time Setup
1. **Configure API Key**
   - Volcano Engine: Enter API key in settings
   - Local Ollama: Ensure Ollama service runs on localhost:11434

2. **Create First Persona**
   - Click "New Persona" button on the left
   - Fill in persona name and system prompt
   - Optional: Upload avatar, set preset dialogs

3. **Start Chatting**
   - Select created persona
   - Type message in input box
   - Enjoy natural AI conversation experience

## 📖 User Guide

### 🔧 Basic Configuration

#### API Configuration
1. **Volcano Engine API**
   ```
   Settings → API Configuration → Enter Volcano Engine API Key
   Model: doubao-1.5-pro-32k-250115
   ```

2. **Local Ollama**
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Start service
   ollama serve
   
   # Download models (recommended)
   ollama pull llama2
   ollama pull qwen:7b
   ```

#### Data Storage Information
- **Storage Location**: Browser local IndexedDB
- **Data Security**: Completely local storage, not uploaded to servers
- **Storage Capacity**: Supports tens of thousands of conversation records
- **Data Backup**: Automatic backup to LocalStorage

### 🎭 Persona Management Guide

#### Creating Personas
1. **Basic Information**
   - **Persona Name**: For identification and switching (1-50 characters)
   - **System Prompt**: Define AI personality, background, speaking style (1-2000 characters)
   - **Avatar Setting**: Support JPG/PNG/GIF, max 2MB

2. **Advanced Settings**
   - **Preset Dialogs**: Set conversation openers, must appear in pairs (user-AI)
   - **Style Imitation**: Provide example conversations for AI to learn specific styles
   - **Default Persona**: Set default persona when app starts

#### Persona Examples
```
Name: Assistant
Prompt: You are a friendly AI assistant, always willing to help users solve problems. Your answers are concise and clear, with a gentle and friendly tone.

Name: Literary Scholar
Prompt: You are a knowledgeable literary critic with deep understanding of literature from ancient to modern times. You like to express yourself in beautiful language and often quote classic poems.
```

### 💬 Chat Features

#### Basic Chat
- **Send Messages**: Type text and press Enter or click send
- **Message History**: Automatically save all conversation records
- **Context Understanding**: AI remembers complete conversation history

#### Command System
```
/persona [name]    # Switch to specified persona
/persona          # Show all available personas
/clear           # Clear current conversation (coming soon)
/export          # Export chat records (coming soon)
```

#### Real-time Information Queries
- **Weather Queries**: "How's the weather today?", "Will it rain in Beijing tomorrow?"
- **Time Queries**: "What time is it now?", "What's today's date?"
- **Other Information**: Based on MCP tool supported features

### 📱 Mobile Usage

#### Interface Adaptation
- **Screen < 768px**: Automatically switch to mobile layout
- **Sidebar**: Collapsible persona list
- **Touch Optimization**: Button sizes suitable for finger operation

#### Mobile Tips
- **Quick Persona Switch**: Using `/persona` commands is faster than clicking
- **Long Press Messages**: Copy message content (coming soon)
- **Pull to Refresh**: Reload conversation (coming soon)

### 🔍 Troubleshooting

#### Common Issues
1. **API Call Failed**
   - Check network connection
   - Verify API key is correct
   - Check browser console for error messages

2. **Ollama Connection Failed**
   - Confirm Ollama service is running: `ollama serve`
   - Check if port is 11434
   - Confirm required models are downloaded

3. **Data Loss**
   - Check if browser supports IndexedDB
   - Check LocalStorage backup data
   - Avoid using incognito mode

4. **Interface Display Issues**
   - Clear browser cache
   - Check network connection (CDN resources)
   - Try refreshing the page

## 🛠️ Technical Architecture

### Core Technology Stack
- **Frontend Framework**: Native HTML5 + ES6+ JavaScript
- **UI Framework**: TailwindCSS + DaisyUI
- **Icon Library**: Font Awesome
- **Storage Solution**: IndexedDB + LocalStorage
- **API Integration**: Fetch API + WebSocket (planned)
- **Real-time Information**: MCP (Model Context Protocol)
- **Desktop Version**: Electron (optional)

### Architecture Design
```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer                                  │
├─────────────────────────────────────────────────────────────┤
│                   Business Layer                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │ Persona Manager │ │  Chat Manager   │ │Settings Manager │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   Service Layer                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │  API Service    │ │Storage Service  │ │  Tool Service   │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   Data Layer                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   IndexedDB     │ │  LocalStorage   │ │  External API   │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
ai-chat/
├── index.html                    # Main application file
├── index_clean.html             # Simplified version
├── test-ollama-guide.html       # Ollama test guide
├── assets/                      # Static resources
│   └── js/                     # JavaScript modules
│       ├── core.js             # Core application logic
│       ├── persona-manager.js  # Persona management
│       ├── chat-manager.js     # Chat management
│       ├── api-service.js      # API service
│       └── ...                 # Other modules
├── docs/                       # Documentation
│   ├── api.md                 # API documentation
│   ├── deployment.md          # Deployment guide
│   └── development.md         # Development guide
├── .github/                   # GitHub configuration
├── README.md                  # Project description (Chinese)
├── README_EN.md              # Project description (English)
├── CONTRIBUTING.md           # Contributing guide
└── LICENSE                   # MIT license
```

## ❓ FAQ

### 🔧 Installation and Configuration

**Q: How to get Volcano Engine API key?**
A: 
1. Visit [Volcano Engine Console](https://console.volcengine.com/)
2. Register and complete real-name verification
3. Enable "Volcano Ark" service
4. Create key in API management
5. Copy key to application settings

**Q: What if Ollama installation fails?**
A: 
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download official installer: https://ollama.ai/download
```

### 💾 Data and Storage

**Q: Will my chat records be lost?**
A: No. All data is stored in browser's local IndexedDB, unless you actively clear browser data. The app also automatically backs up to LocalStorage.

**Q: Can data be synced across multiple devices?**
A: Currently not supported, data is only stored locally. Future versions will consider adding optional cloud sync functionality.

### 🤖 AI and Conversation

**Q: Why is AI response slow?**
A: 
1. Check network connection
2. Volcano Engine API may have latency
3. Try switching to local Ollama
4. Check if API quota is exhausted

**Q: How to make AI understand me better?**
A: 
1. Describe AI role in detail in system prompt
2. Use preset dialogs to provide examples
3. Maintain conversation continuity
4. Provide clear and specific questions

### 🔒 Privacy and Security

**Q: Will my conversation content be uploaded?**
A: No. Except for messages sent to AI APIs, all data is stored in your local browser.

**Q: Is using local Ollama safer?**
A: Yes. When using local Ollama, all conversations are processed locally and not sent to any servers.

## 🔧 Development

### Environment Requirements
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Local HTTP server (optional, to avoid CORS issues)

### Local Development
```bash
# Clone project
git clone https://github.com/your-username/ai-chat.git

# Enter directory
cd ai-chat

# Start local server
python -m http.server 8000
# or
npx serve .

# Visit http://localhost:8000
```

## 🤝 Contributing

Welcome to contribute code! Please check [Contributing Guide](CONTRIBUTING.md)

### How to Contribute
1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [TailwindCSS](https://tailwindcss.com/) - CSS Framework
- [DaisyUI](https://daisyui.com/) - UI Component Library
- [Volcano Engine](https://www.volcengine.com/) - AI Service
- [Ollama](https://ollama.ai/) - Local AI Models

## 📞 Contact

For questions or suggestions, please:
- Create [Issue](issues)
- Send email to your-email@example.com
- Follow the project for latest updates

---

<div align="center">

**If this project helps you, please give it a ⭐ Star for support!**

</div>