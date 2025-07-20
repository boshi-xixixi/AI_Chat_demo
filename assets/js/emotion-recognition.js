/**
 * 情感识别和回应管理器
 * 负责识别用户情感状态，生成适当的AI情感回应和共情表达
 */

class EmotionRecognitionManager {
  constructor() {
    // 情感识别配置
    this.config = {
      emotionThreshold: 0.3,        // 情感识别阈值
      contextWindow: 3,             // 情感上下文窗口
      empathyStrength: 0.8,         // 共情强度
      emotionDecayRate: 0.1,        // 情感衰减率
      maxEmotionHistory: 10,        // 最大情感历史记录
      responseVariationCount: 3     // 回应变化数量
    };
    
    // 情感词典
    this.emotionLexicon = {
      // 积极情感
      positive: {
        joy: {
          keywords: ['开心', '高兴', '快乐', '兴奋', '愉快', '欣喜', '喜悦', '满足', '幸福', '乐观'],
          intensity: [0.3, 0.5, 0.7, 0.8, 0.6, 0.7, 0.8, 0.6, 0.9, 0.7],
          responses: [
            '看到你这么开心，我也感到很高兴！',
            '你的快乐真的很有感染力呢！',
            '能分享你的喜悦真是太好了！'
          ]
        },
        excitement: {
          keywords: ['激动', '兴奋', '振奋', '热情', '狂欢', '欢呼', '雀跃', '亢奋'],
          intensity: [0.8, 0.8, 0.7, 0.6, 0.9, 0.8, 0.7, 0.9],
          responses: [
            '你的激动心情我完全能理解！',
            '这种兴奋的感觉真的很棒！',
            '看得出来你真的很激动呢！'
          ]
        },
        gratitude: {
          keywords: ['感谢', '谢谢', '感激', '感恩', '谢了', '多谢', '感谢你'],
          intensity: [0.6, 0.5, 0.7, 0.8, 0.4, 0.5, 0.6],
          responses: [
            '不用客气，能帮到你我很开心！',
            '这是我应该做的，很高兴能帮助你！',
            '你的感谢让我觉得很温暖！'
          ]
        },
        love: {
          keywords: ['爱', '喜欢', '爱好', '热爱', '钟爱', '迷恋', '喜爱', '心爱'],
          intensity: [0.8, 0.6, 0.5, 0.7, 0.7, 0.8, 0.6, 0.7],
          responses: [
            '能感受到你对此的热爱！',
            '你的喜欢之情溢于言表呢！',
            '看得出这对你很重要！'
          ]
        }
      },
      
      // 消极情感
      negative: {
        sadness: {
          keywords: ['难过', '伤心', '悲伤', '沮丧', '失落', '郁闷', '痛苦', '心痛', '忧伤', '哀伤'],
          intensity: [0.7, 0.8, 0.8, 0.6, 0.5, 0.6, 0.9, 0.8, 0.7, 0.8],
          responses: [
            '我能理解你现在的难过心情，这种感受确实不好受。',
            '看到你这样难过，我也感到很心疼。',
            '每个人都会有低落的时候，这很正常。'
          ]
        },
        anger: {
          keywords: ['生气', '愤怒', '气愤', '恼火', '暴怒', '愤慨', '火大', '气死了', '讨厌'],
          intensity: [0.7, 0.9, 0.8, 0.6, 0.9, 0.8, 0.6, 0.8, 0.5],
          responses: [
            '我能感受到你的愤怒，这种情况确实让人生气。',
            '你有权利感到生气，这种反应很正常。',
            '深呼吸一下，我们一起来处理这个问题。'
          ]
        },
        fear: {
          keywords: ['害怕', '恐惧', '担心', '忧虑', '紧张', '焦虑', '不安', '惊慌', '恐慌'],
          intensity: [0.7, 0.8, 0.6, 0.6, 0.5, 0.7, 0.5, 0.8, 0.9],
          responses: [
            '我理解你的担心，这种不安的感觉确实不好受。',
            '有这样的担忧是很正常的，我们可以一起面对。',
            '别害怕，我会陪着你一起解决问题。'
          ]
        },
        disappointment: {
          keywords: ['失望', '沮丧', '失落', '挫败', '泄气', '绝望', '无望', '心灰意冷'],
          intensity: [0.7, 0.6, 0.5, 0.8, 0.5, 0.9, 0.8, 0.9],
          responses: [
            '我能理解你的失望，这种感受真的很难受。',
            '虽然现在很失望，但请相信事情会好转的。',
            '每个人都会遇到挫折，这不代表你不够好。'
          ]
        }
      },
      
      // 中性情感
      neutral: {
        confusion: {
          keywords: ['困惑', '迷惑', '不懂', '不明白', '疑惑', '纳闷', '搞不懂', '不理解'],
          intensity: [0.5, 0.5, 0.4, 0.4, 0.5, 0.4, 0.5, 0.4],
          responses: [
            '我理解你的困惑，让我来帮你理清思路。',
            '有疑问是很正常的，我们一起来解决。',
            '不用担心不懂，我会耐心解释的。'
          ]
        },
        curiosity: {
          keywords: ['好奇', '想知道', '感兴趣', '想了解', '疑问', '探索', '研究'],
          intensity: [0.6, 0.5, 0.6, 0.5, 0.4, 0.7, 0.6],
          responses: [
            '你的好奇心很棒，让我们一起探索吧！',
            '很高兴看到你对此感兴趣！',
            '好奇心是学习的动力，这很好！'
          ]
        }
      }
    };
    
    // 情感强度修饰词
    this.intensityModifiers = {
      high: ['非常', '特别', '极其', '超级', '十分', '相当', '很', '太', '超', '巨'],
      medium: ['比较', '还', '挺', '蛮', '稍微', '有点'],
      low: ['一点', '一些', '略微', '轻微']
    };
    
    // 情感上下文标记
    this.contextMarkers = {
      emphasis: ['！', '!', '？？', '??', '...', '。。。'],
      repetition: /(.)\1{2,}/g, // 重复字符
      caps: /[A-Z]{3,}/g,      // 大写字母
      emoticons: ['😊', '😢', '😡', '😰', '😍', '😭', '😤', '🥺', '😔', '😃']
    };
    
    // 情感历史记录
    this.emotionHistory = new Map();
    
    // 情感回应缓存
    this.responseCache = new Map();
  }

