/**
 * 指令处理器
 * 负责解析和处理用户输入的各种指令
 */

class CommandProcessor {
  constructor(personaManager, chatManager) {
    this.personaManager = personaManager;
    this.chatManager = chatManager;
    
    // 指令前缀
    this.commandPrefix = '/';
    
    // 支持的指令
    this.commands = {
      'persona': this.handlePersonaCommand.bind(this),
      'help': this.handleHelpCommand.bind(this),
      'current': this.handleCurrentCommand.bind(this),
      'clear': this.handleClearCommand.bind(this),
      'export': this.handleExportCommand.bind(this),
      'stats': this.handleStatsCommand.bind(this)
    };
    
    // 指令别名
    this.aliases = {
      'p': 'persona',
      'h': 'help',
      'c': 'current',
      'cl': 'clear',
      'exp': 'export',
      's': 'stats'
    };
  }

  /**
   * 检查输入是否为指令
   */
  isCommand(input) {
    return input.trim().startsWith(this.commandPrefix);
  }

  /**
   * 处理指令
   */
  async processCommand(input) {
    try {
      if (!this.isCommand(input)) {
        return null;
      }

      const commandText = input.trim().substring(1); // 移除前缀
      const parts = commandText.split(' ');
      const commandName = parts[0].toLowerCase();
      const args = parts.slice(1);

      // 检查别名
      const actualCommand = this.aliases[commandName] || commandName;

      // 执行指令
      if (this.commands[actualCommand]) {
        const result = await this.commands[actualCommand](args, input);
        return {
          ...result,
          isCommand: true,
          originalInput: input,
          commandName: actualCommand
        };
      } else {
        return {
          type: 'error',
          isCommand: true,
          message: `未知指令: /${commandName}`,
          help: '使用 /help 查看可用指令',
          suggestions: this._findSimilarCommands(commandName)
        };
      }
    } catch (error) {
      console.error('处理指令失败:', error);
      return {
        type: 'error',
        isCommand: true,
        message: '指令处理失败，请稍后重试',
        error: error.message
      };
    }
  }

  /**
   * 处理人格指令
   */
  async handlePersonaCommand(args, originalInput) {
    const personaName = args.join(' ').trim();
    
    if (!personaName) {
      // 显示人格列表
      const personas = this.personaManager.getAllPersonas();
      const currentPersona = this.personaManager.getCurrentPersona();
      
      return {
        type: 'list',
        title: '可用人格列表',
        personas: personas.map(p => ({
          id: p.id,
          name: p.name,
          isCurrent: p.id === currentPersona.id,
          prompt: p.prompt.substring(0, 50) + (p.prompt.length > 50 ? '...' : ''),
          hasAvatar: !!p.avatar
        })),
        footer: '使用 /persona [人格名称] 切换人格',
        currentPersona: currentPersona.name
      };
    } else {
      // 切换人格
      const persona = this.personaManager.findPersonaByName(personaName);
      
      if (persona) {
        const previousPersona = this.personaManager.getCurrentPersona();
        await this.personaManager.switchPersona(persona.id);
        
        return {
          type: 'switch',
          message: `已从 "${previousPersona.name}" 切换到 "${persona.name}"`,
          previousPersona: {
            id: previousPersona.id,
            name: previousPersona.name
          },
          newPersona: {
            id: persona.id,
            name: persona.name,
            prompt: persona.prompt.substring(0, 100) + (persona.prompt.length > 100 ? '...' : ''),
            hasAvatar: !!persona.avatar
          },
          switchTime: new Date()
        };
      } else {
        // 查找相似名称
        const suggestions = this._findSimilarPersonaNames(personaName);
        
        return {
          type: 'error',
          message: `未找到人格: "${personaName}"`,
          suggestions: suggestions,
          help: '使用 /persona 查看所有可用人格'
        };
      }
    }
  }

  /**
   * 处理帮助指令
   */
  async handleHelpCommand(args) {
    const commandName = args[0];
    
    if (commandName) {
      // 显示特定指令的帮助
      return this._getCommandHelp(commandName);
    } else {
      // 显示所有指令的帮助
      return {
        type: 'help',
        title: '指令帮助',
        commands: [
          {
            command: '/persona [名称]',
            alias: '/p',
            description: '切换人格或显示人格列表',
            examples: ['/persona', '/persona 小助手', '/p 专业顾问']
          },
          {
            command: '/current',
            alias: '/c',
            description: '显示当前人格信息',
            examples: ['/current', '/c']
          },
          {
            command: '/clear',
            alias: '/cl',
            description: '清空当前聊天记录',
            examples: ['/clear', '/cl']
          },
          {
            command: '/export [格式]',
            alias: '/exp',
            description: '导出聊天记录 (json/txt/html)',
            examples: ['/export', '/export json', '/exp txt']
          },
          {
            command: '/stats',
            alias: '/s',
            description: '显示聊天统计信息',
            examples: ['/stats', '/s']
          },
          {
            command: '/help [指令]',
            alias: '/h',
            description: '显示帮助信息',
            examples: ['/help', '/help persona', '/h']
          }
        ],
        footer: '提示: 可以使用指令别名来快速输入'
      };
    }
  }

