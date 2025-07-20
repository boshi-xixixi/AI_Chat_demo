/**
 * 会话连续性管理器
 * 负责跨会话的对话状态恢复、人格切换时的记忆保持和对话连续性
 */

class SessionContinuityManager {
  constructor(storageService, memoryManager, contextManager) {
    this.storage = storageService;
    this.memoryManager = memoryManager;
    this.contextManager = contextManager;
    
    // 会话配置
    this.config = {
      maxSessionHistory: 100,      // 最大会话历史数量
      sessionTimeoutHours: 24,     // 会话超时时间（小时）
      contextRecoveryDepth: 20,    // 上下文恢复深度
      memoryRecoveryLimit: 50,     // 记忆恢复限制
      continuityThreshold: 0.6,    // 连续性阈值
      stateCompressionRatio: 0.5   // 状态压缩比例
    };
    
    // 缓存
    this.sessionCache = new Map();
    this.stateCache = new Map();
    this.continuityCache = new Map();
    
    // 会话状态类型
    this.stateTypes = {
      CONVERSATION: 'conversation',     // 对话状态
      PERSONA: 'persona',              // 人格状态
      CONTEXT: 'context',              // 上下文状态
      MEMORY: 'memory',                // 记忆状态
      EMOTIONAL: 'emotional',          // 情感状态
      PREFERENCE: 'preference'         // 偏好状态
    };
    
    // 当前会话状态
    this.currentSession = null;
    this.sessionStates = new Map();
    
    // 初始化会话管理
    this._initSessionManagement();
  }

  /**
   * 初始化会话管理
   */
  async _initSessionManagement() {
    try {
      // 确保存储已初始化
      await this.storage.init();
      
      // 恢复上次会话状态
      await this._recoverLastSession();
      
      // 设置自动保存
      this._setupAutoSave();
      
      console.log('会话连续性管理器初始化完成');
    } catch (error) {
      console.error('会话连续性管理器初始化失败:', error);
    }
  }

  /**
   * 恢复上次会话状态
   */
  async _recoverLastSession() {
    try {
      // 获取最近的会话
      const recentSessions = await this.storage.getAllByIndex('sessions', 'lastActiveAt');
      
      if (recentSessions.length > 0) {
        // 按最后活跃时间排序
        const sortedSessions = recentSessions.sort((a, b) => 
          new Date(b.lastActiveAt) - new Date(a.lastActiveAt)
        );
        
        const lastSession = sortedSessions[0];
        const timeDiff = Date.now() - new Date(lastSession.lastActiveAt).getTime();
        
        // 如果会话未超时，恢复状态
        if (timeDiff < this.config.sessionTimeoutHours * 60 * 60 * 1000) {
          await this._restoreSessionState(lastSession);
          console.log(`恢复会话状态: ${lastSession.id}`);
        } else {
          console.log('上次会话已超时，创建新会话');
          await this._createNewSession();
        }
      } else {
        await this._createNewSession();
      }
    } catch (error) {
      console.warn('恢复会话状态失败:', error);
      await this._createNewSession();
    }
  }

  /**
   * 创建新会话
   */
  async _createNewSession() {
    try {
      const session = {
        id: `session_${AIChat.Utils.generateId()}`,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        personaId: null,
        messageCount: 0,
        states: {},
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      };
      
      await this.storage.put('sessions', session);
      this.currentSession = session;
      
      console.log(`创建新会话: ${session.id}`);
      return session;
    } catch (error) {
      console.error('创建新会话失败:', error);
      throw error;
    }
  }

  /**
   * 恢复会话状态
   */
  async _restoreSessionState(session) {
    try {
      this.currentSession = session;
      
      // 恢复各种状态
      if (session.states) {
        for (const [stateType, stateData] of Object.entries(session.states)) {
          await this._restoreSpecificState(stateType, stateData);
        }
      }
      
      // 更新最后活跃时间
      await this._updateSessionActivity();
      
      return true;
    } catch (error) {
      console.error('恢复会话状态失败:', error);
      return false;
    }
  }

  /**
   * 恢复特定状态
   */
  async _restoreSpecificState(stateType, stateData) {
    try {
      switch (stateType) {
        case this.stateTypes.CONVERSATION:
          await this._restoreConversationState(stateData);
          break;
        case this.stateTypes.PERSONA:
          await this._restorePersonaState(stateData);
          break;
        case this.stateTypes.CONTEXT:
          await this._restoreContextState(stateData);
          break;
        case this.stateTypes.MEMORY:
          await this._restoreMemoryState(stateData);
          break;
        case this.stateTypes.EMOTIONAL:
          await this._restoreEmotionalState(stateData);
          break;
        case this.stateTypes.PREFERENCE:
          await this._restorePreferenceState(stateData);
          break;
        default:
          console.warn(`未知的状态类型: ${stateType}`);
      }
    } catch (error) {
      console.error(`恢复状态失败 ${stateType}:`, error);
    }
  }

