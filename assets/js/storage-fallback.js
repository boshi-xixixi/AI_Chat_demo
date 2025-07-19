/**
 * LocalStorage降级存储方案
 * 当IndexedDB不可用时使用
 */

class LocalStorageFallback {
  constructor() {
    this.prefix = 'ai_chat_';
    this.isReady = true;
    this.stores = {
      personas: 'personas',
      messages: 'messages',
      settings: 'settings',
      sessions: 'sessions'
    };
  }

  /**
   * 初始化（LocalStorage无需初始化）
   */
  async init() {
    console.log('使用LocalStorage降级方案');
    return Promise.resolve();
  }

  /**
   * 获取存储键名
   */
  _getKey(storeName, id = null) {
    return id ? `${this.prefix}${storeName}_${id}` : `${this.prefix}${storeName}`;
  }

  /**
   * 获取存储的所有键
   */
  _getStoreKeys(storeName) {
    const prefix = this._getKey(storeName);
    const keys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix + '_')) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  /**
   * 添加/更新数据
   */
  async put(storeName, data) {
    try {
      if (!data.id) {
        throw new Error('数据必须包含id字段');
      }
      
      const key = this._getKey(storeName, data.id);
      const serialized = JSON.stringify(data);
      
      localStorage.setItem(key, serialized);
      
      // 更新索引
      await this._updateIndex(storeName, data);
      
      return data.id;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('存储空间不足');
      }
      throw error;
    }
  }

  /**
   * 获取单个数据
   */
  async get(storeName, id) {
    try {
      const key = this._getKey(storeName, id);
      const data = localStorage.getItem(key);
      
      return data ? JSON.parse(data) : undefined;
    } catch (error) {
      console.error('获取数据失败:', error);
      return undefined;
    }
  }

  /**
   * 获取所有数据
   */
  async getAll(storeName) {
    try {
      const keys = this._getStoreKeys(storeName);
      const results = [];
      
      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            results.push(JSON.parse(data));
          } catch (error) {
            console.warn('解析数据失败:', key, error);
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('获取所有数据失败:', error);
      return [];
    }
  }

  /**
   * 通过索引获取数据（简化实现）
   */
  async getByIndex(storeName, indexName, value) {
    try {
      const allData = await this.getAll(storeName);
      return allData.find(item => item[indexName] === value);
    } catch (error) {
      console.error('通过索引获取数据失败:', error);
      return undefined;
    }
  }

  /**
   * 通过索引获取所有数据
   */
  async getAllByIndex(storeName, indexName, value = null) {
    try {
      const allData = await this.getAll(storeName);
      
      if (value === null) {
        return allData;
      }
      
      return allData.filter(item => item[indexName] === value);
    } catch (error) {
      console.error('通过索引获取所有数据失败:', error);
      return [];
    }
  }

  /**
   * 删除数据
   */
  async delete(storeName, id) {
    try {
      const key = this._getKey(storeName, id);
      localStorage.removeItem(key);
      
      // 更新索引
      await this._removeFromIndex(storeName, id);
      
      return true;
    } catch (error) {
      console.error('删除数据失败:', error);
      return false;
    }
  }

  /**
   * 清空存储
   */
  async clear(storeName) {
    try {
      const keys = this._getStoreKeys(storeName);
      
      for (const key of keys) {
        localStorage.removeItem(key);
      }
      
      // 清空索引
      const indexKey = this._getKey(storeName + '_index');
      localStorage.removeItem(indexKey);
      
      return true;
    } catch (error) {
      console.error('清空存储失败:', error);
      return false;
    }
  }

  /**
   * 计数
   */
  async count(storeName) {
    try {
      const keys = this._getStoreKeys(storeName);
      return keys.length;
    } catch (error) {
      console.error('计数失败:', error);
      return 0;
    }
  }

  /**
   * 更新索引（简化实现）
   */
  async _updateIndex(storeName, data) {
    try {
      const indexKey = this._getKey(storeName + '_index');
      let index = {};
      
      const existingIndex = localStorage.getItem(indexKey);
      if (existingIndex) {
        index = JSON.parse(existingIndex);
      }
      
      // 更新索引
      index[data.id] = {
        id: data.id,
        name: data.name,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      
      localStorage.setItem(indexKey, JSON.stringify(index));
    } catch (error) {
      console.warn('更新索引失败:', error);
    }
  }

  /**
   * 从索引中移除
   */
  async _removeFromIndex(storeName, id) {
    try {
      const indexKey = this._getKey(storeName + '_index');
      const existingIndex = localStorage.getItem(indexKey);
      
      if (existingIndex) {
        const index = JSON.parse(existingIndex);
        delete index[id];
        localStorage.setItem(indexKey, JSON.stringify(index));
      }
    } catch (error) {
      console.warn('从索引中移除失败:', error);
    }
  }

  /**
   * 批量操作
   */
  async batchOperation(operations) {
    const results = [];
    
    for (const operation of operations) {
      try {
        const result = await operation();
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error });
      }
    }
    
    return results;
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    try {
      const stats = {
        personas: await this.count('personas'),
        messages: await this.count('messages'),
        settings: await this.count('settings'),
        sessions: await this.count('sessions'),
        storageUsed: this._getStorageUsed()
      };
      
      return stats;
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return null;
    }
  }

  /**
   * 获取已使用的存储空间（估算）
   */
  _getStorageUsed() {
    let total = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const value = localStorage.getItem(key);
        total += key.length + (value ? value.length : 0);
      }
    }
    
    return {
      bytes: total,
      kb: Math.round(total / 1024),
      mb: Math.round(total / (1024 * 1024))
    };
  }

  /**
   * 备份数据
   */
  async backup() {
    try {
      const backup = {
        version: 1,
        timestamp: new Date().toISOString(),
        storage: 'localStorage',
        data: {
          personas: await this.getAll('personas'),
          messages: await this.getAll('messages'),
          settings: await this.getAll('settings'),
          sessions: await this.getAll('sessions')
        }
      };
      
      return JSON.stringify(backup, null, 2);
    } catch (error) {
      console.error('备份失败:', error);
      throw error;
    }
  }

  /**
   * 恢复数据
   */
  async restore(backupData) {
    try {
      const backup = JSON.parse(backupData);
      
      if (!backup.data) {
        throw new Error('无效的备份数据格式');
      }
      
      // 清空现有数据
      await this.clear('personas');
      await this.clear('messages');
      await this.clear('settings');
      await this.clear('sessions');
      
      // 恢复数据
      const operations = [];
      
      Object.keys(backup.data).forEach(storeName => {
        if (backup.data[storeName]) {
          backup.data[storeName].forEach(item => {
            operations.push(() => this.put(storeName, item));
          });
        }
      });
      
      const results = await this.batchOperation(operations);
      const failed = results.filter(r => !r.success);
      
      console.log('LocalStorage数据恢复完成');
      return {
        total: results.length,
        success: results.length - failed.length,
        failed: failed.length
      };
    } catch (error) {
      console.error('恢复数据失败:', error);
      throw error;
    }
  }

  /**
   * 清理所有应用数据
   */
  async clearAll() {
    try {
      const keys = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }
      
      keys.forEach(key => localStorage.removeItem(key));
      
      console.log(`清理了 ${keys.length} 个存储项`);
      return keys.length;
    } catch (error) {
      console.error('清理数据失败:', error);
      throw error;
    }
  }

  /**
   * 检查存储空间
   */
  checkStorageSpace() {
    try {
      const testKey = this.prefix + 'test';
      const testData = 'x'.repeat(1024); // 1KB测试数据
      
      localStorage.setItem(testKey, testData);
      localStorage.removeItem(testKey);
      
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        return false;
      }
      throw error;
    }
  }

  /**
   * 关闭连接（LocalStorage无需关闭）
   */
  close() {
    console.log('LocalStorage降级方案已关闭');
  }
}

// 导出LocalStorage降级方案
window.AIChat = window.AIChat || {};
window.AIChat.LocalStorageFallback = LocalStorageFallback;

console.log('LocalStorage降级存储方案已加载');