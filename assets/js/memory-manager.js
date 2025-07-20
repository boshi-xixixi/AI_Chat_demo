/**
 * 对话记忆管理器
 * 负责长期对话记忆、智能摘要、重要信息提取和跨会话连续性
 */

class MemoryManager {
  constructor(storageService, contextManager) {
    this.storage = storageService;
    this.contextManager = contextManager;
    
    // 记忆配置
    this.config = {
      maxMemoryEntries: 1000,        // 最大记忆条目数
      summaryTriggerCount: 50,       // 触发摘要的消息数量
      memoryDecayDays: 30,           // 记忆衰减天数
      importanceThreshold: 0.7,      // 重要性阈值
      keywordExtractionMinScore: 0.5, // 关键词提取最小分数
      maxSummaryLength: 500,         // 最大摘要长度
      contextWindowSize: 20,         // 上下文窗口大小
      memoryCompressionRatio: 0.3    // 记忆压缩比例
    };
    
    // 缓存
    this.memoryCache = new Map();
    this.summaryCache = new Map();
    this.keywordCache = new Map();
    
    // 记忆类型
    this.memoryTypes = {
      CONVERSATION: 'conversation',   // 对话记忆
      PERSONAL: 'personal',          // 个人信息记忆
      PREFERENCE: 'preference',      // 偏好记忆
      CONTEXT: 'context',            // 上下文记忆
      EMOTIONAL: 'emotional',        // 情感记忆
      FACTUAL: 'factual'            // 事实记忆
    };
    
    // 记忆重要性权重
    this.memoryWeights = {
      recency: 0.2,        // 时间新近性
      frequency: 0.2,      // 出现频率
      importance: 0.3,     // 内容重要性
      emotional: 0.15,     // 情感强度
      personal: 0.15       // 个人相关性
    };
    
    // 初始化记忆存储结构
    this._initMemoryStructure();
  }

  /**
   * 初始化记忆存储结构
   */
  async _initMemoryStructure() {
    try {
      // 确保数据库已初始化
      await this.storage.init();
      
      // 检查是否需要创建记忆相关的存储结构
      await this._ensureMemoryStores();
      
      console.log('记忆管理器初始化完成');
    } catch (error) {
      console.error('记忆管理器初始化失败:', error);
    }
  }

  /**
   * 确保记忆存储结构存在
   */
  async _ensureMemoryStores() {
    try {
      // 创建记忆条目存储（如果不存在）
      const memoryStore = {
        id: 'memory_structure_check',
        type: 'system',
        content: 'Memory structure initialization',
        personaId: 'system',
        timestamp: new Date(),
        metadata: {
          isSystemEntry: true
        }
      };
      
      // 尝试存储以确保结构存在
      await this.storage.put('memories', memoryStore);
      await this.storage.delete('memories', 'memory_structure_check');
      
    } catch (error) {
      console.warn('记忆存储结构检查失败:', error);
    }
  }

  /**
   * 处理新消息并提取记忆
   */
  async processMessage(message, personaId, conversationContext = []) {
    try {
      // 分析消息内容
      const analysis = await this._analyzeMessage(message, conversationContext);
      
      // 提取记忆条目
      const memoryEntries = await this._extractMemoryEntries(
        message, 
        personaId, 
        analysis
      );
      
      // 保存记忆条目
      for (const entry of memoryEntries) {
        await this._saveMemoryEntry(entry);
      }
      
      // 检查是否需要生成摘要
      await this._checkSummaryTrigger(personaId);
      
      // 更新记忆统计
      await this._updateMemoryStats(personaId);
      
      console.log(`处理消息记忆完成: ${memoryEntries.length} 个记忆条目`);
      return memoryEntries;
    } catch (error) {
      console.error('处理消息记忆失败:', error);
      return [];
    }
  }

  /**
   * 分析消息内容
   */
  async _analyzeMessage(message, conversationContext) {
    const content = message.content.toLowerCase();
    
    const analysis = {
      keywords: this._extractKeywords(content),
      entities: this._extractEntities(content),
      emotions: this._analyzeEmotions(content),
      personalInfo: this._extractPersonalInfo(content),
      preferences: this._extractPreferences(content),
      questions: this._extractQuestions(content),
      facts: this._extractFacts(content),
      references: this._findReferences(content, conversationContext),
      importance: await this.contextManager._calculateMessageImportance(
        message, 
        conversationContext
      )
    };
    
    return analysis;
  }

  /**
   * 提取关键词
   */
  _extractKeywords(content) {
    // 使用改进的关键词提取算法
    const words = content
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length >= 2);
    
