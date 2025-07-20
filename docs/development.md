# 开发指南

## 概述

本文档为AI人格聊天应用的开发者提供详细的开发指南，包括环境搭建、代码结构、开发流程和最佳实践。

## 开发环境搭建

### 必需工具

1. **现代浏览器**
   - Chrome 90+ (推荐)
   - Firefox 88+
   - Safari 14+
   - Edge 90+

2. **代码编辑器**
   - VS Code (推荐)
   - WebStorm
   - Sublime Text
   - Vim/Neovim

3. **版本控制**
   - Git 2.20+

4. **本地服务器**
   - Python 3.x (内置http.server)
   - Node.js (npx serve)
   - PHP (内置服务器)

### 可选工具

1. **API测试**
   - Postman
   - Insomnia
   - curl

2. **调试工具**
   - Chrome DevTools
   - Firefox Developer Tools
   - React Developer Tools (如果使用React)

3. **本地AI服务**
   - Ollama
   - LocalAI

### 环境配置

#### 1. 克隆项目

```bash
git clone https://github.com/your-username/ai-chat.git
cd ai-chat
```

#### 2. 启动本地服务器

```bash
# 方法1: Python
python -m http.server 8000

# 方法2: Node.js
npx serve . -p 8000

# 方法3: PHP
php -S localhost:8000

# 访问 http://localhost:8000
```

#### 3. 配置API密钥

创建 `.env.local` 文件（可选）：
```bash
VOLCANO_API_KEY=your_volcano_api_key
OLLAMA_ENDPOINT=http://localhost:11434
```

## 项目结构详解

### 目录结构

```
ai-chat/
├── index.html                    # 主应用入口
├── index_clean.html             # 简化版本
├── test-ollama-guide.html       # Ollama测试页面
├── assets/                      # 静态资源
│   └── js/                     # JavaScript模块
│       ├── core.js             # 核心应用逻辑
│       ├── persona-manager.js  # 人格管理模块
│       ├── chat-manager.js     # 聊天管理模块
│       ├── api-service.js      # 基础API服务
│       ├── enhanced-api-service.js  # 增强API服务
│       ├── database.js         # 数据库操作
│       ├── settings-manager.js # 设置管理
│       ├── settings-ui.js      # 设置界面
│       ├── mcp-service.js      # MCP服务
│       ├── guide-service.js    # 用户引导
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
├── docs/                       # 文档
│   ├── api.md                 # API文档
│   ├── deployment.md          # 部署指南
│   └── development.md         # 开发指南
├── .github/                   # GitHub配置
│   ├── workflows/             # GitHub Actions
│   └── ISSUE_TEMPLATE/        # Issue模板
├── README.md                  # 项目说明
├── CONTRIBUTING.md           # 贡献指南
└── LICENSE                   # 许可证
```

### 核心模块说明

#### core.js - 核心应用逻辑
应用的主入口，负责初始化和协调各个模块。

```javascript
class AIChat {
  constructor() {
    this.personaManager = new PersonaManager();
    this.chatManager = new ChatManager();
    this.apiService = new APIService();
    // ... 其他模块
  }
  
  async init() {
    // 初始化应用
  }
}
```

#### persona-manager.js - 人格管理
处理AI人格的CRUD操作和切换逻辑。

```javascript
class PersonaManager {
  constructor() {
    this.currentPersona = null;
    this.personas = new Map();
  }
  
  // 核心方法
  async createPersona(data) { /* ... */ }
  async updatePersona(id, data) { /* ... */ }
  async deletePersona(id) { /* ... */ }
  switchPersona(id) { /* ... */ }
}
```

#### chat-manager.js - 聊天管理
处理消息发送、接收和历史记录管理。

```javascript
class ChatManager {
  constructor(apiService, storageService) {
    this.apiService = apiService;
    this.storageService = storageService;
    this.messageQueue = [];
  }
  
  async sendMessage(content, personaId) { /* ... */ }
  async loadChatHistory(personaId) { /* ... */ }
}
```

## 开发流程

