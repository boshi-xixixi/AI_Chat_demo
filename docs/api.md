# API 文档

## 概述

AI人格聊天应用的API文档，包含所有核心模块的接口说明和使用示例。

## 核心模块

### PersonaManager - 人格管理器

人格管理器负责AI人格的创建、编辑、删除和切换。

#### 方法

##### `createPersona(personaData)`
创建新的AI人格。

**参数：**
```javascript
personaData = {
  name: string,                    // 人格名称 (1-50字符)
  prompt: string,                  // 系统提示词 (1-2000字符)
  avatar: string,                  // 头像base64字符串 (可选)
  beginDialogs: Array,             // 预设对话数组 (可选)
  moodImitationDialogs: Array,     // 风格模仿对话数组 (可选)
  isDefault: boolean               // 是否设为默认人格 (可选)
}
```

**返回值：**
```javascript
Promise<{
  success: boolean,
  data: PersonaObject,
  error?: string
}>
```

**示例：**
```javascript
const personaManager = new PersonaManager();

const newPersona = await personaManager.createPersona({
  name: "小助手",
  prompt: "你是一个友善的AI助手，总是乐于帮助用户。",
  beginDialogs: [
    { role: "user", content: "你好" },
    { role: "assistant", content: "你好！我是你的AI助手，有什么可以帮助你的吗？" }
  ]
});
```

##### `updatePersona(id, personaData)`
更新现有人格信息。

**参数：**
- `id` (string): 人格ID
- `personaData` (object): 要更新的人格数据

**返回值：**
```javascript
Promise<{
  success: boolean,
  data: PersonaObject,
  error?: string
}>
```

##### `deletePersona(id)`
删除指定人格。

**参数：**
- `id` (string): 人格ID

**返回值：**
```javascript
Promise<{
  success: boolean,
  error?: string
}>
```

##### `getAllPersonas()`
获取所有人格列表。

**返回值：**
```javascript
Promise<{
  success: boolean,
  data: PersonaObject[],
  error?: string
}>
```

##### `switchPersona(id)`
切换当前活跃人格。

**参数：**
- `id` (string): 人格ID

**返回值：**
```javascript
{
  success: boolean,
  data: PersonaObject,
  error?: string
}
```

### ChatManager - 聊天管理器

聊天管理器处理消息发送、接收和历史记录管理。

#### 方法

##### `sendMessage(message, personaId)`
发送消息并获取AI回复。

**参数：**
- `message` (string): 用户消息内容
- `personaId` (string): 目标人格ID

**返回值：**
```javascript
Promise<{
  success: boolean,
  data: {
    userMessage: MessageObject,
    aiResponse: MessageObject
  },
  error?: string
}>
```

**示例：**
```javascript
const chatManager = new ChatManager();

const result = await chatManager.sendMessage(
  "今天天气怎么样？", 
  "persona-123"
);

if (result.success) {
  console.log("AI回复:", result.data.aiResponse.content);
}
```

##### `getChatHistory(personaId, options)`
获取指定人格的聊天历史。

**参数：**
- `personaId` (string): 人格ID
- `options` (object): 查询选项
  - `limit` (number): 返回消息数量限制，默认100
  - `offset` (number): 偏移量，默认0
  - `startDate` (Date): 开始日期 (可选)
  - `endDate` (Date): 结束日期 (可选)

**返回值：**
```javascript
Promise<{
  success: boolean,
  data: {
    messages: MessageObject[],
    total: number,
    hasMore: boolean
  },
  error?: string
}>
```

##### `clearChatHistory(personaId)`
清空指定人格的聊天历史。

**参数：**
- `personaId` (string): 人格ID

**返回值：**
```javascript
Promise<{
  success: boolean,
  error?: string
}>
```

##### `handleCommand(command)`
处理聊天指令。

**参数：**
- `command` (string): 指令字符串

**支持的指令：**
- `/persona [名称]` - 切换人格
- `/persona` - 显示所有人格
- `/clear` - 清空当前对话
- `/export` - 导出聊天记录

**返回值：**
```javascript
{
  success: boolean,
  data: any,
  message: string,
  error?: string
}
```

### APIService - API服务

API服务负责与外部AI服务的通信。

