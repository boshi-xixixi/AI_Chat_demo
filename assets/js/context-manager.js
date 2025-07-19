/**
 * 对话上下文管理器
 * 负责智能截取对话历史、标记重要内容、保持对话连贯性
 */

class ContextManager {
  constructor(chatManager, storageService) {
    this.chatManager = chatManager;
    this.storage = storageService;
    
    // 上下文配置
    this.config = {
      maxContextTokens: 8000,        // 最大上下文token数
      maxContextMessages: 50,        // 最大上下文消息数
      importantMessageThreshold: 0.7, // 重要消息阈值
      coherenceCheckWindow: 10,      // 连贯性检查窗口
      summaryTriggerLength: 100,     // 触发摘要的消息数量
      keywordExtractionMinLength: 20 // 关键词提取最小长度
    };
    
    // 缓存
    this.contextCache = new Map();
    this.importanceCache = new Map();
    this.summaryCache = new Map();
    
    // 重要性评分权重
    this.importanceWeights = {
      length: 0.1,           // 消息长度
      keywords: 0.2,         // 关键词密度
      questions: 0.15,       // 问题数量
      emotions: 0.15,        // 情感表达
      references: 0.2,       // 引用其他消息
      userEngagement: 0.1,   // 用户参与度
      timeRecency: 0.1       // 时间新近性
    };
    
    // 关键词库
    this.importantKeywords = {
      personal: ['我', '你', '我们', '名字', '喜欢', '讨厌', '爱好', '工作', '家人', '朋友'],
      emotional: ['开心', '难过', '生气', '兴奋', '担心', '害怕', '感动', '失望', '惊讶'],
      questions: ['什么', '为什么', '怎么', '哪里', '什么时候', '谁', '如何', '是否'],
      important: ['重要', '关键', '必须', '一定', '绝对', '特别', '非常', '极其']
    };
  }

