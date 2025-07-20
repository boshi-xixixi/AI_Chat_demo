/**
 * AI人格聊天应用 - 核心架构
 * 
 * 这是一个专注于自然对话体验的多人格AI聊天系统的核心模块。
 * 采用模块化设计，支持火山引擎API和本地Ollama，数据完全本地存储。
 * 
 * 主要功能：
 * - 多人格AI管理和切换
 * - 智能对话记忆和上下文管理
 * - 双API架构（火山引擎 + Ollama）
 * - 本地数据存储（IndexedDB + LocalStorage备份）
 * - 响应式设计和移动端适配
 * - 实时信息获取（MCP协议）
 * 
 * @author AI Chat Team
 * @version 1.0.0
 * @since 2025-01-20
 */

/**
 * 应用核心配置
 * 包含API端点、存储配置、UI设置等全局配置项
 */
const CONFIG = {
  /** 应用版本号 */
  version: '1.0.0',
  
  /** API服务端点配置 */
  apiEndpoints: {
    /** 火山引擎API端点 */
    volcano: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    /** 本地Ollama API端点 */
    ollama: 'http://localhost:11434/api/chat'
  },
  
  /** 数据存储配置 */
  storage: {
    /** IndexedDB数据库名称 */
    dbName: 'AIPersonaChatDB',
    /** 数据库版本号 */
    dbVersion: 1,
    /** 对象存储名称映射 */
    stores: {
      personas: 'personas',    // 人格数据存储
      messages: 'messages',    // 消息数据存储
      settings: 'settings'     // 设置数据存储
    }
  },
  
  /** UI界面配置 */
  ui: {
    /** 支持的主题列表 */
    themes: ['light', 'dark'],
    /** 单条消息最大长度 */
    maxMessageLength: 4000,
    /** 聊天历史最大显示数量 */
    maxHistoryLength: 100
  }
};

/**
 * 通用工具函数集合
 * 提供应用中常用的工具方法，包括ID生成、时间格式化、防抖、验证等
 */
const Utils = {
  /**
   * 生成唯一标识符
   * 使用时间戳和随机数组合生成唯一ID，确保在单个会话中的唯一性
   * 
   * @returns {string} 格式为 'id_' + 随机字符串 + 时间戳 的唯一标识符
   * @example
   * const id = Utils.generateId(); // 'id_abc123def456'
   */
  generateId() {
    return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  },

  /**
   * 格式化时间显示
   * 将时间戳转换为用户友好的相对时间显示
   * 
   * @param {Date|number} date - 要格式化的日期对象或时间戳
   * @returns {string} 格式化后的时间字符串
   * @example
   * Utils.formatTime(new Date()) // '刚刚'
   * Utils.formatTime(Date.now() - 60000) // '1分钟前'
   */
  formatTime(date) {
    const now = new Date();
    const targetDate = date instanceof Date ? date : new Date(date);
    const diff = now - targetDate;
    
    // 1分钟内显示"刚刚"
    if (diff < 60000) return '刚刚';
    // 1小时内显示分钟
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    // 1天内显示小时
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    // 超过1天显示日期
    return targetDate.toLocaleDateString('zh-CN');
  },

  /**
   * 防抖函数
   * 在指定时间内多次调用只执行最后一次，常用于搜索输入、窗口resize等场景
   * 
   * @param {Function} func - 要防抖的函数
   * @param {number} wait - 等待时间（毫秒）
   * @returns {Function} 防抖后的函数
   * @example
   * const debouncedSearch = Utils.debounce(searchFunction, 300);
   * input.addEventListener('input', debouncedSearch);
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * 深拷贝对象
   * 创建对象的完全独立副本，避免引用问题
   * 注意：不支持函数、Symbol、undefined等特殊类型
   * 
   * @param {any} obj - 要拷贝的对象
   * @returns {any} 深拷贝后的对象
   * @example
   * const copy = Utils.deepClone(originalObject);
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
    
    // 对于普通对象使用JSON方法（性能较好）
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      console.warn('深拷贝失败，使用浅拷贝:', error);
      return { ...obj };
    }
  },

  /**
   * 数据验证工具集
   * 提供常用的数据验证方法，确保数据的有效性和安全性
   */
  validate: {
    /**
     * 验证人格名称
     * @param {string} name - 人格名称
     * @returns {boolean} 是否有效
     */
    personaName: (name) => {
      return name && 
             typeof name === 'string' && 
             name.trim().length > 0 && 
             name.trim().length <= 50;
    },
    
    /**
     * 验证系统提示词
     * @param {string} prompt - 系统提示词
     * @returns {boolean} 是否有效
     */
    prompt: (prompt) => {
      return prompt && 
             typeof prompt === 'string' && 
             prompt.trim().length > 0 && 
             prompt.trim().length <= 2000;
    },
    
    /**
     * 验证对话对数组（必须成对出现）
     * @param {Array} dialogs - 对话数组
     * @returns {boolean} 是否有效
     */
    dialogPairs: (dialogs) => {
      return Array.isArray(dialogs) && 
             dialogs.length % 2 === 0 &&
             dialogs.every(dialog => 
               dialog && 
               typeof dialog === 'object' && 
               dialog.role && 
               dialog.content
             );
    },
    
    /**
     * 验证API密钥格式
     * @param {string} apiKey - API密钥
     * @returns {boolean} 是否有效
     */
    apiKey: (apiKey) => {
      return apiKey && 
             typeof apiKey === 'string' && 
             apiKey.trim().length > 10;
    }
  }
};

