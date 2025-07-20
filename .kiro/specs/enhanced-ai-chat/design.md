# 设计文档

## 概述

增强版AI聊天应用将在现有HTML基础上构建一个功能完整的多人格AI聊天系统。应用采用纯前端架构，使用HTML + DaisyUI实现现代化的聊天界面，结合现代Web技术实现本地数据存储、多API集成和丰富的用户交互功能。选择保守技术栈确保快速开发和稳定运行。

## 架构

### 整体架构
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

### 技术栈选择

**前端技术：**
- HTML5 + CSS3 + JavaScript (ES6+)
- TailwindCSS + DaisyUI - 现代化UI组件库，专业聊天界面
- Font Awesome - 图标库
- 原生Web APIs - 文件处理、存储等
- LangUI组件 - 可选的AI聊天专用组件

**DaisyUI组件使用：**
- `chat` - 聊天气泡组件，支持用户和AI消息样式
- `avatar` - 头像组件，支持图片和字母头像
- `card` - 人格卡片展示
- `modal` - 人格编辑弹窗
- `input` - 消息输入框
- `button` - 各种操作按钮
- `drawer` - 移动端侧边栏
- `loading` - 加载状态指示器

**数据存储：**
- IndexedDB - 主要数据存储（聊天记录、人格数据）
- LocalStorage - 配置和临时数据存储
- 文件系统API - 头像图片存储

**API集成：**
- Fetch API - HTTP请求处理
- 火山引擎API - 主要AI服务
- Ollama API - 本地AI服务
- MCP (Model Context Protocol) - 实时信息获取
- 天气API - 通过MCP获取天气数据
- 时间API - 获取准确时间信息

## 组件和接口

### 核心组件

#### 1. PersonaManager (人格管理器)
```javascript
class PersonaManager {
  // 创建新人格
  async createPersona(personaData)
  
  // 更新人格信息
  async updatePersona(id, personaData)
  
  // 删除人格
  async deletePersona(id)
  
  // 获取所有人格
  async getAllPersonas()
  
  // 切换当前人格
  switchPersona(id)
  
  // 验证人格数据
  validatePersonaData(data)
}
```

#### 2. ChatManager (聊天管理器)
```javascript
class ChatManager {
  // 发送消息
  async sendMessage(message, personaId)
  
  // 获取聊天历史
  async getChatHistory(personaId)
  
  // 清空聊天记录
  async clearChatHistory(personaId)
  
  // 处理指令
  handleCommand(command)
  
  // 导出聊天记录
  exportChatHistory(personaId, format)
}
```

#### 3. APIService (API服务)
```javascript
class APIService {
  // 调用火山引擎API
  async callVolcanoAPI(messages, model)
  
  // 调用Ollama API
  async callOllamaAPI(messages, model)
  
  // 调用天气API
  async getWeatherData(location)
  
  // 检测消息类型
  detectMessageType(message)
}
```

#### 4. StorageService (存储服务)
```javascript
class StorageService {
  // IndexedDB操作
  async initDB()
  async savePersona(persona)
  async loadPersonas()
  async saveChatMessage(message)
  async loadChatHistory(personaId)
  
  // LocalStorage操作
  saveSettings(settings)
  loadSettings()
  saveCache(key, data)
  loadCache(key)
}
```

#### 5. MCPService (MCP服务)
```javascript
class MCPService {
  // 初始化MCP连接
  async initMCP()
  
  // 获取天气信息
  async getWeather(location)
  
  // 获取当前时间
  getCurrentTime()
  
  // 检测消息中的信息需求
  detectInfoRequest(message)
  
  // 调用相应的MCP工具
  async callMCPTool(toolName, params)
}
```

### 扩展组件（可选）

#### 6. MediaService (多媒体服务)
```javascript
class MediaService {
  // 图片处理
  async uploadImage(file)
  async recognizeImage(imageData)
  
  // 语音处理
  async startVoiceRecording()
  async stopVoiceRecording()
  async textToSpeech(text)
  
  // 文件处理
  async uploadDocument(file)
  async extractDocumentContent(file)
}
```

#### 7. GuideService (引导服务)
```javascript
class GuideService {
  // 首次使用引导
  async showWelcomeGuide()
  async showOllamaSetupGuide()
  
  // Ollama状态检测
  async detectOllamaStatus()
  async checkOllamaModels()
  
  // 帮助系统
  showHelpDialog(topic)
  showDataStorageInfo()
  
  // 引导状态管理
  markGuideCompleted(guideType)
  isGuideCompleted(guideType)
}
```