#### 方法

##### `callVolcanoAPI(messages, model, options)`
调用火山引擎API。

**参数：**
- `messages` (Array): 消息数组
- `model` (string): 模型名称，默认"doubao-1.5-pro-32k-250115"
- `options` (object): 请求选项
  - `temperature` (number): 温度参数，默认0.7
  - `maxTokens` (number): 最大token数，默认2000

**返回值：**
```javascript
Promise<{
  success: boolean,
  data: {
    content: string,
    usage: {
      promptTokens: number,
      completionTokens: number,
      totalTokens: number
    }
  },
  error?: string
}>
```

##### `callOllamaAPI(messages, model, options)`
调用本地Ollama API。

**参数：**
- `messages` (Array): 消息数组
- `model` (string): 模型名称，默认"llama2"
- `options` (object): 请求选项

**返回值：**
```javascript
Promise<{
  success: boolean,
  data: {
    content: string,
    model: string,
    createdAt: string
  },
  error?: string
}>
```

##### `detectMessageType(message)`
检测消息类型，判断是否需要实时信息。

**参数：**
- `message` (string): 消息内容

**返回值：**
```javascript
{
  type: 'weather' | 'time' | 'normal',
  confidence: number,
  extractedInfo?: object
}
```

### StorageService - 存储服务

存储服务管理本地数据存储。

#### 方法

##### `initDB()`
初始化IndexedDB数据库。

**返回值：**
```javascript
Promise<{
  success: boolean,
  error?: string
}>
```

##### `savePersona(persona)`
保存人格数据。

**参数：**
- `persona` (PersonaObject): 人格对象

**返回值：**
```javascript
Promise<{
  success: boolean,
  data: PersonaObject,
  error?: string
}>
```

##### `loadPersonas()`
加载所有人格数据。

**返回值：**
```javascript
Promise<{
  success: boolean,
  data: PersonaObject[],
  error?: string
}>
```

##### `saveChatMessage(message)`
保存聊天消息。

**参数：**
- `message` (MessageObject): 消息对象

**返回值：**
```javascript
Promise<{
  success: boolean,
  data: MessageObject,
  error?: string
}>
```

##### `loadChatHistory(personaId, options)`
加载聊天历史。

**参数：**
- `personaId` (string): 人格ID
- `options` (object): 查询选项

**返回值：**
```javascript
Promise<{
  success: boolean,
  data: MessageObject[],
  error?: string
}>
```

## 数据模型

### PersonaObject - 人格对象

```javascript
{
  id: string,                      // 唯一标识符
  name: string,                    // 人格名称
  prompt: string,                  // 系统提示词
  avatar: string | null,           // 头像base64字符串
  beginDialogs: DialogObject[],    // 预设对话
  moodImitationDialogs: DialogObject[], // 风格模仿对话
  createdAt: Date,                 // 创建时间
  updatedAt: Date,                 // 更新时间
  isDefault: boolean,              // 是否默认人格
  settings: {                      // 人格设置
    temperature: number,           // 温度参数
    maxTokens: number,             // 最大token数
    model: string                  // 首选模型
  }
}
```

### MessageObject - 消息对象

```javascript
{
  id: string,                      // 消息ID
  personaId: string,               // 所属人格ID
  role: 'user' | 'assistant' | 'system', // 消息角色
  content: string,                 // 消息内容
  timestamp: Date,                 // 时间戳
  metadata: {                      // 元数据
    model: string,                 // 使用的模型
    apiType: 'volcano' | 'ollama', // API类型
    tokens: number,                // token数量
    compressed: boolean,           // 是否压缩存储
    important: boolean,            // 重要消息标记
    responseTime: number           // 响应时间(ms)
  }
}
```

### DialogObject - 对话对象

```javascript
{
  role: 'user' | 'assistant',      // 对话角色
  content: string                  // 对话内容
}
```

## 错误处理

### 错误类型

#### APIError - API错误
```javascript
{
  code: 'API_ERROR',
  message: string,
  details: {
    apiType: 'volcano' | 'ollama',
    statusCode: number,
    response: any
  }
}
```

#### StorageError - 存储错误
```javascript
{
  code: 'STORAGE_ERROR',
  message: string,
  details: {
    operation: string,
    storageType: 'indexeddb' | 'localstorage'
  }
}
```