### 1. 功能开发流程

#### 新功能开发
1. **创建功能分支**
   ```bash
   git checkout -b feature/new-feature-name
   ```

2. **编写代码**
   - 遵循代码规范
   - 添加必要注释
   - 编写单元测试

3. **测试功能**
   - 本地测试
   - 浏览器兼容性测试
   - 性能测试

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   git push origin feature/new-feature-name
   ```

5. **创建Pull Request**
   - 详细描述功能
   - 添加测试截图
   - 请求代码审查

#### Bug修复流程
1. **创建修复分支**
   ```bash
   git checkout -b fix/bug-description
   ```

2. **定位问题**
   - 使用浏览器开发者工具
   - 查看控制台错误
   - 分析错误堆栈

3. **修复问题**
   - 最小化修改范围
   - 添加防御性代码
   - 更新相关测试

4. **验证修复**
   - 复现原始问题
   - 验证修复效果
   - 回归测试

### 2. 代码规范

#### JavaScript规范

```javascript
// 使用const/let，避免var
const apiService = new APIService();
let currentPersona = null;

// 函数命名使用驼峰命名法
function handleUserMessage(message) {
  // 函数体
}

// 类名使用帕斯卡命名法
class PersonaManager {
  constructor() {
    this.personas = new Map();
  }
  
  // 方法使用驼峰命名法
  async createPersona(personaData) {
    // 方法体
  }
}

// 常量使用大写下划线
const API_ENDPOINTS = {
  VOLCANO: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  OLLAMA: 'http://localhost:11434/api/chat'
};

// 使用模板字符串
const message = `用户 ${userName} 发送了消息: ${content}`;

// 使用解构赋值
const { name, prompt, avatar } = personaData;

// 使用箭头函数（适当时）
const processMessage = (message) => {
  return message.trim().toLowerCase();
};

// 错误处理
try {
  const result = await apiService.callAPI(messages);
  return result;
} catch (error) {
  console.error('API调用失败:', error);
  throw new APIError('API调用失败', error);
}
```

#### HTML规范

```html
<!-- 使用语义化标签 -->
<main class="chat-container">
  <aside class="persona-sidebar">
    <nav class="persona-list">
      <!-- 人格列表 -->
    </nav>
  </aside>
  
  <section class="chat-area">
    <header class="chat-header">
      <!-- 聊天头部 -->
    </header>
    
    <div class="messages-container">
      <!-- 消息列表 -->
    </div>
    
    <footer class="input-area">
      <!-- 输入区域 -->
    </footer>
  </section>
</main>

<!-- 使用适当的属性 -->
<button 
  type="button" 
  class="btn btn-primary" 
  aria-label="发送消息"
  data-action="send-message">
  发送
</button>

<!-- 表单验证 -->
<input 
  type="text" 
  name="persona-name" 
  required 
  maxlength="50" 
  placeholder="输入人格名称"
  aria-describedby="name-help">
<div id="name-help" class="form-help">
  人格名称长度为1-50个字符
</div>
```

#### CSS规范

```css
/* 使用BEM命名法 */
.persona-card {
  /* 块 */
}

.persona-card__avatar {
  /* 元素 */
}

.persona-card--active {
  /* 修饰符 */
}

/* 使用CSS自定义属性 */
:root {
  --primary-color: #165DFF;
  --secondary-color: #36D399;
  --text-color: #1E293B;
  --bg-color: #F8FAFC;
}