  /**
   * 识别文本中的情感
   */
  recognizeEmotion(text, userId = 'default') {
    try {
      const emotions = {
        primary: null,      // 主要情感
        secondary: [],      // 次要情感
        intensity: 0,       // 情感强度
        confidence: 0,      // 识别置信度
        context: {
          hasEmphasis: false,
          hasRepetition: false,
          hasEmoticons: false
        }
      };

      if (!text || typeof text !== 'string') {
        return emotions;
      }

      const normalizedText = text.toLowerCase().trim();
      
      // 分析上下文标记
      emotions.context = this._analyzeContext(text);
      
      // 识别情感词汇
      const emotionScores = this._calculateEmotionScores(normalizedText);
      
      // 应用强度修饰符
      const adjustedScores = this._applyIntensityModifiers(emotionScores, normalizedText);
      
      // 应用上下文调整
      const contextAdjustedScores = this._applyContextAdjustment(adjustedScores, emotions.context);
      
      // 确定主要和次要情感
      const sortedEmotions = Object.entries(contextAdjustedScores)
        .sort(([,a], [,b]) => b.score - a.score)
        .filter(([,emotion]) => emotion.score >= this.config.emotionThreshold);

      if (sortedEmotions.length > 0) {
        const [primaryType, primaryEmotion] = sortedEmotions[0];
        emotions.primary = {
          type: primaryType,
          category: primaryEmotion.category,
          score: primaryEmotion.score,
          keywords: primaryEmotion.matchedKeywords
        };
        emotions.intensity = primaryEmotion.score;
        emotions.confidence = this._calculateConfidence(primaryEmotion, emotions.context);
        
        // 次要情感
        emotions.secondary = sortedEmotions.slice(1, 3).map(([type, emotion]) => ({
          type: type,
          category: emotion.category,
          score: emotion.score
        }));
      }
      
      // 更新情感历史
      this._updateEmotionHistory(userId, emotions);
      
      console.log('情感识别结果:', emotions);
      return emotions;
    } catch (error) {
      console.error('情感识别失败:', error);
      return { primary: null, secondary: [], intensity: 0, confidence: 0 };
    }
  }