/**
 * 存储服务类
 * 
 * 提供统一的数据存储接口，支持IndexedDB和LocalStorage双重存储策略。
 * 优先使用IndexedDB以获得更好的性能和容量，在不支持时自动降级到LocalStorage。
 * 
 * 特性：
 * - 自动降级机制：IndexedDB -> LocalStorage
 * - 统一的异步API接口
 * - 数据完整性保证
 * - 错误恢复机制
 * 
 * @class StorageService
 */
class StorageService {
  /**
   * 创建存储服务实例
   */
  constructor() {
    /** @type {DatabaseManager|null} IndexedDB管理器实例 */
    this.database = null;
    
    /** @type {LocalStorageFallback|null} LocalStorage备份实例 */
    this.fallback = null;
    
    /** @type {boolean} 服务是否已初始化 */
    this.isReady = false;
    
    /** @type {string} 当前使用的存储类型 */
    this.storageType = null;
  }

  /**
   * 初始化存储服务
   * 
   * 按优先级尝试初始化存储方案：
   * 1. 首先尝试IndexedDB（推荐，性能好，容量大）
   * 2. 失败时降级到LocalStorage（兼容性好，但容量有限）
   * 
   * @async
   * @throws {Error} 当所有存储方案都失败时抛出错误
   * @example
   * const storage = new StorageService();
   * await storage.init();
   */
  async init() {
    try {
      // 尝试使用IndexedDB - 现代浏览器的首选方案
      this.database = new AIChat.DatabaseManager();
      await this.database.init();
      this.isReady = true;
      this.storageType = 'IndexedDB';
      console.log('✅ 存储服务初始化完成 - 使用IndexedDB');
    } catch (error) {
      console.warn('⚠️ IndexedDB初始化失败，尝试LocalStorage降级:', error);
      
      try {
        // 降级到LocalStorage - 兼容性方案
        this.fallback = new AIChat.LocalStorageFallback();
        await this.fallback.init();
        this.isReady = true;
        this.storageType = 'LocalStorage';
        console.log('✅ 存储服务初始化完成 - 使用LocalStorage');
      } catch (fallbackError) {
        console.error('❌ 所有存储方案初始化失败:', fallbackError);
        throw new Error('存储服务初始化失败：浏览器不支持数据存储');
      }
    }
  }

  /**
   * 获取当前存储实例
   */
  _getStorage() {
    return this.database || this.fallback;
  }

  /**
   * 检查是否已初始化
   */
  _checkReady() {
    if (!this.isReady) {
      throw new Error('存储服务未初始化');
    }
  }

  /**
   * 保存人格
   */
  async savePersona(persona) {
    this._checkReady();
    const storage = this._getStorage();
    
    // 确保必要字段
    const personaData = {
      ...persona,
      updatedAt: new Date(),
      createdAt: persona.createdAt || new Date()
    };
    
    return await storage.put('personas', personaData);
  }

  /**
   * 获取所有人格
   */
  async loadPersonas() {
    this._checkReady();
    const storage = this._getStorage();
    return await storage.getAll('personas');
  }

