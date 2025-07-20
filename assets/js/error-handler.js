/**
 * 全局错误处理系统
 * 提供统一的错误捕获、处理和用户反馈机制
 */

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 1000;
    this.debugMode = false;
    this.errorCategories = {
      NETWORK: 'network',
      API: 'api', 
      STORAGE: 'storage',
      VALIDATION: 'validation',
      SYSTEM: 'system',
      USER: 'user'
    };
    
    // 错误级别
    this.errorLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
    
    // 通知系统
    this.notificationSystem = null;
    
    // 错误统计
    this.errorStats = {
      total: 0,
      byCategory: {},
      byLevel: {},
      recent: []
    };
    
    this.init();
  }

  /**
   * 初始化错误处理系统
   */
  init() {
    // 全局错误捕获
    this.setupGlobalErrorHandlers();
    
    // 初始化通知系统
    this.initNotificationSystem();
    
    // 从存储加载错误统计
    this.loadErrorStats();
    
    console.log('全局错误处理系统已初始化');
  }

  /**
   * 设置全局错误处理器
   */
  setupGlobalErrorHandlers() {
    // 捕获未处理的JavaScript错误
    window.addEventListener('error', (event) => {
      this.handleGlobalError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        category: this.errorCategories.SYSTEM,
        level: this.errorLevels.HIGH
      });
    });

    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError({
        type: 'promise',
        message: event.reason?.message || '未处理的Promise拒绝',
        error: event.reason,
        category: this.errorCategories.SYSTEM,
        level: this.errorLevels.MEDIUM
      });
    });

    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleGlobalError({
          type: 'resource',
          message: `资源加载失败: ${event.target.src || event.target.href}`,
          element: event.target.tagName,
          category: this.errorCategories.NETWORK,
          level: this.errorLevels.LOW
        });
      }
    }, true);
  }

  /**
   * 初始化通知系统
   */
  initNotificationSystem() {
    // 创建通知容器
    if (!document.getElementById('error-notifications')) {
      const container = document.createElement('div');
      container.id = 'error-notifications';
      container.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(container);
    }
  }

  /**
   * 处理全局错误
   */
  handleGlobalError(errorInfo) {
    const error = this.createErrorObject(errorInfo);
    this.logError(error);
    this.updateErrorStats(error);
    
    // 根据错误级别决定是否显示通知
    if (error.level === this.errorLevels.HIGH || error.level === this.errorLevels.CRITICAL) {
      this.showErrorNotification(error);
    }
    
    // 调试模式下输出详细信息
    if (this.debugMode) {
      console.error('全局错误捕获:', error);
    }
  }

  /**
   * 创建标准化错误对象
   */
  createErrorObject(errorInfo) {
    return {
      id: this.generateErrorId(),
      timestamp: new Date(),
      type: errorInfo.type || 'unknown',
      message: errorInfo.message || '未知错误',
      category: errorInfo.category || this.errorCategories.SYSTEM,
      level: errorInfo.level || this.errorLevels.MEDIUM,
      stack: errorInfo.error?.stack || null,
      context: errorInfo.context || {},
      userAgent: navigator.userAgent,
      url: window.location.href,
      resolved: false
    };
  }

  /**
   * 生成错误ID
   */
  generateErrorId() {
    return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 记录错误到日志
   */
  logError(error) {
    this.errorLog.unshift(error);
    
    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
    
    // 保存到本地存储
    this.saveErrorLog();
  }

  /**
   * 更新错误统计
   */
  updateErrorStats(error) {
    this.errorStats.total++;
    
    // 按类别统计
    if (!this.errorStats.byCategory[error.category]) {
      this.errorStats.byCategory[error.category] = 0;
    }
    this.errorStats.byCategory[error.category]++;
    
    // 按级别统计
    if (!this.errorStats.byLevel[error.level]) {
      this.errorStats.byLevel[error.level] = 0;
    }
    this.errorStats.byLevel[error.level]++;
    
    // 最近错误
    this.errorStats.recent.unshift({
      id: error.id,
      timestamp: error.timestamp,
      message: error.message,
      category: error.category,
      level: error.level
    });
    
    if (this.errorStats.recent.length > 50) {
      this.errorStats.recent = this.errorStats.recent.slice(0, 50);
    }
    
    this.saveErrorStats();
  }

  /**
   * 显示错误通知
   */
  showErrorNotification(error) {
    const container = document.getElementById('error-notifications');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `alert ${this.getAlertClass(error.level)} shadow-lg max-w-sm`;
    notification.innerHTML = `
      <div class="flex items-start">
        <i class="fa ${this.getErrorIcon(error.category)} mr-2 mt-1"></i>
        <div class="flex-1">
          <div class="font-medium">${this.getErrorTitle(error)}</div>
          <div class="text-sm opacity-90">${this.getUserFriendlyMessage(error)}</div>
        </div>
        <button class="btn btn-ghost btn-xs ml-2" onclick="this.parentElement.parentElement.remove()">
          <i class="fa fa-times"></i>
        </button>
      </div>
    `;

    container.appendChild(notification);

    // 自动移除通知
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, this.getNotificationDuration(error.level));
  }

  /**
   * 获取警告样式类
   */
  getAlertClass(level) {
    const classMap = {
      [this.errorLevels.LOW]: 'alert-info',
      [this.errorLevels.MEDIUM]: 'alert-warning', 
      [this.errorLevels.HIGH]: 'alert-error',
      [this.errorLevels.CRITICAL]: 'alert-error'
    };
    return classMap[level] || 'alert-warning';
  }

  /**
   * 获取错误图标
   */
  getErrorIcon(category) {
    const iconMap = {
      [this.errorCategories.NETWORK]: 'fa-wifi',
      [this.errorCategories.API]: 'fa-server',
      [this.errorCategories.STORAGE]: 'fa-database',
      [this.errorCategories.VALIDATION]: 'fa-exclamation-triangle',
      [this.errorCategories.SYSTEM]: 'fa-bug',
      [this.errorCategories.USER]: 'fa-user'
    };
    return iconMap[category] || 'fa-exclamation-circle';
  }

  /**
   * 获取错误标题
   */
  getErrorTitle(error) {
    const titleMap = {
      [this.errorCategories.NETWORK]: '网络错误',
      [this.errorCategories.API]: 'API错误',
      [this.errorCategories.STORAGE]: '存储错误',
      [this.errorCategories.VALIDATION]: '验证错误',
      [this.errorCategories.SYSTEM]: '系统错误',
      [this.errorCategories.USER]: '操作错误'
    };
    return titleMap[error.category] || '未知错误';
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserFriendlyMessage(error) {
    // 网络错误处理
    if (error.category === this.errorCategories.NETWORK) {
      if (error.message.includes('fetch')) {
        return '网络连接失败，请检查网络设置';
      }
      if (error.message.includes('timeout')) {
        return '请求超时，请稍后重试';
      }
      return '网络连接异常';
    }
    
    // API错误处理
    if (error.category === this.errorCategories.API) {
      if (error.message.includes('401')) {
        return 'API密钥无效，请检查配置';
      }
      if (error.message.includes('429')) {
        return '请求过于频繁，请稍后重试';
      }
      if (error.message.includes('500')) {
        return '服务器错误，请稍后重试';
      }
      return 'API调用失败';
    }
    
    // 存储错误处理
    if (error.category === this.errorCategories.STORAGE) {
      if (error.message.includes('quota')) {
        return '存储空间不足，请清理数据';
      }
      if (error.message.includes('IndexedDB')) {
        return '数据库访问失败';
      }
      return '数据存储异常';
    }
    
    // 验证错误处理
    if (error.category === this.errorCategories.VALIDATION) {
      return error.message; // 验证错误通常已经是用户友好的
    }
    
    // 默认处理
    return error.message.length > 100 ? 
      error.message.substring(0, 100) + '...' : 
      error.message;
  }

  /**
   * 获取通知显示时长
   */
  getNotificationDuration(level) {
    const durationMap = {
      [this.errorLevels.LOW]: 3000,
      [this.errorLevels.MEDIUM]: 5000,
      [this.errorLevels.HIGH]: 8000,
      [this.errorLevels.CRITICAL]: 10000
    };
    return durationMap[level] || 5000;
  }

  /**
   * 手动报告错误
   */
  reportError(message, category = null, level = null, context = {}) {
    const error = this.createErrorObject({
      type: 'manual',
      message,
      category: category || this.errorCategories.USER,
      level: level || this.errorLevels.MEDIUM,
      context
    });
    
    this.logError(error);
    this.updateErrorStats(error);
    this.showErrorNotification(error);
    
    return error.id;
  }

  /**
   * 包装异步函数以自动处理错误
   */
  wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.reportError(
          error.message || '异步操作失败',
          this.categorizeError(error),
          this.assessErrorLevel(error),
          { ...context, args }
        );
        throw error;
      }
    };
  }

  /**
   * 包装同步函数以自动处理错误
   */
  wrapSync(fn, context = {}) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        this.reportError(
          error.message || '同步操作失败',
          this.categorizeError(error),
          this.assessErrorLevel(error),
          { ...context, args }
        );
        throw error;
      }
    };
  }

  /**
   * 自动分类错误
   */
  categorizeError(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return this.errorCategories.NETWORK;
    }
    if (message.includes('api') || message.includes('401') || message.includes('429')) {
      return this.errorCategories.API;
    }
    if (message.includes('storage') || message.includes('database') || message.includes('indexeddb')) {
      return this.errorCategories.STORAGE;
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return this.errorCategories.VALIDATION;
    }
    
    return this.errorCategories.SYSTEM;
  }

  /**
   * 评估错误级别
   */
  assessErrorLevel(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('critical') || message.includes('fatal')) {
      return this.errorLevels.CRITICAL;
    }
    if (message.includes('401') || message.includes('403') || message.includes('database')) {
      return this.errorLevels.HIGH;
    }
    if (message.includes('validation') || message.includes('timeout')) {
      return this.errorLevels.MEDIUM;
    }
    
    return this.errorLevels.LOW;
  }

  /**
   * 获取错误日志
   */
  getErrorLog(limit = 50) {
    return this.errorLog.slice(0, limit);
  }

  /**
   * 获取错误统计
   */
  getErrorStats() {
    return { ...this.errorStats };
  }

  /**
   * 清空错误日志
   */
  clearErrorLog() {
    this.errorLog = [];
    this.errorStats = {
      total: 0,
      byCategory: {},
      byLevel: {},
      recent: []
    };
    this.saveErrorLog();
    this.saveErrorStats();
  }

  /**
   * 保存错误日志到本地存储
   */
  saveErrorLog() {
    try {
      localStorage.setItem('ai_chat_error_log', JSON.stringify(this.errorLog.slice(0, 100)));
    } catch (error) {
      console.warn('保存错误日志失败:', error);
    }
  }

  /**
   * 从本地存储加载错误日志
   */
  loadErrorLog() {
    try {
      const saved = localStorage.getItem('ai_chat_error_log');
      if (saved) {
        this.errorLog = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('加载错误日志失败:', error);
    }
  }

  /**
   * 保存错误统计
   */
  saveErrorStats() {
    try {
      localStorage.setItem('ai_chat_error_stats', JSON.stringify(this.errorStats));
    } catch (error) {
      console.warn('保存错误统计失败:', error);
    }
  }

  /**
   * 加载错误统计
   */
  loadErrorStats() {
    try {
      const saved = localStorage.getItem('ai_chat_error_stats');
      if (saved) {
        this.errorStats = { ...this.errorStats, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('加载错误统计失败:', error);
    }
  }

  /**
   * 设置调试模式
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    console.log(`调试模式${enabled ? '已启用' : '已禁用'}`);
  }

  /**
   * 导出错误报告
   */
  exportErrorReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.errorStats,
      recentErrors: this.errorLog.slice(0, 20),
      systemInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 显示错误详情模态框
   */
  showErrorDetails(errorId) {
    const error = this.errorLog.find(e => e.id === errorId);
    if (!error) return;

    const modal = document.createElement('dialog');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-box max-w-4xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-lg">错误详情</h3>
          <button class="btn btn-sm btn-circle btn-ghost" onclick="this.closest('dialog').close()">
            <i class="fa fa-times"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">错误ID</label>
              <input class="input input-bordered w-full" value="${error.id}" readonly>
            </div>
            <div>
              <label class="label">时间</label>
              <input class="input input-bordered w-full" value="${error.timestamp.toLocaleString()}" readonly>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="label">类别</label>
              <input class="input input-bordered w-full" value="${error.category}" readonly>
            </div>
            <div>
              <label class="label">级别</label>
              <input class="input input-bordered w-full" value="${error.level}" readonly>
            </div>
            <div>
              <label class="label">类型</label>
              <input class="input input-bordered w-full" value="${error.type}" readonly>
            </div>
          </div>
          
          <div>
            <label class="label">错误消息</label>
            <textarea class="textarea textarea-bordered w-full h-20" readonly>${error.message}</textarea>
          </div>
          
          ${error.stack ? `
          <div>
            <label class="label">堆栈跟踪</label>
            <textarea class="textarea textarea-bordered w-full h-32 font-mono text-xs" readonly>${error.stack}</textarea>
          </div>
          ` : ''}
          
          <div>
            <label class="label">上下文信息</label>
            <textarea class="textarea textarea-bordered w-full h-20 font-mono text-xs" readonly>${JSON.stringify(error.context, null, 2)}</textarea>
          </div>
        </div>
        
        <div class="modal-action">
          <button class="btn" onclick="this.closest('dialog').close()">关闭</button>
          <button class="btn btn-primary" onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(error)}, null, 2))">复制详情</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.showModal();
    
    modal.addEventListener('close', () => {
      document.body.removeChild(modal);
    });
  }
}

// 创建全局错误处理器实例
window.errorHandler = new ErrorHandler();

// 导出到AIChat命名空间
if (window.AIChat) {
  window.AIChat.ErrorHandler = ErrorHandler;
  window.AIChat.errorHandler = window.errorHandler;
}

console.log('全局错误处理系统已加载');