  /**
   * 恢复对话状态
   */
  async _restoreConversationState(stateData) {
    if (stateData.lastMessages && stateData.lastMessages.length > 0) {
      // 将最近的消息加载到上下文中
      this.sessionStates.set(this.stateTypes.CONVERSATION, {
        lastMessages: stateData.lastMessages,
        conversationFlow: stateData.conversationFlow,
        topicHistory: stateData.topicHistory,
        restoredAt: new Date()
      });
      
      console.log(`恢复对话状态: ${stateData.lastMessages.length} 条消息`);
    }
  }

  /**
   * 恢复人格状态
   */
  async _restorePersonaState(stateData) {
    if (stateData.currentPersonaId) {
      // 恢复当前人格
      this.sessionStates.set(this.stateTypes.PERSONA, {
        currentPersonaId: stateData.currentPersonaId,
        personaHistory: stateData.personaHistory || [],
        switchCount: stateData.switchCount || 0,
        restoredAt: new Date()
      });
      
      console.log(`恢复人格状态: ${stateData.currentPersonaId}`);
    }
  }

  /**
   * 恢复上下文状态
   */
  async _restoreContextState(stateData) {
    if (stateData.contextSummary) {
      this.sessionStates.set(this.stateTypes.CONTEXT, {
        contextSummary: stateData.contextSummary,
        importantContext: stateData.importantContext || [],
        contextKeywords: stateData.contextKeywords || [],
        restoredAt: new Date()
      });
      
      console.log('恢复上下文状态完成');
    }
  }

  /**
   * 恢复记忆状态
   */
  async _restoreMemoryState(stateData) {
    if (stateData.memorySnapshot) {
      this.sessionStates.set(this.stateTypes.MEMORY, {
        memorySnapshot: stateData.memorySnapshot,
        importantMemories: stateData.importantMemories || [],
        memoryKeywords: stateData.memoryKeywords || [],
        restoredAt: new Date()
      });
      
      console.log('恢复记忆状态完成');
    }
  }

  /**
   * 恢复情感状态
   */
  async _restoreEmotionalState(stateData) {
    if (stateData.emotionalProfile) {
      this.sessionStates.set(this.stateTypes.EMOTIONAL, {
        emotionalProfile: stateData.emotionalProfile,
        moodHistory: stateData.moodHistory || [],
        emotionalTrends: stateData.emotionalTrends || {},
        restoredAt: new Date()
      });
      
      console.log('恢复情感状态完成');
    }
  }

  /**
   * 恢复偏好状态
   */
  async _restorePreferenceState(stateData) {
    if (stateData.preferences) {
      this.sessionStates.set(this.stateTypes.PREFERENCE, {
        preferences: stateData.preferences,
        preferenceHistory: stateData.preferenceHistory || [],
        preferenceStrength: stateData.preferenceStrength || {},
        restoredAt: new Date()
      });
      
      console.log('恢复偏好状态完成');
    }
  }

  /**
   * 保存当前会话状态
   */
  async saveCurrentSessionState(personaId) {
    try {
      if (!this.currentSession) {
        await this._createNewSession();
      }
      
      // 收集当前状态
      const states = await this._collectCurrentStates(personaId);
      
      // 更新会话
      this.currentSession.states = states;
      this.currentSession.personaId = personaId;
      this.currentSession.lastActiveAt = new Date();
      this.currentSession.messageCount = (this.currentSession.messageCount || 0) + 1;
      
      // 保存到存储
      await this.storage.put('sessions', this.currentSession);
      
      console.log(`保存会话状态: ${this.currentSession.id}`);
      return true;
    } catch (error) {
      console.error('保存会话状态失败:', error);
      return false;
    }
  }

