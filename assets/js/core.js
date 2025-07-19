/**
 * AI人格聊天应用 - 核心架构
 * 基于模块化设计的JavaScript架构
 */

// 核心配置
const CONFIG = {
  version: '1.0.0',
  apiEndpoints: {
    volcano: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    ollama: 'http://localhost:11434/api/chat'
  },
  storage: {
    dbName: 'AIPersonaChatDB',
    dbVersion: 1,
    stores: {
      personas: 'personas',
      messages: 'messages', 
      settings: 'settings'
    }
  },
  ui: {
    themes: ['light', 'dark'],
    maxMessageLength: 4000,
    maxHistoryLength: 100
  }
};

// 工具函数
const Utils = {
  /**
   * 生成UUID
   */
  generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return date.toLocaleDateString('zh-CN');
  },

  /**
   * 防抖函数
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * 深拷贝对象
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * 验证数据
   */
  validate: {
    personaName: (name) => name && name.trim().length > 0 && name.length <= 50,
    prompt: (prompt) => prompt && prompt.trim().length > 0 && prompt.length <= 2000,
    dialogPairs: (dialogs) => Array.isArray(dialogs) && dialogs.length % 2 === 0
  }
};

// 存储服务
class StorageService {
  constructor() {
    this.database = null;
    this.fallback = null;
    this.isReady = false;
  }

  /**
   * 初始化存储服务
   */
  async init() {
    try {
      // 尝试使用IndexedDB
      this.database = new AIChat.DatabaseManager();
      await this.database.init();
      this.isReady = true;
      console.log('存储服务初始化完成 - 使用IndexedDB');
    } catch (error) {
      console.warn('IndexedDB初始化失败，使用LocalStorage降级:', error);
      
      // 降级到LocalStorage
      this.fallback = new AIChat.LocalStorageFallback();
      await this.fallback.init();
      this.isReady = true;
      console.log('存储服务初始化完成 - 使用LocalStorage');
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

// 导出核心模块
window.AIChat = {
  CONFIG,
  Utils,
  StorageService
};

console.log('AI人格聊天应用核心模块已加载 v' + CONFIG.version);