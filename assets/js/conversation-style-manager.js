/**
 * 对话风格管理器
 * 负责维护人格对话风格的一致性，实现风格模仿对话的有效应用
 */

class ConversationStyleManager {
  constructor(personaManager, contextManager) {
    this.personaManager = personaManager;
    this.contextManager = contextManager;
    
    // 风格一致性配置
    this.config = {
      styleCheckWindow: 5,           // 风格检查窗口（最近N条消息）
      consistencyThreshold: 0.7,     // 一致性阈值
      styleAdjustmentStrength: 0.8,  // 风格调整强度
      moodDialogWeight: 1.5,         // 风格模仿对话权重
      beginDialogWeight: 1.0,        // 预设对话权重
      maxStylePromptLength: 500      // 最大风格提示长度
    };
    
    // 风格特征提取器
    this.styleFeatures = {
      // 语言风格特征
      linguistic: {
        formalityLevel: 0,      // 正式程度 (-1到1)
        emotionalTone: 0,       // 情感色调 (-1到1)
        verbosity: 0,           // 冗长程度 (0到1)
        questionFrequency: 0,   // 问题频率 (0到1)
        exclamationUsage: 0     // 感叹号使用频率 (0到1)
      },
      // 对话模式特征
      conversational: {
        initiativeLevel: 0,     // 主动性 (0到1)
        empathyLevel: 0,        // 共情程度 (0到1)
        humorUsage: 0,          // 幽默使用 (0到1)
        supportiveness: 0,      // 支持性 (0到1)
        curiosity: 0            // 好奇心 (0到1)
      },
      // 个性特征
      personality: {
        friendliness: 0,        // 友好程度 (0到1)
        confidence: 0,          // 自信程度 (0到1)
        patience: 0,            // 耐心程度 (0到1)
        creativity: 0,          // 创造性 (0到1)
        directness: 0           // 直接性 (0到1)
      }
    };
    
    // 风格缓存
    this.styleCache = new Map();
    this.consistencyCache = new Map();
    
    // 风格关键词库
    this.styleKeywords = {
      formal: ['您', '请问', '非常', '十分', '相当', '颇为', '敬请', '恳请'],
      informal: ['你', '咋', '啥', '嘛', '呢', '吧', '哈哈', '嘿嘿'],
      emotional: ['感动', '激动', '兴奋', '难过', '开心', '担心', '害怕', '惊讶'],
      supportive: ['理解', '支持', '鼓励', '加油', '没关系', '别担心', '会好的'],
      questioning: ['为什么', '怎么', '什么', '哪里', '什么时候', '如何', '是否'],
      humorous: ['哈哈', '呵呵', '嘿嘿', '有趣', '好玩', '搞笑', '逗乐'],
      confident: ['肯定', '确定', '绝对', '一定', '必须', '当然', '显然'],
      creative: ['想象', '创意', '灵感', '独特', '新颖', '有趣', '别出心裁']
    };
  }

  /**
   * 分析人格的风格特征
   */
  async analyzePersonaStyle(persona) {
    try {
      const cacheKey = `style_${persona.id}_${persona.updatedAt}`;
      
      // 检查缓存
      if (this.styleCache.has(cacheKey)) {
        return this.styleCache.get(cacheKey);
      }

      const styleProfile = {
        personaId: persona.id,
        baseStyle: this._extractStyleFromPrompt(persona.prompt),
        moodStyle: this._extractStyleFromDialogs(persona.moodImitationDialogs || []),
        beginStyle: this._extractStyleFromDialogs(persona.beginDialogs || []),
        combinedStyle: null,
        lastAnalyzed: new Date()
      };

      // 合并风格特征
      styleProfile.combinedStyle = this._combineStyleFeatures(
        styleProfile.baseStyle,
        styleProfile.moodStyle,
        styleProfile.beginStyle
      );

      // 缓存结果
      this.styleCache.set(cacheKey, styleProfile);
      
      console.log(`人格风格分析完成: ${persona.name}`, styleProfile.combinedStyle);
      return styleProfile;
    } catch (error) {
      console.error('分析人格风格失败:', error);
      return this._getDefaultStyleProfile(persona.id);
    }
  }