  /**
   * 收集当前状态
   */
  async _collectCurrentStates(personaId) {
    const states = {};
    
    try {
      // 收集对话状态
      states[this.stateTypes.CONVERSATION] = await this._collectConversationState(personaId);
      
      // 收集人格状态
      states[this.stateTypes.PERSONA] = await this._collectPersonaState(personaId);
      
      // 收集上下文状态
      states[this.stateTypes.CONTEXT] = await this._collectContextState(personaId);
      
      // 收集记忆状态
      states[this.stateTypes.MEMORY] = await this._collectMemoryState(personaId);
      
      // 收集情感状态
      states[this.stateTypes.EMOTIONAL] = await this._collectEmotionalState(personaId);
      
      // 收集偏好状态
      states[this.stateTypes.PREFERENCE] = await this._collectPreferenceState(personaId);
      
    } catch (error) {
      console.error('收集状态失败:', error);
    }
    
    return states;
  }

  /**
   * 收集对话状态
   */
  async _collectConversationState(personaId) {
    try {
      // 获取最近的消息
      const recentMessages = await this.storage.getAllByIndex('messages', 'personaId', personaId);
      const lastMessages = recentMessages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, this.config.contextRecoveryDepth);
      
      // 分析对话流程
      const conversationFlow = this._analyzeConversationFlow(lastMessages);
      
      // 提取话题历史
      const topicHistory = this._extractTopicHistory(lastMessages);
      
      return {
        lastMessages: lastMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content.length > 200 ? msg.content.substring(0, 200) + '...' : msg.content,
          timestamp: msg.timestamp,
          importance: msg.metadata?.importance || 0.5
        })),
        conversationFlow,
        topicHistory,
        collectedAt: new Date()
      };
    } catch (error) {
      console.error('收集对话状态失败:', error);
      return {};
    }
  }

  /**
   * 分析对话流程
   */
  _analyzeConversationFlow(messages) {
    if (messages.length === 0) return {};
    
    const flow = {
      totalMessages: messages.length,
      userMessages: messages.filter(m => m.role === 'user').length,
      assistantMessages: messages.filter(m => m.role === 'assistant').length,
      averageLength: 0,
      lastTopic: null,
      conversationTrend: 'neutral'
    };
    
    // 计算平均长度
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    flow.averageLength = Math.round(totalLength / messages.length);
    
    // 分析最后话题
    if (messages.length > 0) {
      const lastMessage = messages[0]; // 已按时间倒序排列
      flow.lastTopic = this._extractMainTopic(lastMessage.content);
    }
    
    // 分析对话趋势
    if (messages.length >= 3) {
      const recentMessages = messages.slice(0, 3);
      const lengths = recentMessages.map(m => m.content.length);
      const avgRecent = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      
      if (avgRecent > flow.averageLength * 1.2) {
        flow.conversationTrend = 'expanding';
      } else if (avgRecent < flow.averageLength * 0.8) {
        flow.conversationTrend = 'contracting';
      }
    }
    
    return flow;
  }

  /**
   * 提取主要话题
   */
  _extractMainTopic(content) {
    // 简单的话题提取（实际项目中可以使用更复杂的NLP算法）
    const keywords = content
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length >= 2)
      .slice(0, 5);
    
    return keywords.join(' ');
  }

  /**
   * 提取话题历史
   */
  _extractTopicHistory(messages) {
    const topics = [];
    const topicCounts = {};
    
    messages.forEach(message => {
      const topic = this._extractMainTopic(message.content);
      if (topic) {
        topics.push({
          topic,
          timestamp: message.timestamp,
          role: message.role
        });
        
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    });
    
    // 按频率排序的热门话题
    const popularTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));
    
    return {
      chronological: topics.slice(0, 10),
      popular: popularTopics
    };
  }  /
