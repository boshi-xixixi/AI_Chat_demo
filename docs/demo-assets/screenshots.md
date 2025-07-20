# Demo Screenshots and GIFs

This document provides guidance for creating compelling demo assets for the Enhanced AI Chat project.

## Required Screenshots

### 1. Main Interface (main-interface.png)
**Purpose**: Show the complete application interface
**Content**:
- Active chat conversation with an AI persona
- Sidebar showing multiple personas
- Modern DaisyUI interface
- Message bubbles with user and AI responses
- Input area with send button

**Specifications**:
- Resolution: 1920x1080 or 1280x720
- Format: PNG
- Show realistic conversation content
- Include at least 3-4 message exchanges

### 2. Persona Creation (persona-creation.png)
**Purpose**: Demonstrate persona customization
**Content**:
- Persona creation modal/dialog
- Filled form with example data
- Avatar upload area
- System prompt text area
- Preset dialog configuration

**Example Data**:
```
Name: 文学助手
System Prompt: 你是一位博学的文学评论家，对古今中外的文学作品都有深入了解...
Avatar: Custom uploaded image or letter avatar
```

### 3. Settings Panel (settings-panel.png)
**Purpose**: Show configuration options
**Content**:
- API configuration section
- Volcano Engine and Ollama settings
- Theme selection
- Data storage information
- Privacy settings

### 4. Mobile Interface (mobile-interface.png)
**Purpose**: Demonstrate mobile responsiveness
**Content**:
- Mobile-optimized layout
- Collapsible sidebar
- Touch-friendly buttons
- Responsive chat interface

**Specifications**:
- Mobile viewport (375x667 or similar)
- Show both collapsed and expanded states

### 5. Persona Switching (persona-switching.png)
**Purpose**: Show persona management
**Content**:
- Multiple personas in sidebar
- Active persona highlighted
- Different avatar styles
- Persona context menu

## Required GIFs

### 1. Chat Flow Demo (chat-flow-demo.gif)
**Purpose**: Show natural conversation flow
**Content**:
- User typing message
- AI response appearing
- Smooth animations
- Context continuity

**Specifications**:
- Duration: 8-12 seconds
- Frame rate: 12-15 FPS
- File size: < 5MB
- Show 2-3 message exchanges

### 2. Persona Switching Demo (persona-switching-demo.gif)
**Purpose**: Demonstrate persona switching
**Content**:
- Click on different persona
- Interface updates
- Conversation style changes
- Smooth transitions

**Specifications**:
- Duration: 6-10 seconds
- Show switching between 2-3 personas
- Include `/persona` command usage

### 3. Setup Demo (setup-demo.gif)
**Purpose**: Show initial configuration
**Content**:
- Opening settings
- Entering API key
- Creating first persona
- Starting first conversation

**Specifications**:
- Duration: 15-20 seconds
- Step-by-step process
- Clear visual feedback

### 4. Mobile Usage Demo (mobile-usage-demo.gif)
**Purpose**: Show mobile experience
**Content**:
- Opening sidebar
- Sending messages
- Responsive interactions
- Touch gestures

## Creation Guidelines

### Screenshot Best Practices
1. **Consistent Environment**:
   - Use same browser/device
   - Consistent zoom level (100%)
   - Clean, uncluttered background

2. **Content Quality**:
   - Use realistic, engaging conversation examples
   - Show meaningful persona differences
   - Include Chinese and English content
   - Avoid personal information

3. **Visual Appeal**:
   - Good contrast and lighting
   - Focus on key features
   - Crop appropriately
   - Maintain aspect ratios

### GIF Best Practices
1. **Performance**:
   - Optimize file size (< 10MB)
   - Use appropriate frame rate
   - Compress colors when possible

2. **Content Flow**:
   - Clear beginning and end
   - Smooth transitions
   - Appropriate pacing
   - Brief pauses to show results

3. **User Experience**:
   - Show realistic usage patterns
   - Include loading states
   - Demonstrate key features
   - Keep viewers engaged

## Tools and Resources

### Screenshot Tools
- **macOS**: Built-in Screenshot (⌘+Shift+4)
- **Windows**: Snipping Tool, Snip & Sketch
- **Linux**: GNOME Screenshot, Flameshot
- **Browser**: DevTools device simulation

### GIF Creation Tools
- **Cross-platform**: LICEcap (free)
- **macOS**: GIPHY Capture, Kap
- **Windows**: ScreenToGif
- **Linux**: Peek
- **Online**: Ezgif.com for editing

### Image Optimization
- **TinyPNG**: PNG compression
- **ImageOptim**: macOS optimization
- **Squoosh**: Web-based compression
- **GIMP**: Advanced editing

## Example Conversations for Screenshots

### Casual Chat Example
```
User: 今天天气怎么样？
AI Assistant: 今天北京的天气很不错！阳光明媚，温度大约22度，微风习习。正是出门散步的好天气呢！你有什么户外活动计划吗？

User: 我想去公园走走
AI Assistant: 太好了！公园散步是很棒的选择。记得带上水壶，虽然天气不热但保持水分很重要。如果你喜欢拍照，今天的光线特别适合拍一些自然风景呢！
```

### Literary Persona Example
```
User: 推荐一本好书吧
Literary Scholar: 我向您推荐加西亚·马尔克斯的《百年孤独》。这部魔幻现实主义的杰作，如诗人所言"文学是可以居住的谎言"，马尔克斯用绚烂的想象力构建了一个既真实又超现实的世界。

User: 这本书有什么特别之处？
Literary Scholar: 《百年孤独》的特别之处在于其独特的叙事结构和深刻的主题。正如博尔赫斯所说："时间是构成我的物质"，马尔克斯在这部作品中巧妙地处理了时间的循环性...
```

## File Organization

```
docs/demo-assets/
├── screenshots/
│   ├── main-interface.png
│   ├── persona-creation.png
│   ├── settings-panel.png
│   ├── mobile-interface.png
│   └── persona-switching.png
├── gifs/
│   ├── chat-flow-demo.gif
│   ├── persona-switching-demo.gif
│   ├── setup-demo.gif
│   └── mobile-usage-demo.gif
└── thumbnails/
    ├── main-interface-thumb.png
    └── ...
```

## Usage in Documentation

### README Integration
```markdown
## 🎬 Demo

### Main Interface
![Main Interface](docs/demo-assets/screenshots/main-interface.png)

### Quick Demo
![Chat Demo](docs/demo-assets/gifs/chat-flow-demo.gif)

### Mobile Experience
<img src="docs/demo-assets/screenshots/mobile-interface.png" width="300" alt="Mobile Interface">
```

### GitHub Pages Integration
- Add to project homepage
- Include in feature descriptions
- Use in tutorials and guides
- Embed in documentation

## Quality Checklist

Before publishing demo assets:

- [ ] All screenshots are high resolution
- [ ] GIFs are optimized for web
- [ ] No personal information visible
- [ ] Consistent visual style
- [ ] Realistic demo content
- [ ] Files properly named
- [ ] Appropriate file sizes
- [ ] Cross-platform compatibility tested