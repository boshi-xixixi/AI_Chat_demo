/**
 * 聊天管理器
 * 负责聊天消息的存储、检索和管理
 */

class ChatManager {
  constructor(storageService) {
    this.storage = storageService;
    this.messageCache = new Map(); // 消息缓存
    this.maxCacheSize = 1000; // 最大缓存消息数
    this.compressionThreshold = 500; // 消息压缩阈值（字符数）
  }

  /**
   * 发送消息
   */
  async sendMessage(content, personaId, role = 'user') {
    try {
      const message = {
        id: AIChat.Utils.generateId(),
        personaId: personaId,
        role: role,
        content: content,
        timestamp: new Date(),
        metadata: {
          compressed: content.length > this.compressionThreshold,
          length: content.length,
          tokens: this._estimateTokens(content)
        }
      };

      // 如果消息过长，进行压缩
      if (message.metadata.compressed) {
        message.content = this._compressMessage(content);
        message.originalLength = content.length;
      }

      // 保存到存储
      await this.storage.saveMessage(message);
      
      // 更新缓存
      this._updateCache(personaId, message);
      
      console.log(`消息已保存: ${message.id}`);
      return message;
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取聊天历史
   */
  async getChatHistory(personaId, limit = 50, offset = 0) {
    try {
      // 先检查缓存
      const cacheKey = `${personaId}_${limit}_${offset}`;
      if (this.messageCache.has(cacheKey)) {
        return this.messageCache.get(cacheKey);
      }

      // 从存储获取
      let messages = await this.storage.loadChatHistory(personaId, limit + offset);
      
      // 应用偏移和限制
      if (offset > 0) {
        messages = messages.slice(offset);
      }
      if (messages.length > limit) {
        messages = messages.slice(-limit);
      }

      // 解压缩消息
      const decompressedMessages = messages.map(message => {
        if (message.metadata && message.metadata.compressed) {
          return {
            ...message,
            content: this._decompressMessage(message.content)
          };
        }
        return message;
      });

      // 更新缓存
      this.messageCache.set(cacheKey, decompressedMessages);
      this._cleanCache();

      return decompressedMessages;
    } catch (error) {
      console.error('获取聊天历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取最近的消息
   */
  async getRecentMessages(personaId, count = 10) {
    return await this.getChatHistory(personaId, count);
  }

  /**
   * 搜索消息
   */
  async searchMessages(personaId, query, limit = 20) {
    try {
      const allMessages = await this.storage.loadChatHistory(personaId, 1000); // 获取更多消息用于搜索
      
      const searchTerm = query.toLowerCase();
      const matchedMessages = allMessages.filter(message => {
        const content = message.metadata && message.metadata.compressed 
          ? this._decompressMessage(message.content)
          : message.content;
        
        return content.toLowerCase().includes(searchTerm);
      });

      // 按时间倒序排列，返回最新的匹配结果
      return matchedMessages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('搜索消息失败:', error);
      throw error;
    }
  }

  /**
   * 删除消息
   */
  async deleteMessage(messageId) {
    try {
      // 从存储删除
      await this.storage.delete('messages', messageId);
      
      // 清理缓存
      this._clearCacheForMessage(messageId);
      
      console.log(`消息已删除: ${messageId}`);
      return true;
    } catch (error) {
      console.error('删除消息失败:', error);
      throw error;
    }
  }

  /**
   * 清空聊天历史
   */
  async clearChatHistory(personaId) {
    try {
      await this.storage.clearChatHistory(personaId);
      
      // 清理相关缓存
      this._clearCacheForPersona(personaId);
      
      console.log(`聊天历史已清空: ${personaId}`);
      return true;
    } catch (error) {
      console.error('清空聊天历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取消息统计
   */
  async getMessageStats(personaId) {
    try {
      const messages = await this.storage.loadChatHistory(personaId, 10000); // 获取大量消息用于统计
      
      const stats = {
        totalMessages: messages.length,
        userMessages: messages.filter(m => m.role === 'user').length,
        assistantMessages: messages.filter(m => m.role === 'assistant').length,
        systemMessages: messages.filter(m => m.role === 'system').length,
        totalCharacters: 0,
        averageMessageLength: 0,
        firstMessage: null,
        lastMessage: null,
        dailyStats: {}
      };

      if (messages.length > 0) {
        // 计算字符统计
        stats.totalCharacters = messages.reduce((total, message) => {
          const content = message.metadata && message.metadata.compressed 
            ? this._decompressMessage(message.content)
            : message.content;
          return total + content.length;
        }, 0);

        stats.averageMessageLength = Math.round(stats.totalCharacters / messages.length);
        
        // 按时间排序
        const sortedMessages = messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        stats.firstMessage = sortedMessages[0];
        stats.lastMessage = sortedMessages[sortedMessages.length - 1];

        // 按日期统计
        messages.forEach(message => {
          const date = new Date(message.timestamp).toDateString();
          if (!stats.dailyStats[date]) {
            stats.dailyStats[date] = { count: 0, userCount: 0, assistantCount: 0 };
          }
          stats.dailyStats[date].count++;
          if (message.role === 'user') {
            stats.dailyStats[date].userCount++;
          } else if (message.role === 'assistant') {
            stats.dailyStats[date].assistantCount++;
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('获取消息统计失败:', error);
      throw error;
    }
  }

  /**
   * 导出聊天记录
   */
  async exportChatHistory(personaId, format = 'json') {
    try {
      const messages = await this.storage.loadChatHistory(personaId, 10000);
      
      // 解压缩所有消息
      const decompressedMessages = messages.map(message => {
        if (message.metadata && message.metadata.compressed) {
          return {
            ...message,
            content: this._decompressMessage(message.content)
          };
        }
        return message;
      });

      switch (format.toLowerCase()) {
        case 'json':
          return this._exportAsJSON(decompressedMessages);
        case 'txt':
          return this._exportAsText(decompressedMessages);
        case 'html':
          return this._exportAsHTML(decompressedMessages);
        case 'csv':
          return this._exportAsCSV(decompressedMessages);
        default:
          throw new Error('不支持的导出格式');
      }
    } catch (error) {
      console.error('导出聊天记录失败:', error);
      throw error;
    }
  }

  /**
   * 压缩消息内容
   */
  _compressMessage(content) {
    try {
      // 简单的压缩实现（实际项目中可以使用更好的压缩算法）
      return btoa(unescape(encodeURIComponent(content)));
    } catch (error) {
      console.warn('消息压缩失败:', error);
      return content;
    }
  }

  /**
   * 解压缩消息内容
   */
  _decompressMessage(compressedContent) {
    try {
      return decodeURIComponent(escape(atob(compressedContent)));
    } catch (error) {
      console.warn('消息解压缩失败:', error);
      return compressedContent;
    }
  }

  /**
   * 估算token数量
   */
  _estimateTokens(content) {
    // 简单的token估算（实际项目中可以使用更精确的方法）
    return Math.ceil(content.length / 4);
  }

  /**
   * 更新缓存
   */
  _updateCache(personaId, message) {
    // 简单的缓存策略
    const cacheKeys = Array.from(this.messageCache.keys()).filter(key => 
      key.startsWith(personaId)
    );
    
    cacheKeys.forEach(key => {
      const messages = this.messageCache.get(key);
      if (messages) {
        messages.push(message);
        // 保持缓存大小限制
        if (messages.length > 100) {
          messages.shift();
        }
      }
    });
  }

  /**
   * 清理缓存
   */
  _cleanCache() {
    if (this.messageCache.size > this.maxCacheSize) {
      const keys = Array.from(this.messageCache.keys());
      const keysToDelete = keys.slice(0, keys.length - this.maxCacheSize);
      keysToDelete.forEach(key => this.messageCache.delete(key));
    }
  }

  /**
   * 清理特定消息的缓存
   */
  _clearCacheForMessage(messageId) {
    this.messageCache.forEach((messages, key) => {
      const index = messages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        messages.splice(index, 1);
      }
    });
  }

  /**
   * 清理特定人格的缓存
   */
  _clearCacheForPersona(personaId) {
    const keysToDelete = Array.from(this.messageCache.keys()).filter(key => 
      key.startsWith(personaId)
    );
    keysToDelete.forEach(key => this.messageCache.delete(key));
  }

  /**
   * 导出为JSON格式
   */
  _exportAsJSON(messages) {
    return JSON.stringify({
      exportTime: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages
    }, null, 2);
  }

  /**
   * 导出为文本格式
   */
  _exportAsText(messages) {
    let text = `聊天记录导出\n导出时间: ${new Date().toLocaleString()}\n消息数量: ${messages.length}\n\n`;
    
    messages.forEach(message => {
      const time = new Date(message.timestamp).toLocaleString();
      const role = message.role === 'user' ? '用户' : message.role === 'assistant' ? 'AI' : '系统';
      text += `[${time}] ${role}: ${message.content}\n\n`;
    });
    
    return text;
  }

  /**
   * 导出为HTML格式
   */
  _exportAsHTML(messages) {
    let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>聊天记录</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .message { margin-bottom: 15px; padding: 10px; border-radius: 8px; }
        .user { background-color: #e3f2fd; text-align: right; }
        .assistant { background-color: #f5f5f5; }
        .system { background-color: #fff3e0; font-style: italic; }
        .time { font-size: 12px; color: #666; margin-bottom: 5px; }
        .content { line-height: 1.4; }
    </style>
</head>
<body>
    <div class="header">
        <h1>聊天记录</h1>
        <p>导出时间: ${new Date().toLocaleString()}</p>
        <p>消息数量: ${messages.length}</p>
    </div>
`;

    messages.forEach(message => {
      const time = new Date(message.timestamp).toLocaleString();
      const roleClass = message.role;
      const roleName = message.role === 'user' ? '用户' : message.role === 'assistant' ? 'AI' : '系统';
      
      html += `
    <div class="message ${roleClass}">
        <div class="time">${time} - ${roleName}</div>
        <div class="content">${message.content.replace(/\n/g, '<br>')}</div>
    </div>`;
    });

    html += `
</body>
</html>`;

    return html;
  }

  /**
   * 导出为CSV格式
   */
  _exportAsCSV(messages) {
    let csv = '时间,角色,内容,字符数\n';
    
    messages.forEach(message => {
      const time = new Date(message.timestamp).toISOString();
      const role = message.role;
      const content = message.content.replace(/"/g, '""'); // 转义双引号
      const length = message.content.length;
      
      csv += `"${time}","${role}","${content}",${length}\n`;
    });
    
    return csv;
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      cacheSize: this.messageCache.size,
      maxCacheSize: this.maxCacheSize,
      cacheKeys: Array.from(this.messageCache.keys())
    };
  }

  /**
   * 清空所有缓存
   */
  clearCache() {
    this.messageCache.clear();
    console.log('消息缓存已清空');
  }
}

// 导出聊天管理器
window.AIChat = window.AIChat || {};
window.AIChat.ChatManager = ChatManager;

console.log('聊天管理器已加载');