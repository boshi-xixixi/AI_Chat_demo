/**
 * 增强的API服务包装器
 * 集成错误处理和加载管理
 */

class EnhancedAPIService {
  constructor(originalAPIService) {
    this.api = originalAPIService;
    this.errorHandler = window.errorHandler;
    this.loadingManager = window.loadingManager;
  }

  /**
   * 包装API调用以添加错误处理和加载状态
   */
  async callWithErrorHandling(operation, options = {}) {
    const {
      loadingText = '处理中...',
      successMessage = null,
      showGlobalLoading = false,
      buttonElement = null,
      category = this.errorHandler.errorCategories.API,
      context = {}
    } = options;

    let loaderId = null;

    try {
      // 显示加载状态
      if (buttonElement) {
        loaderId = this.loadingManager.showButtonLoading(buttonElement, loadingText);
      } else if (showGlobalLoading) {
        loaderId = this.loadingManager.showGlobalLoading(loadingText);
      }

      // 执行操作
      const result = await operation();

      // 显示成功消息
      if (successMessage) {
        this.loadingManager.showSuccessNotification(successMessage);
      }

      return result;
    } catch (error) {
      // 报告错误
      this.errorHandler.reportError(
        error.message || '操作失败',
        category,
        this.errorHandler.assessErrorLevel(error),
        { ...context, operation: operation.name }
      );

      throw error;
    } finally {
      // 隐藏加载状态
      if (loaderId) {
        if (buttonElement) {
          this.loadingManager.hideButtonLoading(loaderId);
        } else if (showGlobalLoading) {
          this.loadingManager.hideGlobalLoading(loaderId);
        }
      }
    }
  }

  /**
   * 增强的火山引擎API调用
   */
  async callVolcanoAPI(messages, options = {}) {
    return this.callWithErrorHandling(
      () => this.api.callVolcanoAPI(messages, options),
      {
        loadingText: '正在调用AI模型...',
        category: this.errorHandler.errorCategories.API,
        context: { provider: 'volcano', messageCount: messages.length }
      }
    );
  }

  /**
   * 增强的Ollama API调用
   */
  async callOllamaAPI(messages, options = {}) {
    return this.callWithErrorHandling(
      () => this.api.callOllamaAPI(messages, options),
      {
        loadingText: '正在调用本地模型...',
        category: this.errorHandler.errorCategories.API,
        context: { provider: 'ollama', messageCount: messages.length }
      }
    );
  }

  /**
   * 增强的Ollama状态检查
   */
  async checkOllamaStatus() {
    return this.callWithErrorHandling(
      () => this.api.checkOllamaStatus(),
      {
        loadingText: '检查Ollama状态...',
        category: this.errorHandler.errorCategories.NETWORK,
        context: { operation: 'ollama_status_check' }
      }
    );
  }

  /**
   * 增强的聊天请求
   */
  async sendChatRequest(messages, persona, currentMessage = null, buttonElement = null) {
    return this.callWithErrorHandling(
      () => this.api.sendChatRequest(messages, persona, currentMessage),
      {
        loadingText: '正在生成回复...',
        successMessage: null, // 不显示成功消息，由聊天界面处理
        buttonElement: buttonElement,
        category: this.errorHandler.errorCategories.API,
        context: { 
          personaId: persona.id,
          provider: this.api.currentProvider,
          messageCount: messages.length
        }
      }
    );
  }

  /**
   * 增强的模型检测
   */
  async detectBestOllamaModel(preferences = {}) {
    return this.callWithErrorHandling(
      () => this.api.detectBestOllamaModel(preferences),
      {
        loadingText: '检测最佳模型...',
        category: this.errorHandler.errorCategories.API,
        context: { operation: 'model_detection', preferences }
      }
    );
  }

  /**
   * 增强的火山引擎API测试
   */
  async testVolcanoAPI(buttonElement = null) {
    return this.callWithErrorHandling(
      () => this.api.testVolcanoAPI(),
      {
        loadingText: '测试连接...',
        successMessage: 'API连接测试成功',
        buttonElement: buttonElement,
        category: this.errorHandler.errorCategories.API,
        context: { operation: 'api_test', provider: 'volcano' }
      }
    );
  }

  // 代理其他方法到原始API服务
  setApiKey(...args) {
    return this.api.setApiKey(...args);
  }

  setProvider(...args) {
    return this.api.setProvider(...args);
  }

  getModelRecommendations(...args) {
    return this.api.getModelRecommendations(...args);
  }

  getVolcanoModels(...args) {
    return this.api.getVolcanoModels(...args);
  }

  setContextManager(...args) {
    return this.api.setContextManager(...args);
  }

  buildMessageContext(...args) {
    return this.api.buildMessageContext(...args);
  }

  getDialogStats(...args) {
    return this.api.getDialogStats(...args);
  }

  // 获取原始API服务的属性
  get currentProvider() {
    return this.api.currentProvider;
  }

  get apiKeys() {
    return this.api.apiKeys;
  }

  get models() {
    return this.api.models;
  }

  get ollamaManager() {
    return this.api.ollamaManager;
  }
}

// 导出到AIChat命名空间
if (window.AIChat) {
  window.AIChat.EnhancedAPIService = EnhancedAPIService;
}

console.log('增强的API服务包装器已加载');