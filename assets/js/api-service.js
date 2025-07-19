/**
 * API服务
 * 负责与AI模型API的通信
 */

class APIService {
  constructor() {
    this.apiKeys = {};
    this.currentProvider = 'volcano'; // 'volcano' | 'ollama'
    this.models = {
      volcano: 'doubao-1.5-pro-32k-250115',
      ollama: 'llama2' // 默认模型，会自动检测
    };
    this.requestTimeout = 30000; // 30秒超时
    
    // Ollama连接管理器
    this.ollamaManager = new OllamaConnectionManager(this);
    
    // 缓存
    this.modelCache = new Map();
    this.statusCache = new Map();
    this.lastHealthCheck = 0;
    this.healthCheckInterval = 30000; // 30秒检查一次
  }

  /**
   * 初始化API服务
   */
  async init(storageService) {
    this.storage = storageService;
    
    // 加载API配置
    this.apiKeys.volcano = await this.storage.loadSetting('volcanoApiKey', '');
    this.apiKeys.ollama = await this.storage.loadSetting('ollamaEndpoint', 'http://localhost:11434');
    this.currentProvider = await this.storage.loadSetting('currentProvider', 'volcano');
    
    // 初始化Ollama连接管理器
    if (this.ollamaManager) {
      this.ollamaManager.destroy();
    }
    this.ollamaManager = new OllamaConnectionManager(this);
    
    // 添加连接状态监听器
    this.ollamaManager.addConnectionListener((isConnected, status) => {
      console.log(`Ollama连接状态变化: ${isConnected ? '已连接' : '已断开'}`, status);
      
      // 触发自定义事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ollamaConnectionChange', {
          detail: { isConnected, status }
        }));
      }
    });
    
    console.log('API服务初始化完成，当前提供商:', this.currentProvider);
    
    // 如果当前使用Ollama，立即检查连接状态
    if (this.currentProvider === 'ollama') {
      setTimeout(() => {
        this.ollamaManager.performHealthCheck();
      }, 1000);
    }
  }

  /**
   * 设置API密钥
   */
  async setApiKey(provider, key) {
    this.apiKeys[provider] = key;
    await this.storage.saveSetting(`${provider}ApiKey`, key);
    console.log(`${provider} API密钥已更新`);
  }

  /**
   * 设置当前提供商
   */
  async setProvider(provider) {
    if (!['volcano', 'ollama'].includes(provider)) {
      throw new Error('不支持的API提供商');
    }
    
    this.currentProvider = provider;
    await this.storage.saveSetting('currentProvider', provider);
    console.log('切换到API提供商:', provider);
  }

  /**
   * 检测Ollama服务状态
   */
  async checkOllamaStatus() {
    const cacheKey = 'ollama_status';
    const now = Date.now();
    
    // 检查缓存
    if (this.statusCache.has(cacheKey)) {
      const cached = this.statusCache.get(cacheKey);
      if (now - cached.timestamp < 10000) { // 10秒缓存
        return cached.data;
      }
    }
    
    try {
      console.log('检测Ollama服务状态...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 增加超时时间

      // 并行检查多个端点
      const endpoints = [
        this.apiKeys.ollama,
        'http://localhost:11434',
        'http://127.0.0.1:11434'
      ];
      
      let bestEndpoint = this.apiKeys.ollama;
      let response = null;
      
      // 尝试连接到最佳端点
      for (const endpoint of endpoints) {
        try {
          response = await fetch(`${endpoint}/api/tags`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            bestEndpoint = endpoint;
            break;
          }
        } catch (err) {
          console.warn(`端点 ${endpoint} 连接失败:`, err.message);
          continue;
        }
      }
      
      clearTimeout(timeoutId);

      if (response && response.ok) {
        const data = await response.json();
        const models = data.models || [];
        
        // 获取详细的模型信息
        const detailedModels = await this._getDetailedModelInfo(models, bestEndpoint);
        
        // 获取系统信息
        const systemInfo = await this._getOllamaSystemInfo(bestEndpoint);
        
        const result = {
          available: true,
          models: detailedModels,
          modelCount: models.length,
          version: systemInfo.version,
          endpoint: bestEndpoint,
          systemInfo: systemInfo,
          lastChecked: now,
          responseTime: now - (this.lastHealthCheck || now)
        };
        
        // 更新缓存
        this.statusCache.set(cacheKey, {
          data: result,
          timestamp: now
        });
        
        // 如果端点发生变化，更新配置
        if (bestEndpoint !== this.apiKeys.ollama) {
          this.apiKeys.ollama = bestEndpoint;
          console.log(`Ollama端点已更新为: ${bestEndpoint}`);
        }
        
        console.log(`Ollama服务可用，发现 ${models.length} 个模型`);
        return result;
      }
      
      const errorResult = { 
        available: false, 
        error: `Ollama服务响应错误: ${response ? response.status : '无响应'}`,
        lastChecked: now
      };
      
      this.statusCache.set(cacheKey, {
        data: errorResult,
        timestamp: now
      });
      
      return errorResult;
    } catch (error) {
      let errorMessage = 'Ollama服务不可用';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Ollama服务连接超时';
      } else if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Ollama服务未启动或网络连接失败';
      } else {
        errorMessage = error.message;
      }
      
      console.warn('Ollama状态检测失败:', errorMessage);
      
      const errorResult = { 
        available: false, 
        error: errorMessage,
        lastChecked: now
      };
      
      this.statusCache.set(cacheKey, {
        data: errorResult,
        timestamp: now
      });
      
      return errorResult;
    }
  }

  /**
   * 获取Ollama版本信息
   */
  async _getOllamaVersion() {
    try {
      const response = await fetch(`${this.apiKeys.ollama}/api/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.version || 'unknown';
      }
    } catch (error) {
      console.warn('获取Ollama版本失败:', error);
    }
    
    return 'unknown';
  }

  /**
   * 获取详细的模型信息
   */
  async _getDetailedModelInfo(models, endpoint) {
    const detailedModels = [];
    
    for (const model of models.slice(0, 10)) { // 限制并发请求数量
      try {
        const response = await fetch(`${endpoint}/api/show`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: model.name }),
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const details = await response.json();
          detailedModels.push({
            ...model,
            details: details,
            size: this._formatModelSize(model.size),
            family: this._extractModelFamily(model.name),
            parameters: this._extractParameters(model.name),
            quantization: this._extractQuantization(model.name),
            lastUsed: model.modified_at,
            isRecommended: this._isRecommendedModel(model.name)
          });
        } else {
          // 如果获取详细信息失败，至少保留基本信息
          detailedModels.push({
            ...model,
            size: this._formatModelSize(model.size),
            family: this._extractModelFamily(model.name),
            parameters: this._extractParameters(model.name),
            quantization: this._extractQuantization(model.name),
            isRecommended: this._isRecommendedModel(model.name)
          });
        }
      } catch (error) {
        console.warn(`获取模型 ${model.name} 详细信息失败:`, error);
        detailedModels.push({
          ...model,
          size: this._formatModelSize(model.size),
          family: this._extractModelFamily(model.name),
          isRecommended: this._isRecommendedModel(model.name)
        });
      }
    }
    
    return detailedModels;
  }

  /**
   * 获取Ollama系统信息
   */
  async _getOllamaSystemInfo(endpoint) {
    try {
      const [versionResponse, psResponse] = await Promise.allSettled([
        fetch(`${endpoint}/api/version`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        }),
        fetch(`${endpoint}/api/ps`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        })
      ]);
      
      let version = 'unknown';
      let runningModels = [];
      
      if (versionResponse.status === 'fulfilled' && versionResponse.value.ok) {
        const versionData = await versionResponse.value.json();
        version = versionData.version || 'unknown';
      }
      
      if (psResponse.status === 'fulfilled' && psResponse.value.ok) {
        const psData = await psResponse.value.json();
        runningModels = psData.models || [];
      }
      
      return {
        version,
        runningModels,
        runningModelCount: runningModels.length,
        endpoint
      };
    } catch (error) {
      console.warn('获取Ollama系统信息失败:', error);
      return {
        version: 'unknown',
        runningModels: [],
        runningModelCount: 0,
        endpoint
      };
    }
  }

  /**
   * 格式化模型大小
   */
  _formatModelSize(bytes) {
    if (!bytes) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * 提取模型家族
   */
  _extractModelFamily(modelName) {
    const name = modelName.toLowerCase();
    
    if (name.includes('llama')) return 'Llama';
    if (name.includes('qwen')) return 'Qwen';
    if (name.includes('gemma')) return 'Gemma';
    if (name.includes('mistral')) return 'Mistral';
    if (name.includes('codellama')) return 'Code Llama';
    if (name.includes('vicuna')) return 'Vicuna';
    if (name.includes('alpaca')) return 'Alpaca';
    if (name.includes('phi')) return 'Phi';
    
    return 'Other';
  }

  /**
   * 提取模型参数数量
   */
  _extractParameters(modelName) {
    const match = modelName.match(/(\d+(?:\.\d+)?)[bB]/);
    return match ? `${match[1]}B` : 'Unknown';
  }

  /**
   * 提取量化信息
   */
  _extractQuantization(modelName) {
    const match = modelName.match(/q(\d+(?:_\d+)?)/i);
    return match ? `Q${match[1]}` : 'FP16';
  }

  /**
   * 判断是否为推荐模型
   */
  _isRecommendedModel(modelName) {
    const recommendedModels = [
      'llama3.1:8b',
      'llama3.1:7b',
      'qwen2:7b',
      'gemma2:9b',
      'mistral:7b'
    ];
    
    return recommendedModels.some(recommended => 
      modelName.toLowerCase().includes(recommended.toLowerCase())
    );
  }

  /**
   * 自动检测和选择最佳Ollama模型
   */
  async detectBestOllamaModel(preferences = {}) {
    const cacheKey = 'best_ollama_model';
    const now = Date.now();
    
    // 检查缓存
    if (this.modelCache.has(cacheKey)) {
      const cached = this.modelCache.get(cacheKey);
      if (now - cached.timestamp < 60000) { // 1分钟缓存
        return cached.data;
      }
    }
    
    try {
      const status = await this.checkOllamaStatus();
      
      if (!status.available || !status.models.length) {
        return null;
      }

      // 智能模型选择算法
      const scoredModels = this._scoreModels(status.models, preferences);
      
      // 按分数排序
      scoredModels.sort((a, b) => b.score - a.score);
      
      const bestModel = scoredModels[0];
      
      if (bestModel) {
        console.log(`选择最佳Ollama模型: ${bestModel.name} (得分: ${bestModel.score})`);
        
        // 缓存结果
        this.modelCache.set(cacheKey, {
          data: bestModel,
          timestamp: now
        });
        
        // 保存用户偏好
        await this._saveModelPreference(bestModel.name);
        
        return bestModel;
      }

      return null;
    } catch (error) {
      console.error('检测最佳Ollama模型失败:', error);
      return null;
    }
  }

  /**
   * 为模型评分
   */
  _scoreModels(models, preferences = {}) {
    return models.map(model => {
      let score = 0;
      const name = model.name.toLowerCase();
      
      // 基础分数 - 根据模型家族
      if (name.includes('llama3.1')) score += 100;
      else if (name.includes('llama3')) score += 90;
      else if (name.includes('qwen2')) score += 85;
      else if (name.includes('gemma2')) score += 80;
      else if (name.includes('mistral')) score += 75;
      else if (name.includes('llama2')) score += 70;
      else score += 50;
      
      // 参数数量评分 (7B-8B为最佳平衡点)
      if (name.includes('7b') || name.includes('8b')) score += 20;
      else if (name.includes('13b') || name.includes('14b')) score += 15;
      else if (name.includes('3b') || name.includes('4b')) score += 10;
      else if (name.includes('1b') || name.includes('2b')) score += 5;
      
      // 量化评分 (Q4为最佳平衡点)
      if (name.includes('q4')) score += 15;
      else if (name.includes('q5') || name.includes('q6')) score += 10;
      else if (name.includes('q8')) score += 8;
      else if (name.includes('q3')) score += 5;
      else score += 12; // FP16默认分数
      
      // 模型大小评分 (偏好中等大小)
      if (model.size) {
        const sizeGB = model.size / (1024 * 1024 * 1024);
        if (sizeGB >= 3 && sizeGB <= 6) score += 10;
        else if (sizeGB >= 6 && sizeGB <= 10) score += 8;
        else if (sizeGB < 3) score += 5;
        else score += 3;
      }
      
      // 最近使用评分
      if (model.modified_at) {
        const daysSinceModified = (Date.now() - new Date(model.modified_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceModified < 7) score += 10;
        else if (daysSinceModified < 30) score += 5;
      }
      
      // 用户偏好评分
      if (preferences.preferredFamily && model.family === preferences.preferredFamily) {
        score += 25;
      }
      
      if (preferences.preferredSize && name.includes(preferences.preferredSize)) {
        score += 20;
      }
      
      // 推荐模型额外分数
      if (model.isRecommended) {
        score += 15;
      }
      
      return {
        ...model,
        score: Math.round(score)
      };
    });
  }

  /**
   * 保存模型偏好
   */
  async _saveModelPreference(modelName) {
    try {
      if (this.storage) {
        await this.storage.saveSetting('preferredOllamaModel', modelName);
      }
    } catch (error) {
      console.warn('保存模型偏好失败:', error);
    }
  }

  /**
   * 获取模型推荐列表
   */
  async getModelRecommendations(limit = 5) {
    try {
      const status = await this.checkOllamaStatus();
      
      if (!status.available || !status.models.length) {
        return [];
      }
      
      const scoredModels = this._scoreModels(status.models);
      scoredModels.sort((a, b) => b.score - a.score);
      
      return scoredModels.slice(0, limit).map(model => ({
        name: model.name,
        family: model.family,
        parameters: model.parameters,
        size: model.size,
        score: model.score,
        isRecommended: model.isRecommended,
        description: this._getModelDescription(model)
      }));
    } catch (error) {
      console.error('获取模型推荐失败:', error);
      return [];
    }
  }

  /**
   * 获取模型描述
   */
  _getModelDescription(model) {
    const family = model.family || 'Unknown';
    const params = model.parameters || 'Unknown';
    const size = this._formatModelSize(model.size) || 'Unknown';
    
    let description = `${family} ${params} 模型`;
    
    if (model.isRecommended) {
      description += ' (推荐)';
    }
    
    if (size !== 'Unknown') {
      description += ` - ${size}`;
    }
    
    return description;
  }

  /**
   * 发送聊天请求
   */
  async sendChatRequest(messages, persona, currentMessage = null) {
    try {
      // 构建完整的消息上下文
      const fullMessages = await this.buildMessageContext(messages, persona, currentMessage);
      
      if (this.currentProvider === 'volcano') {
        return await this.callVolcanoAPI(fullMessages);
      } else {
        return await this.callOllamaAPI(fullMessages);
      }
    } catch (error) {
      console.error('聊天请求失败:', error);
      throw error;
    }
  }

  /**
   * 构建消息上下文（智能版本）
   */
  async buildMessageContext(messages, persona, currentMessage = null) {
    const context = [];
    
    // 添加系统提示词
    context.push({
      role: 'system',
      content: persona.prompt
    });
    
    // 验证并添加预设对话
    if (persona.beginDialogs && persona.beginDialogs.length > 0) {
      const validatedBeginDialogs = this._validateAndProcessDialogs(persona.beginDialogs, 'beginDialogs');
      if (validatedBeginDialogs.length > 0) {
        context.push(...validatedBeginDialogs);
        console.log(`添加了 ${validatedBeginDialogs.length} 条预设对话`);
      }
    }
    
    // 验证并添加风格模仿对话
    if (persona.moodImitationDialogs && persona.moodImitationDialogs.length > 0) {
      const validatedMoodDialogs = this._validateAndProcessDialogs(persona.moodImitationDialogs, 'moodImitationDialogs');
      if (validatedMoodDialogs.length > 0) {
        context.push(...validatedMoodDialogs);
        console.log(`添加了 ${validatedMoodDialogs.length} 条风格模仿对话`);
      }
    }
    
    // 使用智能上下文管理器构建历史消息上下文
    if (this.contextManager) {
      try {
        const intelligentContext = await this.contextManager.buildContext(
          persona.id, 
          currentMessage,
          {
            maxMessages: 30,
            maxTokens: 6000
          }
        );
        
        // 只添加消息内容，不包括重要性等元数据
        const cleanMessages = intelligentContext.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        context.push(...cleanMessages);
      } catch (error) {
        console.warn('智能上下文构建失败，使用简单模式:', error);
        // 降级处理：使用简单的最近消息
        const recentMessages = messages.slice(-20);
        context.push(...recentMessages);
      }
    } else {
      // 如果没有上下文管理器，使用简单的最近消息
      const recentMessages = messages.slice(-20);
      context.push(...recentMessages);
    }
    
    return context;
  }

  /**
   * 验证和处理对话数据
   */
  _validateAndProcessDialogs(dialogs, type) {
    if (!Array.isArray(dialogs)) {
      console.warn(`${type} 不是数组格式`);
      return [];
    }

    // 验证对话对数（必须是偶数）
    if (dialogs.length % 2 !== 0) {
      console.warn(`${type} 数量不是偶数，将忽略最后一条`);
      dialogs = dialogs.slice(0, -1);
    }

    const validatedDialogs = [];
    
    for (let i = 0; i < dialogs.length; i++) {
      const dialog = dialogs[i];
      
      // 验证对话格式
      if (!dialog || typeof dialog !== 'object') {
        console.warn(`${type}[${i}] 格式无效，跳过`);
        continue;
      }

      if (!dialog.role || !dialog.content) {
        console.warn(`${type}[${i}] 缺少必要字段 (role/content)，跳过`);
        continue;
      }

      // 验证角色
      if (!['user', 'assistant', 'system'].includes(dialog.role)) {
        console.warn(`${type}[${i}] 角色无效: ${dialog.role}，跳过`);
        continue;
      }

      // 验证内容
      if (typeof dialog.content !== 'string' || dialog.content.trim() === '') {
        console.warn(`${type}[${i}] 内容为空，跳过`);
        continue;
      }

      // 处理内容（去除多余空白、限制长度）
      const processedContent = this._processDialogContent(dialog.content);
      
      validatedDialogs.push({
        role: dialog.role,
        content: processedContent
      });
    }

    // 再次验证对话对数
    if (validatedDialogs.length % 2 !== 0) {
      console.warn(`${type} 验证后数量不是偶数，移除最后一条`);
      validatedDialogs.pop();
    }

    // 验证对话对的逻辑性
    if (type === 'beginDialogs' || type === 'moodImitationDialogs') {
      const validatedPairs = this._validateDialogPairs(validatedDialogs, type);
      return validatedPairs;
    }

    return validatedDialogs;
  }

  /**
   * 处理对话内容
   */
  _processDialogContent(content) {
    // 去除首尾空白
    let processed = content.trim();
    
    // 限制长度（单条对话最多500字符）
    if (processed.length > 500) {
      processed = processed.substring(0, 497) + '...';
      console.warn('对话内容过长，已截断');
    }
    
    // 替换多个连续空白为单个空格
    processed = processed.replace(/\s+/g, ' ');
    
    return processed;
  }

  /**
   * 验证对话对的逻辑性
   */
  _validateDialogPairs(dialogs, type) {
    const validatedPairs = [];
    
    for (let i = 0; i < dialogs.length; i += 2) {
      const userDialog = dialogs[i];
      const assistantDialog = dialogs[i + 1];
      
      if (!userDialog || !assistantDialog) {
        console.warn(`${type} 对话对不完整，跳过`);
        continue;
      }
      
      // 验证对话对的角色顺序
      let isValidPair = false;
      
      if (userDialog.role === 'user' && assistantDialog.role === 'assistant') {
        isValidPair = true;
      } else if (userDialog.role === 'assistant' && assistantDialog.role === 'user') {
        // 允许反向顺序，但会调整
        validatedPairs.push(assistantDialog, userDialog);
        console.log(`${type} 对话对顺序已调整`);
        continue;
      }
      
      if (isValidPair) {
        validatedPairs.push(userDialog, assistantDialog);
      } else {
        console.warn(`${type} 对话对角色无效: ${userDialog.role} -> ${assistantDialog.role}，跳过`);
      }
    }
    
    return validatedPairs;
  }

  /**
   * 获取对话统计信息
   */
  getDialogStats(persona) {
    const stats = {
      beginDialogs: {
        count: 0,
        pairs: 0,
        valid: false,
        errors: []
      },
      moodImitationDialogs: {
        count: 0,
        pairs: 0,
        valid: false,
        errors: []
      }
    };

    // 统计预设对话
    if (persona.beginDialogs && Array.isArray(persona.beginDialogs)) {
      stats.beginDialogs.count = persona.beginDialogs.length;
      stats.beginDialogs.pairs = Math.floor(persona.beginDialogs.length / 2);
      
      if (persona.beginDialogs.length % 2 === 0) {
        const validated = this._validateAndProcessDialogs(persona.beginDialogs, 'beginDialogs');
        stats.beginDialogs.valid = validated.length === persona.beginDialogs.length;
        if (!stats.beginDialogs.valid) {
          stats.beginDialogs.errors.push('部分对话验证失败');
        }
      } else {
        stats.beginDialogs.errors.push('对话数量不是偶数');
      }
    }

    // 统计风格模仿对话
    if (persona.moodImitationDialogs && Array.isArray(persona.moodImitationDialogs)) {
      stats.moodImitationDialogs.count = persona.moodImitationDialogs.length;
      stats.moodImitationDialogs.pairs = Math.floor(persona.moodImitationDialogs.length / 2);
      
      if (persona.moodImitationDialogs.length % 2 === 0) {
        const validated = this._validateAndProcessDialogs(persona.moodImitationDialogs, 'moodImitationDialogs');
        stats.moodImitationDialogs.valid = validated.length === persona.moodImitationDialogs.length;
        if (!stats.moodImitationDialogs.valid) {
          stats.moodImitationDialogs.errors.push('部分对话验证失败');
        }
      } else {
        stats.moodImitationDialogs.errors.push('对话数量不是偶数');
      }
    }

    return stats;
  }

  /**
   * 设置上下文管理器
   */
  setContextManager(contextManager) {
    this.contextManager = contextManager;
    console.log('API服务已集成上下文管理器');
  }

  /**
   * 调用火山引擎API
   */
  async callVolcanoAPI(messages, options = {}) {
    if (!this.apiKeys.volcano) {
      throw new Error('请先配置火山引擎API密钥');
    }

    const requestBody = {
      model: options.model || this.models.volcano,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      top_p: options.topP || 0.9,
      frequency_penalty: options.frequencyPenalty || 0,
      presence_penalty: options.presencePenalty || 0,
      stream: options.stream || false,
      ...options.extraParams
    };

    console.log('调用火山引擎API:', {
      model: requestBody.model,
      messageCount: messages.length,
      temperature: requestBody.temperature
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

      const response = await fetch(AIChat.CONFIG.apiEndpoints.volcano, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys.volcano}`,
          'User-Agent': 'AI-Chat-App/1.0'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = this._parseVolcanoError(response.status, errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('API返回数据格式错误：缺少choices字段');
      }

      const result = {
        content: data.choices[0].message.content,
        model: requestBody.model,
        provider: 'volcano',
        usage: data.usage || {},
        finishReason: data.choices[0].finish_reason,
        responseTime: Date.now(),
        requestId: data.id
      };

      console.log('火山引擎API调用成功:', {
        model: result.model,
        tokens: result.usage.total_tokens,
        finishReason: result.finishReason
      });

      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接');
      }
      
      console.error('火山引擎API调用失败:', error);
      throw error;
    }
  }

  /**
   * 解析火山引擎API错误
   */
  _parseVolcanoError(status, errorData) {
    const errorMap = {
      400: '请求参数错误',
      401: 'API密钥无效或已过期',
      403: '访问被拒绝，请检查API权限',
      404: '请求的资源不存在',
      429: '请求频率过高，请稍后重试',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务暂时不可用',
      504: '网关超时'
    };

    const baseMessage = errorMap[status] || `HTTP错误 ${status}`;
    const detailMessage = errorData.error?.message || errorData.message || '';
    
    return detailMessage ? `${baseMessage}: ${detailMessage}` : baseMessage;
  }

  /**
   * 测试火山引擎API连接
   */
  async testVolcanoAPI() {
    try {
      const testMessages = [
        { role: 'system', content: '你是一个测试助手' },
        { role: 'user', content: '请回复"测试成功"' }
      ];

      const result = await this.callVolcanoAPI(testMessages, {
        maxTokens: 50,
        temperature: 0.1
      });

      return {
        success: true,
        model: result.model,
        responseTime: result.responseTime,
        usage: result.usage
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取火山引擎可用模型列表
   */
  async getVolcanoModels() {
    if (!this.apiKeys.volcano) {
      throw new Error('请先配置火山引擎API密钥');
    }

    try {
      const response = await fetch(`${AIChat.CONFIG.apiEndpoints.volcano.replace('/chat/completions', '/models')}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.volcano}`
        }
      });

      if (!response.ok) {
        throw new Error('获取模型列表失败');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.warn('获取火山引擎模型列表失败:', error);
      // 返回默认模型列表
      return [
        { id: 'doubao-1.5-pro-32k-250115', name: 'Doubao Pro 32K' },
        { id: 'doubao-1.5-lite-32k-250115', name: 'Doubao Lite 32K' }
      ];
    }
  }

  /**
   * 流式调用火山引擎API
   */
  async callVolcanoAPIStream(messages, options = {}, onChunk = null) {
    if (!this.apiKeys.volcano) {
      throw new Error('请先配置火山引擎API密钥');
    }

    const requestBody = {
      model: options.model || this.models.volcano,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      stream: true,
      ...options.extraParams
    };

    try {
      const response = await fetch(AIChat.CONFIG.apiEndpoints.volcano, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys.volcano}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(this._parseVolcanoError(response.status, errorData));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let usage = {};

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                break;
              }

              try {
                const parsed = JSON.parse(data);
                
                if (parsed.choices && parsed.choices[0]) {
                  const delta = parsed.choices[0].delta;
                  
                  if (delta.content) {
                    fullContent += delta.content;
                    
                    if (onChunk) {
                      onChunk({
                        content: delta.content,
                        fullContent: fullContent,
                        finishReason: parsed.choices[0].finish_reason
                      });
                    }
                  }
                }

                if (parsed.usage) {
                  usage = parsed.usage;
                }
              } catch (parseError) {
                console.warn('解析流数据失败:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return {
        content: fullContent,
        model: requestBody.model,
        provider: 'volcano',
        usage: usage,
        stream: true
      };
    } catch (error) {
      console.error('火山引擎流式API调用失败:', error);
      throw error;
    }
  }

  /**
   * 调用Ollama API
   */
  async callOllamaAPI(messages, options = {}) {
    const ollamaStatus = await this.checkOllamaStatus();
    if (!ollamaStatus.available) {
      throw new Error(`Ollama服务不可用: ${ollamaStatus.error}`);
    }

    // 自动选择最佳模型
    let model = options.model || this.models.ollama;
    if (!options.model) {
      const bestModel = await this.detectBestOllamaModel();
      if (bestModel) {
        model = bestModel.name;
      }
    }

    const requestBody = {
      model: model,
      messages: messages,
      stream: options.stream || false,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || 2000,
        top_p: options.topP || 0.9,
        repeat_penalty: options.repeatPenalty || 1.1,
        top_k: options.topK || 40,
        ...options.extraParams
      }
    };

    console.log('调用Ollama API:', {
      model: model,
      messageCount: messages.length,
      temperature: requestBody.options.temperature
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

      const response = await fetch(`${this.apiKeys.ollama}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = this._parseOllamaError(response.status, errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.message) {
        throw new Error('Ollama API返回数据格式错误：缺少message字段');
      }

      const result = {
        content: data.message.content,
        model: model,
        provider: 'ollama',
        usage: {
          prompt_tokens: data.prompt_eval_count || 0,
          completion_tokens: data.eval_count || 0,
          total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        },
        performance: {
          load_duration: data.load_duration,
          prompt_eval_duration: data.prompt_eval_duration,
          eval_duration: data.eval_duration,
          total_duration: data.total_duration
        },
        done: data.done,
        responseTime: Date.now()
      };

      console.log('Ollama API调用成功:', {
        model: result.model,
        tokens: result.usage.total_tokens,
        duration: Math.round((result.performance.total_duration || 0) / 1000000) + 'ms'
      });

      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Ollama请求超时，模型可能正在加载中');
      }
      
      console.error('Ollama API调用失败:', error);
      throw error;
    }
  }

  /**
   * 解析Ollama API错误
   */
  _parseOllamaError(status, errorData) {
    const errorMap = {
      400: '请求参数错误',
      404: '模型不存在或未安装',
      500: 'Ollama服务内部错误'
    };

    const baseMessage = errorMap[status] || `Ollama错误 ${status}`;
    const detailMessage = errorData.error || '';
    
    return detailMessage ? `${baseMessage}: ${detailMessage}` : baseMessage;
  }

  /**
   * 测试Ollama API连接
   */
  async testOllamaAPI() {
    try {
      const status = await this.checkOllamaStatus();
      
      if (!status.available) {
        return {
          success: false,
          error: status.error
        };
      }

      const testMessages = [
        { role: 'system', content: '你是一个测试助手' },
        { role: 'user', content: '请回复"测试成功"' }
      ];

      const result = await this.callOllamaAPI(testMessages, {
        maxTokens: 50,
        temperature: 0.1
      });

      return {
        success: true,
        model: result.model,
        responseTime: result.responseTime,
        usage: result.usage,
        performance: result.performance
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 拉取Ollama模型
   */
  async pullOllamaModel(modelName, onProgress = null) {
    try {
      const response = await fetch(`${this.apiKeys.ollama}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: modelName,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`拉取模型失败: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              if (onProgress && data.status) {
                onProgress({
                  status: data.status,
                  digest: data.digest,
                  total: data.total,
                  completed: data.completed
                });
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('解析拉取进度失败:', parseError);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      console.log(`模型 ${modelName} 拉取完成`);
      return true;
    } catch (error) {
      console.error('拉取Ollama模型失败:', error);
      throw error;
    }
  }

  /**
   * 删除Ollama模型
   */
  async deleteOllamaModel(modelName) {
    try {
      const response = await fetch(`${this.apiKeys.ollama}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: modelName
        })
      });

      if (!response.ok) {
        throw new Error(`删除模型失败: ${response.status}`);
      }

      console.log(`模型 ${modelName} 已删除`);
      return true;
    } catch (error) {
      console.error('删除Ollama模型失败:', error);
      throw error;
    }
  }

  /**
   * 流式调用Ollama API
   */
  async callOllamaAPIStream(messages, options = {}, onChunk = null) {
    const ollamaStatus = await this.checkOllamaStatus();
    if (!ollamaStatus.available) {
      throw new Error(`Ollama服务不可用: ${ollamaStatus.error}`);
    }

    let model = options.model || this.models.ollama;
    if (!options.model) {
      const bestModel = await this.detectBestOllamaModel();
      if (bestModel) {
        model = bestModel.name;
      }
    }

    const requestBody = {
      model: model,
      messages: messages,
      stream: true,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || 2000,
        ...options.extraParams
      }
    };

    try {
      const response = await fetch(`${this.apiKeys.ollama}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(this._parseOllamaError(response.status, errorData));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let usage = {};

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              if (data.message && data.message.content) {
                const content = data.message.content;
                fullContent += content;
                
                if (onChunk) {
                  onChunk({
                    content: content,
                    fullContent: fullContent,
                    done: data.done
                  });
                }
              }

              if (data.done) {
                usage = {
                  prompt_tokens: data.prompt_eval_count || 0,
                  completion_tokens: data.eval_count || 0,
                  total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                };
                break;
              }
            } catch (parseError) {
              console.warn('解析流数据失败:', parseError);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return {
        content: fullContent,
        model: model,
        provider: 'ollama',
        usage: usage,
        stream: true
      };
    } catch (error) {
      console.error('Ollama流式API调用失败:', error);
      throw error;
    }
  }

  /**
   * 检测消息中的特殊需求（天气、时间等）
   */
  detectSpecialRequests(message) {
    const requests = [];
    
    // 天气查询
    if (/天气|气温|下雨|晴天|阴天|温度/.test(message)) {
      requests.push({
        type: 'weather',
        query: message
      });
    }
    
    // 时间查询
    if (/时间|几点|现在|当前时间/.test(message)) {
      requests.push({
        type: 'time',
        query: message
      });
    }
    
    return requests;
  }

  /**
   * 处理特殊请求
   */
  async handleSpecialRequests(requests) {
    const results = [];
    
    for (const request of requests) {
      try {
        switch (request.type) {
          case 'weather':
            const weather = await this.getWeatherInfo();
            results.push({
              type: 'weather',
              data: weather
            });
            break;
            
          case 'time':
            const time = this.getCurrentTime();
            results.push({
              type: 'time',
              data: time
            });
            break;
        }
      } catch (error) {
        console.warn(`处理${request.type}请求失败:`, error);
      }
    }
    
    return results;
  }

  /**
   * 获取当前时间
   */
  getCurrentTime() {
    const now = new Date();
    return {
      datetime: now.toISOString(),
      formatted: now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'long'
      }),
      timestamp: now.getTime()
    };
  }

  /**
   * 获取天气信息（示例实现）
   */
  async getWeatherInfo(location = '北京') {
    // 这里应该调用真实的天气API
    // 目前返回模拟数据
    return {
      location: location,
      temperature: '22°C',
      condition: '晴天',
      humidity: '45%',
      windSpeed: '3级',
      description: `${location}当前天气晴朗，气温22度，湿度45%，风力3级。`
    };
  }

  /**
   * 获取Ollama模型列表
   */
  async getOllamaModels(includeDetails = false) {
    try {
      const status = await this.checkOllamaStatus();
      
      if (!status.available) {
        throw new Error(`Ollama服务不可用: ${status.error}`);
      }
      
      if (includeDetails) {
        return status.models || [];
      } else {
        return (status.models || []).map(model => ({
          name: model.name,
          family: model.family,
          parameters: model.parameters,
          size: this._formatModelSize(model.size),
          isRecommended: model.isRecommended
        }));
      }
    } catch (error) {
      console.error('获取Ollama模型列表失败:', error);
      return [];
    }
  }

  /**
   * 检查模型是否可用
   */
  async isModelAvailable(modelName) {
    try {
      const models = await this.getOllamaModels();
      return models.some(model => model.name === modelName);
    } catch (error) {
      console.error('检查模型可用性失败:', error);
      return false;
    }
  }

  /**
   * 获取Ollama服务诊断信息
   */
  async getOllamaDiagnostics() {
    try {
      const status = await this.checkOllamaStatus();
      const connectionStats = this.ollamaManager.getConnectionStats();
      
      return {
        service: {
          available: status.available,
          version: status.version,
          endpoint: status.endpoint,
          modelCount: status.modelCount,
          runningModels: status.systemInfo?.runningModels || [],
          lastChecked: status.lastChecked,
          responseTime: status.responseTime
        },
        connection: connectionStats,
        recommendations: await this.getModelRecommendations(3),
        troubleshooting: this._generateTroubleshootingTips(status)
      };
    } catch (error) {
      console.error('获取Ollama诊断信息失败:', error);
      return {
        service: { available: false, error: error.message },
        connection: { uptime: '0%', isCurrentlyConnected: false },
        recommendations: [],
        troubleshooting: ['检查Ollama服务是否正在运行', '验证网络连接', '重启Ollama服务']
      };
    }
  }

  /**
   * 生成故障排除提示
   */
  _generateTroubleshootingTips(status) {
    const tips = [];
    
    if (!status.available) {
      tips.push('检查Ollama服务是否正在运行');
      tips.push('验证服务地址是否正确 (默认: http://localhost:11434)');
      tips.push('检查防火墙设置是否阻止了连接');
      
      if (status.error?.includes('超时')) {
        tips.push('服务响应超时，可能是模型正在加载中');
        tips.push('尝试等待几分钟后重试');
      }
      
      if (status.error?.includes('网络')) {
        tips.push('检查网络连接是否正常');
        tips.push('尝试重启网络服务');
      }
    } else {
      if (status.modelCount === 0) {
        tips.push('没有可用的模型，请下载至少一个模型');
        tips.push('运行 "ollama pull llama3.1:7b" 下载推荐模型');
      }
      
      if (status.responseTime > 5000) {
        tips.push('服务响应较慢，可能是系统资源不足');
        tips.push('考虑关闭其他占用资源的应用程序');
      }
    }
    
    return tips;
  }

  /**
   * 强制刷新Ollama状态
   */
  async refreshOllamaStatus() {
    // 清除缓存
    this.statusCache.delete('ollama_status');
    this.modelCache.delete('best_ollama_model');
    
    // 强制重新检查
    return await this.ollamaManager.forceReconnect();
  }

  /**
   * 获取API状态
   */
  async getAPIStatus() {
    const status = {
      volcano: {
        configured: !!this.apiKeys.volcano,
        available: false
      },
      ollama: {
        configured: !!this.apiKeys.ollama,
        available: false,
        connectionManager: this.ollamaManager.getConnectionStatus()
      }
    };

    // 检查火山引擎API
    if (status.volcano.configured) {
      try {
        const testResult = await this.testVolcanoAPI();
        status.volcano.available = testResult.success;
        status.volcano.error = testResult.error;
      } catch (error) {
        console.warn('火山引擎API测试失败:', error.message);
        status.volcano.error = error.message;
      }
    }

    // 检查Ollama API
    const ollamaStatus = await this.checkOllamaStatus();
    status.ollama.available = ollamaStatus.available;
    status.ollama.error = ollamaStatus.error;
    status.ollama.modelCount = ollamaStatus.modelCount;
    status.ollama.version = ollamaStatus.version;

    return status;
  }

  /**
   * 销毁API服务
   */
  destroy() {
    if (this.ollamaManager) {
      this.ollamaManager.destroy();
    }
    
    // 清除缓存
    this.modelCache.clear();
    this.statusCache.clear();
    
    console.log('API服务已销毁');
  }
}

/**
 * Ollama连接管理器
 * 负责Ollama服务的连接管理、健康检查和状态监控
 */
class OllamaConnectionManager {
  constructor(apiService) {
    this.apiService = apiService;
    this.isConnected = false;
    this.lastCheckTime = 0;
    this.checkInterval = 30000; // 30秒检查间隔
    this.retryCount = 0;
    this.maxRetries = 3;
    this.healthCheckTimer = null;
    this.connectionListeners = [];
    this.statusHistory = [];
    this.maxHistoryLength = 100;
    
    // 启动定期健康检查
    this.startHealthCheck();
  }

  /**
   * 启动定期健康检查
   */
  startHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.checkInterval);
    
    // 立即执行一次检查
    this.performHealthCheck();
  }

  /**
   * 停止健康检查
   */
  stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck() {
    try {
      const status = await this.apiService.checkOllamaStatus();
      const wasConnected = this.isConnected;
      this.isConnected = status.available;
      
      // 记录状态历史
      this.recordStatusHistory(status);
      
      // 如果连接状态发生变化，通知监听器
      if (wasConnected !== this.isConnected) {
        this.notifyConnectionChange(this.isConnected, status);
      }
      
      // 重置重试计数
      if (this.isConnected) {
        this.retryCount = 0;
      }
      
      this.lastCheckTime = Date.now();
      
      console.log(`Ollama健康检查完成: ${this.isConnected ? '连接正常' : '连接失败'}`, status);
      
    } catch (error) {
      console.error('Ollama健康检查失败:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * 记录状态历史
   */
  recordStatusHistory(status) {
    const historyEntry = {
      timestamp: Date.now(),
      available: status.available,
      error: status.error,
      modelCount: status.models ? status.models.length : 0,
      version: status.version,
      endpoint: status.endpoint
    };
    
    this.statusHistory.push(historyEntry);
    
    // 保持历史记录长度
    if (this.statusHistory.length > this.maxHistoryLength) {
      this.statusHistory.shift();
    }
  }

  /**
   * 处理连接错误
   */
  handleConnectionError(error) {
    this.isConnected = false;
    this.retryCount++;
    
    if (this.retryCount <= this.maxRetries) {
      console.log(`Ollama连接失败，${5}秒后重试 (${this.retryCount}/${this.maxRetries})`);
      setTimeout(() => {
        this.performHealthCheck();
      }, 5000);
    } else {
      console.error('Ollama连接重试次数已达上限');
      this.notifyConnectionChange(false, { error: error.message });
    }
  }

  /**
   * 添加连接状态监听器
   */
  addConnectionListener(callback) {
    this.connectionListeners.push(callback);
  }

  /**
   * 移除连接状态监听器
   */
  removeConnectionListener(callback) {
    const index = this.connectionListeners.indexOf(callback);
    if (index > -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  /**
   * 通知连接状态变化
   */
  notifyConnectionChange(isConnected, status) {
    this.connectionListeners.forEach(callback => {
      try {
        callback(isConnected, status);
      } catch (error) {
        console.error('连接状态监听器执行失败:', error);
      }
    });
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      lastCheckTime: this.lastCheckTime,
      retryCount: this.retryCount,
      statusHistory: this.statusHistory.slice(-10) // 返回最近10条记录
    };
  }

  /**
   * 强制重新连接
   */
  async forceReconnect() {
    console.log('强制重新连接Ollama服务...');
    this.retryCount = 0;
    await this.performHealthCheck();
  }

  /**
   * 获取连接统计信息
   */
  getConnectionStats() {
    const now = Date.now();
    const last24h = this.statusHistory.filter(entry => 
      now - entry.timestamp < 24 * 60 * 60 * 1000
    );
    
    const successCount = last24h.filter(entry => entry.available).length;
    const totalCount = last24h.length;
    const uptime = totalCount > 0 ? (successCount / totalCount * 100).toFixed(2) : 0;
    
    return {
      uptime: `${uptime}%`,
      totalChecks: totalCount,
      successfulChecks: successCount,
      failedChecks: totalCount - successCount,
      lastCheckTime: this.lastCheckTime,
      isCurrentlyConnected: this.isConnected
    };
  }

  /**
   * 销毁连接管理器
   */
  destroy() {
    this.stopHealthCheck();
    this.connectionListeners = [];
    this.statusHistory = [];
  }
}

// 导出API服务
window.AIChat.APIService = APIService;
window.AIChat.OllamaConnectionManager = OllamaConnectionManager;