  /**
   * 构建智能对话上下文
   */
  async buildContext(personaId, currentMessage = null, options = {}) {
    try {
      const cacheKey = `${personaId}_${options.maxMessages || this.config.maxContextMessages}`;
      
      // 检查缓存
      if (this.contextCache.has(cacheKey) && !currentMessage) {
        const cached = this.contextCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 60000) { // 1分钟缓存
          return cached.context;
        }
      }

      // 获取历史消息
      const allMessages = await this.chatManager.getChatHistory(
        personaId, 
        options.maxMessages || this.config.maxContextMessages * 2
      );

      if (!allMessages || allMessages.length === 0) {
        return [];
      }

      // 分析消息重要性
      const analyzedMessages = await this._analyzeMessageImportance(allMessages);
      
      // 智能选择上下文消息
      const contextMessages = await this._selectContextMessages(
        analyzedMessages, 
        options.maxTokens || this.config.maxContextTokens
      );

      // 添加当前消息
      if (currentMessage) {
        contextMessages.push({
          ...currentMessage,
          importance: await this._calculateMessageImportance(currentMessage, allMessages)
        });
      }

      // 检查对话连贯性
      const coherenceScore = this._checkCoherence(contextMessages);
      
      // 如果连贯性不足，尝试添加关键的历史消息
      if (coherenceScore < 0.6) {
        const enhancedContext = await this._enhanceContextCoherence(
          contextMessages, 
          allMessages
        );
        contextMessages.splice(0, 0, ...enhancedContext);
      }

      // 缓存结果
      this.contextCache.set(cacheKey, {
        context: contextMessages,
        timestamp: Date.now(),
        coherenceScore: coherenceScore
      });

      console.log(`构建上下文完成: ${contextMessages.length} 条消息, 连贯性: ${coherenceScore.toFixed(2)}`);
      
      return contextMessages;
    } catch (error) {
      console.error('构建对话上下文失败:', error);
      // 降级处理：返回最近的消息
      return await this.chatManager.getRecentMessages(personaId, 10);
    }
  }

  /**
   * 分析消息重要性
   */
  async _analyzeMessageImportance(messages) {
    const analyzed = [];
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const importance = await this._calculateMessageImportance(message, messages, i);
      
      analyzed.push({
        ...message,
        importance: importance,
        index: i
      });
    }
    
    return analyzed;
  }

  /**
   * 计算单条消息的重要性分数
   */
  async _calculateMessageImportance(message, allMessages = [], index = -1) {
    try {
      const cacheKey = `${message.id}_importance`;
      
      // 检查缓存
      if (this.importanceCache.has(cacheKey)) {
        return this.importanceCache.get(cacheKey);
      }

      let score = 0;
      const content = message.content.toLowerCase();
      const contentLength = content.length;

      // 1. 长度评分 (较长的消息通常更重要)
      const lengthScore = Math.min(contentLength / 200, 1) * this.importanceWeights.length;
      score += lengthScore;

      // 2. 关键词评分
      const keywordScore = this._calculateKeywordScore(content) * this.importanceWeights.keywords;
      score += keywordScore;

      // 3. 问题评分 (包含问题的消息更重要)
      const questionScore = this._calculateQuestionScore(content) * this.importanceWeights.questions;
      score += questionScore;

      // 4. 情感评分
      const emotionScore = this._calculateEmotionScore(content) * this.importanceWeights.emotions;
      score += emotionScore;

      // 5. 引用评分 (如果消息引用了其他内容)
      const referenceScore = this._calculateReferenceScore(content, allMessages) * this.importanceWeights.references;
      score += referenceScore;

      // 6. 用户参与度评分
      const engagementScore = this._calculateEngagementScore(message) * this.importanceWeights.userEngagement;
      score += engagementScore;

      // 7. 时间新近性评分
      const recencyScore = this._calculateRecencyScore(message, allMessages) * this.importanceWeights.timeRecency;
      score += recencyScore;

      // 归一化分数到 0-1 范围
      const finalScore = Math.min(Math.max(score, 0), 1);

      // 缓存结果
      this.importanceCache.set(cacheKey, finalScore);

      return finalScore;
    } catch (error) {
      console.warn('计算消息重要性失败:', error);
      return 0.5; // 默认中等重要性
    }
  }

  /**
   * 计算关键词分数
   */
  _calculateKeywordScore(content) {
    let score = 0;
    let totalKeywords = 0;

    Object.values(this.importantKeywords).forEach(keywords => {
      keywords.forEach(keyword => {
        totalKeywords++;
        if (content.includes(keyword)) {
          score += 1;
        }
      });
    });

    return totalKeywords > 0 ? score / totalKeywords : 0;
  }

  /**
   * 计算问题分数
   */
  _calculateQuestionScore(content) {
    const questionMarkers = ['？', '?', '吗', '呢', '吧'];
    const questionWords = this.importantKeywords.questions;
    
    let score = 0;
    
    // 检查问号
    questionMarkers.forEach(marker => {
      if (content.includes(marker)) {
        score += 0.3;
      }
    });
    
    // 检查疑问词
    questionWords.forEach(word => {
      if (content.includes(word)) {
        score += 0.2;
      }
    });
    
    return Math.min(score, 1);
  }

  /**
   * 计算情感分数
   */
  _calculateEmotionScore(content) {
    const emotionWords = this.importantKeywords.emotional;
    let score = 0;
    
    emotionWords.forEach(emotion => {
      if (content.includes(emotion)) {
        score += 0.1;
      }
    });
    
    // 检查表情符号和感叹号
    if (content.match(/[😀-🙏]|！|!/)) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  /**
   * 计算引用分数
   */
  _calculateReferenceScore(content, allMessages) {
    let score = 0;
    
    // 检查是否引用了之前的话题
    const referenceWords = ['刚才', '之前', '刚刚', '前面', '上次', '记得'];
    referenceWords.forEach(word => {
      if (content.includes(word)) {
        score += 0.2;
      }
    });
    
    // 检查是否包含其他消息的关键词
    if (allMessages.length > 0) {
      const recentMessages = allMessages.slice(-5);
      recentMessages.forEach(msg => {
        if (msg.content !== content) {
          const words = msg.content.split(/\s+/).filter(w => w.length > 2);
          words.forEach(word => {
            if (content.includes(word)) {
              score += 0.05;
            }
          });
        }
      });
    }
    
    return Math.min(score, 1);
  }

  /**
   * 计算用户参与度分数
   */
  _calculateEngagementScore(message) {
    let score = 0;
    
    // 用户消息通常更重要
    if (message.role === 'user') {
      score += 0.3;
    }
    
    // 较长的消息表示更高的参与度
    if (message.content.length > 50) {
      score += 0.2;
    }
    
    // 包含多个句子的消息
    const sentences = message.content.split(/[。！？.!?]/).filter(s => s.trim());
    if (sentences.length > 1) {
      score += 0.1 * Math.min(sentences.length, 5);
    }
    
    return Math.min(score, 1);
  }

  /**
   * 计算时间新近性分数
   */
  _calculateRecencyScore(message, allMessages) {
    if (!allMessages || allMessages.length === 0) {
      return 1;
    }
    
    const messageTime = new Date(message.timestamp).getTime();
    const now = Date.now();
    const hoursSinceMessage = (now - messageTime) / (1000 * 60 * 60);
    
    // 24小时内的消息得满分，之后逐渐衰减
    if (hoursSinceMessage <= 24) {
      return 1;
    } else if (hoursSinceMessage <= 168) { // 一周内
      return 0.8;
    } else if (hoursSinceMessage <= 720) { // 一个月内
      return 0.5;
    } else {
      return 0.2;
    }
  }

  /**
   * 智能选择上下文消息
   */
  async _selectContextMessages(analyzedMessages, maxTokens) {
    // 按重要性排序
    const sortedByImportance = [...analyzedMessages].sort((a, b) => b.importance - a.importance);
    
    // 选择最重要的消息
    const selectedMessages = [];
    let totalTokens = 0;
    
    // 首先确保包含最近的几条消息
    const recentMessages = analyzedMessages.slice(-5);
    for (const message of recentMessages) {
      const tokens = this._estimateTokens(message.content);
      if (totalTokens + tokens <= maxTokens) {
        selectedMessages.push(message);
        totalTokens += tokens;
      }
    }
    
    // 然后添加重要的历史消息
    for (const message of sortedByImportance) {
      if (selectedMessages.find(m => m.id === message.id)) {
        continue; // 已经包含
      }
      
      const tokens = this._estimateTokens(message.content);
      if (totalTokens + tokens <= maxTokens && message.importance > this.config.importantMessageThreshold) {
        selectedMessages.push(message);
        totalTokens += tokens;
      }
      
      if (selectedMessages.length >= this.config.maxContextMessages) {
        break;
      }
    }
    
    // 按时间顺序排序
    return selectedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * 检查对话连贯性
   */
  _checkCoherence(messages) {
    if (messages.length < 2) {
      return 1;
    }
    
    let coherenceScore = 0;
    let comparisons = 0;
    
    // 检查相邻消息的相关性
    for (let i = 1; i < messages.length; i++) {
      const prevMessage = messages[i - 1];
      const currentMessage = messages[i];
      
      const similarity = this._calculateMessageSimilarity(prevMessage.content, currentMessage.content);
      coherenceScore += similarity;
      comparisons++;
    }
    
    // 检查话题连续性
    const topicCoherence = this._calculateTopicCoherence(messages);
    coherenceScore += topicCoherence;
    comparisons++;
    
    return comparisons > 0 ? coherenceScore / comparisons : 0;
  }

  /**
   * 计算消息相似性
   */
  _calculateMessageSimilarity(content1, content2) {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 计算话题连贯性
   */
  _calculateTopicCoherence(messages) {
    if (messages.length < 3) {
      return 1;
    }
    
    // 提取关键词
    const allKeywords = [];
    messages.forEach(message => {
      const keywords = this._extractKeywords(message.content);
      allKeywords.push(...keywords);
    });
    
    // 计算关键词重复率
    const keywordCounts = {};
    allKeywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });
    
    const repeatedKeywords = Object.values(keywordCounts).filter(count => count > 1);
    const coherenceRatio = repeatedKeywords.length / Object.keys(keywordCounts).length;
    
    return Math.min(coherenceRatio * 2, 1); // 放大系数
  }

  /**
   * 提取关键词
   */
  _extractKeywords(content) {
    // 简单的关键词提取（实际项目中可以使用更复杂的NLP算法）
    const words = content.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 保留中文、英文、数字
      .split(/\s+/)
      .filter(word => word.length >= 2);
    
    // 过滤常见停用词
    const stopWords = new Set(['的', '了', '是', '在', '有', '和', '就', '不', '人', '都', '一', '个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那']);
    
    return words.filter(word => !stopWords.has(word));
  }

  /**
   * 增强上下文连贯性
   */
  async _enhanceContextCoherence(contextMessages, allMessages) {
    const enhancementMessages = [];
    
    // 查找缺失的关键连接消息
    const contextKeywords = new Set();
    contextMessages.forEach(msg => {
      const keywords = this._extractKeywords(msg.content);
      keywords.forEach(kw => contextKeywords.add(kw));
    });
    
    // 在历史消息中查找包含相同关键词但未包含在上下文中的消息
    for (const message of allMessages) {
      if (contextMessages.find(m => m.id === message.id)) {
        continue; // 已在上下文中
      }
      
      const messageKeywords = this._extractKeywords(message.content);
      const commonKeywords = messageKeywords.filter(kw => contextKeywords.has(kw));
      
      if (commonKeywords.length >= 2) { // 至少有2个共同关键词
        enhancementMessages.push({
          ...message,
          importance: 0.8, // 连贯性增强消息给予较高重要性
          enhancementReason: 'coherence'
        });
      }
      
      if (enhancementMessages.length >= 3) {
        break; // 限制增强消息数量
      }
    }
    
    return enhancementMessages;
  }

  /**
   * 标记重要对话内容
   */
  async markImportantMessage(messageId, importance = 1.0, reason = '') {
    try {
      // 获取消息
      const message = await this.storage.get('messages', messageId);
      if (!message) {
        throw new Error('消息不存在');
      }
      
      // 更新消息的重要性标记
      message.metadata = message.metadata || {};
      message.metadata.important = true;
      message.metadata.importance = importance;
      message.metadata.importanceReason = reason;
      message.metadata.markedAt = new Date();
      
      // 保存更新
      await this.storage.put('messages', message);
      
      // 清除相关缓存
      this._clearCacheForMessage(messageId);
      
      console.log(`消息已标记为重要: ${messageId}, 重要性: ${importance}`);
      return true;
    } catch (error) {
      console.error('标记重要消息失败:', error);
      throw error;
    }
  }

  /**
   * 取消重要标记
   */
  async unmarkImportantMessage(messageId) {
    try {
      const message = await this.storage.get('messages', messageId);
      if (!message) {
        throw new Error('消息不存在');
      }
      
      if (message.metadata) {
        delete message.metadata.important;
        delete message.metadata.importance;
        delete message.metadata.importanceReason;
        delete message.metadata.markedAt;
      }
      
      await this.storage.put('messages', message);
      this._clearCacheForMessage(messageId);
      
      console.log(`已取消重要标记: ${messageId}`);
      return true;
    } catch (error) {
      console.error('取消重要标记失败:', error);
      throw error;
    }
  }

  /**
   * 获取重要消息列表
   */
  async getImportantMessages(personaId, limit = 20) {
    try {
      const allMessages = await this.chatManager.getChatHistory(personaId, 1000);
      
      const importantMessages = allMessages.filter(message => 
        message.metadata && message.metadata.important
      );
      
      // 按重要性和时间排序
      importantMessages.sort((a, b) => {
        const importanceA = a.metadata.importance || 0;
        const importanceB = b.metadata.importance || 0;
        
        if (importanceA !== importanceB) {
          return importanceB - importanceA; // 重要性降序
        }
        
        return new Date(b.timestamp) - new Date(a.timestamp); // 时间降序
      });
      
      return importantMessages.slice(0, limit);
    } catch (error) {
      console.error('获取重要消息失败:', error);
      return [];
    }
  }

  /**
   * 生成对话摘要
   */
  async generateConversationSummary(personaId, messageCount = 50) {
    try {
      const cacheKey = `summary_${personaId}_${messageCount}`;
      
      // 检查缓存
      if (this.summaryCache.has(cacheKey)) {
        const cached = this.summaryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5分钟缓存
          return cached.summary;
        }
      }
      
      const messages = await this.chatManager.getChatHistory(personaId, messageCount);
      if (messages.length === 0) {
        return null;
      }
      
      // 提取关键信息
      const keyTopics = this._extractKeyTopics(messages);
      const importantMessages = messages.filter(m => 
        m.metadata && m.metadata.important
      );
      
      const summary = {
        personaId: personaId,
        messageCount: messages.length,
        timeRange: {
          start: messages[0].timestamp,
          end: messages[messages.length - 1].timestamp
        },
        keyTopics: keyTopics,
        importantMessages: importantMessages.slice(0, 5), // 最多5条重要消息
        lastActivity: messages[messages.length - 1].timestamp,
        generatedAt: new Date()
      };
      
      // 缓存摘要
      this.summaryCache.set(cacheKey, {
        summary: summary,
        timestamp: Date.now()
      });
      
      return summary;
    } catch (error) {
      console.error('生成对话摘要失败:', error);
      return null;
    }
  }

  /**
   * 提取关键话题
   */
  _extractKeyTopics(messages) {
    const topicKeywords = {};
    
    messages.forEach(message => {
      const keywords = this._extractKeywords(message.content);
      keywords.forEach(keyword => {
        topicKeywords[keyword] = (topicKeywords[keyword] || 0) + 1;
      });
    });
    
    // 按频率排序，取前10个
    const sortedTopics = Object.entries(topicKeywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));
    
    return sortedTopics;
  }

  /**
   * 估算token数量
   */
  _estimateTokens(content) {
    // 简单的token估算（中文按字符数，英文按单词数）
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    
    return chineseChars + englishWords;
  }

  /**
   * 清除消息相关缓存
   */
  _clearCacheForMessage(messageId) {
    // 清除包含该消息的所有缓存
    for (const [key, value] of this.contextCache.entries()) {
      if (value.context && value.context.find(m => m.id === messageId)) {
        this.contextCache.delete(key);
      }
    }
    
    this.importanceCache.delete(`${messageId}_importance`);
  }

  /**
   * 清除人格相关缓存
   */
  clearCacheForPersona(personaId) {
    // 清除上下文缓存
    for (const key of this.contextCache.keys()) {
      if (key.startsWith(personaId)) {
        this.contextCache.delete(key);
      }
    }
    
    // 清除摘要缓存
    for (const key of this.summaryCache.keys()) {
      if (key.includes(personaId)) {
        this.summaryCache.delete(key);
      }
    }
  }

  /**
   * 获取上下文统计信息
   */
  getContextStats() {
    return {
      contextCacheSize: this.contextCache.size,
      importanceCacheSize: this.importanceCache.size,
      summaryCacheSize: this.summaryCache.size,
      config: this.config
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // 清除缓存以应用新配置
    this.contextCache.clear();
    this.summaryCache.clear();
    
    console.log('上下文管理器配置已更新:', this.config);
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    this.contextCache.clear();
    this.importanceCache.clear();
    this.summaryCache.clear();
    
    console.log('上下文管理器缓存已清空');
  }
}

// 导出上下文管理器
window.AIChat = window.AIChat || {};
window.AIChat.ContextManager = ContextManager;

console.log('对话上下文管理器已加载');