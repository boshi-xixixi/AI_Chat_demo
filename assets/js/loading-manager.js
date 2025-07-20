/**
 * 加载状态和进度管理器
 * 提供统一的加载动画、进度提示和用户反馈
 */

class LoadingManager {
  constructor() {
    this.activeLoaders = new Map();
    this.loadingOverlay = null;
    this.progressBars = new Map();
    this.notifications = new Map();
    
    // 加载状态
    this.loadingStates = {
      IDLE: 'idle',
      LOADING: 'loading', 
      SUCCESS: 'success',
      ERROR: 'error'
    };
    
    // 加载类型
    this.loadingTypes = {
      API_CALL: 'api_call',
      DATA_SAVE: 'data_save',
      DATA_LOAD: 'data_load',
      FILE_UPLOAD: 'file_upload',
      EXPORT: 'export',
      IMPORT: 'import',
      INITIALIZATION: 'initialization'
    };
    
    this.init();
  }

  /**
   * 初始化加载管理器
   */
  init() {
    this.createLoadingOverlay();
    this.setupStyles();
    console.log('加载管理器已初始化');
  }

  /**
   * 创建全局加载遮罩层
   */
  createLoadingOverlay() {
    if (document.getElementById('global-loading-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'global-loading-overlay';
    overlay.className = 'loading-overlay hidden';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
        </div>
        <div class="loading-text">加载中...</div>
        <div class="loading-progress hidden">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">0%</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.loadingOverlay = overlay;
  }

  /**
   * 设置样式
   */
  setupStyles() {
    if (document.getElementById('loading-manager-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'loading-manager-styles';
    styles.textContent = `
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.3s ease;
      }
      
      .loading-overlay.hidden {
        display: none;
      }
      
      .loading-content {
        background: hsl(var(--b1));
        border-radius: 1rem;
        padding: 2rem;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        min-width: 200px;
      }
      
      .loading-spinner {
        margin-bottom: 1rem;
      }
      
      .spinner-ring {
        width: 40px;
        height: 40px;
        border: 4px solid hsl(var(--b3));
        border-top: 4px solid hsl(var(--p));
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-text {
        font-weight: 500;
        color: hsl(var(--bc));
        margin-bottom: 0.5rem;
      }
      
      .loading-progress {
        margin-top: 1rem;
      }
      
      .progress-bar {
        width: 100%;
        height: 8px;
        background: hsl(var(--b3));
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
      }
      
      .progress-fill {
        height: 100%;
        background: hsl(var(--p));
        border-radius: 4px;
        transition: width 0.3s ease;
        width: 0%;
      }
      
      .progress-text {
        font-size: 0.875rem;
        color: hsl(var(--bc));
        opacity: 0.7;
      }
      
      .inline-loader {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .inline-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid currentColor;
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        opacity: 0.7;
      }
      
      .button-loader {
        position: relative;
        overflow: hidden;
      }
      
      .button-loader.loading {
        color: transparent;
        pointer-events: none;
      }
      
      .button-loader.loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 16px;
        height: 16px;
        margin: -8px 0 0 -8px;
        border: 2px solid currentColor;
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      .loading-skeleton {
        background: linear-gradient(90deg, hsl(var(--b2)) 25%, hsl(var(--b3)) 50%, hsl(var(--b2)) 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 0.25rem;
      }
      
      @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      .toast-notification {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .toast-notification.removing {
        animation: slideOutRight 0.3s ease forwards;
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  /**
   * 显示全局加载
   */
  showGlobalLoading(text = '加载中...', showProgress = false) {
    if (!this.loadingOverlay) return null;

    const loaderId = this.generateLoaderId();
    
    this.loadingOverlay.querySelector('.loading-text').textContent = text;
    
    const progressElement = this.loadingOverlay.querySelector('.loading-progress');
    if (showProgress) {
      progressElement.classList.remove('hidden');
      this.updateProgress(loaderId, 0);
    } else {
      progressElement.classList.add('hidden');
    }
    
    this.loadingOverlay.classList.remove('hidden');
    this.activeLoaders.set(loaderId, {
      type: 'global',
      text,
      showProgress,
      startTime: Date.now()
    });
    
    return loaderId;
  }

  /**
   * 隐藏全局加载
   */
  hideGlobalLoading(loaderId = null) {
    if (loaderId && this.activeLoaders.has(loaderId)) {
      this.activeLoaders.delete(loaderId);
    }
    
    // 如果还有其他全局加载器，不隐藏
    const hasGlobalLoaders = Array.from(this.activeLoaders.values())
      .some(loader => loader.type === 'global');
    
    if (!hasGlobalLoaders && this.loadingOverlay) {
      this.loadingOverlay.classList.add('hidden');
    }
  }

  /**
   * 更新进度
   */
  updateProgress(loaderId, progress, text = null) {
    if (!this.activeLoaders.has(loaderId)) return;

    const loader = this.activeLoaders.get(loaderId);
    
    if (loader.type === 'global' && this.loadingOverlay) {
      const progressFill = this.loadingOverlay.querySelector('.progress-fill');
      const progressText = this.loadingOverlay.querySelector('.progress-text');
      
      if (progressFill) {
        progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      }
      
      if (progressText) {
        progressText.textContent = text || `${Math.round(progress)}%`;
      }
    }
    
    // 更新加载器信息
    loader.progress = progress;
    if (text) loader.text = text;
  }

  /**
   * 显示按钮加载状态
   */
  showButtonLoading(buttonElement, text = null) {
    if (!buttonElement) return null;

    const loaderId = this.generateLoaderId();
    
    // 保存原始状态
    const originalText = buttonElement.textContent;
    const originalDisabled = buttonElement.disabled;
    
    // 设置加载状态
    buttonElement.classList.add('button-loader', 'loading');
    buttonElement.disabled = true;
    
    if (text) {
      buttonElement.textContent = text;
    }
    
    this.activeLoaders.set(loaderId, {
      type: 'button',
      element: buttonElement,
      originalText,
      originalDisabled,
      startTime: Date.now()
    });
    
    return loaderId;
  }

  /**
   * 隐藏按钮加载状态
   */
  hideButtonLoading(loaderId) {
    if (!this.activeLoaders.has(loaderId)) return;

    const loader = this.activeLoaders.get(loaderId);
    if (loader.type !== 'button' || !loader.element) return;

    const button = loader.element;
    button.classList.remove('button-loader', 'loading');
    button.textContent = loader.originalText;
    button.disabled = loader.originalDisabled;
    
    this.activeLoaders.delete(loaderId);
  }

  /**
   * 显示内联加载器
   */
  showInlineLoading(containerElement, text = '加载中...') {
    if (!containerElement) return null;

    const loaderId = this.generateLoaderId();
    
    const loader = document.createElement('div');
    loader.className = 'inline-loader';
    loader.innerHTML = `
      <div class="inline-spinner"></div>
      <span>${text}</span>
    `;
    
    // 保存原始内容
    const originalContent = containerElement.innerHTML;
    containerElement.innerHTML = '';
    containerElement.appendChild(loader);
    
    this.activeLoaders.set(loaderId, {
      type: 'inline',
      element: containerElement,
      loader,
      originalContent,
      startTime: Date.now()
    });
    
    return loaderId;
  }

  /**
   * 隐藏内联加载器
   */
  hideInlineLoading(loaderId) {
    if (!this.activeLoaders.has(loaderId)) return;

    const loader = this.activeLoaders.get(loaderId);
    if (loader.type !== 'inline' || !loader.element) return;

    loader.element.innerHTML = loader.originalContent;
    this.activeLoaders.delete(loaderId);
  }

  /**
   * 显示骨架屏
   */
  showSkeleton(containerElement, config = {}) {
    if (!containerElement) return null;

    const loaderId = this.generateLoaderId();
    const {
      lines = 3,
      height = '1rem',
      spacing = '0.5rem',
      lastLineWidth = '60%'
    } = config;
    
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-container';
    
    for (let i = 0; i < lines; i++) {
      const line = document.createElement('div');
      line.className = 'loading-skeleton';
      line.style.height = height;
      line.style.marginBottom = i < lines - 1 ? spacing : '0';
      
      if (i === lines - 1) {
        line.style.width = lastLineWidth;
      }
      
      skeleton.appendChild(line);
    }
    
    const originalContent = containerElement.innerHTML;
    containerElement.innerHTML = '';
    containerElement.appendChild(skeleton);
    
    this.activeLoaders.set(loaderId, {
      type: 'skeleton',
      element: containerElement,
      skeleton,
      originalContent,
      startTime: Date.now()
    });
    
    return loaderId;
  }

  /**
   * 隐藏骨架屏
   */
  hideSkeleton(loaderId) {
    if (!this.activeLoaders.has(loaderId)) return;

    const loader = this.activeLoaders.get(loaderId);
    if (loader.type !== 'skeleton' || !loader.element) return;

    loader.element.innerHTML = loader.originalContent;
    this.activeLoaders.delete(loaderId);
  }

  /**
   * 显示成功通知
   */
  showSuccessNotification(message, duration = 3000) {
    return this.showNotification(message, 'success', duration);
  }

  /**
   * 显示错误通知
   */
  showErrorNotification(message, duration = 5000) {
    return this.showNotification(message, 'error', duration);
  }

  /**
   * 显示警告通知
   */
  showWarningNotification(message, duration = 4000) {
    return this.showNotification(message, 'warning', duration);
  }

  /**
   * 显示信息通知
   */
  showInfoNotification(message, duration = 3000) {
    return this.showNotification(message, 'info', duration);
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info', duration = 3000) {
    const notificationId = this.generateLoaderId();
    
    const notification = document.createElement('div');
    notification.className = `toast-notification alert alert-${type} shadow-lg`;
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fa ${this.getNotificationIcon(type)} mr-2"></i>
        <span class="flex-1">${message}</span>
        <button class="btn btn-ghost btn-xs ml-2" onclick="window.loadingManager.hideNotification('${notificationId}')">
          <i class="fa fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    this.notifications.set(notificationId, {
      element: notification,
      type,
      message,
      startTime: Date.now()
    });
    
    // 自动隐藏
    if (duration > 0) {
      setTimeout(() => {
        this.hideNotification(notificationId);
      }, duration);
    }
    
    return notificationId;
  }

  /**
   * 隐藏通知
   */
  hideNotification(notificationId) {
    if (!this.notifications.has(notificationId)) return;

    const notification = this.notifications.get(notificationId);
    const element = notification.element;
    
    element.classList.add('removing');
    
    setTimeout(() => {
      if (element.parentElement) {
        element.remove();
      }
      this.notifications.delete(notificationId);
    }, 300);
  }

  /**
   * 获取通知图标
   */
  getNotificationIcon(type) {
    const iconMap = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return iconMap[type] || 'fa-info-circle';
  }

  /**
   * 包装异步操作以显示加载状态
   */
  wrapAsyncOperation(operation, options = {}) {
    const {
      globalLoading = false,
      loadingText = '处理中...',
      successMessage = null,
      errorMessage = null,
      showProgress = false,
      buttonElement = null
    } = options;

    return async (...args) => {
      let loaderId = null;
      
      try {
        // 显示加载状态
        if (buttonElement) {
          loaderId = this.showButtonLoading(buttonElement, loadingText);
        } else if (globalLoading) {
          loaderId = this.showGlobalLoading(loadingText, showProgress);
        }
        
        // 执行操作
        const result = await operation(...args);
        
        // 显示成功消息
        if (successMessage) {
          this.showSuccessNotification(successMessage);
        }
        
        return result;
      } catch (error) {
        // 显示错误消息
        if (errorMessage) {
          this.showErrorNotification(errorMessage);
        } else {
          this.showErrorNotification(error.message || '操作失败');
        }
        
        throw error;
      } finally {
        // 隐藏加载状态
        if (loaderId) {
          if (buttonElement) {
            this.hideButtonLoading(loaderId);
          } else if (globalLoading) {
            this.hideGlobalLoading(loaderId);
          }
        }
      }
    };
  }

  /**
   * 模拟进度更新
   */
  simulateProgress(loaderId, duration = 3000, steps = 20) {
    if (!this.activeLoaders.has(loaderId)) return;

    const stepDuration = duration / steps;
    let currentStep = 0;
    
    const updateStep = () => {
      if (!this.activeLoaders.has(loaderId)) return;
      
      currentStep++;
      const progress = (currentStep / steps) * 100;
      
      this.updateProgress(loaderId, progress);
      
      if (currentStep < steps) {
        setTimeout(updateStep, stepDuration);
      }
    };
    
    updateStep();
  }

  /**
   * 生成加载器ID
   */
  generateLoaderId() {
    return 'loader_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 获取活动加载器统计
   */
  getActiveLoadersStats() {
    const stats = {
      total: this.activeLoaders.size,
      byType: {},
      notifications: this.notifications.size
    };
    
    for (const loader of this.activeLoaders.values()) {
      stats.byType[loader.type] = (stats.byType[loader.type] || 0) + 1;
    }
    
    return stats;
  }

  /**
   * 清理所有加载器
   */
  clearAllLoaders() {
    // 清理加载器
    for (const [loaderId, loader] of this.activeLoaders.entries()) {
      switch (loader.type) {
        case 'global':
          this.hideGlobalLoading(loaderId);
          break;
        case 'button':
          this.hideButtonLoading(loaderId);
          break;
        case 'inline':
          this.hideInlineLoading(loaderId);
          break;
        case 'skeleton':
          this.hideSkeleton(loaderId);
          break;
      }
    }
    
    // 清理通知
    for (const notificationId of this.notifications.keys()) {
      this.hideNotification(notificationId);
    }
    
    console.log('所有加载器已清理');
  }
}

// 创建全局加载管理器实例
window.loadingManager = new LoadingManager();

// 导出到AIChat命名空间
if (window.AIChat) {
  window.AIChat.LoadingManager = LoadingManager;
  window.AIChat.loadingManager = window.loadingManager;
}

console.log('加载管理器已加载');