.chat-message {
  color: var(--text-color);
  background-color: var(--bg-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .persona-sidebar {
    transform: translateX(-100%);
  }
  
  .persona-sidebar--open {
    transform: translateX(0);
  }
}
```

### 3. 测试策略

#### 单元测试

```javascript
// test-suite.js 示例
class TestSuite {
  constructor() {
    this.tests = [];
    this.results = [];
  }
  
  // 测试人格创建
  async testPersonaCreation() {
    const personaManager = new PersonaManager();
    
    const testData = {
      name: "测试人格",
      prompt: "你是一个测试AI"
    };
    
    try {
      const result = await personaManager.createPersona(testData);
      this.assert(result.success, "人格创建应该成功");
      this.assert(result.data.name === testData.name, "人格名称应该匹配");
      return { passed: true, message: "人格创建测试通过" };
    } catch (error) {
      return { passed: false, message: `人格创建测试失败: ${error.message}` };
    }
  }
  
  // 测试API调用
  async testAPICall() {
    const apiService = new APIService();
    
    const messages = [
      { role: "user", content: "Hello" }
    ];
    
    try {
      const result = await apiService.callOllamaAPI(messages);
      this.assert(result.success, "API调用应该成功");
      this.assert(result.data.content, "应该返回内容");
      return { passed: true, message: "API调用测试通过" };
    } catch (error) {
      return { passed: false, message: `API调用测试失败: ${error.message}` };
    }
  }
  
  // 断言方法
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }
  
  // 运行所有测试
  async runAllTests() {
    const testMethods = [
      'testPersonaCreation',
      'testAPICall',
      // 添加更多测试方法
    ];
    
    for (const method of testMethods) {
      if (typeof this[method] === 'function') {
        const result = await this[method]();
        this.results.push(result);
      }
    }
    
    return this.results;
  }
}
```

#### 集成测试

```javascript
// 完整流程测试
async function testCompleteFlow() {
  const app = new AIChat();
  await app.init();
  
  // 1. 创建人格
  const persona = await app.personaManager.createPersona({
    name: "测试助手",
    prompt: "你是一个友善的测试助手"
  });
  
  // 2. 切换人格
  app.personaManager.switchPersona(persona.data.id);
  
  // 3. 发送消息
  const result = await app.chatManager.sendMessage(
    "你好，请介绍一下自己",
    persona.data.id
  );
  
  // 4. 验证结果
  console.assert(result.success, "消息发送应该成功");
  console.assert(result.data.aiResponse.content, "应该收到AI回复");
  
  console.log("完整流程测试通过");
}
```

#### 性能测试

```javascript
// 性能测试工具
class PerformanceTest {
  static async measureExecutionTime(fn, name) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    console.log(`${name} 执行时间: ${end - start}ms`);
  }
  
  static async testDatabasePerformance() {
    const storageService = new StorageService();
    await storageService.initDB();
    
    // 测试批量插入
    await this.measureExecutionTime(async () => {
      const messages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        personaId: 'test-persona',
        role: 'user',
        content: `测试消息 ${i}`,
        timestamp: new Date()
      }));
      
      for (const message of messages) {
        await storageService.saveChatMessage(message);
      }
    }, "批量插入1000条消息");
    
    // 测试查询性能
    await this.measureExecutionTime(async () => {
      await storageService.loadChatHistory('test-persona', { limit: 100 });
    }, "查询100条消息");
  }
}
```

### 4. 调试技巧

#### 浏览器开发者工具

1. **Console调试**
   ```javascript
   // 使用console.group组织日志
   console.group('API调用');
   console.log('请求参数:', params);
   console.log('响应数据:', response);
   console.groupEnd();
   
   // 使用console.table显示表格数据
   console.table(personas);
   
   // 使用console.time测量性能
   console.time('数据库查询');
   await storageService.loadPersonas();
   console.timeEnd('数据库查询');
   ```

2. **断点调试**
   ```javascript
   function processMessage(message) {
     debugger; // 设置断点
     const processed = message.trim();
     return processed;
   }
   ```

3. **网络面板**
   - 监控API请求
   - 检查请求头和响应
   - 分析网络性能

#### 错误处理和日志

```javascript
// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', {
    message: event.error.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error.stack
  });
});

// Promise错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
});

// 自定义日志系统
class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    console[level](logEntry);
    
    // 可选：发送到远程日志服务
    if (level === 'error') {
      this.sendToRemoteLogger(logEntry);
    }
  }
  
  static info(message, data) {
    this.log('info', message, data);
  }
  
  static warn(message, data) {
    this.log('warn', message, data);
  }
  
  static error(message, data) {
    this.log('error', message, data);
  }
}
```

## 最佳实践

### 1. 代码组织

#### 模块化设计
```javascript
// 使用ES6模块
// persona-manager.js
export class PersonaManager {
  // 实现
}

