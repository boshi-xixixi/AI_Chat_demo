# AI人格聊天应用 / AI Persona Chat

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

一个专注于自然对话体验的多人格AI聊天系统，让AI像真人一样与你聊天

**🌟 支持火山引擎API和本地Ollama，数据完全本地存储，保护隐私安全**

[🚀 在线体验](https://your-username.github.io/ai-chat) | [📱 移动端适配](#响应式设计) | [📖 使用指南](#使用指南) | [🤝 贡献代码](#贡献)

</div>

## ✨ 特色功能

### 🎭 多人格AI系统
- **个性化人格创建** - 自定义AI的性格、背景和说话风格
- **智能人格切换** - 使用 `/persona` 指令快速切换不同AI角色
- **预设对话系统** - 为每个人格设置开场白和风格模仿对话
- **头像管理** - 支持自定义头像，自动生成字母头像

### 🧠 智能对话体验
- **长期记忆** - AI记住完整的对话历史和上下文
- **自然对话** - 基于先进的AI模型，提供流畅自然的聊天体验
- **情感理解** - AI能够理解和回应用户的情感状态
- **上下文连续性** - 支持长时间对话，保持话题连贯性

### 🔄 双API架构
- **火山引擎API** - 使用doubao-1.5-pro-32k-250115模型，性能强劲
- **本地Ollama支持** - 完全离线使用，保护隐私
- **智能切换** - API故障时自动切换到备用服务
- **性能优化** - 请求缓存、重试机制、负载均衡

### 🌐 实时信息集成
- **MCP协议支持** - 获取真实的天气、时间等信息
- **智能信息检测** - 自动识别用户的信息需求
- **多源数据** - 整合多个数据源提供准确信息
- **优雅降级** - 服务不可用时的友好提示

### 💾 本地数据存储
- **IndexedDB存储** - 高性能本地数据库，支持大量数据
- **数据压缩** - 智能压缩算法，节省50-70%存储空间
- **自动备份** - LocalStorage备份机制，防止数据丢失
- **隐私保护** - 所有数据仅存储在用户本地，不上传服务器

### 📱 响应式设计
- **移动端优化** - 完美适配手机和平板设备
- **触摸友好** - 优化的触摸交互体验
- **自适应布局** - 根据屏幕尺寸自动调整界面
- **PWA支持** - 可安装为桌面应用

### 🎨 现代化界面
- **DaisyUI组件** - 精美的聊天界面和交互组件
- **主题系统** - 支持明暗主题切换
- **动画效果** - 流畅的过渡动画和加载效果
- **无障碍设计** - 符合WCAG标准的可访问性设计

## 🚀 快速开始

### 方式一：在线使用（推荐）
直接访问：[https://your-username.github.io/ai-chat](https://your-username.github.io/ai-chat)

无需安装，打开即用，支持所有现代浏览器。

### 方式二：本地部署
```bash
# 方法1：直接下载
# 下载项目文件，双击打开 index.html

# 方法2：Git克隆
git clone https://github.com/your-username/ai-chat.git
cd ai-chat
# 双击 index.html 或启动本地服务器

# 方法3：本地服务器（推荐）
python -m http.server 8000
# 或者
npx serve .
# 访问 http://localhost:8000
```

### 方式三：桌面版下载（即将推出）
- [Windows版本](releases/latest) - 支持Windows 10/11
- [macOS版本](releases/latest) - 支持macOS 10.15+
- [Linux版本](releases/latest) - 支持Ubuntu/Debian/CentOS

### 首次使用配置
1. **配置API密钥**
   - 火山引擎：在设置中输入API密钥
   - 本地Ollama：确保Ollama服务运行在localhost:11434

2. **创建第一个人格**
   - 点击左侧"新建人格"按钮
   - 填写人格名称和系统提示词
   - 可选：上传头像、设置预设对话

3. **开始聊天**
   - 选择创建的人格
   - 在输入框中输入消息
   - 享受自然的AI对话体验

## 📖 使用指南

### 🔧 基础配置

#### API配置
1. **火山引擎API**
   ```
   设置 → API配置 → 输入火山引擎API密钥
   模型：doubao-1.5-pro-32k-250115
   ```

2. **本地Ollama**
   ```bash
   # 安装Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # 启动服务
   ollama serve
   
   # 下载模型（推荐）
   ollama pull llama2
   ollama pull qwen:7b
   ```

#### 数据存储说明
- **存储位置**：浏览器本地IndexedDB
- **数据安全**：完全本地存储，不上传服务器
- **存储容量**：支持数万条对话记录
- **数据备份**：自动备份到LocalStorage

### 🎭 人格管理详解

#### 创建人格
1. **基础信息**
   - **人格名称**：用于识别和切换（1-50字符）
   - **系统提示词**：定义AI的性格、背景、说话风格（1-2000字符）
   - **头像设置**：支持JPG/PNG/GIF，最大2MB

2. **高级设置**
   - **预设对话**：设置对话开场白，必须成对出现（用户-AI）
   - **风格模仿**：提供示例对话让AI学习特定风格
   - **默认人格**：设置应用启动时的默认人格

#### 人格示例
```
名称：小助手
提示词：你是一个友善的AI助手，总是乐于帮助用户解决问题。你的回答简洁明了，语气温和友好。

名称：文学家
提示词：你是一位博学的文学评论家，对古今中外的文学作品都有深入了解。你喜欢用优美的语言表达，经常引用经典诗句。
```

### 💬 聊天功能

#### 基础聊天
- **发送消息**：输入文字后按Enter或点击发送
- **消息历史**：自动保存所有对话记录
- **上下文理解**：AI记住完整对话历史

#### 指令系统
```
/persona [名称]    # 切换到指定人格
/persona          # 显示所有可用人格
/clear           # 清空当前对话（即将支持）
/export          # 导出聊天记录（即将支持）
```

#### 实时信息查询
- **天气查询**："今天天气怎么样？"、"北京明天会下雨吗？"
- **时间查询**："现在几点了？"、"今天是几号？"
- **其他信息**：根据MCP工具支持的功能

### 📱 移动端使用

#### 界面适配
- **屏幕 < 768px**：自动切换移动端布局
- **侧边栏**：可折叠的人格列表
- **触摸优化**：适合手指操作的按钮大小

#### 移动端技巧
- **快速切换人格**：使用 `/persona` 指令比点击更快
- **长按消息**：复制消息内容（即将支持）
- **下拉刷新**：重新加载对话（即将支持）

### 🔍 故障排除

#### 常见问题
1. **API调用失败**
   - 检查网络连接
   - 验证API密钥是否正确
   - 查看浏览器控制台错误信息

2. **Ollama连接失败**
   - 确认Ollama服务正在运行：`ollama serve`
   - 检查端口是否为11434
   - 确认已下载所需模型

3. **数据丢失**
   - 检查浏览器是否支持IndexedDB
   - 查看LocalStorage备份数据
   - 避免使用无痕模式

4. **界面显示异常**
   - 清除浏览器缓存
   - 检查网络连接（CDN资源）
   - 尝试刷新页面

## 🛠️ 技术架构

### 核心技术栈
- **前端框架**: 原生HTML5 + ES6+ JavaScript
- **UI框架**: TailwindCSS + DaisyUI
- **图标库**: Font Awesome
- **存储方案**: IndexedDB + LocalStorage
- **API集成**: Fetch API + WebSocket (计划中)
- **实时信息**: MCP (Model Context Protocol)
- **桌面版**: Electron (可选)

### 架构设计
```
┌─────────────────────────────────────────────────────────────┐
│                    用户界面层 (UI Layer)                      │
├─────────────────────────────────────────────────────────────┤
│                   业务逻辑层 (Business Layer)                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   人格管理器     │ │   聊天管理器     │ │   设置管理器     │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   服务层 (Service Layer)                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   API服务       │ │   存储服务       │ │   工具服务       │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   数据层 (Data Layer)                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │   IndexedDB     │ │   LocalStorage  │ │   外部API       │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 核心模块

#### 人格管理器 (PersonaManager)
```javascript
class PersonaManager {
  async createPersona(personaData)    // 创建人格
  async updatePersona(id, data)       // 更新人格
  async deletePersona(id)             // 删除人格
  async getAllPersonas()              // 获取所有人格
  switchPersona(id)                   // 切换人格
  validatePersonaData(data)           // 验证人格数据
}
```

#### 聊天管理器 (ChatManager)
```javascript
class ChatManager {
  async sendMessage(message, personaId)  // 发送消息
  async getChatHistory(personaId)        // 获取历史
  async clearChatHistory(personaId)      // 清空历史
  handleCommand(command)                 // 处理指令
  exportChatHistory(personaId, format)   // 导出记录
}
```

#### API服务 (APIService)
```javascript
class APIService {
  async callVolcanoAPI(messages, model)  // 火山引擎API
  async callOllamaAPI(messages, model)   // Ollama API
  async getWeatherData(location)         // 天气数据
  detectMessageType(message)             // 消息类型检测
}
```

### 数据模型

#### 人格数据结构
```javascript
{
  id: string,                    // 唯一标识
  name: string,                  // 人格名称
  prompt: string,                // 系统提示词
  avatar: string,                // 头像(base64)
  beginDialogs: [                // 预设对话
    { role: 'user'|'assistant', content: string }
  ],
  moodImitationDialogs: [        // 风格模仿对话
    { role: 'user'|'assistant', content: string }
  ],
  createdAt: Date,               // 创建时间
  updatedAt: Date,               // 更新时间
  isDefault: boolean             // 是否默认
}
```

#### 消息数据结构
```javascript
{
  id: string,                    // 消息ID
  personaId: string,             // 所属人格
  role: 'user'|'assistant'|'system',  // 角色
  content: string,               // 消息内容
  timestamp: Date,               // 时间戳
  metadata: {                    // 元数据
    model: string,               // 使用的模型
    apiType: 'volcano'|'ollama', // API类型
    tokens: number,              // Token数量
    compressed: boolean,         // 是否压缩
    important: boolean           // 重要标记
  }
}
```

### 性能优化

#### 存储优化
- **数据分页**：每页1000条消息，按需加载
- **智能压缩**：长消息LZ压缩，节省50-70%空间
- **索引优化**：personaId + timestamp复合索引
- **自动清理**：保留3个月+重要对话，自动归档

#### 前端优化
- **懒加载**：聊天记录按需加载
- **虚拟滚动**：大量消息时的性能优化
- **图片压缩**：头像自动压缩到合适尺寸
- **缓存策略**：API响应缓存，减少重复请求

#### API优化
- **请求合并**：批量处理相似请求
- **重试机制**：指数退避重试策略
- **超时控制**：合理的请求超时设置
- **负载均衡**：多端点轮询使用

## 📁 项目结构

```
ai-chat/
├── index.html                    # 主应用文件
├── index_clean.html             # 简化版本
├── test-ollama-guide.html       # Ollama测试指南
├── assets/                      # 静态资源
│   └── js/                     # JavaScript模块
│       ├── core.js             # 核心应用逻辑
│       ├── persona-manager.js  # 人格管理
│       ├── chat-manager.js     # 聊天管理
│       ├── api-service.js      # API服务
│       ├── enhanced-api-service.js  # 增强API服务
│       ├── database.js         # 数据库操作
│       ├── settings-manager.js # 设置管理
│       ├── settings-ui.js      # 设置界面
│       ├── mcp-service.js      # MCP服务
│       ├── guide-service.js    # 引导服务
│       ├── error-handler.js    # 错误处理
│       ├── loading-manager.js  # 加载管理
│       ├── performance-optimizer.js  # 性能优化
│       ├── memory-manager.js   # 内存管理
│       ├── context-manager.js  # 上下文管理
│       ├── session-continuity-manager.js  # 会话连续性
│       ├── conversation-style-manager.js  # 对话风格
│       ├── emotion-recognition.js  # 情感识别
│       ├── command-processor.js    # 指令处理
│       ├── avatar-manager.js   # 头像管理
│       ├── responsive-manager.js   # 响应式管理
│       ├── storage-fallback.js # 存储备份
│       ├── test-suite.js       # 测试套件
│       └── testing-ui.js       # 测试界面
├── .github/                    # GitHub配置
│   ├── workflows/              # GitHub Actions
│   │   └── deploy.yml         # 自动部署配置
│   └── ISSUE_TEMPLATE/        # Issue模板
│       ├── bug_report.md      # Bug报告模板
│       └── feature_request.md # 功能请求模板
├── .kiro/                     # Kiro配置
│   └── specs/                 # 规格文档
│       └── enhanced-ai-chat/  # 项目规格
├── docs/                      # 文档目录（即将添加）
│   ├── api.md                # API文档
│   ├── deployment.md         # 部署指南
│   └── development.md        # 开发指南
├── README.md                  # 项目说明（中文）
├── README_EN.md              # 项目说明（英文，即将添加）
├── CONTRIBUTING.md           # 贡献指南
├── LICENSE                   # MIT许可证
└── .gitignore               # Git忽略文件
```

## ❓ 常见问题 (FAQ)

### 🔧 安装和配置

**Q: 如何获取火山引擎API密钥？**
A: 
1. 访问[火山引擎控制台](https://console.volcengine.com/)
2. 注册并完成实名认证
3. 开通"火山方舟"服务
4. 在API管理中创建密钥
5. 复制密钥到应用设置中

**Q: Ollama安装失败怎么办？**
A: 
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# 下载官方安装包：https://ollama.ai/download
```

**Q: 为什么无法连接到Ollama？**
A: 
1. 确认Ollama服务正在运行：`ollama serve`
2. 检查端口是否为11434：`netstat -an | grep 11434`
3. 确认防火墙没有阻止连接
4. 尝试重启Ollama服务

### 💾 数据和存储

**Q: 我的聊天记录会丢失吗？**
A: 不会。所有数据都存储在浏览器本地的IndexedDB中，除非你主动清除浏览器数据。应用还会自动备份到LocalStorage。

**Q: 如何备份我的数据？**
A: 
1. 浏览器会自动备份数据
2. 可以使用浏览器的导出功能
3. 即将支持手动导出功能

**Q: 可以在多个设备间同步数据吗？**
A: 目前不支持，数据仅存储在本地。未来版本将考虑添加可选的云同步功能。

**Q: 数据存储有大小限制吗？**
A: IndexedDB通常支持几GB的存储空间，足够存储数万条对话记录。

### 🤖 AI和对话

**Q: 为什么AI回复很慢？**
A: 
1. 检查网络连接
2. 火山引擎API可能有延迟
3. 尝试切换到本地Ollama
4. 检查API配额是否用完

**Q: 如何让AI更好地理解我？**
A: 
1. 在系统提示词中详细描述AI的角色
2. 使用预设对话提供示例
3. 保持对话的连续性
4. 提供清晰具体的问题

**Q: AI忘记了之前的对话怎么办？**
A: 
1. 检查对话历史是否正常保存
2. 避免清除浏览器数据
3. 确认没有切换到其他人格
4. 重新加载页面试试

### 🎭 人格管理

**Q: 可以创建多少个人格？**
A: 理论上没有限制，但建议不超过50个以保证性能。

**Q: 如何创建一个好的人格？**
A: 
1. 明确定义角色背景和性格特点
2. 提供具体的说话风格示例
3. 设置合适的预设对话
4. 测试和调整提示词

**Q: 人格之间会互相影响吗？**
A: 不会。每个人格的对话历史是独立存储的，不会相互影响。

### 📱 移动端使用

**Q: 手机上使用体验如何？**
A: 应用专门优化了移动端体验，支持触摸操作，界面自适应，使用流畅。

**Q: 可以安装到手机桌面吗？**
A: 是的，应用支持PWA，可以添加到手机桌面，像原生应用一样使用。

### 🔒 隐私和安全

**Q: 我的对话内容会被上传吗？**
A: 不会。除了发送给AI API的消息外，所有数据都存储在你的本地浏览器中。

**Q: 使用本地Ollama更安全吗？**
A: 是的。使用本地Ollama时，所有对话都在本地处理，不会发送到任何服务器。

**Q: API密钥安全吗？**
A: API密钥存储在浏览器本地，不会上传到服务器。建议定期更换密钥。

### 🐛 故障排除

**Q: 页面显示异常怎么办？**
A: 
1. 刷新页面（Ctrl+F5 或 Cmd+Shift+R）
2. 清除浏览器缓存
3. 检查网络连接
4. 尝试其他浏览器

**Q: 消息发送失败怎么办？**
A: 
1. 检查API配置是否正确
2. 确认网络连接正常
3. 查看浏览器控制台错误信息
4. 尝试切换API服务

**Q: 如何报告Bug？**
A: 请在GitHub上创建Issue，提供详细的错误信息和复现步骤。

## 🔧 开发

### 环境要求
- 现代浏览器 (Chrome, Firefox, Safari, Edge)
- 本地HTTP服务器 (可选，用于避免CORS问题)

### 本地开发
```bash
# 克隆项目
git clone https://github.com/your-username/ai-chat.git

# 进入目录
cd ai-chat

# 启动本地服务器
python -m http.server 8000
# 或者
npx serve .

# 访问 http://localhost:8000
```

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md)

### 贡献方式
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [TailwindCSS](https://tailwindcss.com/) - CSS框架
- [DaisyUI](https://daisyui.com/) - UI组件库
- [火山引擎](https://www.volcengine.com/) - AI服务
- [Ollama](https://ollama.ai/) - 本地AI模型

## 📞 联系

如有问题或建议，请：
- 创建 [Issue](issues)
- 发送邮件到 your-email@example.com
- 关注项目获取最新动态

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！**

</div>