  /**
   * 获取单个人格
   */
  async getPersona(id) {
    this._checkReady();
    const storage = this._getStorage();
    return await storage.get('personas', id);
  }

  /**
   * 删除人格
   */
  async deletePersona(id) {
    this._checkReady();
    const storage = this._getStorage();
    
    // 同时删除相关消息
    await this.deleteChatHistory(id);
    
    return await storage.delete('personas', id);
  }

  /**
   * 保存消息
   */
  async saveMessage(message) {
    this._checkReady();
    const storage = this._getStorage();
    
    // 确保必要字段
    const messageData = {
      ...message,
      timestamp: message.timestamp || new Date()
    };
    
    return await storage.put('messages', messageData);
  }

  /**
   * 获取聊天历史
   */
  async loadChatHistory(personaId, limit = 50) {
    this._checkReady();
    const storage = this._getStorage();
    
    const messages = await storage.getAllByIndex('messages', 'personaId', personaId);
    
    // 按时间排序并限制数量
    return messages
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-limit);
  }

  /**
   * 删除聊天历史
   */
  async deleteChatHistory(personaId) {
    this._checkReady();
    const storage = this._getStorage();
    
    const messages = await storage.getAllByIndex('messages', 'personaId', personaId);
    
    const deleteOperations = messages.map(message => 
      () => storage.delete('messages', message.id)
    );
    
    return await storage.batchOperation(deleteOperations);
  }

  /**
   * 清空聊天历史
   */
  async clearChatHistory(personaId) {
    return await this.deleteChatHistory(personaId);
  }

  /**
   * 保存设置
   */
  async saveSetting(key, value, category = 'general') {
    this._checkReady();
    const storage = this._getStorage();
    
    const setting = {
      key,
      value,
      category,
      updatedAt: new Date()
    };
    
    return await storage.put('settings', setting);
  }

  /**
   * 获取设置
   */
  async loadSetting(key, defaultValue = null) {
    this._checkReady();
    const storage = this._getStorage();
    
    const setting = await storage.get('settings', key);
    return setting ? setting.value : defaultValue;
  }

  /**
   * 获取所有设置
   */
  async loadAllSettings() {
    this._checkReady();
    const storage = this._getStorage();
    
    const settings = await storage.getAll('settings');
    const result = {};
    
    settings.forEach(setting => {
      result[setting.key] = setting.value;
    });
    
    return result;
  }

  /**
   * 删除设置
   */
  async deleteSetting(key) {
    this._checkReady();
    const storage = this._getStorage();
    return await storage.delete('settings', key);
  }

  /**
   * 保存会话
   */
  async saveSession(session) {
    this._checkReady();
    const storage = this._getStorage();
    
    const sessionData = {
      ...session,
      lastActiveAt: new Date(),
      createdAt: session.createdAt || new Date()
    };
    
    return await storage.put('sessions', sessionData);
  }

  /**
   * 获取会话
   */
  async getSession(id) {
    this._checkReady();
    const storage = this._getStorage();
    return await storage.get('sessions', id);
  }

  /**
   * 获取人格的所有会话
   */
  async getPersonaSessions(personaId) {
    this._checkReady();
    const storage = this._getStorage();
    return await storage.getAllByIndex('sessions', 'personaId', personaId);
  }

  /**
   * 获取存储统计信息
   */
  async getStats() {
    this._checkReady();
    const storage = this._getStorage();
    return await storage.getStats();
  }

  /**
   * 备份数据
   */
  async backup() {
    this._checkReady();
    const storage = this._getStorage();
    return await storage.backup();
  }

  /**
   * 恢复数据
   */
  async restore(backupData) {
    this._checkReady();
    const storage = this._getStorage();
    return await storage.restore(backupData);
  }

  /**
   * 清空所有数据
   */
  async clearAll() {
    this._checkReady();
    const storage = this._getStorage();
    
    await storage.clear('personas');
    await storage.clear('messages');
    await storage.clear('settings');
    await storage.clear('sessions');
    
    console.log('所有数据已清空');
  }

  /**
   * 检查存储空间
   */
  async checkStorageSpace() {
    this._checkReady();
    
    if (this.database) {
      // IndexedDB存储空间检查
      try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          return {
            used: estimate.usage,
            available: estimate.quota,
            percentage: Math.round((estimate.usage / estimate.quota) * 100)
          };
        }
      } catch (error) {
        console.warn('无法获取存储空间信息:', error);
      }
    } else if (this.fallback) {
      // LocalStorage存储空间检查
      return this.fallback.checkStorageSpace();
    }
    
    return null;
  }

  /**
   * 关闭存储连接
   */
  close() {
    if (this.database) {
      this.database.close();
    }
    if (this.fallback) {
      this.fallback.close();
    }
    
    this.isReady = false;
    console.log('存储服务已关闭');
  }
}

