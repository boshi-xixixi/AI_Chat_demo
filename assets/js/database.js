/**
 * 数据库管理模块
 * 负责IndexedDB的初始化、版本管理和基础操作
 */

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbName = 'AIPersonaChatDB';
    this.dbVersion = 1;
    this.isReady = false;
    this.initPromise = null;
  }

  /**
   * 初始化数据库
   */
  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initDatabase();
    return this.initPromise;
  }

  /**
   * 内部数据库初始化方法
   */
  async _initDatabase() {
    try {
      // 检查IndexedDB支持
      if (!this._checkIndexedDBSupport()) {
        throw new Error('浏览器不支持IndexedDB');
      }

      console.log('正在初始化数据库...');
      
      const db = await this._openDatabase();
      this.db = db;
      this.isReady = true;
      
      console.log('数据库初始化成功');
      return db;
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 检查IndexedDB支持
   */
  _checkIndexedDBSupport() {
    if (!window.indexedDB) {
      console.warn('IndexedDB不被支持');
      return false;
    }
    return true;
  }

  /**
   * 打开数据库
   */
  _openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        reject(new Error(`数据库打开失败: ${request.error}`));
      };
      
      request.onsuccess = () => {
        const db = request.result;
        
        // 设置错误处理
        db.onerror = (event) => {
          console.error('数据库错误:', event.target.error);
        };
        
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;
        
        console.log(`数据库升级: ${oldVersion} -> ${newVersion}`);
        
        try {
          this._createStores(db, oldVersion);
        } catch (error) {
          console.error('数据库升级失败:', error);
          reject(error);
        }
      };
    });
  }

  /**
   * 创建对象存储
   */
  _createStores(db, oldVersion) {
    // 创建人格存储
    if (!db.objectStoreNames.contains('personas')) {
      console.log('创建personas存储...');
      const personaStore = db.createObjectStore('personas', { 
        keyPath: 'id' 
      });
      
      // 创建索引
      personaStore.createIndex('name', 'name', { unique: true });
      personaStore.createIndex('createdAt', 'createdAt');
      personaStore.createIndex('updatedAt', 'updatedAt');
      personaStore.createIndex('isDefault', 'isDefault');
    }
    
    // 创建消息存储
    if (!db.objectStoreNames.contains('messages')) {
      console.log('创建messages存储...');
      const messageStore = db.createObjectStore('messages', { 
        keyPath: 'id' 
      });
      
      // 创建索引
      messageStore.createIndex('personaId', 'personaId');
      messageStore.createIndex('timestamp', 'timestamp');
      messageStore.createIndex('role', 'role');
      messageStore.createIndex('personaId_timestamp', ['personaId', 'timestamp']);
    }
    
    // 创建设置存储
    if (!db.objectStoreNames.contains('settings')) {
      console.log('创建settings存储...');
      const settingsStore = db.createObjectStore('settings', { 
        keyPath: 'key' 
      });
      
      // 创建索引
      settingsStore.createIndex('category', 'category');
      settingsStore.createIndex('updatedAt', 'updatedAt');
    }
    
    // 创建聊天会话存储（用于会话管理）
    if (!db.objectStoreNames.contains('sessions')) {
      console.log('创建sessions存储...');
      const sessionStore = db.createObjectStore('sessions', { 
        keyPath: 'id' 
      });
      
      // 创建索引
      sessionStore.createIndex('personaId', 'personaId');
      sessionStore.createIndex('createdAt', 'createdAt');
      sessionStore.createIndex('lastActiveAt', 'lastActiveAt');
    }
  }

  /**
   * 获取事务
   */
  getTransaction(storeNames, mode = 'readonly') {
    if (!this.isReady) {
      throw new Error('数据库未初始化');
    }
    
    const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
    return this.db.transaction(stores, mode);
  }

  /**
   * 获取对象存储
   */
  getStore(storeName, mode = 'readonly') {
    const transaction = this.getTransaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  /**
   * 执行数据库操作（带错误处理）
   */
  async executeOperation(operation) {
    try {
      if (!this.isReady) {
        await this.init();
      }
      
      return await operation();
    } catch (error) {
      console.error('数据库操作失败:', error);
      throw error;
    }
  }

  /**
   * 通用的添加/更新操作
   */
  async put(storeName, data) {
    return this.executeOperation(() => {
      return new Promise((resolve, reject) => {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.put(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 通用的获取操作
   */
  async get(storeName, key) {
    return this.executeOperation(() => {
      return new Promise((resolve, reject) => {
        const store = this.getStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 通用的获取所有操作
   */
  async getAll(storeName, query = null, count = null) {
    return this.executeOperation(() => {
      return new Promise((resolve, reject) => {
        const store = this.getStore(storeName);
        const request = store.getAll(query, count);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 通过索引获取数据
   */
  async getByIndex(storeName, indexName, key) {
    return this.executeOperation(() => {
      return new Promise((resolve, reject) => {
        const store = this.getStore(storeName);
        const index = store.index(indexName);
        const request = index.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 通过索引获取所有数据
   */
  async getAllByIndex(storeName, indexName, key = null) {
    return this.executeOperation(() => {
      return new Promise((resolve, reject) => {
        const store = this.getStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 通用的删除操作
   */
  async delete(storeName, key) {
    return this.executeOperation(() => {
      return new Promise((resolve, reject) => {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.delete(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 清空存储
   */
  async clear(storeName) {
    return this.executeOperation(() => {
      return new Promise((resolve, reject) => {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.clear();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 计数操作
   */
  async count(storeName, key = null) {
    return this.executeOperation(() => {
      return new Promise((resolve, reject) => {
        const store = this.getStore(storeName);
        const request = store.count(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 游标操作（用于复杂查询）
   */
  async openCursor(storeName, query = null, direction = 'next') {
    return this.executeOperation(() => {
      return new Promise((resolve, reject) => {
        const store = this.getStore(storeName);
        const request = store.openCursor(query, direction);
        const results = [];
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 批量操作
   */
  async batchOperation(operations) {
    return this.executeOperation(async () => {
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
    });
  }

  /**
   * 数据库统计信息
   */
  async getStats() {
    try {
      const stats = {
        personas: await this.count('personas'),
        messages: await this.count('messages'),
        settings: await this.count('settings'),
        sessions: await this.count('sessions'),
        dbSize: await this._estimateSize()
      };
      
      return stats;
    } catch (error) {
      console.error('获取数据库统计失败:', error);
      return null;
    }
  }

  /**
   * 估算数据库大小
   */
  async _estimateSize() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage,
          available: estimate.quota,
          percentage: Math.round((estimate.usage / estimate.quota) * 100)
        };
      }
      return null;
    } catch (error) {
      console.warn('无法估算存储大小:', error);
      return null;
    }
  }

  /**
   * 数据库备份
   */
  async backup() {
    try {
      const backup = {
        version: this.dbVersion,
        timestamp: new Date().toISOString(),
        data: {
          personas: await this.getAll('personas'),
          messages: await this.getAll('messages'),
          settings: await this.getAll('settings'),
          sessions: await this.getAll('sessions')
        }
      };
      
      return JSON.stringify(backup, null, 2);
    } catch (error) {
      console.error('数据库备份失败:', error);
      throw error;
    }
  }

  /**
   * 数据库恢复
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
      
      if (backup.data.personas) {
        backup.data.personas.forEach(persona => {
          operations.push(() => this.put('personas', persona));
        });
      }
      
      if (backup.data.messages) {
        backup.data.messages.forEach(message => {
          operations.push(() => this.put('messages', message));
        });
      }
      
      if (backup.data.settings) {
        backup.data.settings.forEach(setting => {
          operations.push(() => this.put('settings', setting));
        });
      }
      
      if (backup.data.sessions) {
        backup.data.sessions.forEach(session => {
          operations.push(() => this.put('sessions', session));
        });
      }
      
      const results = await this.batchOperation(operations);
      const failed = results.filter(r => !r.success);
      
      if (failed.length > 0) {
        console.warn(`恢复过程中有 ${failed.length} 个操作失败`);
      }
      
      console.log('数据库恢复完成');
      return {
        total: results.length,
        success: results.length - failed.length,
        failed: failed.length
      };
    } catch (error) {
      console.error('数据库恢复失败:', error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isReady = false;
      this.initPromise = null;
      console.log('数据库连接已关闭');
    }
  }

  /**
   * 删除数据库
   */
  static async deleteDatabase(dbName = 'AIPersonaChatDB') {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDB(dbName);
      
      deleteRequest.onsuccess = () => {
        console.log('数据库已删除');
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(new Error('删除数据库失败'));
      };
      
      deleteRequest.onblocked = () => {
        console.warn('数据库删除被阻止，请关闭其他标签页');
      };
    });
  }
}

// 导出数据库管理器
window.AIChat = window.AIChat || {};
window.AIChat.DatabaseManager = DatabaseManager;

console.log('数据库管理模块已加载');