    // 计算词频
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // 过滤停用词并计算重要性分数
    const stopWords = new Set([
      '的', '了', '是', '在', '有', '和', '就', '不', '人', '都', '一', '个', 
      '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', 
      '好', '自己', '这', '那', '能', '可以', '应该', '知道', '觉得', '认为'
    ]);
    
    const keywords = Object.entries(wordFreq)
      .filter(([word]) => !stopWords.has(word))
      .map(([word, freq]) => ({
        word,
        frequency: freq,
        score: this._calculateKeywordScore(word, freq, content.length)
      }))
      .filter(item => item.score >= this.config.keywordExtractionMinScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    return keywords;
  }

  /**
   * 计算关键词分数
   */
  _calculateKeywordScore(word, frequency, contentLength) {
    const lengthFactor = Math.min(word.length / 10, 1);
    const frequencyFactor = Math.min(frequency / 3, 1);
    const rarityFactor = 1 / Math.log(contentLength + 1);
    
    return (lengthFactor * 0.4 + frequencyFactor * 0.4 + rarityFactor * 0.2);
  }

  /**
   * 提取实体（人名、地名等）
   */
  _extractEntities(content) {
    const entities = {
      persons: [],
      places: [],
      organizations: [],
      dates: [],
      numbers: []
    };
    
    // 简单的实体识别（实际项目中可以使用NLP库）
    
    // 提取可能的人名（中文姓名模式）
    const personPattern = /[王李张刘陈杨黄赵周吴徐孙朱马胡郭林何高梁郑罗宋谢唐韩曹许邓萧冯曾程蔡彭潘袁于董余苏叶吕魏蒋田杜丁沈姜范江傅钟卢汪戴崔任陆廖姚方金邱夏谭韦贾邹石熊孟秦阎薛侯雷白龙段郝孔邵史毛常万顾赖武康贺严尹钱施牛洪龚][一-龯]{1,2}/g;
    const personMatches = content.match(personPattern) || [];
    entities.persons = [...new Set(personMatches)];
    
    // 提取日期
    const datePattern = /\d{4}年\d{1,2}月\d{1,2}日|\d{1,2}月\d{1,2}日|今天|明天|昨天|前天|后天/g;
    const dateMatches = content.match(datePattern) || [];
    entities.dates = [...new Set(dateMatches)];
    
    // 提取数字
    const numberPattern = /\d+/g;
    const numberMatches = content.match(numberPattern) || [];
    entities.numbers = [...new Set(numberMatches)];
    
    return entities;
  }

  /**
   * 分析情感
   */
  _analyzeEmotions(content) {
    const emotions = {
      positive: 0,
      negative: 0,
      neutral: 0,
      intensity: 0,
      keywords: []
    };
    
    // 情感词典
    const positiveWords = ['开心', '高兴', '快乐', '兴奋', '满意', '喜欢', '爱', '好', '棒', '赞', '优秀', '完美'];
    const negativeWords = ['难过', '伤心', '生气', '愤怒', '失望', '讨厌', '恨', '糟糕', '差', '坏', '痛苦', '烦恼'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (content.includes(word)) {
        positiveCount++;
        emotions.keywords.push({ word, type: 'positive' });
      }
    });
    
    negativeWords.forEach(word => {
      if (content.includes(word)) {
        negativeCount++;
        emotions.keywords.push({ word, type: 'negative' });
      }
    });
    
    const totalEmotionalWords = positiveCount + negativeCount;
    
    if (totalEmotionalWords > 0) {
      emotions.positive = positiveCount / totalEmotionalWords;
      emotions.negative = negativeCount / totalEmotionalWords;
      emotions.intensity = totalEmotionalWords / content.length * 100;
    } else {
      emotions.neutral = 1;
    }
    