// 应用管理器 - 统一管理所有服务
class AppManager {
  constructor() {
    this.storage = null;
    this.personaManager = null;
    this.chatManager = null;
    this.contextManager = null;
    this.memoryManager = null;
    this.sessionContinuityManager = null;
    this.apiService = null;
    this.conversationStyleManager = null;
    this.emotionRecognitionManager = null;
    this.guideService = null;
    this.isInitialized = false;
  }

  /**
   * 初始化应用
   */
  async init() {
    const loaderId = window.loadingManager?.showGlobalLoading('初始化应用...', true);
    
    try {
      console.log('开始初始化AI聊天应用...');

      // 1. 初始化存储服务
      window.loadingManager?.updateProgress(loaderId, 10, '初始化存储服务...');
      this.storage = new StorageService();
      await this.storage.init();

      // 2. 初始化人格管理器
      window.loadingManager?.updateProgress(loaderId, 20, '初始化人格管理器...');
      this.personaManager = new AIChat.PersonaManager(this.storage);
      await this.personaManager.init();

      // 3. 初始化聊天管理器
      window.loadingManager?.updateProgress(loaderId, 30, '初始化聊天管理器...');
      this.chatManager = new AIChat.ChatManager(this.storage);

      // 4. 初始化上下文管理器
      window.loadingManager?.updateProgress(loaderId, 40, '初始化上下文管理器...');
      this.contextManager = new AIChat.ContextManager(this.chatManager, this.storage);

      // 5. 初始化记忆管理器
      window.loadingManager?.updateProgress(loaderId, 50, '初始化记忆管理器...');
      this.memoryManager = new AIChat.MemoryManager(this.storage, this.contextManager);

      // 6. 初始化会话连续性管理器
      window.loadingManager?.updateProgress(loaderId, 60, '初始化会话管理器...');
      this.sessionContinuityManager = new AIChat.SessionContinuityManager(
        this.storage, 
        this.memoryManager, 
        this.contextManager
      );

      // 7. 初始化API服务
      window.loadingManager?.updateProgress(loaderId, 70, '初始化API服务...');
      this.apiService = new AIChat.APIService();
      await this.apiService.init(this.storage);
      
      // 创建增强的API服务包装器
      if (window.AIChat.EnhancedAPIService) {
        this.enhancedApiService = new AIChat.EnhancedAPIService(this.apiService);
      }
      
      // 设置上下文管理器到API服务
      this.apiService.setContextManager(this.contextManager);

      // 8. 初始化对话风格管理器
      window.loadingManager?.updateProgress(loaderId, 80, '初始化对话风格管理器...');
      this.conversationStyleManager = new AIChat.ConversationStyleManager(
        this.personaManager, 
        this.contextManager
      );

      // 9. 初始化情感识别管理器
      window.loadingManager?.updateProgress(loaderId, 85, '初始化情感识别管理器...');
      this.emotionRecognitionManager = new AIChat.EmotionRecognitionManager();

      // 10. 初始化引导服务
      window.loadingManager?.updateProgress(loaderId, 85, '初始化引导服务...');
      this.guideService = new AIChat.GuideService();
      await this.guideService.init(this.apiService, this.storage);

      // 11. 初始化性能优化器
      window.loadingManager?.updateProgress(loaderId, 90, '初始化性能优化器...');
      this.performanceOptimizer = new AIChat.PerformanceOptimizer();
      
      // 获取聊天容器元素
      const chatContainer = document.getElementById('chatContainer');
      const messageContainer = document.getElementById('chatMessages');
      
      if (chatContainer && messageContainer) {
        await this.performanceOptimizer.init(chatContainer, messageContainer);
        
        // 为消息容器添加优化样式
        messageContainer.classList.add('optimized-scroll');
      }

      // 12. 初始化测试套件（仅在开发模式下）
      window.loadingManager?.updateProgress(loaderId, 95, '初始化测试套件...');
      if (window.AIChat && window.AIChat.TestSuite) {
        this.testSuite = new AIChat.TestSuite();
        console.log('测试套件已初始化');
      }

      window.loadingManager?.updateProgress(loaderId, 100, '初始化完成');
      this.isInitialized = true;
      console.log('AI聊天应用初始化完成');

      // 显示成功通知
      window.loadingManager?.showSuccessNotification('应用初始化完成');

      // 检查是否需要显示欢迎引导
      if (!this.guideService.isGuideCompleted('welcome')) {
        setTimeout(() => {
          this.guideService.showWelcomeGuide();
        }, 1000);
      }

      return true;
    } catch (error) {
      console.error('应用初始化失败:', error);
      
      // 报告错误
      if (window.errorHandler) {
        window.errorHandler.reportError(
          error.message || '应用初始化失败',
          window.errorHandler.errorCategories.SYSTEM,
          window.errorHandler.errorLevels.CRITICAL,
          { phase: 'initialization' }
        );
      }
      
      throw error;
    } finally {
      // 隐藏加载状态
      if (loaderId) {
        window.loadingManager?.hideGlobalLoading(loaderId);
      }
    }
  }