// core.js
import { PersonaManager } from './persona-manager.js';
import { ChatManager } from './chat-manager.js';

class AIChat {
  constructor() {
    this.personaManager = new PersonaManager();
    this.chatManager = new ChatManager();
  }
}
```

#### 依赖注入
```javascript
class ChatManager {
  constructor(apiService, storageService, eventEmitter) {
    this.apiService = apiService;
    this.storageService = storageService;
    this.eventEmitter = eventEmitter;
  }
}

// 在应用初始化时注入依赖
const apiService = new APIService();
const storageService = new StorageService();
const eventEmitter = new EventEmitter();
const chatManager = new ChatManager(apiService, storageService, eventEmitter);
```

### 2. 性能优化

#### 懒加载
```javascript
// 懒加载聊天历史
class ChatManager {
  async loadChatHistory(personaId, page = 0, pageSize = 50) {
    const offset = page * pageSize;
    return await this.storageService.loadChatHistory(personaId, {
      limit: pageSize,
      offset
    });
  }
}
```

#### 防抖和节流
```javascript
// 防抖：用户输入时的搜索
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const searchPersonas = debounce((query) => {
  // 搜索逻辑
}, 300);

// 节流：滚动事件处理
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

const handleScroll = throttle(() => {
  // 滚动处理逻辑
}, 100);
```

#### 内存管理
```javascript
class MemoryManager {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 1000;
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxCacheSize) {
      // 删除最旧的条目
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  get(key) {
    return this.cache.get(key);
  }
  
  clear() {
    this.cache.clear();
  }
}
```

### 3. 安全考虑

#### 输入验证
```javascript
class Validator {
  static validatePersonaName(name) {
    if (!name || typeof name !== 'string') {
      throw new ValidationError('人格名称必须是字符串');
    }
    
    if (name.length < 1 || name.length > 50) {
      throw new ValidationError('人格名称长度必须在1-50个字符之间');
    }
    
    // 防止XSS
    const sanitized = name.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    return sanitized.trim();
  }
  
  static validatePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new ValidationError('系统提示词必须是字符串');
    }
    
    if (prompt.length < 1 || prompt.length > 2000) {
      throw new ValidationError('系统提示词长度必须在1-2000个字符之间');
    }
    
    return prompt.trim();
  }
}
```

#### 数据清理
```javascript
class DataSanitizer {
  static sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  static sanitizeMessage(message) {
    // 移除潜在的恶意脚本
    return message
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}
```

### 4. 可访问性

#### 键盘导航
```javascript
// 键盘事件处理
document.addEventListener('keydown', (event) => {
  // Ctrl/Cmd + Enter 发送消息
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    sendMessage();
  }
  
  // Escape 关闭模态框
  if (event.key === 'Escape') {
    closeModal();
  }
  
  // Tab 导航
  if (event.key === 'Tab') {
    handleTabNavigation(event);
  }
});
```

#### ARIA标签
```html
<!-- 聊天消息 -->
<div 
  class="chat-message" 
  role="log" 
  aria-live="polite" 
  aria-label="聊天消息">
  <div class="message-content" aria-describedby="message-time">
    消息内容
  </div>
  <div id="message-time" class="message-time">
    2024-01-01 12:00:00
  </div>
</div>

<!-- 人格列表 -->
<nav class="persona-list" role="navigation" aria-label="AI人格列表">
  <ul role="list">
    <li role="listitem">
      <button 
        type="button" 
        aria-pressed="false" 
        aria-describedby="persona-description">
        人格名称
      </button>
    </li>
  </ul>
</nav>
```

## 扩展开发

### 1. 插件系统

```javascript
// 插件基类
class Plugin {
  constructor(name, version) {
    this.name = name;
    this.version = version;
    this.enabled = false;
  }
  