  /**
   * 处理当前人格指令
   */
  async handleCurrentCommand(args) {
    const currentPersona = this.personaManager.getCurrentPersona();
    const stats = await this.chatManager.getMessageStats(currentPersona.id);
    
    return {
      type: 'info',
      title: '当前人格信息',
      persona: {
        name: currentPersona.name,
        id: currentPersona.id,
        prompt: currentPersona.prompt,
        hasAvatar: !!currentPersona.avatar,
        hasBeginDialogs: currentPersona.beginDialogs && currentPersona.beginDialogs.length > 0,
        hasMoodDialogs: currentPersona.moodImitationDialogs && currentPersona.moodImitationDialogs.length > 0,
        createdAt: currentPersona.createdAt,
        updatedAt: currentPersona.updatedAt,
        isDefault: currentPersona.isDefault || false
      },
      stats: {
        totalMessages: stats.totalMessages,
        userMessages: stats.userMessages,
        assistantMessages: stats.assistantMessages,
        totalCharacters: stats.totalCharacters,
        averageMessageLength: stats.averageMessageLength,
        firstMessage: stats.firstMessage ? new Date(stats.firstMessage.timestamp) : null,
        lastMessage: stats.lastMessage ? new Date(stats.lastMessage.timestamp) : null
      }
    };
  }

  /**
   * 处理清空指令
   */
  async handleClearCommand(args) {
    const currentPersona = this.personaManager.getCurrentPersona();
    
    // 获取清空前的统计信息
    const stats = await this.chatManager.getMessageStats(currentPersona.id);
    
    // 清空聊天记录
    await this.chatManager.clearChatHistory(currentPersona.id);
    
    return {
      type: 'success',
      message: `已清空 "${currentPersona.name}" 的聊天记录`,
      clearedStats: {
        messageCount: stats.totalMessages,
        characterCount: stats.totalCharacters
      },
      clearTime: new Date()
    };
  }

  /**
   * 处理导出指令
   */
  async handleExportCommand(args) {
    const format = args[0] || 'json';
    const supportedFormats = ['json', 'txt', 'html', 'csv'];
    
    if (!supportedFormats.includes(format.toLowerCase())) {
      return {
        type: 'error',
        message: `不支持的导出格式: ${format}`,
        supportedFormats: supportedFormats,
        help: '使用 /export [格式] 导出聊天记录'
      };
    }
    
    const currentPersona = this.personaManager.getCurrentPersona();
    
    try {
      const exportData = await this.chatManager.exportChatHistory(currentPersona.id, format);
      
      return {
        type: 'export',
        message: `聊天记录已导出为 ${format.toUpperCase()} 格式`,
        format: format,
        data: exportData,
        filename: `chat_${currentPersona.name}_${new Date().toISOString().split('T')[0]}.${format}`,
        exportTime: new Date()
      };
    } catch (error) {
      return {
        type: 'error',
        message: `导出失败: ${error.message}`,
        help: '请稍后重试或选择其他格式'
      };
    }
  }

  /**
   * 处理统计指令
   */
  async handleStatsCommand(args) {
    const currentPersona = this.personaManager.getCurrentPersona();
    const stats = await this.chatManager.getMessageStats(currentPersona.id);
    
    // 计算活跃天数
    const activeDays = Object.keys(stats.dailyStats || {}).length;
    
    // 计算平均每日消息数
    const avgDailyMessages = activeDays > 0 ? Math.round(stats.totalMessages / activeDays) : 0;
    
    return {
      type: 'stats',
      title: `"${currentPersona.name}" 的聊天统计`,
      stats: {
        basic: {
          totalMessages: stats.totalMessages,
          userMessages: stats.userMessages,
          assistantMessages: stats.assistantMessages,
          systemMessages: stats.systemMessages || 0
        },
        content: {
          totalCharacters: stats.totalCharacters,
          averageMessageLength: stats.averageMessageLength,
          longestMessage: this._findLongestMessage(stats),
          shortestMessage: this._findShortestMessage(stats)
        },
        activity: {
          activeDays: activeDays,
          avgDailyMessages: avgDailyMessages,
          firstMessage: stats.firstMessage ? new Date(stats.firstMessage.timestamp) : null,
          lastMessage: stats.lastMessage ? new Date(stats.lastMessage.timestamp) : null
        },
        recent: this._getRecentActivity(stats.dailyStats || {})
      },
      generatedAt: new Date()
    };
  }