  /**
   * 分析上下文标记
   */
  _analyzeContext(text) {
    const context = {
      hasEmphasis: false,
      hasRepetition: false,
      hasEmoticons: false,
      emphasisCount: 0,
      repetitionCount: 0,
      emoticonCount: 0
    };

    // 检查强调标记
    this.contextMarkers.emphasis.forEach(marker => {
      const count = (text.match(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (count > 0) {
        context.hasEmphasis = true;
        context.emphasisCount += count;
      }
    });

    // 检查重复字符
    const repetitionMatches = text.match(this.contextMarkers.repetition);
    if (repetitionMatches) {
      context.hasRepetition = true;
      context.repetitionCount = repetitionMatches.length;
    }

    // 检查表情符号
    this.contextMarkers.emoticons.forEach(emoticon => {
      if (text.includes(emoticon)) {
        context.hasEmoticons = true;
        context.emoticonCount++;
      }
    });

    return context;
  }

  /**
   * 计算情感分数
   */
  _calculateEmotionScores(text) {
    const scores = {};

    Object.entries(this.emotionLexicon).forEach(([category, emotions]) => {
      Object.entries(emotions).forEach(([emotionType, emotionData]) => {
        let totalScore = 0;
        let matchedKeywords = [];

        emotionData.keywords.forEach((keyword, index) => {
          if (text.includes(keyword)) {
            const intensity = emotionData.intensity[index] || 0.5;
            totalScore += intensity;
            matchedKeywords.push(keyword);
          }
        });

        if (totalScore > 0) {
          scores[emotionType] = {
            category: category,
            score: Math.min(totalScore, 1.0), // 限制最大分数为1
            matchedKeywords: matchedKeywords
          };
        }
      });
    });

    return scores;
  }

  /**
   * 应用强度修饰符
   */
  _applyIntensityModifiers(emotionScores, text) {
    const adjustedScores = { ...emotionScores };

    Object.keys(adjustedScores).forEach(emotionType => {
      let multiplier = 1.0;

      // 检查高强度修饰词
      this.intensityModifiers.high.forEach(modifier => {
        if (text.includes(modifier)) {
          multiplier = Math.max(multiplier, 1.5);
        }
      });

      // 检查中等强度修饰词
      this.intensityModifiers.medium.forEach(modifier => {
        if (text.includes(modifier)) {
          multiplier = Math.max(multiplier, 1.2);
        }
      });

      // 检查低强度修饰词
      this.intensityModifiers.low.forEach(modifier => {
        if (text.includes(modifier)) {
          multiplier = Math.min(multiplier, 0.8);
        }
      });

      adjustedScores[emotionType].score = Math.min(
        adjustedScores[emotionType].score * multiplier, 
        1.0
      );
    });

    return adjustedScores;
  }

  /**
   * 应用上下文调整
   */
  _applyContextAdjustment(emotionScores, context) {
    const adjustedScores = { ...emotionScores };

    Object.keys(adjustedScores).forEach(emotionType => {
      let adjustment = 1.0;

      // 强调标记增强情感强度
      if (context.hasEmphasis) {
        adjustment *= (1 + context.emphasisCount * 0.1);
      }

      // 重复字符增强情感强度
      if (context.hasRepetition) {
        adjustment *= (1 + context.repetitionCount * 0.15);
      }

      // 表情符号增强情感强度
      if (context.hasEmoticons) {
        adjustment *= (1 + context.emoticonCount * 0.2);
      }

      adjustedScores[emotionType].score = Math.min(
        adjustedScores[emotionType].score * adjustment,
        1.0
      );
    });

    return adjustedScores;
  }

  /**
   * 计算识别置信度
   */
  _calculateConfidence(emotion, context) {
    let confidence = emotion.score;

    // 匹配关键词数量影响置信度
    confidence += emotion.matchedKeywords.length * 0.1;

    // 上下文标记提高置信度
    if (context.hasEmphasis) confidence += 0.1;
    if (context.hasRepetition) confidence += 0.1;
    if (context.hasEmoticons) confidence += 0.15;

    return Math.min(confidence, 1.0);
  }

  /**
   * 更新情感历史
   */
  _updateEmotionHistory(userId, emotion) {
    if (!this.emotionHistory.has(userId)) {
      this.emotionHistory.set(userId, []);
    }

    const history = this.emotionHistory.get(userId);
    
    // 添加时间戳
    const emotionRecord = {
      ...emotion,
      timestamp: new Date(),
      id: Date.now().toString()
    };

    history.push(emotionRecord);

    // 限制历史记录长度
    if (history.length > this.config.maxEmotionHistory) {
      history.shift();
    }

    this.emotionHistory.set(userId, history);
  }

  /**
   * 生成情感回应
   */
  generateEmotionalResponse(emotion, personaStyle = null, userId = 'default') {
    try {
      if (!emotion || !emotion.primary) {
        return null;
      }

      const cacheKey = `${emotion.primary.type}_${emotion.intensity}_${userId}`;
      
      // 检查缓存
      if (this.responseCache.has(cacheKey)) {
        const cached = this.responseCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 60000) { // 1分钟缓存
          return this._varyResponse(cached.response);
        }
      }

      const emotionType = emotion.primary.type;
      const emotionData = this._getEmotionData(emotionType);
      
      if (!emotionData) {
        return null;
      }

      // 基础回应
      let baseResponse = this._selectBaseResponse(emotionData.responses, emotion.intensity);
      
      // 应用人格风格调整
      if (personaStyle) {
        baseResponse = this._adjustResponseForPersona(baseResponse, personaStyle, emotion);
      }
      
      // 应用情感历史上下文
      const contextualResponse = this._applyEmotionalContext(baseResponse, userId, emotion);
      
      // 生成最终回应
      const finalResponse = {
        content: contextualResponse,
        emotionType: emotionType,
        empathyLevel: this._calculateEmpathyLevel(emotion),
        responseType: this._determineResponseType(emotion),
        suggestions: this._generateActionSuggestions(emotion)
      };

      // 缓存回应
      this.responseCache.set(cacheKey, {
        response: finalResponse,
        timestamp: Date.now()
      });

      console.log('生成情感回应:', finalResponse);
      return finalResponse;
    } catch (error) {
      console.error('生成情感回应失败:', error);
      return null;
    }
  }

  /**
   * 获取情感数据
   */
  _getEmotionData(emotionType) {
    for (const category of Object.values(this.emotionLexicon)) {
      if (category[emotionType]) {
        return category[emotionType];
      }
    }
    return null;
  }

  /**
   * 选择基础回应
   */
  _selectBaseResponse(responses, intensity) {
    if (!responses || responses.length === 0) {
      return '我理解你的感受。';
    }

    // 根据情感强度选择合适的回应
    let responseIndex;
    if (intensity >= 0.8) {
      responseIndex = 0; // 高强度情感使用第一个回应
    } else if (intensity >= 0.5) {
      responseIndex = Math.min(1, responses.length - 1);
    } else {
      responseIndex = Math.min(2, responses.length - 1);
    }

    return responses[responseIndex] || responses[0];
  }

  /**
   * 根据人格风格调整回应
   */
  _adjustResponseForPersona(response, personaStyle, emotion) {
    let adjustedResponse = response;

    // 根据人格的友好程度调整
    if (personaStyle.personality && personaStyle.personality.friendliness > 0.7) {
      adjustedResponse = this._makeFriendlier(adjustedResponse);
    }

    // 根据人格的正式程度调整
    if (personaStyle.linguistic && personaStyle.linguistic.formalityLevel > 0.5) {
      adjustedResponse = this._makeFormal(adjustedResponse);
    } else if (personaStyle.linguistic.formalityLevel < -0.3) {
      adjustedResponse = this._makeInformal(adjustedResponse);
    }

    // 根据人格的支持性调整
    if (personaStyle.conversational && personaStyle.conversational.supportiveness > 0.7) {
      adjustedResponse = this._addSupportiveElements(adjustedResponse, emotion);
    }

    return adjustedResponse;
  }

  /**
   * 使回应更友好
   */
  _makeFriendlier(response) {
    const friendlyPrefixes = ['', '亲爱的朋友，', ''];
    const friendlySuffixes = ['', '，我会一直陪着你的', '，别担心哦'];
    
    const prefix = friendlyPrefixes[Math.floor(Math.random() * friendlyPrefixes.length)];
    const suffix = friendlySuffixes[Math.floor(Math.random() * friendlySuffixes.length)];
    
    return prefix + response + suffix;
  }

  /**
   * 使回应更正式
   */
  _makeFormal(response) {
    return response
      .replace(/你/g, '您')
      .replace(/咋/g, '怎么')
      .replace(/啥/g, '什么');
  }

  /**
   * 使回应更非正式
   */
  _makeInformal(response) {
    return response
      .replace(/您/g, '你')
      .replace(/什么/g, '啥')
      .replace(/怎么/g, '咋样');
  }

  /**
   * 添加支持性元素
   */
  _addSupportiveElements(response, emotion) {
    const supportiveElements = {
      positive: ['真为你高兴！', '这太棒了！'],
      negative: ['我会陪着你的', '一切都会好起来的', '你并不孤单'],
      neutral: ['我理解你', '这很正常']
    };

    const category = emotion.primary.category;
    const elements = supportiveElements[category] || supportiveElements.neutral;
    const element = elements[Math.floor(Math.random() * elements.length)];
    
    return response + ' ' + element;
  }

  /**
   * 应用情感历史上下文
   */
  _applyEmotionalContext(response, userId, currentEmotion) {
    const history = this.emotionHistory.get(userId) || [];
    
    if (history.length < 2) {
      return response;
    }

    const recentEmotions = history.slice(-3);
    const prevEmotion = recentEmotions[recentEmotions.length - 2];

    // 检查情感变化
    if (prevEmotion && prevEmotion.primary) {
      const emotionChange = this._detectEmotionChange(prevEmotion.primary, currentEmotion.primary);
      
      if (emotionChange) {
        const contextualPrefix = this._generateContextualPrefix(emotionChange);
        return contextualPrefix + response;
      }
    }

    return response;
  }

  /**
   * 检测情感变化
   */
  _detectEmotionChange(prevEmotion, currentEmotion) {
    if (prevEmotion.category !== currentEmotion.category) {
      return {
        type: 'category_change',
        from: prevEmotion.category,
        to: currentEmotion.category,
        intensity: Math.abs(prevEmotion.score - currentEmotion.score)
      };
    }

    if (Math.abs(prevEmotion.score - currentEmotion.score) > 0.3) {
      return {
        type: 'intensity_change',
        direction: currentEmotion.score > prevEmotion.score ? 'increase' : 'decrease',
        intensity: Math.abs(prevEmotion.score - currentEmotion.score)
      };
    }

    return null;
  }

  /**
   * 生成上下文前缀
   */
  _generateContextualPrefix(emotionChange) {
    const prefixes = {
      category_change: {
        'negative_to_positive': '很高兴看到你的心情好转了！',
        'positive_to_negative': '我注意到你的心情有些变化，',
        'neutral_to_positive': '看到你开心起来真好！',
        'neutral_to_negative': '我感觉到你有些不开心，'
      },
      intensity_change: {
        increase: '我能感受到你的情感更强烈了，',
        decrease: '看起来你的情绪稍微平静了一些，'
      }
    };

    if (emotionChange.type === 'category_change') {
      const key = `${emotionChange.from}_to_${emotionChange.to}`;
      return prefixes.category_change[key] || '';
    } else if (emotionChange.type === 'intensity_change') {
      return prefixes.intensity_change[emotionChange.direction] || '';
    }

    return '';
  }

  /**
   * 计算共情程度
   */
  _calculateEmpathyLevel(emotion) {
    let empathyLevel = this.config.empathyStrength;

    // 根据情感强度调整共情程度
    empathyLevel *= emotion.intensity;

    // 消极情感需要更高的共情
    if (emotion.primary.category === 'negative') {
      empathyLevel *= 1.3;
    }

    return Math.min(empathyLevel, 1.0);
  }

  /**
   * 确定回应类型
   */
  _determineResponseType(emotion) {
    const category = emotion.primary.category;
    const intensity = emotion.intensity;

    if (category === 'positive') {
      return intensity > 0.7 ? 'celebration' : 'encouragement';
    } else if (category === 'negative') {
      return intensity > 0.7 ? 'comfort' : 'support';
    } else {
      return 'understanding';
    }
  }

  /**
   * 生成行动建议
   */
  _generateActionSuggestions(emotion) {
    const suggestions = {
      positive: {
        joy: ['分享你的快乐给身边的人', '记录下这美好的时刻'],
        excitement: ['保持这份热情', '将这种能量投入到你喜欢的事情中'],
        gratitude: ['继续保持感恩的心', '也许可以表达对他人的感谢']
      },
      negative: {
        sadness: ['允许自己感受这种情绪', '考虑和信任的人聊聊', '做一些让自己舒服的事情'],
        anger: ['深呼吸，让自己冷静下来', '找到问题的根源', '考虑建设性的解决方案'],
        fear: ['识别具体的担忧', '制定应对计划', '寻求支持和帮助'],
        disappointment: ['接受这种感受', '从中学习经验', '重新设定期望和目标']
      },
      neutral: {
        confusion: ['整理思路', '寻求更多信息', '向他人请教'],
        curiosity: ['深入探索感兴趣的话题', '保持开放的心态学习']
      }
    };

    const category = emotion.primary.category;
    const type = emotion.primary.type;
    
    return suggestions[category]?.[type] || ['保持积极的心态', '关注当下的感受'];
  }

  /**
   * 变化回应以避免重复
   */
  _varyResponse(response) {
    // 简单的变化策略，实际项目中可以更复杂
    const variations = [
      response.content,
      response.content.replace('我', '我们'),
      response.content + '，我在这里陪着你。'
    ];

    const variedContent = variations[Math.floor(Math.random() * variations.length)];
    
    return {
      ...response,
      content: variedContent
    };
  }

  /**
   * 获取情感历史
   */
  getEmotionHistory(userId = 'default', limit = 10) {
    const history = this.emotionHistory.get(userId) || [];
    return history.slice(-limit);
  }

  /**
   * 分析情感趋势
   */
  analyzeEmotionTrend(userId = 'default', timeWindow = 24) {
    const history = this.emotionHistory.get(userId) || [];
    const cutoffTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
    
    const recentEmotions = history.filter(emotion => 
      new Date(emotion.timestamp) > cutoffTime
    );

    if (recentEmotions.length === 0) {
      return null;
    }

    const trend = {
      totalEmotions: recentEmotions.length,
      averageIntensity: 0,
      dominantCategory: null,
      emotionDistribution: {},
      trend: 'stable' // 'improving', 'declining', 'stable'
    };

    // 计算平均强度
    trend.averageIntensity = recentEmotions.reduce((sum, emotion) => 
      sum + emotion.intensity, 0) / recentEmotions.length;

    // 统计情感分布
    recentEmotions.forEach(emotion => {
      if (emotion.primary) {
        const category = emotion.primary.category;
        trend.emotionDistribution[category] = (trend.emotionDistribution[category] || 0) + 1;
      }
    });

    // 确定主导情感类别
    trend.dominantCategory = Object.entries(trend.emotionDistribution)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    // 分析趋势
    if (recentEmotions.length >= 3) {
      const recent = recentEmotions.slice(-3);
      const positiveCount = recent.filter(e => e.primary?.category === 'positive').length;
      const negativeCount = recent.filter(e => e.primary?.category === 'negative').length;
      
      if (positiveCount > negativeCount) {
        trend.trend = 'improving';
      } else if (negativeCount > positiveCount) {
        trend.trend = 'declining';
      }
    }

    return trend;
  }

  /**
   * 清除情感历史
   */
  clearEmotionHistory(userId = 'default') {
    if (userId === 'all') {
      this.emotionHistory.clear();
      console.log('所有用户的情感历史已清除');
    } else {
      this.emotionHistory.delete(userId);
      console.log(`用户 ${userId} 的情感历史已清除`);
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalUsers: this.emotionHistory.size,
      cacheSize: this.responseCache.size,
      config: this.config,
      emotionTypes: Object.keys(this.emotionLexicon).reduce((acc, category) => {
        return acc + Object.keys(this.emotionLexicon[category]).length;
      }, 0)
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // 清除缓存以应用新配置
    this.responseCache.clear();
    
    console.log('情感识别管理器配置已更新:', this.config);
  }
}

// 导出情感识别管理器
window.AIChat = window.AIChat || {};
window.AIChat.EmotionRecognitionManager = EmotionRecognitionManager;

console.log('情感识别和回应管理器已加载');