#### 8. PluginManager (插件管理器)
```javascript
class PluginManager {
  // 插件生命周期
  async loadPlugin(pluginName)
  async unloadPlugin(pluginName)
  
  // 插件通信
  async callPlugin(pluginName, method, params)
  registerPluginAPI(apiName, handler)
  
  // 插件管理
  getAvailablePlugins()
  getActivePlugins()
}
```

### 桌面应用架构（可选）

#### Electron集成
```javascript
// 主进程 (main.js)
const { app, BrowserWindow, Menu, Tray } = require('electron')

class DesktopApp {
  // 窗口管理
  createMainWindow()
  createTrayIcon()
  
  // 系统集成
  setupMenuBar()
  setupNotifications()
  setupAutoUpdater()
  
  // 数据同步
  syncWithBrowserVersion()
}
```

### 数据模型

#### Persona模型
```javascript
{
  id: string,
  name: string,
  prompt: string,
  avatar: string, // base64编码的图片或null
  beginDialogs: [
    { role: 'user'|'assistant', content: string }
  ],
  moodImitationDialogs: [
    { role: 'user'|'assistant', content: string }
  ],
  createdAt: Date,
  updatedAt: Date,
  isDefault: boolean
}
```

#### Message模型
```javascript
{
  id: string,
  personaId: string,
  role: 'user'|'assistant'|'system',
  content: string, // 长内容自动压缩
  timestamp: Date,
  metadata: {
    model: string,
    apiType: 'volcano'|'ollama',
    tokens: number,
    compressed: boolean, // 是否压缩存储
    important: boolean   // 重要对话标记
  }
}
```

#### Settings模型
```javascript
{
  defaultPersonaId: string,
  apiSettings: {
    volcanoApiKey: string,
    ollamaEndpoint: string,
    weatherApiKey: string,
    preferredModel: 'volcano'|'ollama'
  },
  uiSettings: {
    theme: 'light'|'dark',
    language: 'zh-CN'|'en-US',
    autoSave: boolean
  }
}
```

## 错误处理

### API错误处理策略
1. **网络错误：** 显示重试按钮，支持自动重试机制
2. **认证错误：** 提示用户检查API密钥设置
3. **限流错误：** 显示等待时间，自动延迟重试
4. **服务不可用：** 自动切换到备用服务（如从火山引擎切换到Ollama）

### 数据存储错误处理
1. **IndexedDB不可用：** 自动降级到LocalStorage
2. **存储空间不足：** 提示用户清理旧数据
3. **数据损坏：** 尝试恢复，失败则重置为默认状态

### 用户输入验证
1. **人格名称：** 不能为空，长度限制1-50字符
2. **系统提示词：** 长度限制1-2000字符
3. **对话对数：** 必须为偶数个
4. **头像文件：** 限制格式（jpg, png, gif），大小不超过2MB

## 测试策略

### 单元测试
- 各个管理器类的方法测试
- 数据模型验证测试
- API调用模拟测试
- 存储服务测试

### 集成测试
- 完整的聊天流程测试
- 人格切换功能测试
- 数据持久化测试
- API集成测试

### 用户界面测试
- 响应式设计测试
- 交互功能测试
- 错误状态显示测试
- 性能测试

### 兼容性测试
- 主流浏览器兼容性
- 移动设备适配测试
- IndexedDB支持测试
- 文件API支持测试

## 性能优化

### 前端优化
1. **懒加载：** 聊天记录按需加载
2. **虚拟滚动：** 大量消息时使用虚拟滚动
3. **图片压缩：** 头像上传时自动压缩
4. **缓存策略：** API响应缓存，减少重复请求

### 存储优化
1. **数据分页：** 聊天记录分页存储和加载，每页1000条消息
2. **索引优化：** 为personaId、timestamp建立复合索引
3. **智能清理：** 保留最近3个月+重要对话，自动归档旧数据
4. **压缩存储：** 长消息使用LZ压缩，节省50-70%空间
5. **分库策略：** 按人格分别存储，避免单表过大
6. **存储监控：** 实时监控存储使用量，提醒用户清理

### API优化
1. **请求合并：** 批量处理相似请求
2. **超时控制：** 设置合理的请求超时时间
3. **重试机制：** 指数退避重试策略
4. **负载均衡：** 多个API端点轮询使用

## 安全考虑

### 数据安全
1. **本地加密：** 敏感数据本地加密存储
2. **API密钥保护：** 密钥不在代码中硬编码
3. **输入验证：** 严格验证用户输入
4. **XSS防护：** 消息内容转义处理

### 隐私保护
1. **数据本地化：** 所有数据存储在用户本地
2. **匿名化：** 不收集用户个人信息
3. **透明度：** 明确告知数据使用方式
4. **用户控制：** 用户可完全控制自己的数据