#### ValidationError - 验证错误
```javascript
{
  code: 'VALIDATION_ERROR',
  message: string,
  details: {
    field: string,
    value: any,
    constraint: string
  }
}
```

### 错误处理示例

```javascript
try {
  const result = await chatManager.sendMessage("Hello", "persona-123");
  if (!result.success) {
    throw new Error(result.error);
  }
} catch (error) {
  if (error.code === 'API_ERROR') {
    console.error('API调用失败:', error.message);
    // 尝试切换到备用API
  } else if (error.code === 'STORAGE_ERROR') {
    console.error('存储操作失败:', error.message);
    // 尝试使用备用存储
  } else {
    console.error('未知错误:', error.message);
  }
}
```

## 事件系统

### 事件类型

#### persona-switched - 人格切换事件
```javascript
document.addEventListener('persona-switched', (event) => {
  const { oldPersona, newPersona } = event.detail;
  console.log(`从 ${oldPersona.name} 切换到 ${newPersona.name}`);
});
```

#### message-sent - 消息发送事件
```javascript
document.addEventListener('message-sent', (event) => {
  const { message, persona } = event.detail;
  console.log(`向 ${persona.name} 发送消息:`, message.content);
});
```

#### message-received - 消息接收事件
```javascript
document.addEventListener('message-received', (event) => {
  const { message, persona } = event.detail;
  console.log(`收到 ${persona.name} 的回复:`, message.content);
});
```

## 配置选项

### 全局配置

```javascript
window.AIChat = {
  config: {
    // API配置
    api: {
      volcano: {
        endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        model: 'doubao-1.5-pro-32k-250115',
        timeout: 30000
      },
      ollama: {
        endpoint: 'http://localhost:11434/api/chat',
        model: 'llama2',
        timeout: 60000
      }
    },
    
    // 存储配置
    storage: {
      dbName: 'AIChat',
      version: 1,
      maxMessages: 10000,
      compressionThreshold: 1000
    },
    
    // UI配置
    ui: {
      theme: 'light',
      language: 'zh-CN',
      autoSave: true,
      showTypingIndicator: true
    }
  }
};
```

## 使用示例

### 完整的聊天流程

```javascript
// 初始化应用
const app = new AIChat();
await app.init();

// 创建人格
const persona = await app.personaManager.createPersona({
  name: "小助手",
  prompt: "你是一个友善的AI助手。"
});

// 切换到新人格
app.personaManager.switchPersona(persona.data.id);

// 发送消息
const result = await app.chatManager.sendMessage(
  "你好，请介绍一下自己", 
  persona.data.id
);

// 处理回复
if (result.success) {
  console.log("AI回复:", result.data.aiResponse.content);
} else {
  console.error("发送失败:", result.error);
}
```

### 批量操作示例

```javascript
// 批量创建人格
const personas = [
  { name: "助手", prompt: "你是一个助手" },
  { name: "老师", prompt: "你是一个老师" },
  { name: "朋友", prompt: "你是一个朋友" }
];

const createdPersonas = await Promise.all(
  personas.map(p => app.personaManager.createPersona(p))
);

// 批量获取聊天历史
const histories = await Promise.all(
  createdPersonas.map(p => 
    app.chatManager.getChatHistory(p.data.id, { limit: 50 })
  )
);
```

## 扩展开发

### 自定义插件

```javascript
class CustomPlugin {
  constructor(app) {
    this.app = app;
  }
  
  async init() {
    // 注册事件监听器
    document.addEventListener('message-sent', this.onMessageSent.bind(this));
  }
  
  async onMessageSent(event) {
    const { message } = event.detail;
    // 自定义处理逻辑
    console.log('插件处理消息:', message.content);
  }
}

// 注册插件
app.registerPlugin('custom', new CustomPlugin(app));
```

### 自定义API服务

```javascript
class CustomAPIService extends APIService {
  async callCustomAPI(messages, options) {
    // 实现自定义API调用
    const response = await fetch('/api/custom-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, ...options })
    });
    
    return await response.json();
  }
}

// 替换默认API服务
app.apiService = new CustomAPIService();
```