  /**
   * 发送增强的聊天消息（集成风格一致性和情感识别）
   */
  async sendEnhancedMessage(content, personaId) {
    try {
      if (!this.isInitialized) {
        throw new Error('应用未初始化');
      }

      const persona = this.personaManager.getCurrentPersona();
      if (!persona || persona.id !== personaId) {
        throw new Error('人格不匹配');
      }

      // 1. 保存用户消息
      const userMessage = await this.chatManager.sendMessage(content, personaId, 'user');

      // 2. 处理消息记忆
      const conversationContext = await this.chatManager.getChatHistory(personaId, 20);
      const memoryEntries = await this.memoryManager.processMessage(
        userMessage, 
        personaId, 
        conversationContext
      );
      console.log('提取记忆条目:', memoryEntries.length);

      // 3. 情感识别
      const emotion = this.emotionRecognitionManager.recognizeEmotion(content, personaId);
      console.log('识别到的情感:', emotion);

      // 4. 获取聊天历史
      const chatHistory = conversationContext;

      // 5. 检查对话风格一致性
      const styleCheck = await this.conversationStyleManager.checkStyleConsistency(
        personaId, 
        chatHistory.slice(-5)
      );
      console.log('风格一致性检查:', styleCheck);

      // 6. 构建增强的消息上下文（包含记忆信息）
      const messageContext = await this.contextManager.buildContext(personaId, userMessage);
      
      // 7. 获取相关记忆信息
      const relevantMemories = await this.memoryManager.searchMemories(
        personaId, 
        content, 
        { limit: 5, minScore: 0.4 }
      );
      console.log('相关记忆:', relevantMemories.length);

      // 8. 生成记忆增强提示
      let memoryPrompt = '';
      if (relevantMemories.length > 0) {
        const memoryContext = relevantMemories
          .map(mem => `- ${mem.summary || mem.content.substring(0, 100)}`)
          .join('\n');
        memoryPrompt = `基于以下相关记忆信息回应用户：\n${memoryContext}`;
      }

      // 9. 生成风格增强提示
      let stylePrompt = '';
      if (!styleCheck.isConsistent) {
        stylePrompt = this.conversationStyleManager.generateStyleEnhancementPrompt(
          personaId, 
          styleCheck
        );
      }

      // 10. 生成情感回应提示
      let emotionPrompt = '';
      if (emotion.primary) {
        const personaStyle = await this.conversationStyleManager.analyzePersonaStyle(persona);
        const emotionalResponse = this.emotionRecognitionManager.generateEmotionalResponse(
          emotion, 
          personaStyle.combinedStyle, 
          personaId
        );
        
        if (emotionalResponse) {
          emotionPrompt = `请以共情和理解的方式回应用户的${emotion.primary.type}情感。`;
          if (emotionalResponse.suggestions && emotionalResponse.suggestions.length > 0) {
            emotionPrompt += `可以考虑提供以下建议：${emotionalResponse.suggestions.slice(0, 2).join('、')}。`;
          }
        }
      }

      // 11. 构建完整的系统提示
      let enhancedPrompt = persona.prompt;
      if (memoryPrompt) {
        enhancedPrompt += '\n\n' + memoryPrompt;
      }
      if (stylePrompt) {
        enhancedPrompt += '\n\n' + stylePrompt;
      }
      if (emotionPrompt) {
        enhancedPrompt += '\n\n' + emotionPrompt;
      }

      // 12. 创建增强的人格副本
      const enhancedPersona = {
        ...persona,
        prompt: enhancedPrompt
      };

      // 13. 发送API请求
      const apiResponse = await this.apiService.sendChatRequest(
        messageContext, 
        enhancedPersona, 
        userMessage
      );

      // 14. 保存AI回复
      const assistantMessage = await this.chatManager.sendMessage(
        apiResponse.content, 
        personaId, 
        'assistant'
      );

      // 15. 处理AI回复的记忆
      const aiMemoryEntries = await this.memoryManager.processMessage(
        assistantMessage, 
        personaId, 
        [...conversationContext, userMessage]
      );

      // 16. 保存会话状态
      await this.sessionContinuityManager.saveCurrentSessionState(personaId);

      // 17. 更新情感历史（如果AI回复中包含情感）
      const aiEmotion = this.emotionRecognitionManager.recognizeEmotion(
        apiResponse.content, 
        `${personaId}_ai`
      );

      // 18. 更新性能优化器的消息计数
      if (this.performanceOptimizer) {
        this.performanceOptimizer.virtualScrollConfig.totalItems += 2; // 用户消息 + AI回复
      }

      return {
        userMessage,
        assistantMessage,
        apiResponse,
        emotion,
        aiEmotion,
        styleCheck,
        memoryEntries,
        aiMemoryEntries,
        relevantMemories,
        enhancementApplied: {
          memoryEnhancement: !!memoryPrompt,
          styleEnhancement: !!stylePrompt,
          emotionEnhancement: !!emotionPrompt
        }
      };
    } catch (error) {
      console.error('发送增强消息失败:', error);
      throw error;
    }
  }