  /**
   * 查找相似的指令名称
   */
  _findSimilarCommands(commandName) {
    const allCommands = [...Object.keys(this.commands), ...Object.keys(this.aliases)];
    const suggestions = [];
    
    allCommands.forEach(cmd => {
      if (cmd.includes(commandName) || commandName.includes(cmd)) {
        suggestions.push(cmd);
      }
    });
    
    return suggestions.slice(0, 3);
  }

  /**
   * 查找相似的人格名称
   */
  _findSimilarPersonaNames(query) {
    const personas = this.personaManager.getAllPersonas();
    const queryLower = query.toLowerCase();
    const suggestions = [];
    
    personas.forEach(persona => {
      const nameLower = persona.name.toLowerCase();
      
      if (nameLower.includes(queryLower) || queryLower.includes(nameLower)) {
        suggestions.push(persona.name);
      }
    });
    
    return suggestions.slice(0, 3);
  }

  /**
   * 获取特定指令的帮助
   */
  _getCommandHelp(commandName) {
    const helpInfo = {
      'persona': {
        command: '/persona [名称]',
        alias: '/p',
        description: '人格管理指令',
        usage: [
          '/persona - 显示所有人格列表',
          '/persona [名称] - 切换到指定人格'
        ],
        examples: ['/persona', '/persona 小助手', '/p 专业顾问']
      },
      'current': {
        command: '/current',
        alias: '/c',
        description: '显示当前人格的详细信息',
        usage: ['/current - 显示当前人格信息和统计'],
        examples: ['/current', '/c']
      },
      'clear': {
        command: '/clear',
        alias: '/cl',
        description: '清空当前人格的聊天记录',
        usage: ['/clear - 清空所有聊天记录'],
        examples: ['/clear', '/cl']
      }
    };
    
    const info = helpInfo[commandName];
    if (info) {
      return {
        type: 'help',
        title: `${info.command} 指令帮助`,
        command: info,
        relatedCommands: Object.keys(helpInfo).filter(cmd => cmd !== commandName).slice(0, 3)
      };
    } else {
      return {
        type: 'error',
        message: `未找到指令帮助: ${commandName}`,
        help: '使用 /help 查看所有可用指令'
      };
    }
  }

  /**
   * 查找最长消息
   */
  _findLongestMessage(stats) {
    // 这里需要实际的消息数据，暂时返回估算值
    return stats.averageMessageLength ? Math.round(stats.averageMessageLength * 2) : 0;
  }

  /**
   * 查找最短消息
   */
  _findShortestMessage(stats) {
    // 这里需要实际的消息数据，暂时返回估算值
    return stats.averageMessageLength ? Math.round(stats.averageMessageLength * 0.3) : 0;
  }

  /**
   * 获取最近活动情况
   */
  _getRecentActivity(dailyStats) {
    const recent = Object.entries(dailyStats)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .slice(0, 7)
      .map(([date, stats]) => ({
        date: new Date(date),
        messageCount: stats.count,
        userMessages: stats.userCount,
        assistantMessages: stats.assistantCount
      }));
    
    return recent;
  }

  /**
   * 获取所有支持的指令
   */
  getSupportedCommands() {
    return {
      commands: Object.keys(this.commands),
      aliases: this.aliases,
      prefix: this.commandPrefix
    };
  }

  /**
   * 添加自定义指令
   */
  addCommand(name, handler, alias = null) {
    this.commands[name] = handler;
    if (alias) {
      this.aliases[alias] = name;
    }
    console.log(`已添加自定义指令: /${name}${alias ? ` (别名: /${alias})` : ''}`);
  }

  /**
   * 移除指令
   */
  removeCommand(name) {
    delete this.commands[name];
    
    // 移除相关别名
    Object.keys(this.aliases).forEach(alias => {
      if (this.aliases[alias] === name) {
        delete this.aliases[alias];
      }
    });
    
    console.log(`已移除指令: /${name}`);
  }
}

// 导出指令处理器
window.AIChat = window.AIChat || {};
window.AIChat.CommandProcessor = CommandProcessor;

console.log('指令处理器已加载');