  /**
   * 从系统提示词中提取风格特征
   */
  _extractStyleFromPrompt(prompt) {
    const features = JSON.parse(JSON.stringify(this.styleFeatures)); // 深拷贝
    const content = prompt.toLowerCase();
    
    // 分析正式程度
    const formalWords = this.styleKeywords.formal.filter(word => content.includes(word)).length;
    const informalWords = this.styleKeywords.informal.filter(word => content.includes(word)).length;
    features.linguistic.formalityLevel = (formalWords - informalWords) / Math.max(formalWords + informalWords, 1);
    
    // 分析情感色调
    const emotionalWords = this.styleKeywords.emotional.filter(word => content.includes(word)).length;
    features.linguistic.emotionalTone = Math.min(emotionalWords / 10, 1);
    
    // 分析冗长程度
    features.linguistic.verbosity = Math.min(prompt.length / 1000, 1);
    
    // 分析支持性
    const supportiveWords = this.styleKeywords.supportive.filter(word => content.includes(word)).length;
    features.conversational.supportiveness = Math.min(supportiveWords / 5, 1);
    
    // 分析自信程度
    const confidentWords = this.styleKeywords.confident.filter(word => content.includes(word)).length;
    features.personality.confidence = Math.min(confidentWords / 5, 1);
    
    // 分析创造性
    const creativeWords = this.styleKeywords.creative.filter(word => content.includes(word)).length;
    features.personality.creativity = Math.min(creativeWords / 5, 1);
    
    return features;
  }

  /**
   * 从对话中提取风格特征
   */
  _extractStyleFromDialogs(dialogs) {
    const features = JSON.parse(JSON.stringify(this.styleFeatures)); // 深拷贝
    
    if (!dialogs || dialogs.length === 0) {
      return features;
    }

    let totalContent = '';
    let assistantMessages = 0;
    let questionCount = 0;
    let exclamationCount = 0;
    
    dialogs.forEach(dialog => {
      if (dialog.role === 'assistant') {
        const content = dialog.content.toLowerCase();
        totalContent += content + ' ';
        assistantMessages++;
        
        // 统计问号和感叹号
        questionCount += (content.match(/[？?]/g) || []).length;
        exclamationCount += (content.match(/[！!]/g) || []).length;
      }
    });

    if (assistantMessages === 0) {
      return features;
    }

    // 分析各种风格特征
    this._analyzeStyleFeatures(features, totalContent, assistantMessages, questionCount, exclamationCount);
    
    return features;
  }

  /**
   * 分析风格特征的详细实现
   */
  _analyzeStyleFeatures(features, content, messageCount, questionCount, exclamationCount) {
    // 正式程度分析
    const formalWords = this.styleKeywords.formal.filter(word => content.includes(word)).length;
    const informalWords = this.styleKeywords.informal.filter(word => content.includes(word)).length;
    features.linguistic.formalityLevel = (formalWords - informalWords) / Math.max(formalWords + informalWords, 1);
    
    // 情感色调分析
    const emotionalWords = this.styleKeywords.emotional.filter(word => content.includes(word)).length;
    features.linguistic.emotionalTone = Math.min(emotionalWords / (messageCount * 2), 1);
    
    // 冗长程度分析
    features.linguistic.verbosity = Math.min(content.length / (messageCount * 100), 1);
    
    // 问题频率分析
    features.linguistic.questionFrequency = Math.min(questionCount / messageCount, 1);
    
    // 感叹号使用频率
    features.linguistic.exclamationUsage = Math.min(exclamationCount / messageCount, 1);
    
    // 支持性分析
    const supportiveWords = this.styleKeywords.supportive.filter(word => content.includes(word)).length;
    features.conversational.supportiveness = Math.min(supportiveWords / messageCount, 1);
    
    // 幽默使用分析
    const humorWords = this.styleKeywords.humorous.filter(word => content.includes(word)).length;
    features.conversational.humorUsage = Math.min(humorWords / messageCount, 1);
    
    // 好奇心分析
    const questionWords = this.styleKeywords.questioning.filter(word => content.includes(word)).length;
    features.conversational.curiosity = Math.min(questionWords / messageCount, 1);
    
    // 友好程度分析（基于情感词汇和支持性词汇）
    features.personality.friendliness = Math.min(
      (features.conversational.supportiveness + features.linguistic.emotionalTone) / 2, 1
    );
    
    // 自信程度分析
    const confidentWords = this.styleKeywords.confident.filter(word => content.includes(word)).length;
    features.personality.confidence = Math.min(confidentWords / messageCount, 1);
    
    // 创造性分析
    const creativeWords = this.styleKeywords.creative.filter(word => content.includes(word)).length;
    features.personality.creativity = Math.min(creativeWords / messageCount, 1);
    
    // 直接性分析（基于简洁性和自信程度）
    features.personality.directness = Math.min(
      (1 - features.linguistic.verbosity + features.personality.confidence) / 2, 1
    );
  }