  /**
   * 处理人格切换
   */
  async switchPersona(fromPersonaId, toPersonaId) {
    try {
      if (!this.isInitialized) {
        throw new Error('应用未初始化');
      }

      // 使用会话连续性管理器处理人格切换
      const success = await this.sessionContinuityManager.handlePersonaSwitch(
        fromPersonaId, 
        toPersonaId
      );

      if (success) {
        // 更新人格管理器的当前人格
        const newPersona = await this.personaManager.loadPersona(toPersonaId);
        if (newPersona) {
          this.personaManager.setCurrentPersona(newPersona);
        }

        console.log(`人格切换成功: ${fromPersonaId} -> ${toPersonaId}`);
        return {
          success: true,
          fromPersonaId,
          toPersonaId,
          continuityContext: this.sessionContinuityManager.getContinuityContext()
        };
      } else {
        throw new Error('人格切换失败');
      }
    } catch (error) {
      console.error('人格切换失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取记忆摘要
   */
  async getMemorySummary(personaId) {
    try {
      if (!this.isInitialized) {
        throw new Error('应用未初始化');
      }

      const summary = await this.memoryManager.generateConversationSummary(personaId);
      const stats = await this.memoryManager.getMemoryStats(personaId);

      return {
        summary,
        stats,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('获取记忆摘要失败:', error);
      throw error;
    }
  }

  /**
   * 搜索记忆
   */
  async searchMemories(personaId, query, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('应用未初始化');
      }

      return await this.memoryManager.searchMemories(personaId, query, options);
    } catch (error) {
      console.error('搜索记忆失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupExpiredData(personaId) {
    try {
      if (!this.isInitialized) {
        throw new Error('应用未初始化');
      }

      const results = {
        expiredMemories: 0,
        expiredSessions: 0
      };

      // 清理过期记忆
      results.expiredMemories = await this.memoryManager.cleanupExpiredMemories(personaId);

      // 清理过期会话
      results.expiredSessions = await this.sessionContinuityManager.cleanupExpiredSessions();

      console.log('数据清理完成:', results);
      return results;
    } catch (error) {
      console.error('数据清理失败:', error);
      throw error;
    }
  }

  /**
   * 获取会话连续性信息
   */
  getSessionContinuity() {
    if (!this.isInitialized) {
      return null;
    }

    return this.sessionContinuityManager.getContinuityContext();
  }

  /**
   * 运行数据完整性检查
   */
  async runDataIntegrityCheck() {
    try {
      if (!this.isInitialized) {
        throw new Error('应用未初始化');
      }

      if (!window.AIChat.DataIntegrityChecker) {
        throw new Error('数据完整性检查器未找到');
      }

      const checker = new window.AIChat.DataIntegrityChecker();
      const results = await checker.checkAll(this.storage);

      console.log('数据完整性检查完成:', results);
      return results;
    } catch (error) {
      console.error('数据完整性检查失败:', error);
      throw error;
    }
  }

  /**
   * 运行测试套件
   */
  async runTests(category = null) {
    try {
      if (!this.testSuite) {
        throw new Error('测试套件未初始化');
      }

      let results;
      if (category) {
        results = await this.testSuite.runTestsByCategory(category);
      } else {
        results = await this.testSuite.runAllTests();
      }

      console.log('测试运行完成:', results);
      return results;
    } catch (error) {
      console.error('测试运行失败:', error);
      throw error;
    }
  }

  /**
   * 获取对话体验分析
   */
  async getConversationAnalysis(personaId, messageCount = 10) {
    try {
      if (!this.isInitialized) {
        throw new Error('应用未初始化');
      }

      const chatHistory = await this.chatManager.getChatHistory(personaId, messageCount);
      
      // 风格一致性分析
      const styleAnalysis = await this.conversationStyleManager.checkStyleConsistency(
        personaId, 
        chatHistory
      );

      // 情感趋势分析
      const emotionTrend = this.emotionRecognitionManager.analyzeEmotionTrend(personaId, 24);

      // 对话质量评估
      const qualityMetrics = {
        messageCount: chatHistory.length,
        averageMessageLength: chatHistory.reduce((sum, msg) => sum + msg.content.length, 0) / chatHistory.length,
        userEngagement: chatHistory.filter(msg => msg.role === 'user').length / chatHistory.length,
        conversationFlow: this._assessConversationFlow(chatHistory)
      };

      // 记忆分析
      const memoryStats = await this.memoryManager.getMemoryStats(personaId);
      const memorySummary = await this.memoryManager.generateConversationSummary(personaId);

      // 会话连续性分析
      const sessionStats = await this.sessionContinuityManager.getSessionStats();

      return {
        personaId,
        styleAnalysis,
        emotionTrend,
        qualityMetrics,
        memoryStats,
        memorySummary,
        sessionStats,
        recommendations: this._generateConversationRecommendations(
          styleAnalysis, 
          emotionTrend, 
          qualityMetrics,
          memoryStats
        ),
        analyzedAt: new Date()
      };
    } catch (error) {
      console.error('对话分析失败:', error);
      throw error;
    }
  }

  /**
   * 评估对话流畅度
   */
  _assessConversationFlow(messages) {
    if (messages.length < 4) {
      return { score: 1.0, quality: 'excellent' };
    }

    let flowScore = 1.0;
    let contextBreaks = 0;

    // 检查对话的连贯性
    for (let i = 1; i < messages.length; i++) {
      const prevMsg = messages[i - 1];
      const currMsg = messages[i];

      // 检查角色交替
      if (prevMsg.role === currMsg.role) {
        flowScore -= 0.1;
      }

      // 检查时间间隔（过长的间隔可能表示对话中断）
      const timeDiff = new Date(currMsg.timestamp) - new Date(prevMsg.timestamp);
      if (timeDiff > 30 * 60 * 1000) { // 30分钟
        contextBreaks++;
      }
    }

    // 应用上下文中断惩罚
    flowScore -= contextBreaks * 0.2;
    flowScore = Math.max(flowScore, 0);

    let quality;
    if (flowScore >= 0.8) quality = 'excellent';
    else if (flowScore >= 0.6) quality = 'good';
    else if (flowScore >= 0.4) quality = 'fair';
    else quality = 'poor';

    return { score: flowScore, quality, contextBreaks };
  }

  /**
   * 生成对话改进建议
   */
  _generateConversationRecommendations(styleAnalysis, emotionTrend, qualityMetrics, memoryStats = null) {
    const recommendations = [];

    // 风格一致性建议
    if (!styleAnalysis.isConsistent) {
      recommendations.push({
        type: 'style',
        priority: 'high',
        message: '建议调整对话风格以保持人格一致性',
        details: styleAnalysis.adjustmentSuggestions?.slice(0, 2)
      });
    }

    // 情感回应建议
    if (emotionTrend && emotionTrend.dominantCategory === 'negative') {
      recommendations.push({
        type: 'emotion',
        priority: 'medium',
        message: '检测到用户情绪偏向消极，建议增加共情和支持性回应',
        details: ['提供更多情感支持', '使用更温暖的语言']
      });
    }

    // 对话质量建议
    if (qualityMetrics.conversationFlow.score < 0.6) {
      recommendations.push({
        type: 'flow',
        priority: 'medium',
        message: '对话流畅度有待提升',
        details: ['保持话题连贯性', '减少对话中断']
      });
    }

    if (qualityMetrics.userEngagement < 0.4) {
      recommendations.push({
        type: 'engagement',
        priority: 'low',
        message: '用户参与度较低，建议增加互动性',
        details: ['多提问引导用户', '分享相关话题']
      });
    }

    // 记忆相关建议
    if (memoryStats) {
      if (memoryStats.total < 10) {
        recommendations.push({
          type: 'memory',
          priority: 'low',
          message: '对话记忆较少，建议进行更深入的交流',
          details: ['分享更多个人信息', '讨论感兴趣的话题']
        });
      }

      if (memoryStats.averageImportance < 0.5) {
        recommendations.push({
          type: 'memory',
          priority: 'medium',
          message: '对话内容重要性偏低，建议增加有意义的交流',
          details: ['讨论重要话题', '分享深层想法']
        });
      }
    }

    return recommendations;
  }

  /**
   * 获取所有管理器的统计信息
   */
  getStats() {
    if (!this.isInitialized) {
      return { error: '应用未初始化' };
    }

    return {
      storage: this.storage.getStats?.() || {},
      persona: this.personaManager.getUsageStats?.() || {},
      chat: this.chatManager.getCacheStats?.() || {},
      context: this.contextManager.getContextStats?.() || {},
      memory: this.memoryManager.getCacheStats?.() || {},
      sessionContinuity: this.sessionContinuityManager.getCacheStats?.() || {},
      style: this.conversationStyleManager.getStyleStats?.() || {},
      emotion: this.emotionRecognitionManager.getStats?.() || {},
      api: this.apiService.getStats?.() || {},
      guide: this.guideService.getUsageStats?.() || {},
      performance: this.performanceOptimizer?.getPerformanceStats?.() || {},
      testing: this.testSuite ? {
        totalTests: this.testSuite.tests.size,
        lastResults: this.testSuite.testResults.length > 0 ? this.testSuite.testResults[this.testSuite.testResults.length - 1] : null,
        debugMode: this.testSuite.debugMode
      } : {}
    };
  }

  /**
   * 清理缓存和临时数据
   */
  cleanup() {
    if (!this.isInitialized) {
      return;
    }

    this.contextManager?.clearAllCache();
    this.memoryManager?.clearAllCache();
    this.sessionContinuityManager?.clearAllCache();
    this.conversationStyleManager?.clearCache();
    this.emotionRecognitionManager?.clearEmotionHistory('all');
    this.chatManager?.clearCache();
    this.guideService?.cleanup();
    this.performanceOptimizer?.cleanupCache();
    this.testSuite?.cleanup();

    console.log('应用缓存已清理');
  }

  /**
   * 关闭应用
   */
  close() {
    if (this.storage) {
      this.storage.close();
    }

    if (this.guideService) {
      this.guideService.close();
    }

    if (this.performanceOptimizer) {
      this.performanceOptimizer.destroy();
    }

    this.cleanup();
    this.isInitialized = false;
    
    console.log('AI聊天应用已关闭');
  }
}

// 导出核心模块
window.AIChat = {
  CONFIG,
  Utils,
  StorageService,
  AppManager
};

console.log('AI人格聊天应用核心模块已加载 v' + CONFIG.version);