/**
 * 性能优化管理器
 * 负责聊天记录的懒加载、虚拟滚动、缓存机制和内存优化
 */

class PerformanceOptimizer {
  constructor() {
    this.virtualScrollConfig = {
      itemHeight: 80, // 每个消息项的估计高度
      bufferSize: 5,  // 缓冲区大小
      containerHeight: 0,
      scrollTop: 0,
      totalItems: 0
    };
    
    this.lazyLoadConfig = {
      pageSize: 50,           // 每页加载的消息数
      loadThreshold: 200,     // 距离底部多少像素时触发加载
      isLoading: false,
      hasMore: true,
      currentPage: 0
    };
    
    this.cacheManager = new Map();
    this.maxCacheSize = 100; // 最大缓存项数
    this.memoryMonitor = {
      lastCleanup: Date.now(),
      cleanupInterval: 5 * 60 * 1000, // 5分钟清理一次
      memoryThreshold: 50 * 1024 * 1024 // 50MB内存阈值
    };
    
    this.observers = new Map(); // 存储各种观察器
    this.isInitialized = false;
  }

  /**
   * 初始化性能优化器
   */
  async init(chatContainer, messageContainer) {
    try {
      this.chatContainer = chatContainer;
      this.messageContainer = messageContainer;
      
      // 初始化虚拟滚动
      this.initVirtualScroll();
      
      // 初始化懒加载
      this.initLazyLoading();
      
      // 初始化缓存管理
      this.initCacheManagement();
      
      // 初始化内存监控
      this.initMemoryMonitoring();
      
      // 初始化图片懒加载
      this.initImageLazyLoading();
      
      this.isInitialized = true;
      console.log('性能优化器初始化完成');
      
      return true;
    } catch (error) {
      console.error('性能优化器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化虚拟滚动
   */
  initVirtualScroll() {
    if (!this.messageContainer) return;
    
    // 获取容器高度
    this.virtualScrollConfig.containerHeight = this.messageContainer.clientHeight;
    
    // 创建虚拟滚动容器
    this.createVirtualScrollContainer();
    
    // 监听滚动事件
    this.messageContainer.addEventListener('scroll', 
      this.debounce(this.handleVirtualScroll.bind(this), 16) // 60fps
    );
    
    // 监听窗口大小变化
    window.addEventListener('resize', 
      this.debounce(this.handleResize.bind(this), 100)
    );
    
    console.log('虚拟滚动已初始化');
  }

  /**
   * 创建虚拟滚动容器
   */
  createVirtualScrollContainer() {
    // 创建虚拟容器
    this.virtualContainer = document.createElement('div');
    this.virtualContainer.className = 'virtual-scroll-container';
    this.virtualContainer.style.cssText = `
      position: relative;
      height: 100%;
      overflow: hidden;
    `;
    
    // 创建可见区域
    this.visibleArea = document.createElement('div');
    this.visibleArea.className = 'virtual-visible-area';
    this.visibleArea.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      will-change: transform;
    `;
    
    // 创建占位符（用于维持滚动条）
    this.spacer = document.createElement('div');
    this.spacer.className = 'virtual-spacer';
    
    this.virtualContainer.appendChild(this.spacer);
    this.virtualContainer.appendChild(this.visibleArea);
  }

  /**
   * 处理虚拟滚动
   */
  handleVirtualScroll(event) {
    if (!this.isVirtualScrollEnabled()) return;
    
    const scrollTop = event.target.scrollTop;
    this.virtualScrollConfig.scrollTop = scrollTop;
    
    // 计算可见范围
    const visibleRange = this.calculateVisibleRange(scrollTop);
    
    // 更新可见项
    this.updateVisibleItems(visibleRange);
    
    // 检查是否需要懒加载更多内容
    this.checkLazyLoad(scrollTop);
  }

  /**
   * 计算可见范围
   */
  calculateVisibleRange(scrollTop) {
    const { itemHeight, bufferSize, containerHeight } = this.virtualScrollConfig;
    
    const startIndex = Math.max(0, 
      Math.floor(scrollTop / itemHeight) - bufferSize
    );
    
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(
      this.virtualScrollConfig.totalItems - 1,
      startIndex + visibleCount + bufferSize * 2
    );
    
    return { startIndex, endIndex, visibleCount };
  }

  /**
   * 更新可见项
   */
  updateVisibleItems(visibleRange) {
    const { startIndex, endIndex } = visibleRange;
    const { itemHeight } = this.virtualScrollConfig;
    
    // 清空当前可见区域
    this.visibleArea.innerHTML = '';
    
    // 设置可见区域的偏移
    const offsetY = startIndex * itemHeight;
    this.visibleArea.style.transform = `translateY(${offsetY}px)`;
    
    // 渲染可见项
    for (let i = startIndex; i <= endIndex; i++) {
      const item = this.renderVirtualItem(i);
      if (item) {
        this.visibleArea.appendChild(item);
      }
    }
    
    // 更新占位符高度
    this.spacer.style.height = `${this.virtualScrollConfig.totalItems * itemHeight}px`;
  }

  /**
   * 渲染虚拟项
   */
  renderVirtualItem(index) {
    // 从缓存获取消息数据
    const messageData = this.getCachedMessage(index);
    if (!messageData) return null;
    
    // 创建消息元素
    const messageElement = this.createMessageElement(messageData, index);
    return messageElement;
  }

  /**
   * 初始化懒加载
   */
  initLazyLoading() {
    if (!this.messageContainer) return;
    
    // 创建交叉观察器用于懒加载
    this.lazyLoadObserver = new IntersectionObserver(
      this.handleLazyLoadIntersection.bind(this),
      {
        root: this.messageContainer,
        rootMargin: `${this.lazyLoadConfig.loadThreshold}px`,
        threshold: 0.1
      }
    );
    
    // 创建加载触发器
    this.createLoadTrigger();
    
    console.log('懒加载已初始化');
  }

  /**
   * 创建加载触发器
   */
  createLoadTrigger() {
    this.loadTrigger = document.createElement('div');
    this.loadTrigger.className = 'lazy-load-trigger';
    this.loadTrigger.style.cssText = `
      height: 1px;
      margin: 10px 0;
      background: transparent;
    `;
    
    // 添加到消息容器顶部（用于向上加载历史消息）
    if (this.messageContainer.firstChild) {
      this.messageContainer.insertBefore(this.loadTrigger, this.messageContainer.firstChild);
    } else {
      this.messageContainer.appendChild(this.loadTrigger);
    }
    
    // 开始观察
    this.lazyLoadObserver.observe(this.loadTrigger);
  }

  /**
   * 处理懒加载交叉事件
   */
  async handleLazyLoadIntersection(entries) {
    for (const entry of entries) {
      if (entry.isIntersecting && !this.lazyLoadConfig.isLoading && this.lazyLoadConfig.hasMore) {
        await this.loadMoreMessages();
      }
    }
  }

  /**
   * 加载更多消息
   */
  async loadMoreMessages() {
    if (this.lazyLoadConfig.isLoading || !this.lazyLoadConfig.hasMore) {
      return;
    }
    
    this.lazyLoadConfig.isLoading = true;
    
    try {
      // 显示加载指示器
      this.showLoadingIndicator();
      
      // 获取当前人格ID
      const currentPersonaId = this.getCurrentPersonaId();
      if (!currentPersonaId) return;
      
      // 计算偏移量
      const offset = this.lazyLoadConfig.currentPage * this.lazyLoadConfig.pageSize;
      
      // 从聊天管理器获取更多消息
      const messages = await this.loadMessagesFromStorage(
        currentPersonaId, 
        this.lazyLoadConfig.pageSize, 
        offset
      );
      
      if (messages && messages.length > 0) {
        // 缓存消息
        this.cacheMessages(messages, offset);
        
        // 渲染新消息
        await this.renderLazyLoadedMessages(messages);
        
        // 更新页码
        this.lazyLoadConfig.currentPage++;
        
        // 检查是否还有更多消息
        if (messages.length < this.lazyLoadConfig.pageSize) {
          this.lazyLoadConfig.hasMore = false;
          this.hideLoadTrigger();
        }
      } else {
        this.lazyLoadConfig.hasMore = false;
        this.hideLoadTrigger();
      }
      
    } catch (error) {
      console.error('懒加载消息失败:', error);
      this.showLoadError();
    } finally {
      this.lazyLoadConfig.isLoading = false;
      this.hideLoadingIndicator();
    }
  }

  /**
   * 从存储加载消息
   */
  async loadMessagesFromStorage(personaId, limit, offset) {
    try {
      // 这里需要与聊天管理器集成
      if (window.AIChat && window.AIChat.chatManager) {
        return await window.AIChat.chatManager.getChatHistory(personaId, limit, offset);
      }
      
      // 备用方案：直接从存储获取
      if (window.AIChat && window.AIChat.storage) {
        const allMessages = await window.AIChat.storage.loadChatHistory(personaId, limit + offset);
        return allMessages.slice(offset, offset + limit);
      }
      
      return [];
    } catch (error) {
      console.error('从存储加载消息失败:', error);
      return [];
    }
  }

  /**
   * 渲染懒加载的消息
   */
  async renderLazyLoadedMessages(messages) {
    const fragment = document.createDocumentFragment();
    
    for (const message of messages) {
      const messageElement = this.createMessageElement(message);
      if (messageElement) {
        fragment.appendChild(messageElement);
      }
    }
    
    // 插入到加载触发器之后
    if (this.loadTrigger && this.loadTrigger.nextSibling) {
      this.messageContainer.insertBefore(fragment, this.loadTrigger.nextSibling);
    } else {
      this.messageContainer.appendChild(fragment);
    }
  }

  /**
   * 初始化缓存管理
   */
  initCacheManagement() {
    // 初始化各种缓存
    this.messageCache = new Map();
    this.imageCache = new Map();
    this.apiResponseCache = new Map();
    
    // 设置缓存清理定时器
    setInterval(() => {
      this.cleanupCache();
    }, this.memoryMonitor.cleanupInterval);
    
    console.log('缓存管理已初始化');
  }

  /**
   * 缓存消息
   */
  cacheMessages(messages, startIndex = 0) {
    messages.forEach((message, index) => {
      const cacheKey = `msg_${startIndex + index}`;
      this.messageCache.set(cacheKey, {
        data: message,
        timestamp: Date.now(),
        accessCount: 0
      });
    });
    
    // 检查缓存大小
    this.checkCacheSize();
  }

  /**
   * 获取缓存的消息
   */
  getCachedMessage(index) {
    const cacheKey = `msg_${index}`;
    const cached = this.messageCache.get(cacheKey);
    
    if (cached) {
      cached.accessCount++;
      cached.lastAccess = Date.now();
      return cached.data;
    }
    
    return null;
  }

  /**
   * 缓存图片
   */
  cacheImage(url, blob) {
    if (this.imageCache.size >= this.maxCacheSize) {
      this.cleanupImageCache();
    }
    
    this.imageCache.set(url, {
      blob,
      timestamp: Date.now(),
      size: blob.size
    });
  }

  /**
   * 获取缓存的图片
   */
  getCachedImage(url) {
    return this.imageCache.get(url);
  }

  /**
   * 缓存API响应
   */
  cacheApiResponse(key, response, ttl = 5 * 60 * 1000) { // 默认5分钟TTL
    this.apiResponseCache.set(key, {
      data: response,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 获取缓存的API响应
   */
  getCachedApiResponse(key) {
    const cached = this.apiResponseCache.get(key);
    
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < cached.ttl) {
        return cached.data;
      } else {
        this.apiResponseCache.delete(key);
      }
    }
    
    return null;
  }

  /**
   * 检查缓存大小
   */
  checkCacheSize() {
    if (this.messageCache.size > this.maxCacheSize) {
      this.cleanupMessageCache();
    }
  }

  /**
   * 清理消息缓存
   */
  cleanupMessageCache() {
    // 按访问频率和时间排序，删除最少使用的项
    const entries = Array.from(this.messageCache.entries());
    entries.sort((a, b) => {
      const scoreA = a[1].accessCount / (Date.now() - a[1].timestamp);
      const scoreB = b[1].accessCount / (Date.now() - b[1].timestamp);
      return scoreA - scoreB;
    });
    
    // 删除最少使用的25%
    const deleteCount = Math.floor(entries.length * 0.25);
    for (let i = 0; i < deleteCount; i++) {
      this.messageCache.delete(entries[i][0]);
    }
    
    console.log(`清理了 ${deleteCount} 个消息缓存项`);
  }

  /**
   * 清理图片缓存
   */
  cleanupImageCache() {
    const entries = Array.from(this.imageCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // 删除最旧的50%
    const deleteCount = Math.floor(entries.length * 0.5);
    for (let i = 0; i < deleteCount; i++) {
      this.imageCache.delete(entries[i][0]);
    }
    
    console.log(`清理了 ${deleteCount} 个图片缓存项`);
  }

  /**
   * 清理所有缓存
   */
  cleanupCache() {
    const now = Date.now();
    
    // 清理过期的API响应缓存
    for (const [key, value] of this.apiResponseCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.apiResponseCache.delete(key);
      }
    }
    
    // 定期清理其他缓存
    if (now - this.memoryMonitor.lastCleanup > this.memoryMonitor.cleanupInterval) {
      this.cleanupMessageCache();
      this.cleanupImageCache();
      this.memoryMonitor.lastCleanup = now;
    }
  }

  /**
   * 初始化内存监控
   */
  initMemoryMonitoring() {
    // 监控内存使用情况
    if ('memory' in performance) {
      setInterval(() => {
        this.checkMemoryUsage();
      }, 30000); // 每30秒检查一次
    }
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onPageHidden();
      } else {
        this.onPageVisible();
      }
    });
    
    console.log('内存监控已初始化');
  }

  /**
   * 检查内存使用情况
   */
  checkMemoryUsage() {
    if (!('memory' in performance)) return;
    
    const memInfo = performance.memory;
    const usedMemory = memInfo.usedJSHeapSize;
    
    if (usedMemory > this.memoryMonitor.memoryThreshold) {
      console.warn(`内存使用过高: ${Math.round(usedMemory / 1024 / 1024)}MB`);
      this.performMemoryCleanup();
    }
  }

  /**
   * 执行内存清理
   */
  performMemoryCleanup() {
    // 清理缓存
    this.cleanupCache();
    
    // 清理DOM中不可见的元素
    this.cleanupInvisibleElements();
    
    // 触发垃圾回收（如果可能）
    if (window.gc) {
      window.gc();
    }
    
    console.log('执行了内存清理');
  }

  /**
   * 清理不可见的DOM元素
   */
  cleanupInvisibleElements() {
    if (!this.messageContainer) return;
    
    const messages = this.messageContainer.querySelectorAll('.chat-message');
    const containerRect = this.messageContainer.getBoundingClientRect();
    
    messages.forEach(message => {
      const messageRect = message.getBoundingClientRect();
      
      // 如果消息完全不在可见区域内
      if (messageRect.bottom < containerRect.top - 1000 || 
          messageRect.top > containerRect.bottom + 1000) {
        
        // 将消息内容替换为占位符
        const placeholder = this.createMessagePlaceholder(message);
        if (placeholder) {
          message.parentNode.replaceChild(placeholder, message);
        }
      }
    });
  }

  /**
   * 创建消息占位符
   */
  createMessagePlaceholder(originalMessage) {
    const placeholder = document.createElement('div');
    placeholder.className = 'message-placeholder';
    placeholder.style.cssText = `
      height: ${originalMessage.offsetHeight}px;
      background: rgba(0,0,0,0.05);
      border-radius: 8px;
      margin: ${getComputedStyle(originalMessage).margin};
    `;
    
    // 存储原始数据用于恢复
    placeholder.dataset.messageId = originalMessage.dataset.messageId;
    placeholder.dataset.personaId = originalMessage.dataset.personaId;
    
    return placeholder;
  }

  /**
   * 页面隐藏时的处理
   */
  onPageHidden() {
    // 暂停不必要的操作
    this.pauseOperations();
    
    // 清理缓存
    this.cleanupCache();
  }

  /**
   * 页面可见时的处理
   */
  onPageVisible() {
    // 恢复操作
    this.resumeOperations();
  }

  /**
   * 暂停操作
   */
  pauseOperations() {
    // 暂停虚拟滚动更新
    this.virtualScrollPaused = true;
    
    // 暂停懒加载
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.disconnect();
    }
  }

  /**
   * 恢复操作
   */
  resumeOperations() {
    // 恢复虚拟滚动
    this.virtualScrollPaused = false;
    
    // 恢复懒加载
    if (this.lazyLoadObserver && this.loadTrigger) {
      this.lazyLoadObserver.observe(this.loadTrigger);
    }
  }

  /**
   * 初始化图片懒加载
   */
  initImageLazyLoading() {
    // 创建图片懒加载观察器
    this.imageObserver = new IntersectionObserver(
      this.handleImageIntersection.bind(this),
      {
        root: this.messageContainer,
        rootMargin: '50px',
        threshold: 0.1
      }
    );
    
    console.log('图片懒加载已初始化');
  }

  /**
   * 处理图片交叉事件
   */
  async handleImageIntersection(entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const img = entry.target;
        await this.loadImage(img);
        this.imageObserver.unobserve(img);
      }
    }
  }

  /**
   * 加载图片
   */
  async loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;
    
    try {
      // 检查缓存
      const cached = this.getCachedImage(src);
      if (cached) {
        img.src = URL.createObjectURL(cached.blob);
        img.classList.add('loaded');
        return;
      }
      
      // 加载图片
      const response = await fetch(src);
      const blob = await response.blob();
      
      // 缓存图片
      this.cacheImage(src, blob);
      
      // 设置图片源
      img.src = URL.createObjectURL(blob);
      img.classList.add('loaded');
      
    } catch (error) {
      console.error('图片加载失败:', error);
      img.classList.add('error');
    }
  }

  /**
   * 工具函数：防抖
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
  }

  /**
   * 工具函数：节流
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // 辅助方法
  isVirtualScrollEnabled() {
    return this.virtualScrollConfig.totalItems > 50; // 超过50条消息时启用虚拟滚动
  }

  getCurrentPersonaId() {
    // 从全局状态获取当前人格ID
    if (window.AIChat && window.AIChat.personaManager) {
      const currentPersona = window.AIChat.personaManager.getCurrentPersona();
      return currentPersona ? currentPersona.id : null;
    }
    return null;
  }

  createMessageElement(messageData, index) {
    // 这里应该调用现有的消息渲染逻辑
    // 简化实现
    const element = document.createElement('div');
    element.className = 'chat-message';
    element.dataset.messageId = messageData.id;
    element.dataset.index = index;
    
    // 基本消息结构
    element.innerHTML = `
      <div class="chat ${messageData.role === 'user' ? 'chat-end' : 'chat-start'}">
        <div class="chat-bubble">
          ${messageData.content}
        </div>
        <div class="chat-footer opacity-50">
          <time class="text-xs">${new Date(messageData.timestamp).toLocaleTimeString()}</time>
        </div>
      </div>
    `;
    
    return element;
  }

  showLoadingIndicator() {
    if (!this.loadingIndicator) {
      this.loadingIndicator = document.createElement('div');
      this.loadingIndicator.className = 'loading-indicator';
      this.loadingIndicator.innerHTML = `
        <div class="flex items-center justify-center p-4">
          <div class="loading loading-spinner loading-sm mr-2"></div>
          <span class="text-sm opacity-70">加载历史消息...</span>
        </div>
      `;
    }
    
    if (this.loadTrigger && !this.loadingIndicator.parentNode) {
      this.loadTrigger.parentNode.insertBefore(this.loadingIndicator, this.loadTrigger);
    }
  }

  hideLoadingIndicator() {
    if (this.loadingIndicator && this.loadingIndicator.parentNode) {
      this.loadingIndicator.parentNode.removeChild(this.loadingIndicator);
    }
  }

  hideLoadTrigger() {
    if (this.loadTrigger) {
      this.loadTrigger.style.display = 'none';
    }
  }

  showLoadError() {
    // 显示加载错误提示
    console.error('加载更多消息失败');
  }

  handleResize() {
    if (this.messageContainer) {
      this.virtualScrollConfig.containerHeight = this.messageContainer.clientHeight;
      // 重新计算可见范围
      if (this.isVirtualScrollEnabled()) {
        this.handleVirtualScroll({ target: { scrollTop: this.virtualScrollConfig.scrollTop } });
      }
    }
  }

  /**
   * 获取性能统计信息
   */
  getPerformanceStats() {
    return {
      virtualScroll: {
        enabled: this.isVirtualScrollEnabled(),
        totalItems: this.virtualScrollConfig.totalItems,
        containerHeight: this.virtualScrollConfig.containerHeight,
        itemHeight: this.virtualScrollConfig.itemHeight
      },
      lazyLoad: {
        currentPage: this.lazyLoadConfig.currentPage,
        pageSize: this.lazyLoadConfig.pageSize,
        hasMore: this.lazyLoadConfig.hasMore,
        isLoading: this.lazyLoadConfig.isLoading
      },
      cache: {
        messageCache: this.messageCache.size,
        imageCache: this.imageCache.size,
        apiResponseCache: this.apiResponseCache.size,
        maxCacheSize: this.maxCacheSize
      },
      memory: {
        lastCleanup: new Date(this.memoryMonitor.lastCleanup),
        cleanupInterval: this.memoryMonitor.cleanupInterval,
        memoryThreshold: this.memoryMonitor.memoryThreshold
      }
    };
  }

  /**
   * 重置性能优化器
   */
  reset() {
    // 清理所有缓存
    this.messageCache.clear();
    this.imageCache.clear();
    this.apiResponseCache.clear();
    
    // 重置懒加载状态
    this.lazyLoadConfig.currentPage = 0;
    this.lazyLoadConfig.hasMore = true;
    this.lazyLoadConfig.isLoading = false;
    
    // 重置虚拟滚动状态
    this.virtualScrollConfig.scrollTop = 0;
    this.virtualScrollConfig.totalItems = 0;
    
    console.log('性能优化器已重置');
  }

  /**
   * 销毁性能优化器
   */
  destroy() {
    // 断开所有观察器
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.disconnect();
    }
    
    if (this.imageObserver) {
      this.imageObserver.disconnect();
    }
    
    // 清理事件监听器
    if (this.messageContainer) {
      this.messageContainer.removeEventListener('scroll', this.handleVirtualScroll);
    }
    
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.onPageVisible);
    
    // 清理缓存
    this.messageCache.clear();
    this.imageCache.clear();
    this.apiResponseCache.clear();
    
    this.isInitialized = false;
    console.log('性能优化器已销毁');
  }
}

// 导出性能优化器
window.AIChat = window.AIChat || {};
window.AIChat.PerformanceOptimizer = PerformanceOptimizer;

console.log('性能优化器已加载');