  /**
   * 合并多个风格特征
   */
  _combineStyleFeatures(baseStyle, moodStyle, beginStyle) {
    const combined = JSON.parse(JSON.stringify(this.styleFeatures)); // 深拷贝
    
    // 权重配置
    const weights = {
      base: 1.0,
      mood: this.config.moodDialogWeight,
      begin: this.config.beginDialogWeight
    };
    
    const totalWeight = weights.base + weights.mood + weights.begin;
    
    // 合并每个特征类别
    Object.keys(combined).forEach(category => {
      Object.keys(combined[category]).forEach(feature => {
        const baseValue = baseStyle[category][feature] || 0;
        const moodValue = moodStyle[category][feature] || 0;
        const beginValue = beginStyle[category][feature] || 0;
        
        combined[category][feature] = (
          baseValue * weights.base +
          moodValue * weights.mood +
          beginValue * weights.begin
        ) / totalWeight;
      });
    });
    
    return combined;
  }

  /**
   * 检查对话风格一致性
   */
  async checkStyleConsistency(personaId, recentMessages = []) {
    try {
      const cacheKey = `consistency_${personaId}_${recentMessages.length}`;
      
      // 检查缓存
      if (this.consistencyCache.has(cacheKey)) {
        const cached = this.consistencyCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30000) { // 30秒缓存
          return cached.data;
        }
      }

      const persona = this.personaManager.getCurrentPersona();
      if (!persona || persona.id !== personaId) {
        throw new Error('人格不匹配');
      }

      // 分析人格预期风格
      const expectedStyle = await this.analyzePersonaStyle(persona);
      
      // 分析最近消息的实际风格
      const actualStyle = this._analyzeRecentMessagesStyle(recentMessages);
      
      // 计算一致性分数
      const consistencyScore = this._calculateConsistencyScore(
        expectedStyle.combinedStyle,
        actualStyle
      );
      
      // 生成风格调整建议
      const adjustmentSuggestions = this._generateStyleAdjustments(
        expectedStyle.combinedStyle,
        actualStyle,
        consistencyScore
      );
      
      const result = {
        personaId: personaId,
        consistencyScore: consistencyScore,
        expectedStyle: expectedStyle.combinedStyle,
        actualStyle: actualStyle,
        isConsistent: consistencyScore >= this.config.consistencyThreshold,
        adjustmentSuggestions: adjustmentSuggestions,
        checkedAt: new Date()
      };
      
      // 缓存结果
      this.consistencyCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      console.log(`风格一致性检查完成: ${consistencyScore.toFixed(2)}`);
      return result;
    } catch (error) {
      console.error('检查风格一致性失败:', error);
      return {
        personaId: personaId,
        consistencyScore: 0.5,
        isConsistent: false,
        error: error.message
      };
    }
  }

  /**
   * 分析最近消息的风格
   */
  _analyzeRecentMessagesStyle(messages) {
    const features = JSON.parse(JSON.stringify(this.styleFeatures)); // 深拷贝
    
    if (!messages || messages.length === 0) {
      return features;
    }

    // 只分析AI的回复
    const aiMessages = messages.filter(msg => msg.role === 'assistant');
    
    if (aiMessages.length === 0) {
      return features;
    }

    let totalContent = '';
    let questionCount = 0;
    let exclamationCount = 0;
    
    aiMessages.forEach(message => {
      const content = message.content.toLowerCase();
      totalContent += content + ' ';
      
      questionCount += (content.match(/[？?]/g) || []).length;
      exclamationCount += (content.match(/[！!]/g) || []).length;
    });

    // 分析风格特征
    this._analyzeStyleFeatures(features, totalContent, aiMessages.length, questionCount, exclamationCount);
    
    return features;
  }

  /**
   * 计算风格一致性分数
   */
  _calculateConsistencyScore(expectedStyle, actualStyle) {
    let totalScore = 0;
    let featureCount = 0;
    
    Object.keys(expectedStyle).forEach(category => {
      Object.keys(expectedStyle[category]).forEach(feature => {
        const expected = expectedStyle[category][feature];
        const actual = actualStyle[category][feature];
        
        // 计算特征相似度（使用余弦相似度的简化版本）
        const similarity = 1 - Math.abs(expected - actual);
        totalScore += similarity;
        featureCount++;
      });
    });
    
    return featureCount > 0 ? totalScore / featureCount : 0;
  }

  /**
   * 生成风格调整建议
   */
  _generateStyleAdjustments(expectedStyle, actualStyle, consistencyScore) {
    const adjustments = [];
    
    if (consistencyScore >= this.config.consistencyThreshold) {
      return adjustments; // 风格已经一致，无需调整
    }

    // 分析各个特征的偏差
    Object.keys(expectedStyle).forEach(category => {
      Object.keys(expectedStyle[category]).forEach(feature => {
        const expected = expectedStyle[category][feature];
        const actual = actualStyle[category][feature];
        const deviation = Math.abs(expected - actual);
        
        if (deviation > 0.3) { // 偏差阈值
          adjustments.push({
            category: category,
            feature: feature,
            expected: expected,
            actual: actual,
            deviation: deviation,
            suggestion: this._getFeatureAdjustmentSuggestion(category, feature, expected, actual)
          });
        }
      });
    });
    
    // 按偏差程度排序
    adjustments.sort((a, b) => b.deviation - a.deviation);
    
    return adjustments.slice(0, 5); // 返回最重要的5个调整建议
  }

  /**
   * 获取特征调整建议
   */
  _getFeatureAdjustmentSuggestion(category, feature, expected, actual) {
    const suggestions = {
      linguistic: {
        formalityLevel: expected > actual ? 
          '使用更正式的语言，如"您"、"请问"等敬语' : 
          '使用更随意的语言，如"你"、"咋样"等口语',
        emotionalTone: expected > actual ? 
          '增加情感表达，使用更多情感词汇' : 
          '减少情感表达，保持相对中性的语调',
        verbosity: expected > actual ? 
          '提供更详细的回答和解释' : 
          '保持回答简洁明了',
        questionFrequency: expected > actual ? 
          '多向用户提问，增加互动性' : 
          '减少提问，更多地提供直接回答',
        exclamationUsage: expected > actual ? 
          '适当使用感叹号表达情感' : 
          '减少感叹号的使用，保持语调平稳'
      },
      conversational: {
        supportiveness: expected > actual ? 
          '增加支持性语言，如"理解"、"支持"、"鼓励"' : 
          '减少过度的支持性表达',
        humorUsage: expected > actual ? 
          '适当加入幽默元素，使对话更轻松' : 
          '保持严肃的对话风格',
        curiosity: expected > actual ? 
          '表现出更多好奇心，主动询问细节' : 
          '减少过度的好奇心表达'
      },
      personality: {
        friendliness: expected > actual ? 
          '使用更友好的语言和表达方式' : 
          '保持适度的距离感',
        confidence: expected > actual ? 
          '使用更肯定的语言，如"确定"、"肯定"' : 
          '使用更谦逊的表达方式',
        creativity: expected > actual ? 
          '提供更有创意和独特的回答' : 
          '保持传统和常规的回答方式'
      }
    };
    
    return suggestions[category]?.[feature] || '调整此特征以匹配人格风格';
  }

  /**
   * 生成风格增强提示词
   */
  generateStyleEnhancementPrompt(personaId, consistencyCheck = null) {
    try {
      const persona = this.personaManager.getCurrentPersona();
      if (!persona || persona.id !== personaId) {
        return '';
      }

      let enhancementPrompt = '';
      
      // 如果有一致性检查结果，基于调整建议生成提示
      if (consistencyCheck && !consistencyCheck.isConsistent) {
        const adjustments = consistencyCheck.adjustmentSuggestions || [];
        
        if (adjustments.length > 0) {
          enhancementPrompt += '请注意保持以下对话风格特征：\n';
          
          adjustments.slice(0, 3).forEach(adj => {
            enhancementPrompt += `- ${adj.suggestion}\n`;
          });
          
          enhancementPrompt += '\n';
        }
      }
      
      // 基于风格模仿对话生成提示
      if (persona.moodImitationDialogs && persona.moodImitationDialogs.length > 0) {
        enhancementPrompt += '请参考以下对话风格进行回复：\n';
        
        // 选择最具代表性的对话对
        const representativeDialogs = this._selectRepresentativeDialogs(persona.moodImitationDialogs);
        
        representativeDialogs.forEach((dialog, index) => {
          if (dialog.role === 'assistant') {
            enhancementPrompt += `风格示例${index + 1}: ${dialog.content}\n`;
          }
        });
        
        enhancementPrompt += '\n';
      }
      
      // 限制提示词长度
      if (enhancementPrompt.length > this.config.maxStylePromptLength) {
        enhancementPrompt = enhancementPrompt.substring(0, this.config.maxStylePromptLength - 3) + '...';
      }
      
      return enhancementPrompt;
    } catch (error) {
      console.error('生成风格增强提示词失败:', error);
      return '';
    }
  }

  /**
   * 选择最具代表性的对话
   */
  _selectRepresentativeDialogs(dialogs) {
    if (!dialogs || dialogs.length === 0) {
      return [];
    }

    // 只选择AI的回复
    const aiDialogs = dialogs.filter(dialog => dialog.role === 'assistant');
    
    if (aiDialogs.length <= 3) {
      return aiDialogs;
    }

    // 选择长度适中、包含关键风格特征的对话
    const scoredDialogs = aiDialogs.map(dialog => {
      let score = 0;
      const content = dialog.content.toLowerCase();
      
      // 长度评分（偏好中等长度）
      const length = content.length;
      if (length >= 20 && length <= 100) {
        score += 2;
      } else if (length >= 10 && length <= 150) {
        score += 1;
      }
      
      // 风格特征评分
      Object.values(this.styleKeywords).forEach(keywords => {
        keywords.forEach(keyword => {
          if (content.includes(keyword)) {
            score += 0.5;
          }
        });
      });
      
      return { dialog, score };
    });
    
    // 按分数排序，选择前3个
    scoredDialogs.sort((a, b) => b.score - a.score);
    return scoredDialogs.slice(0, 3).map(item => item.dialog);
  }

  /**
   * 动态调整对话风格
   */
  async adjustConversationStyle(personaId, messageContext) {
    try {
      // 获取最近的消息
      const recentMessages = messageContext.slice(-this.config.styleCheckWindow);
      
      // 检查风格一致性
      const consistencyCheck = await this.checkStyleConsistency(personaId, recentMessages);
      
      if (consistencyCheck.isConsistent) {
        return {
          needsAdjustment: false,
          consistencyScore: consistencyCheck.consistencyScore,
          message: '对话风格保持一致'
        };
      }
      
      // 生成风格调整提示
      const stylePrompt = this.generateStyleEnhancementPrompt(personaId, consistencyCheck);
      
      return {
        needsAdjustment: true,
        consistencyScore: consistencyCheck.consistencyScore,
        adjustmentPrompt: stylePrompt,
        adjustmentSuggestions: consistencyCheck.adjustmentSuggestions,
        message: '检测到风格不一致，已生成调整建议'
      };
    } catch (error) {
      console.error('动态调整对话风格失败:', error);
      return {
        needsAdjustment: false,
        error: error.message
      };
    }
  }

  /**
   * 获取默认风格配置
   */
  _getDefaultStyleProfile(personaId) {
    return {
      personaId: personaId,
      baseStyle: JSON.parse(JSON.stringify(this.styleFeatures)),
      moodStyle: JSON.parse(JSON.stringify(this.styleFeatures)),
      beginStyle: JSON.parse(JSON.stringify(this.styleFeatures)),
      combinedStyle: JSON.parse(JSON.stringify(this.styleFeatures)),
      lastAnalyzed: new Date()
    };
  }

  /**
   * 清除缓存
   */
  clearCache(personaId = null) {
    if (personaId) {
      // 清除特定人格的缓存
      for (const key of this.styleCache.keys()) {
        if (key.includes(personaId)) {
          this.styleCache.delete(key);
        }
      }
      for (const key of this.consistencyCache.keys()) {
        if (key.includes(personaId)) {
          this.consistencyCache.delete(key);
        }
      }
    } else {
      // 清除所有缓存
      this.styleCache.clear();
      this.consistencyCache.clear();
    }
    
    console.log(`风格管理器缓存已清除${personaId ? ` (${personaId})` : ''}`);
  }

  /**
   * 获取风格统计信息
   */
  getStyleStats() {
    return {
      styleCacheSize: this.styleCache.size,
      consistencyCacheSize: this.consistencyCache.size,
      config: this.config,
      keywordCategories: Object.keys(this.styleKeywords).length
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // 清除缓存以应用新配置
    this.clearCache();
    
    console.log('对话风格管理器配置已更新:', this.config);
  }
}

// 导出对话风格管理器
window.AIChat = window.AIChat || {};
window.AIChat.ConversationStyleManager = ConversationStyleManager;

console.log('对话风格管理器已加载');