**
   * 收集人格状态
   */
  async _collectPersonaState(personaId) {
    try {
      const personaHistory = this.sessionStates.get(this.stateTypes.PERSONA) || {};
      
      return {
        currentPersonaId: personaId,
        personaHistory: personaHistory.personaHistory || [],
        switchCount: personaHistory.switchCount || 0,
        collectedAt: new Date()
      };
    } catch (error) {
      console.error('收集人格状态失败:', error);
      return {};
    }
  }

  /**
   * 收集上下文状态
   */
  async _collectContextState(personaId) {
    try {
      // 生成上下文摘要
      const contextSummary = await this.contextManager.generateConversationSummary(personaId);
      
      // 获取重要上下文
      const importantContext = await this.contextManager.getImportantMessages(personaId, 10);
      
      // 提取上下文关键词
      const contextKeywords = this._extractContextKeywords(importantContext);
      
      return {
        contextSummary,
        importantContext: importantContext.map(ctx => ({
          id: ctx.id,
          content: ctx.content.substring(0, 150),
          importance: ctx.metadata?.importance || 0.5,
          timestamp: ctx.timestamp
        })),
        contextKeywords,
        collectedAt: new Date()
      };
    } catch (error) {
      console.error('收集上下文状态失败:', error);
      return {};
    }
  }

  /**
   * 收集记忆状态
   */
  async _collectMemoryState(personaId) {
    try {
      // 获取记忆快照
      const memorySnapshot = await this.memoryManager.generateConversationSummary(personaId);
      
      // 获取重要记忆
      const importantMemories = await this.memoryManager.getMemoryEntries(personaId, {
        minImportance: 0.7,
        limit: this.config.memoryRecoveryLimit
      });
      
      // 提取记忆关键词
      const memoryKeywords = this._extractMemoryKeywords(importantMemories);
      
      return {
        memorySnapshot,
        importantMemories: importantMemories.map(mem => ({
          id: mem.id,
          type: mem.type,
          summary: mem.summary,
          importance: mem.importance,
          timestamp: mem.timestamp,
          keywords: mem.keywords.slice(0, 5)
        })),
        memoryKeywords,
        collectedAt: new Date()
      };
    } catch (error) {
      console.error('收集记忆状态失败:', error);
      return {};
    }
  }

  /**
   * 收集情感状态
   */
  async _collectEmotionalState(personaId) {
    try {
      // 获取情感记忆
      const emotionalMemories = await this.memoryManager.getMemoryEntries(personaId, {
        type: this.memoryManager.memoryTypes.EMOTIONAL,
        limit: 20
      });
      
      // 分析情感档案
      const emotionalProfile = this._analyzeEmotionalProfile(emotionalMemories);
      
      // 获取情绪历史
      const moodHistory = this._extractMoodHistory(emotionalMemories);
      
      // 分析情感趋势
      const emotionalTrends = this._analyzeEmotionalTrends(emotionalMemories);
      
      return {
        emotionalProfile,
        moodHistory,
        emotionalTrends,
        collectedAt: new Date()
      };
    } catch (error) {
      console.error('收集情感状态失败:', error);
      return {};
    }
  }

  /**
   * 收集偏好状态
   */
  async _collectPreferenceState(personaId) {
    try {
      // 获取偏好记忆
      const preferenceMemories = await this.memoryManager.getMemoryEntries(personaId, {
        type: this.memoryManager.memoryTypes.PREFERENCE,
        limit: 30
      });
      
      // 整合偏好信息
      const preferences = this._consolidatePreferences(preferenceMemories);
      
      // 获取偏好历史
      const preferenceHistory = this._extractPreferenceHistory(preferenceMemories);
      
      // 计算偏好强度
      const preferenceStrength = this._calculatePreferenceStrength(preferenceMemories);
      
      return {
        preferences,
        preferenceHistory,
        preferenceStrength,
        collectedAt: new Date()
      };
    } catch (error) {
      console.error('收集偏好状态失败:', error);
      return {};
    }
  }

  /**
   * 提取上下文关键词
   */
  _extractContextKeywords(contextMessages) {
    const keywords = new Set();
    
    contextMessages.forEach(message => {
      if (message.content) {
        const words = message.content
          .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length >= 2);
        
        words.forEach(word => keywords.add(word));
      }
    });
    
    return Array.from(keywords).slice(0, 20);
  }

  /**
   * 提取记忆关键词
   */
  _extractMemoryKeywords(memories) {
    const keywordCounts = {};
    
    memories.forEach(memory => {
      memory.keywords.forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + memory.importance;
      });
    });
    
    return Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([keyword, score]) => ({ keyword, score }));
  }

  /**
   * 分析情感档案
   */
  _analyzeEmotionalProfile(emotionalMemories) {
    if (emotionalMemories.length === 0) {
      return { overall: 'neutral', dominant: [], patterns: [] };
    }
    
    const emotionCounts = { positive: 0, negative: 0, neutral: 0 };
    const emotionKeywords = {};
    
    emotionalMemories.forEach(memory => {
      if (memory.metadata && memory.metadata.emotions) {
        const emotions = memory.metadata.emotions;
        
        emotionCounts.positive += emotions.positive || 0;
        emotionCounts.negative += emotions.negative || 0;
        emotionCounts.neutral += emotions.neutral || 0;
        
        emotions.keywords.forEach(keyword => {
          const key = `${keyword.type}_${keyword.word}`;
          emotionKeywords[key] = (emotionKeywords[key] || 0) + 1;
        });
      }
    });
    
    const total = emotionCounts.positive + emotionCounts.negative + emotionCounts.neutral;
    const overall = total > 0 ? 
      (emotionCounts.positive > emotionCounts.negative ? 'positive' : 
       emotionCounts.negative > emotionCounts.positive ? 'negative' : 'neutral') : 'neutral';
    
    const dominant = Object.entries(emotionKeywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion, count]) => ({ emotion, count }));
    
    return {
      overall,
      distribution: {
        positive: total > 0 ? emotionCounts.positive / total : 0,
        negative: total > 0 ? emotionCounts.negative / total : 0,
        neutral: total > 0 ? emotionCounts.neutral / total : 0
      },
      dominant,
      patterns: this._identifyEmotionalPatterns(emotionalMemories)
    };
  }

  /**
   * 识别情感模式
   */
  _identifyEmotionalPatterns(emotionalMemories) {
    const patterns = [];
    
    // 按时间排序
    const sortedMemories = emotionalMemories.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // 分析情感变化趋势
    if (sortedMemories.length >= 3) {
      const recent = sortedMemories.slice(-3);
      const emotions = recent.map(m => m.metadata?.emotions?.overall || 'neutral');
      
      if (emotions.every(e => e === 'positive')) {
        patterns.push('持续积极');
      } else if (emotions.every(e => e === 'negative')) {
        patterns.push('持续消极');
      } else if (emotions[0] !== emotions[emotions.length - 1]) {
        patterns.push('情感波动');
      }
    }
    
    return patterns;
  }

  /**
   * 提取情绪历史
   */
  _extractMoodHistory(emotionalMemories) {
    return emotionalMemories
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(memory => ({
        timestamp: memory.timestamp,
        mood: memory.metadata?.emotions?.overall || 'neutral',
        intensity: memory.metadata?.emotions?.intensity || 0,
        keywords: memory.metadata?.emotions?.keywords?.slice(0, 3) || []
      }));
  }

  /**
   * 分析情感趋势
   */
  _analyzeEmotionalTrends(emotionalMemories) {
    const trends = {
      recent: 'stable',
      weekly: 'stable',
      overall: 'neutral'
    };
    
    if (emotionalMemories.length < 2) {
      return trends;
    }
    
    // 分析最近趋势（最近3条记录）
    const recentMemories = emotionalMemories
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 3);
    
    if (recentMemories.length >= 2) {
      const recentScores = recentMemories.map(m => {
        const emotions = m.metadata?.emotions;
        if (!emotions) return 0;
        return (emotions.positive || 0) - (emotions.negative || 0);
      });
      
      const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      
      if (avgRecent > 0.2) trends.recent = 'improving';
      else if (avgRecent < -0.2) trends.recent = 'declining';
    }
    
    return trends;
  }

  /**
   * 整合偏好信息
   */
  _consolidatePreferences(preferenceMemories) {
    const consolidated = {
      likes: {},
      dislikes: {},
      habits: {},
      opinions: {}
    };
    
    preferenceMemories.forEach(memory => {
      if (memory.metadata && memory.metadata.preferences) {
        const prefs = memory.metadata.preferences;
        
        // 整合喜好
        prefs.likes?.forEach(like => {
          consolidated.likes[like] = (consolidated.likes[like] || 0) + memory.importance;
        });
        
        // 整合不喜欢的
        prefs.dislikes?.forEach(dislike => {
          consolidated.dislikes[dislike] = (consolidated.dislikes[dislike] || 0) + memory.importance;
        });
        
        // 整合习惯
        prefs.habits?.forEach(habit => {
          consolidated.habits[habit] = (consolidated.habits[habit] || 0) + memory.importance;
        });
        
        // 整合观点
        prefs.opinions?.forEach(opinion => {
          consolidated.opinions[opinion] = (consolidated.opinions[opinion] || 0) + memory.importance;
        });
      }
    });
    
    // 转换为排序数组
    Object.keys(consolidated).forEach(key => {
      consolidated[key] = Object.entries(consolidated[key])
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([item, score]) => ({ item, score }));
    });
    
    return consolidated;
  }

  /**
   * 提取偏好历史
   */
  _extractPreferenceHistory(preferenceMemories) {
    return preferenceMemories
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 15)
      .map(memory => ({
        timestamp: memory.timestamp,
        preferences: memory.metadata?.preferences || {},
        importance: memory.importance
      }));
  }

  /**
   * 计算偏好强度
   */
  _calculatePreferenceStrength(preferenceMemories) {
    const strength = {};
    
    preferenceMemories.forEach(memory => {
      if (memory.metadata && memory.metadata.preferences) {
        const prefs = memory.metadata.preferences;
        
        ['likes', 'dislikes', 'habits', 'opinions'].forEach(category => {
          if (prefs[category]) {
            prefs[category].forEach(item => {
              const key = `${category}_${item}`;
              strength[key] = (strength[key] || 0) + memory.importance;
            });
          }
        });
      }
    });
    
    return strength;
  }

  /**
   * 处理人格切换
   */
  async handlePersonaSwitch(fromPersonaId, toPersonaId) {
    try {
      // 保存当前人格的状态
      if (fromPersonaId) {
        await this.saveCurrentSessionState(fromPersonaId);
      }
      
      // 记录人格切换
      await this._recordPersonaSwitch(fromPersonaId, toPersonaId);
      
      // 恢复目标人格的状态
      await this._restorePersonaContext(toPersonaId);
      
      // 建立连续性桥梁
      await this._buildContinuityBridge(fromPersonaId, toPersonaId);
      
      console.log(`人格切换完成: ${fromPersonaId} -> ${toPersonaId}`);
      return true;
    } catch (error) {
      console.error('处理人格切换失败:', error);
      return false;
    }
  }

  /**
   * 记录人格切换
   */
  async _recordPersonaSwitch(fromPersonaId, toPersonaId) {
    const switchRecord = {
      id: `switch_${AIChat.Utils.generateId()}`,
      fromPersonaId,
      toPersonaId,
      timestamp: new Date(),
      sessionId: this.currentSession?.id,
      metadata: {
        reason: 'user_initiated',
        context: await this._captureTransitionContext(fromPersonaId)
      }
    };
    
    await this.storage.put('persona_switches', switchRecord);
    
    // 更新会话中的人格历史
    const personaState = this.sessionStates.get(this.stateTypes.PERSONA) || {};
    personaState.personaHistory = personaState.personaHistory || [];
    personaState.personaHistory.push(switchRecord);
    personaState.switchCount = (personaState.switchCount || 0) + 1;
    
    this.sessionStates.set(this.stateTypes.PERSONA, personaState);
  }

  /**
   * 捕获转换上下文
   */
  async _captureTransitionContext(personaId) {
    if (!personaId) return {};
    
    try {
      // 获取最近的对话
      const recentMessages = await this.storage.getAllByIndex('messages', 'personaId', personaId);
      const lastMessages = recentMessages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
      
      // 获取当前话题
      const currentTopic = lastMessages.length > 0 ? 
        this._extractMainTopic(lastMessages[0].content) : null;
      
      return {
        lastMessages: lastMessages.map(msg => ({
          role: msg.role,
          content: msg.content.substring(0, 100),
          timestamp: msg.timestamp
        })),
        currentTopic,
        messageCount: recentMessages.length
      };
    } catch (error) {
      console.error('捕获转换上下文失败:', error);
      return {};
    }
  }

  /**
   * 恢复人格上下文
   */
  async _restorePersonaContext(personaId) {
    try {
      // 获取该人格的最近会话
      const personaSessions = await this.storage.getAllByIndex('sessions', 'personaId', personaId);
      
      if (personaSessions.length > 0) {
        // 找到最近的会话
        const recentSession = personaSessions
          .sort((a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt))[0];
        
        // 恢复部分状态（不完全覆盖当前会话）
        await this._partialStateRestore(recentSession, personaId);
      }
      
      // 加载人格特定的记忆摘要
      await this._loadPersonaMemorySummary(personaId);
      
    } catch (error) {
      console.error('恢复人格上下文失败:', error);
    }
  }

  /**
   * 部分状态恢复
   */
  async _partialStateRestore(session, personaId) {
    if (!session.states) return;
    
    // 只恢复记忆和偏好状态，保持对话连续性
    if (session.states[this.stateTypes.MEMORY]) {
      await this._restoreMemoryState(session.states[this.stateTypes.MEMORY]);
    }
    
    if (session.states[this.stateTypes.PREFERENCE]) {
      await this._restorePreferenceState(session.states[this.stateTypes.PREFERENCE]);
    }
    
    if (session.states[this.stateTypes.EMOTIONAL]) {
      await this._restoreEmotionalState(session.states[this.stateTypes.EMOTIONAL]);
    }
  }

  /**
   * 加载人格记忆摘要
   */
  async _loadPersonaMemorySummary(personaId) {
    try {
      const memorySummary = await this.memoryManager.generateConversationSummary(personaId);
      
      if (memorySummary) {
        // 将记忆摘要添加到当前上下文
        this.sessionStates.set('persona_memory_summary', {
          personaId,
          summary: memorySummary,
          loadedAt: new Date()
        });
      }
    } catch (error) {
      console.error('加载人格记忆摘要失败:', error);
    }
  }

  /**
   * 建立连续性桥梁
   */
  async _buildContinuityBridge(fromPersonaId, toPersonaId) {
    try {
      if (!fromPersonaId || !toPersonaId) return;
      
      // 查找共同话题和记忆
      const commonElements = await this._findCommonElements(fromPersonaId, toPersonaId);
      
      // 创建连续性提示
      const continuityPrompt = this._generateContinuityPrompt(commonElements);
      
      // 保存连续性信息
      this.sessionStates.set('continuity_bridge', {
        fromPersonaId,
        toPersonaId,
        commonElements,
        continuityPrompt,
        createdAt: new Date()
      });
      
    } catch (error) {
      console.error('建立连续性桥梁失败:', error);
    }
  }

  /**
   * 查找共同元素
   */
  async _findCommonElements(fromPersonaId, toPersonaId) {
    try {
      // 获取两个人格的记忆
      const fromMemories = await this.memoryManager.getMemoryEntries(fromPersonaId, { limit: 100 });
      const toMemories = await this.memoryManager.getMemoryEntries(toPersonaId, { limit: 100 });
      
      // 查找共同关键词
      const fromKeywords = new Set();
      const toKeywords = new Set();
      
      fromMemories.forEach(memory => {
        memory.keywords.forEach(keyword => fromKeywords.add(keyword));
      });
      
      toMemories.forEach(memory => {
        memory.keywords.forEach(keyword => toKeywords.add(keyword));
      });
      
      const commonKeywords = Array.from(fromKeywords).filter(keyword => 
        toKeywords.has(keyword)
      );
      
      // 查找共同话题
      const commonTopics = this._findCommonTopics(fromMemories, toMemories);
      
      return {
        keywords: commonKeywords.slice(0, 10),
        topics: commonTopics.slice(0, 5),
        memoryOverlap: this._calculateMemoryOverlap(fromMemories, toMemories)
      };
    } catch (error) {
      console.error('查找共同元素失败:', error);
      return { keywords: [], topics: [], memoryOverlap: 0 };
    }
  }

  /**
   * 查找共同话题
   */
  _findCommonTopics(fromMemories, toMemories) {
    const fromTopics = this._extractTopicsFromMemories(fromMemories);
    const toTopics = this._extractTopicsFromMemories(toMemories);
    
    return fromTopics.filter(topic => 
      toTopics.some(t => t.topic === topic.topic)
    );
  }

  /**
   * 从记忆中提取话题
   */
  _extractTopicsFromMemories(memories) {
    const topicCounts = {};
    
    memories.forEach(memory => {
      const topic = this._extractMainTopic(memory.content || memory.summary);
      if (topic) {
        topicCounts[topic] = (topicCounts[topic] || 0) + memory.importance;
      }
    });
    
    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, score]) => ({ topic, score }));
  }

  /**
   * 计算记忆重叠度
   */
  _calculateMemoryOverlap(fromMemories, toMemories) {
    if (fromMemories.length === 0 || toMemories.length === 0) {
      return 0;
    }
    
    let overlapCount = 0;
    const totalComparisons = Math.min(fromMemories.length, toMemories.length);
    
    fromMemories.slice(0, totalComparisons).forEach(fromMemory => {
      const hasOverlap = toMemories.some(toMemory => 
        this._calculateMemorySimilarity(fromMemory, toMemory) > 0.5
      );
      
      if (hasOverlap) {
        overlapCount++;
      }
    });
    
    return overlapCount / totalComparisons;
  }

  /**
   * 计算记忆相似性
   */
  _calculateMemorySimilarity(memory1, memory2) {
    // 比较关键词重叠
    const keywords1 = new Set(memory1.keywords);
    const keywords2 = new Set(memory2.keywords);
    
    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 生成连续性提示
   */
  _generateContinuityPrompt(commonElements) {
    const prompts = [];
    
    if (commonElements.keywords.length > 0) {
      prompts.push(`共同关键词: ${commonElements.keywords.slice(0, 5).join('、')}`);
    }
    
    if (commonElements.topics.length > 0) {
      prompts.push(`共同话题: ${commonElements.topics.map(t => t.topic).slice(0, 3).join('、')}`);
    }
    
    if (commonElements.memoryOverlap > 0.3) {
      prompts.push(`记忆重叠度: ${Math.round(commonElements.memoryOverlap * 100)}%`);
    }
    
    return prompts.join('；');
  }

  /**
   * 获取连续性上下文
   */
  getContinuityContext() {
    const continuityBridge = this.sessionStates.get('continuity_bridge');
    const personaMemorySummary = this.sessionStates.get('persona_memory_summary');
    
    return {
      bridge: continuityBridge,
      memorySummary: personaMemorySummary,
      sessionStates: Object.fromEntries(this.sessionStates)
    };
  }

  /**
   * 设置自动保存
   */
  _setupAutoSave() {
    // 每5分钟自动保存一次会话状态
    setInterval(async () => {
      if (this.currentSession && this.currentSession.personaId) {
        await this.saveCurrentSessionState(this.currentSession.personaId);
      }
    }, 5 * 60 * 1000);
    
    // 页面关闭时保存状态
    window.addEventListener('beforeunload', async () => {
      if (this.currentSession && this.currentSession.personaId) {
        await this.saveCurrentSessionState(this.currentSession.personaId);
      }
    });
  }

  /**
   * 更新会话活跃时间
   */
  async _updateSessionActivity() {
    if (this.currentSession) {
      this.currentSession.lastActiveAt = new Date();
      await this.storage.put('sessions', this.currentSession);
    }
  }

  /**
   * 获取会话统计
   */
  async getSessionStats() {
    try {
      const allSessions = await this.storage.getAll('sessions');
      
      const stats = {
        totalSessions: allSessions.length,
        activeSessions: 0,
        averageSessionLength: 0,
        totalMessages: 0,
        personaUsage: {},
        sessionDuration: {
          short: 0,  // < 10分钟
          medium: 0, // 10分钟 - 1小时
          long: 0    // > 1小时
        }
      };
      
      const now = Date.now();
      let totalDuration = 0;
      
      allSessions.forEach(session => {
        const createdAt = new Date(session.createdAt).getTime();
        const lastActiveAt = new Date(session.lastActiveAt).getTime();
        const duration = lastActiveAt - createdAt;
        
        totalDuration += duration;
        stats.totalMessages += session.messageCount || 0;
        
        // 统计活跃会话（24小时内）
        if (now - lastActiveAt < 24 * 60 * 60 * 1000) {
          stats.activeSessions++;
        }
        
        // 统计人格使用
        if (session.personaId) {
          stats.personaUsage[session.personaId] = 
            (stats.personaUsage[session.personaId] || 0) + 1;
        }
        
        // 统计会话时长分布
        const durationMinutes = duration / (1000 * 60);
        if (durationMinutes < 10) {
          stats.sessionDuration.short++;
        } else if (durationMinutes < 60) {
          stats.sessionDuration.medium++;
        } else {
          stats.sessionDuration.long++;
        }
      });
      
      stats.averageSessionLength = allSessions.length > 0 ? 
        Math.round(totalDuration / allSessions.length / (1000 * 60)) : 0;
      
      return stats;
    } catch (error) {
      console.error('获取会话统计失败:', error);
      return null;
    }
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions() {
    try {
      const allSessions = await this.storage.getAll('sessions');
      const cutoffTime = Date.now() - (this.config.sessionTimeoutHours * 24 * 60 * 60 * 1000);
      
      let deletedCount = 0;
      
      for (const session of allSessions) {
        const lastActiveAt = new Date(session.lastActiveAt).getTime();
        
        if (lastActiveAt < cutoffTime) {
          await this.storage.delete('sessions', session.id);
          deletedCount++;
        }
      }
      
      console.log(`清理过期会话完成: ${deletedCount} 个`);
      return deletedCount;
    } catch (error) {
      console.error('清理过期会话失败:', error);
      return 0;
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      sessionCache: this.sessionCache.size,
      stateCache: this.stateCache.size,
      continuityCache: this.continuityCache.size,
      sessionStates: this.sessionStates.size,
      config: this.config
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('会话连续性管理器配置已更新:', this.config);
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    this.sessionCache.clear();
    this.stateCache.clear();
    this.continuityCache.clear();
    this.sessionStates.clear();
    console.log('会话连续性管理器缓存已清空');
  }
}

// 导出会话连续性管理器
window.AIChat = window.AIChat || {};
window.AIChat.SessionContinuityManager = SessionContinuityManager;

console.log('会话连续性管理器已加载');