    return emotions;
  }

  /**
   * 提取个人信息
   */
  _extractPersonalInfo(content) {
    const personalInfo = {
      name: null,
      age: null,
      occupation: null,
      location: null,
      interests: [],
      relationships: []
    };
    
    // 提取姓名
    const namePattern = /我叫|我是|我的名字是|名字叫([^\s，。！？]+)/;
    const nameMatch = content.match(namePattern);
    if (nameMatch) {
      personalInfo.name = nameMatch[1];
    }
    
    // 提取年龄
    const agePattern = /(\d+)岁|今年(\d+)/;
    const ageMatch = content.match(agePattern);
    if (ageMatch) {
      personalInfo.age = parseInt(ageMatch[1] || ageMatch[2]);
    }
    
    // 提取职业
    const occupationKeywords = ['工作', '职业', '从事', '做', '是个', '当'];
    occupationKeywords.forEach(keyword => {
      const pattern = new RegExp(`${keyword}([^\\s，。！？]+)`);
      const match = content.match(pattern);
      if (match) {
        personalInfo.occupation = match[1];
      }
    });
    
    // 提取兴趣爱好
    const interestKeywords = ['喜欢', '爱好', '兴趣', '热爱', '痴迷'];
    interestKeywords.forEach(keyword => {
      const pattern = new RegExp(`${keyword}([^\\s，。！？]+)`);
      const match = content.match(pattern);
      if (match) {
        personalInfo.interests.push(match[1]);
      }
    });
    
    return personalInfo;
  }

  /**
   * 提取偏好信息
   */
  _extractPreferences(content) {
    const preferences = {
      likes: [],
      dislikes: [],
      habits: [],
      opinions: []
    };
    
    // 提取喜好
    const likePatterns = ['喜欢', '爱', '偏爱', '钟爱', '热爱'];
    likePatterns.forEach(pattern => {
      const regex = new RegExp(`${pattern}([^\\s，。！？]+)`, 'g');
      let match;
      while ((match = regex.exec(content)) !== null) {
        preferences.likes.push(match[1]);
      }
    });
    
    // 提取不喜欢的
    const dislikePatterns = ['不喜欢', '讨厌', '恨', '反感'];
    dislikePatterns.forEach(pattern => {
      const regex = new RegExp(`${pattern}([^\\s，。！？]+)`, 'g');
      let match;
      while ((match = regex.exec(content)) !== null) {
        preferences.dislikes.push(match[1]);
      }
    });
    
    // 提取习惯
    const habitPatterns = ['习惯', '经常', '总是', '通常', '一般'];
    habitPatterns.forEach(pattern => {
      const regex = new RegExp(`${pattern}([^\\s，。！？]+)`, 'g');
      let match;
      while ((match = regex.exec(content)) !== null) {
        preferences.habits.push(match[1]);
      }
    });
    
    return preferences;
  }

  /**
   * 提取问题
   */
  _extractQuestions(content) {
    const questions = [];
    
    // 按句子分割
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim());
    
    sentences.forEach(sentence => {
      if (sentence.includes('？') || sentence.includes('?') || 
          sentence.includes('吗') || sentence.includes('呢') ||
          sentence.includes('什么') || sentence.includes('为什么') ||
          sentence.includes('怎么') || sentence.includes('如何')) {
        questions.push(sentence.trim());
      }
    });
    
    return questions;
  }

  /**
   * 提取事实信息
   */
  _extractFacts(content) {
    const facts = [];
    
    // 寻找陈述性句子
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim());
    
    sentences.forEach(sentence => {
      // 包含确定性词汇的句子可能是事实
      if (sentence.includes('是') || sentence.includes('有') || 
          sentence.includes('在') || sentence.includes('会') ||
          sentence.includes('能') || sentence.includes('可以')) {
        facts.push({
          content: sentence.trim(),
          confidence: this._calculateFactConfidence(sentence)
        });
      }
    });
    
    return facts.filter(fact => fact.confidence > 0.5);
  }

  /**
   * 计算事实置信度
   */
  _calculateFactConfidence(sentence) {
    let confidence = 0.5;
    
    // 包含确定性词汇增加置信度
    const certaintyWords = ['确实', '肯定', '一定', '绝对', '必须', '总是'];
    certaintyWords.forEach(word => {
      if (sentence.includes(word)) {
        confidence += 0.1;
      }
    });
    
    // 包含不确定性词汇降低置信度
    const uncertaintyWords = ['可能', '也许', '大概', '估计', '好像', '似乎'];
    uncertaintyWords.forEach(word => {
      if (sentence.includes(word)) {
        confidence -= 0.2;
      }
    });
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 查找引用
   */
  _findReferences(content, conversationContext) {
    const references = [];
    
    // 查找时间引用
    const timeReferences = ['刚才', '之前', '刚刚', '前面', '上次', '昨天', '今天'];
    timeReferences.forEach(ref => {
      if (content.includes(ref)) {
        references.push({
          type: 'temporal',
          reference: ref,
          context: this._findContextForReference(ref, conversationContext)
        });
      }
    });
    
    // 查找内容引用
    if (conversationContext.length > 0) {
      const recentMessages = conversationContext.slice(-5);
      recentMessages.forEach(msg => {
        const msgWords = msg.content.split(/\s+/).filter(w => w.length > 2);
        msgWords.forEach(word => {
          if (content.includes(word) && word !== content) {
            references.push({
              type: 'content',
              reference: word,
              sourceMessageId: msg.id,
              context: msg.content.substring(0, 100)
            });
          }
        });
      });
    }
    
    return references;
  }

  /**
   * 为引用查找上下文
   */
  _findContextForReference(reference, conversationContext) {
    // 根据引用类型查找相关的历史消息
    const relevantMessages = conversationContext.filter(msg => {
      const timeDiff = Date.now() - new Date(msg.timestamp).getTime();
      
      switch (reference) {
        case '刚才':
        case '刚刚':
          return timeDiff < 5 * 60 * 1000; // 5分钟内
        case '之前':
        case '前面':
          return timeDiff < 30 * 60 * 1000; // 30分钟内
        case '上次':
          return timeDiff < 24 * 60 * 60 * 1000; // 24小时内
        default:
          return false;
      }
    });
    
    return relevantMessages.slice(-3); // 返回最近的3条相关消息
  }

  /**
   * 提取记忆条目
   */
  async _extractMemoryEntries(message, personaId, analysis) {
    const entries = [];
    const timestamp = new Date();
    
    // 1. 对话记忆条目
    if (analysis.importance > this.config.importanceThreshold) {
      entries.push({
        id: `conv_${AIChat.Utils.generateId()}`,
        type: this.memoryTypes.CONVERSATION,
        personaId: personaId,
        content: message.content,
        summary: this._generateSummary(message.content),
        keywords: analysis.keywords.map(k => k.word),
        importance: analysis.importance,
        timestamp: timestamp,
        sourceMessageId: message.id,
        metadata: {
          emotions: analysis.emotions,
          entities: analysis.entities,
          references: analysis.references
        }
      });
    }
    
    // 2. 个人信息记忆条目
    if (analysis.personalInfo.name || analysis.personalInfo.age || 
        analysis.personalInfo.occupation || analysis.personalInfo.location) {
      entries.push({
        id: `personal_${AIChat.Utils.generateId()}`,
        type: this.memoryTypes.PERSONAL,
        personaId: personaId,
        content: JSON.stringify(analysis.personalInfo),
        summary: this._generatePersonalInfoSummary(analysis.personalInfo),
        keywords: Object.values(analysis.personalInfo).filter(v => v).flat(),
        importance: 0.9, // 个人信息很重要
        timestamp: timestamp,
        sourceMessageId: message.id,
        metadata: {
          personalInfo: analysis.personalInfo
        }
      });
    }
    
    // 3. 偏好记忆条目
    if (analysis.preferences.likes.length > 0 || analysis.preferences.dislikes.length > 0) {
      entries.push({
        id: `pref_${AIChat.Utils.generateId()}`,
        type: this.memoryTypes.PREFERENCE,
        personaId: personaId,
        content: JSON.stringify(analysis.preferences),
        summary: this._generatePreferenceSummary(analysis.preferences),
        keywords: [...analysis.preferences.likes, ...analysis.preferences.dislikes],
        importance: 0.8,
        timestamp: timestamp,
        sourceMessageId: message.id,
        metadata: {
          preferences: analysis.preferences
        }
      });
    }
    
    // 4. 情感记忆条目
    if (analysis.emotions.intensity > 0.5) {
      entries.push({
        id: `emotion_${AIChat.Utils.generateId()}`,
        type: this.memoryTypes.EMOTIONAL,
        personaId: personaId,
        content: message.content,
        summary: this._generateEmotionSummary(analysis.emotions),
        keywords: analysis.emotions.keywords.map(k => k.word),
        importance: analysis.emotions.intensity,
        timestamp: timestamp,
        sourceMessageId: message.id,
        metadata: {
          emotions: analysis.emotions
        }
      });
    }
    
    // 5. 事实记忆条目
    if (analysis.facts.length > 0) {
      analysis.facts.forEach(fact => {
        entries.push({
          id: `fact_${AIChat.Utils.generateId()}`,
          type: this.memoryTypes.FACTUAL,
          personaId: personaId,
          content: fact.content,
          summary: fact.content,
          keywords: this._extractKeywords(fact.content).map(k => k.word),
          importance: fact.confidence,
          timestamp: timestamp,
          sourceMessageId: message.id,
          metadata: {
            confidence: fact.confidence,
            factType: 'statement'
          }
        });
      });
    }
    
    return entries;
  }

  /**
   * 生成摘要
   */
  _generateSummary(content) {
    if (content.length <= this.config.maxSummaryLength) {
      return content;
    }
    
    // 简单的摘要生成：取前面的重要句子
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim());
    let summary = '';
    
    for (const sentence of sentences) {
      if (summary.length + sentence.length <= this.config.maxSummaryLength) {
        summary += sentence + '。';
      } else {
        break;
      }
    }
    
    return summary || content.substring(0, this.config.maxSummaryLength) + '...';
  }

  /**
   * 生成个人信息摘要
   */
  _generatePersonalInfoSummary(personalInfo) {
    const parts = [];
    
    if (personalInfo.name) parts.push(`姓名：${personalInfo.name}`);
    if (personalInfo.age) parts.push(`年龄：${personalInfo.age}岁`);
    if (personalInfo.occupation) parts.push(`职业：${personalInfo.occupation}`);
    if (personalInfo.location) parts.push(`地点：${personalInfo.location}`);
    if (personalInfo.interests.length > 0) parts.push(`兴趣：${personalInfo.interests.join('、')}`);
    
    return parts.join('，');
  }

  /**
   * 生成偏好摘要
   */
  _generatePreferenceSummary(preferences) {
    const parts = [];
    
    if (preferences.likes.length > 0) parts.push(`喜欢：${preferences.likes.join('、')}`);
    if (preferences.dislikes.length > 0) parts.push(`不喜欢：${preferences.dislikes.join('、')}`);
    if (preferences.habits.length > 0) parts.push(`习惯：${preferences.habits.join('、')}`);
    
    return parts.join('；');
  }

  /**
   * 生成情感摘要
   */
  _generateEmotionSummary(emotions) {
    const emotionType = emotions.positive > emotions.negative ? '积极' : 
                       emotions.negative > emotions.positive ? '消极' : '中性';
    const intensity = emotions.intensity > 0.7 ? '强烈' : 
                     emotions.intensity > 0.3 ? '中等' : '轻微';
    
    return `${intensity}的${emotionType}情感`;
  }

  /**
   * 保存记忆条目
   */
  async _saveMemoryEntry(entry) {
    try {
      // 检查是否已存在相似的记忆条目
      const existingEntry = await this._findSimilarMemoryEntry(entry);
      
      if (existingEntry) {
        // 更新现有条目
        await this._updateMemoryEntry(existingEntry, entry);
      } else {
        // 创建新条目
        await this.storage.put('memories', entry);
      }
      
      // 更新缓存
      this._updateMemoryCache(entry);
      
    } catch (error) {
      console.error('保存记忆条目失败:', error);
      throw error;
    }
  }

  /**
   * 查找相似的记忆条目
   */
  async _findSimilarMemoryEntry(newEntry) {
    try {
      const existingEntries = await this.storage.getAllByIndex(
        'memories', 
        'personaId', 
        newEntry.personaId
      );
      
      return existingEntries.find(entry => 
        entry.type === newEntry.type &&
        this._calculateSimilarity(entry.content, newEntry.content) > 0.8
      );
    } catch (error) {
      console.warn('查找相似记忆条目失败:', error);
      return null;
    }
  }

  /**
   * 计算内容相似性
   */
  _calculateSimilarity(content1, content2) {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 更新记忆条目
   */
  async _updateMemoryEntry(existingEntry, newEntry) {
    // 合并信息
    const updatedEntry = {
      ...existingEntry,
      content: this._mergeContent(existingEntry.content, newEntry.content),
      keywords: [...new Set([...existingEntry.keywords, ...newEntry.keywords])],
      importance: Math.max(existingEntry.importance, newEntry.importance),
      lastUpdated: new Date(),
      updateCount: (existingEntry.updateCount || 0) + 1,
      metadata: {
        ...existingEntry.metadata,
        ...newEntry.metadata,
        sources: [
          ...(existingEntry.metadata.sources || [existingEntry.sourceMessageId]),
          newEntry.sourceMessageId
        ]
      }
    };
    
    await this.storage.put('memories', updatedEntry);
    return updatedEntry;
  }

  /**
   * 合并内容
   */
  _mergeContent(existingContent, newContent) {
    // 如果内容相似度很高，保留较长的那个
    if (this._calculateSimilarity(existingContent, newContent) > 0.9) {
      return existingContent.length > newContent.length ? existingContent : newContent;
    }
    
    // 否则合并内容
    return `${existingContent}\n补充：${newContent}`;
  }

  /**
   * 更新记忆缓存
   */
  _updateMemoryCache(entry) {
    const cacheKey = `${entry.personaId}_${entry.type}`;
    
    if (!this.memoryCache.has(cacheKey)) {
      this.memoryCache.set(cacheKey, []);
    }
    
    const cached = this.memoryCache.get(cacheKey);
    const existingIndex = cached.findIndex(item => item.id === entry.id);
    
    if (existingIndex >= 0) {
      cached[existingIndex] = entry;
    } else {
      cached.push(entry);
      
      // 保持缓存大小限制
      if (cached.length > 100) {
        cached.shift();
      }
    }
  } 
 /**
   * 检查摘要触发条件
   */
  async _checkSummaryTrigger(personaId) {
    try {
      const messageCount = await this.storage.count('messages');
      
      if (messageCount % this.config.summaryTriggerCount === 0) {
        await this.generateConversationSummary(personaId);
      }
    } catch (error) {
      console.warn('检查摘要触发条件失败:', error);
    }
  }

  /**
   * 生成对话摘要
   */
  async generateConversationSummary(personaId) {
    try {
      const cacheKey = `summary_${personaId}`;
      
      // 检查缓存
      if (this.summaryCache.has(cacheKey)) {
        const cached = this.summaryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5分钟缓存
          return cached.summary;
        }
      }
      
      // 获取记忆条目
      const memoryEntries = await this.getMemoryEntries(personaId, {
        limit: 100,
        sortBy: 'importance'
      });
      
      if (memoryEntries.length === 0) {
        return null;
      }
      
      // 生成摘要
      const summary = {
        id: `summary_${AIChat.Utils.generateId()}`,
        personaId: personaId,
        type: 'conversation_summary',
        generatedAt: new Date(),
        memoryCount: memoryEntries.length,
        keyTopics: this._extractKeyTopics(memoryEntries),
        personalInfo: this._summarizePersonalInfo(memoryEntries),
        preferences: this._summarizePreferences(memoryEntries),
        emotionalProfile: this._summarizeEmotions(memoryEntries),
        importantFacts: this._summarizeImportantFacts(memoryEntries),
        conversationStyle: this._analyzeConversationStyle(memoryEntries)
      };
      
      // 保存摘要
      await this.storage.put('summaries', summary);
      
      // 缓存摘要
      this.summaryCache.set(cacheKey, {
        summary: summary,
        timestamp: Date.now()
      });
      
      console.log(`生成对话摘要完成: ${personaId}`);
      return summary;
    } catch (error) {
      console.error('生成对话摘要失败:', error);
      return null;
    }
  }

  /**
   * 提取关键话题
   */
  _extractKeyTopics(memoryEntries) {
    const topicCounts = {};
    
    memoryEntries.forEach(entry => {
      entry.keywords.forEach(keyword => {
        topicCounts[keyword] = (topicCounts[keyword] || 0) + entry.importance;
      });
    });
    
    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, score]) => ({ topic, score }));
  }

  /**
   * 汇总个人信息
   */
  _summarizePersonalInfo(memoryEntries) {
    const personalEntries = memoryEntries.filter(entry => 
      entry.type === this.memoryTypes.PERSONAL
    );
    
    const consolidatedInfo = {
      name: null,
      age: null,
      occupation: null,
      location: null,
      interests: [],
      relationships: []
    };
    
    personalEntries.forEach(entry => {
      if (entry.metadata && entry.metadata.personalInfo) {
        const info = entry.metadata.personalInfo;
        
        if (info.name) consolidatedInfo.name = info.name;
        if (info.age) consolidatedInfo.age = info.age;
        if (info.occupation) consolidatedInfo.occupation = info.occupation;
        if (info.location) consolidatedInfo.location = info.location;
        if (info.interests) consolidatedInfo.interests.push(...info.interests);
        if (info.relationships) consolidatedInfo.relationships.push(...info.relationships);
      }
    });
    
    // 去重
    consolidatedInfo.interests = [...new Set(consolidatedInfo.interests)];
    consolidatedInfo.relationships = [...new Set(consolidatedInfo.relationships)];
    
    return consolidatedInfo;
  }

  /**
   * 汇总偏好信息
   */
  _summarizePreferences(memoryEntries) {
    const preferenceEntries = memoryEntries.filter(entry => 
      entry.type === this.memoryTypes.PREFERENCE
    );
    
    const consolidatedPrefs = {
      likes: [],
      dislikes: [],
      habits: [],
      opinions: []
    };
    
    preferenceEntries.forEach(entry => {
      if (entry.metadata && entry.metadata.preferences) {
        const prefs = entry.metadata.preferences;
        
        if (prefs.likes) consolidatedPrefs.likes.push(...prefs.likes);
        if (prefs.dislikes) consolidatedPrefs.dislikes.push(...prefs.dislikes);
        if (prefs.habits) consolidatedPrefs.habits.push(...prefs.habits);
        if (prefs.opinions) consolidatedPrefs.opinions.push(...prefs.opinions);
      }
    });
    
    // 去重并按频率排序
    Object.keys(consolidatedPrefs).forEach(key => {
      const counts = {};
      consolidatedPrefs[key].forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
      });
      
      consolidatedPrefs[key] = Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .map(([item, count]) => ({ item, count }));
    });
    
    return consolidatedPrefs;
  } 
 /**
   * 汇总情感信息
   */
  _summarizeEmotions(memoryEntries) {
    const emotionalEntries = memoryEntries.filter(entry => 
      entry.type === this.memoryTypes.EMOTIONAL
    );
    
    if (emotionalEntries.length === 0) {
      return { overall: 'neutral', patterns: [] };
    }
    
    let totalPositive = 0;
    let totalNegative = 0;
    let totalNeutral = 0;
    const emotionPatterns = {};
    
    emotionalEntries.forEach(entry => {
      if (entry.metadata && entry.metadata.emotions) {
        const emotions = entry.metadata.emotions;
        
        totalPositive += emotions.positive || 0;
        totalNegative += emotions.negative || 0;
        totalNeutral += emotions.neutral || 0;
        
        emotions.keywords.forEach(keyword => {
          const key = `${keyword.type}_${keyword.word}`;
          emotionPatterns[key] = (emotionPatterns[key] || 0) + 1;
        });
      }
    });
    
    const total = totalPositive + totalNegative + totalNeutral;
    const overall = total > 0 ? 
      (totalPositive > totalNegative ? 'positive' : 
       totalNegative > totalPositive ? 'negative' : 'neutral') : 'neutral';
    
    const patterns = Object.entries(emotionPatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));
    
    return {
      overall,
      distribution: {
        positive: total > 0 ? totalPositive / total : 0,
        negative: total > 0 ? totalNegative / total : 0,
        neutral: total > 0 ? totalNeutral / total : 0
      },
      patterns
    };
  }

  /**
   * 汇总重要事实
   */
  _summarizeImportantFacts(memoryEntries) {
    const factualEntries = memoryEntries.filter(entry => 
      entry.type === this.memoryTypes.FACTUAL && entry.importance > 0.7
    );
    
    return factualEntries
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10)
      .map(entry => ({
        fact: entry.content,
        confidence: entry.metadata.confidence,
        importance: entry.importance,
        timestamp: entry.timestamp
      }));
  }

  /**
   * 分析对话风格
   */
  _analyzeConversationStyle(memoryEntries) {
    const conversationEntries = memoryEntries.filter(entry => 
      entry.type === this.memoryTypes.CONVERSATION
    );
    
    if (conversationEntries.length === 0) {
      return { style: 'unknown', characteristics: [] };
    }
    
    const characteristics = [];
    let totalLength = 0;
    let questionCount = 0;
    let emotionalCount = 0;
    
    conversationEntries.forEach(entry => {
      totalLength += entry.content.length;
      
      if (entry.content.includes('？') || entry.content.includes('?')) {
        questionCount++;
      }
      
      if (entry.metadata && entry.metadata.emotions && 
          entry.metadata.emotions.intensity > 0.5) {
        emotionalCount++;
      }
    });
    
    const avgLength = totalLength / conversationEntries.length;
    const questionRatio = questionCount / conversationEntries.length;
    const emotionalRatio = emotionalCount / conversationEntries.length;
    
    if (avgLength > 100) characteristics.push('详细表达');
    if (avgLength < 30) characteristics.push('简洁表达');
    if (questionRatio > 0.3) characteristics.push('好奇提问');
    if (emotionalRatio > 0.4) characteristics.push('情感丰富');
    
    const style = characteristics.length > 0 ? characteristics[0] : 'balanced';
    
    return {
      style,
      characteristics,
      metrics: {
        averageMessageLength: Math.round(avgLength),
        questionRatio: Math.round(questionRatio * 100),
        emotionalRatio: Math.round(emotionalRatio * 100)
      }
    };
  }

  /**
   * 更新记忆统计
   */
  async _updateMemoryStats(personaId) {
    try {
      const stats = {
        id: `stats_${personaId}`,
        personaId: personaId,
        lastUpdated: new Date(),
        memoryCount: await this.storage.count('memories'),
        summaryCount: await this.storage.count('summaries'),
        cacheStats: {
          memoryCache: this.memoryCache.size,
          summaryCache: this.summaryCache.size,
          keywordCache: this.keywordCache.size
        }
      };
      
      await this.storage.put('memory_stats', stats);
    } catch (error) {
      console.warn('更新记忆统计失败:', error);
    }
  }

  /**
   * 获取记忆条目
   */
  async getMemoryEntries(personaId, options = {}) {
    try {
      const {
        type = null,
        limit = 50,
        offset = 0,
        sortBy = 'timestamp',
        sortOrder = 'desc',
        minImportance = 0
      } = options;
      
      let entries = await this.storage.getAllByIndex('memories', 'personaId', personaId);
      
      // 过滤类型
      if (type) {
        entries = entries.filter(entry => entry.type === type);
      }
      
      // 过滤重要性
      if (minImportance > 0) {
        entries = entries.filter(entry => entry.importance >= minImportance);
      }
      
      // 排序
      entries.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortBy === 'timestamp') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      });
      
      // 分页
      return entries.slice(offset, offset + limit);
    } catch (error) {
      console.error('获取记忆条目失败:', error);
      return [];
    }
  }

  /**
   * 搜索记忆
   */
  async searchMemories(personaId, query, options = {}) {
    try {
      const {
        type = null,
        limit = 20,
        minScore = 0.3
      } = options;
      
      const allEntries = await this.getMemoryEntries(personaId, { limit: 1000 });
      const queryLower = query.toLowerCase();
      
      const scoredEntries = allEntries.map(entry => {
        let score = 0;
        
        // 内容匹配
        if (entry.content.toLowerCase().includes(queryLower)) {
          score += 0.5;
        }
        
        // 摘要匹配
        if (entry.summary && entry.summary.toLowerCase().includes(queryLower)) {
          score += 0.3;
        }
        
        // 关键词匹配
        const matchingKeywords = entry.keywords.filter(keyword => 
          keyword.toLowerCase().includes(queryLower)
        );
        score += matchingKeywords.length * 0.2;
        
        // 重要性加权
        score *= entry.importance;
        
        return { ...entry, searchScore: score };
      });
      
      let results = scoredEntries.filter(entry => entry.searchScore >= minScore);
      
      // 过滤类型
      if (type) {
        results = results.filter(entry => entry.type === type);
      }
      
      // 按搜索分数排序
      results.sort((a, b) => b.searchScore - a.searchScore);
      
      return results.slice(0, limit);
    } catch (error) {
      console.error('搜索记忆失败:', error);
      return [];
    }
  }

  /**
   * 获取记忆统计
   */
  async getMemoryStats(personaId) {
    try {
      const entries = await this.getMemoryEntries(personaId, { limit: 1000 });
      
      const stats = {
        total: entries.length,
        byType: {},
        averageImportance: 0,
        oldestEntry: null,
        newestEntry: null,
        topKeywords: []
      };
      
      if (entries.length === 0) {
        return stats;
      }
      
      // 按类型统计
      entries.forEach(entry => {
        stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
      });
      
      // 平均重要性
      const totalImportance = entries.reduce((sum, entry) => sum + entry.importance, 0);
      stats.averageImportance = totalImportance / entries.length;
      
      // 最早和最新条目
      const sortedByTime = entries.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      stats.oldestEntry = sortedByTime[0];
      stats.newestEntry = sortedByTime[sortedByTime.length - 1];
      
      // 热门关键词
      const keywordCounts = {};
      entries.forEach(entry => {
        entry.keywords.forEach(keyword => {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        });
      });
      
      stats.topKeywords = Object.entries(keywordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([keyword, count]) => ({ keyword, count }));
      
      return stats;
    } catch (error) {
      console.error('获取记忆统计失败:', error);
      return null;
    }
  }

  /**
   * 清理过期记忆
   */
  async cleanupExpiredMemories(personaId) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.memoryDecayDays);
      
      const allEntries = await this.getMemoryEntries(personaId, { limit: 10000 });
      const expiredEntries = allEntries.filter(entry => 
        new Date(entry.timestamp) < cutoffDate && entry.importance < 0.5
      );
      
      let deletedCount = 0;
      for (const entry of expiredEntries) {
        await this.storage.delete('memories', entry.id);
        deletedCount++;
      }
      
      // 清理相关缓存
      this.clearCacheForPersona(personaId);
      
      console.log(`清理过期记忆完成: ${deletedCount} 条`);
      return deletedCount;
    } catch (error) {
      console.error('清理过期记忆失败:', error);
      return 0;
    }
  }

  /**
   * 清理人格相关缓存
   */
  clearCacheForPersona(personaId) {
    // 清理记忆缓存
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(personaId)) {
        this.memoryCache.delete(key);
      }
    }
    
    // 清理摘要缓存
    for (const key of this.summaryCache.keys()) {
      if (key.includes(personaId)) {
        this.summaryCache.delete(key);
      }
    }
    
    // 清理关键词缓存
    for (const key of this.keywordCache.keys()) {
      if (key.includes(personaId)) {
        this.keywordCache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      memoryCache: this.memoryCache.size,
      summaryCache: this.summaryCache.size,
      keywordCache: this.keywordCache.size,
      config: this.config
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('记忆管理器配置已更新:', this.config);
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    this.memoryCache.clear();
    this.summaryCache.clear();
    this.keywordCache.clear();
    console.log('记忆管理器缓存已清空');
  }
}

// 导出记忆管理器
window.AIChat = window.AIChat || {};
window.AIChat.MemoryManager = MemoryManager;

console.log('对话记忆管理器已加载');