  async init(app) {
    this.app = app;
    await this.onInit();
    this.enabled = true;
  }
  
  async destroy() {
    await this.onDestroy();
    this.enabled = false;
  }
  
  // 子类需要实现的方法
  async onInit() {
    throw new Error('Plugin must implement onInit method');
  }
  
  async onDestroy() {
    // 可选实现
  }
}

// 示例插件
class WeatherPlugin extends Plugin {
  constructor() {
    super('weather', '1.0.0');
  }
  
  async onInit() {
    // 注册天气查询命令
    this.app.commandProcessor.registerCommand('weather', this.handleWeatherCommand.bind(this));
  }
  
  async handleWeatherCommand(args) {
    const location = args.join(' ') || '北京';
    const weather = await this.getWeather(location);
    return `${location}的天气：${weather}`;
  }
  
  async getWeather(location) {
    // 天气API调用逻辑
    return '晴天，25°C';
  }
}

// 插件管理器
class PluginManager {
  constructor() {
    this.plugins = new Map();
  }
  
  async loadPlugin(plugin) {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already loaded`);
    }
    
    await plugin.init(this.app);
    this.plugins.set(plugin.name, plugin);
  }
  
  async unloadPlugin(name) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      await plugin.destroy();
      this.plugins.delete(name);
    }
  }
}
```

### 2. 主题系统

```javascript
// 主题管理器
class ThemeManager {
  constructor() {
    this.themes = new Map();
    this.currentTheme = 'light';
  }
  
  registerTheme(name, theme) {
    this.themes.set(name, theme);
  }
  
  applyTheme(name) {
    const theme = this.themes.get(name);
    if (!theme) {
      throw new Error(`Theme ${name} not found`);
    }
    
    const root = document.documentElement;
    Object.entries(theme.variables).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    this.currentTheme = name;
    localStorage.setItem('theme', name);
  }
  
  getCurrentTheme() {
    return this.currentTheme;
  }
}

// 主题定义
const lightTheme = {
  name: 'light',
  variables: {
    'primary-color': '#165DFF',
    'bg-color': '#FFFFFF',
    'text-color': '#1E293B',
    'border-color': '#E2E8F0'
  }
};

const darkTheme = {
  name: 'dark',
  variables: {
    'primary-color': '#3B82F6',
    'bg-color': '#1E293B',
    'text-color': '#F8FAFC',
    'border-color': '#475569'
  }
};
```

## 部署和发布

### 1. 构建流程

```bash
# 创建构建脚本 build.sh
#!/bin/bash

echo "开始构建..."

# 1. 清理旧文件
rm -rf dist/

# 2. 创建构建目录
mkdir -p dist/

# 3. 复制文件
cp index.html dist/
cp -r assets/ dist/
cp README.md dist/
cp LICENSE dist/

# 4. 压缩JavaScript（可选）
# 如果使用Node.js工具
# npx terser assets/js/*.js --compress --mangle -o dist/assets/js/app.min.js

# 5. 优化图片（可选）
# imagemin assets/images/* --out-dir=dist/assets/images/

echo "构建完成！"
```

### 2. 版本管理

```javascript
// version.js
const VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  build: Date.now(),
  toString() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
};

// 版本检查
async function checkVersion() {
  try {
    const response = await fetch('/version.json');
    const remoteVersion = await response.json();
    
    if (remoteVersion.version !== VERSION.toString()) {
      showUpdateNotification();
    }
  } catch (error) {
    console.warn('版本检查失败:', error);
  }
}
```

### 3. 发布清单

发布前检查清单：

- [ ] 代码审查完成
- [ ] 所有测试通过
- [ ] 性能测试通过
- [ ] 浏览器兼容性测试
- [ ] 移动端测试
- [ ] 文档更新
- [ ] 版本号更新
- [ ] 更新日志编写
- [ ] 安全检查
- [ ] 备份数据

通过遵循这些开发指南和最佳实践，你可以高效地开发和维护AI人格聊天应用，确保代码质量和用户体验。