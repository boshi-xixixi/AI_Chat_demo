/**
 * 人格管理器
 * 负责人格的创建、编辑、删除和管理
 */

class PersonaManager {
  constructor(storageService) {
    this.storage = storageService;
    this.personas = [];
    this.currentPersonaId = null;
    this.defaultPersona = this.createDefaultPersona();
  }

  /**
   * 创建默认人格
   */
  createDefaultPersona() {
    return {
      id: 'default',
      name: '默认助手',
      prompt: '你是一个智能助手，能够回答各种问题并帮助用户解决问题。请用友好、专业的语气与用户交流。',
      avatar: null,
      beginDialogs: [
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好！我是默认助手，有什么我可以帮助你的吗？' }
      ],
      moodImitationDialogs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: true
    };
  }

  /**
   * 初始化人格管理器
   */
  async init() {
    try {
      this.personas = await this.storage.loadPersonas();
      
      // 如果没有人格，添加默认人格
      if (this.personas.length === 0) {
        await this.savePersona(this.defaultPersona);
        this.personas = [this.defaultPersona];
      }
      
      // 设置当前人格
      const defaultPersonaId = await this.storage.loadSetting('defaultPersonaId', 'default');
      const defaultPersona = this.personas.find(p => p.id === defaultPersonaId);
      
      if (defaultPersona) {
        this.currentPersonaId = defaultPersonaId;
        // 确保默认人格有正确的标记
        if (!defaultPersona.isDefault) {
          defaultPersona.isDefault = true;
          await this.savePersona(defaultPersona);
        }
      } else {
        // 如果默认人格不存在，使用第一个人格
        this.currentPersonaId = this.personas[0].id;
        await this.setDefaultPersona(this.personas[0].id);
      }
      
      console.log('人格管理器初始化完成，加载了', this.personas.length, '个人格');
      return true;
    } catch (error) {
      console.error('人格管理器初始化失败:', error);
      return false;
    }
  }

  /**
   * 创建新人格
   */
  async createPersona(personaData) {
    try {
      // 验证数据
      if (!this.validatePersonaData(personaData)) {
        throw new Error('人格数据验证失败');
      }

      // 检查名称是否重复
      if (this.personas.some(p => p.name === personaData.name)) {
        throw new Error('人格名称已存在');
      }

      const persona = {
        id: AIChat.Utils.generateId(),
        name: personaData.name,
        prompt: personaData.prompt,
        avatar: personaData.avatar || null,
        beginDialogs: personaData.beginDialogs || [],
        moodImitationDialogs: personaData.moodImitationDialogs || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDefault: false
      };

      await this.savePersona(persona);
      this.personas.push(persona);
      
      console.log('创建人格成功:', persona.name);
      return persona;
    } catch (error) {
      console.error('创建人格失败:', error);
      throw error;
    }
  }

  /**
   * 更新人格
   */
  async updatePersona(id, personaData) {
    try {
      const index = this.personas.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error('人格不存在');
      }

      // 验证数据
      if (!this.validatePersonaData(personaData)) {
        throw new Error('人格数据验证失败');
      }

      // 检查名称是否重复（排除自己）
      if (this.personas.some(p => p.id !== id && p.name === personaData.name)) {
        throw new Error('人格名称已存在');
      }

      const persona = {
        ...this.personas[index],
        name: personaData.name,
        prompt: personaData.prompt,
        avatar: personaData.avatar,
        beginDialogs: personaData.beginDialogs || [],
        moodImitationDialogs: personaData.moodImitationDialogs || [],
        updatedAt: new Date()
      };

      await this.savePersona(persona);
      this.personas[index] = persona;
      
      console.log('更新人格成功:', persona.name);
      return persona;
    } catch (error) {
      console.error('更新人格失败:', error);
      throw error;
    }
  }

  /**
   * 删除人格
   */
  async deletePersona(id) {
    try {
      // 不能删除默认人格
      if (id === 'default') {
        throw new Error('不能删除默认人格');
      }

      const index = this.personas.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error('人格不存在');
      }

      await this.storage.deletePersona(id);
      const deletedPersona = this.personas.splice(index, 1)[0];
      
      // 如果删除的是当前人格，切换到默认人格
      if (this.currentPersonaId === id) {
        this.currentPersonaId = 'default';
        await this.storage.saveSetting('defaultPersonaId', 'default');
      }
      
      console.log('删除人格成功:', deletedPersona.name);
      return true;
    } catch (error) {
      console.error('删除人格失败:', error);
      throw error;
    }
  }

  /**
   * 切换人格
   */
  async switchPersona(id) {
    try {
      const persona = this.personas.find(p => p.id === id);
      if (!persona) {
        throw new Error('人格不存在');
      }

      this.currentPersonaId = id;
      await this.storage.saveSetting('currentPersonaId', id);
      
      console.log('切换到人格:', persona.name);
      return persona;
    } catch (error) {
      console.error('切换人格失败:', error);
      throw error;
    }
  }

  /**
   * 设置默认人格
   */
  async setDefaultPersona(id) {
    try {
      const persona = this.personas.find(p => p.id === id);
      if (!persona) {
        throw new Error('人格不存在');
      }

      // 清除之前的默认标记
      this.personas.forEach(p => {
        if (p.isDefault) {
          p.isDefault = false;
        }
      });

      // 设置新的默认人格
      persona.isDefault = true;
      await this.savePersona(persona);
      await this.storage.saveSetting('defaultPersonaId', id);
      
      console.log('设置默认人格:', persona.name);
      return true;
    } catch (error) {
      console.error('设置默认人格失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前人格
   */
  getCurrentPersona() {
    return this.personas.find(p => p.id === this.currentPersonaId) || this.defaultPersona;
  }

  /**
   * 获取所有人格
   */
  getAllPersonas() {
    return [...this.personas];
  }

  /**
   * 根据名称查找人格
   */
  findPersonaByName(name) {
    return this.personas.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
  }

  /**
   * 处理人格指令
   */
  async handlePersonaCommand(command) {
    try {
      const parts = command.trim().split(' ');
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ').trim();

      switch (cmd) {
        case '/persona':
          if (!arg) {
            // 显示所有人格列表
            return {
              type: 'list',
              message: '可用人格列表：',
              personas: this.personas.map(p => ({ 
                id: p.id, 
                name: p.name,
                isCurrent: p.id === this.currentPersonaId
              })),
              help: '使用 /persona [人格名称] 切换人格'
            };
          } else {
            // 切换到指定人格
            const persona = this.findPersonaByName(arg);
            if (persona) {
              await this.switchPersona(persona.id);
              return {
                type: 'switch',
                message: `已切换到人格: ${persona.name}`,
                persona: persona,
                previousPersonaId: this.currentPersonaId
              };
            } else {
              // 提供相似名称建议
              const suggestions = this._findSimilarPersonaNames(arg);
              return {
                type: 'error',
                message: `未找到人格: ${arg}`,
                suggestions: suggestions.length > 0 ? suggestions : null,
                help: '使用 /persona 查看所有可用人格'
              };
            }
          }
        
        case '/help':
        case '/h':
          return {
            type: 'help',
            message: '人格指令帮助',
            commands: [
              { command: '/persona', description: '显示所有人格列表' },
              { command: '/persona [名称]', description: '切换到指定人格' },
              { command: '/help', description: '显示帮助信息' },
              { command: '/current', description: '显示当前人格信息' }
            ]
          };
        
        case '/current':
        case '/c':
          const currentPersona = this.getCurrentPersona();
          return {
            type: 'info',
            message: '当前人格信息',
            persona: {
              name: currentPersona.name,
              prompt: currentPersona.prompt.substring(0, 100) + (currentPersona.prompt.length > 100 ? '...' : ''),
              hasAvatar: !!currentPersona.avatar,
              hasBeginDialogs: currentPersona.beginDialogs && currentPersona.beginDialogs.length > 0,
              hasMoodDialogs: currentPersona.moodImitationDialogs && currentPersona.moodImitationDialogs.length > 0,
              createdAt: currentPersona.createdAt
            }
          };
        
        default:
          return {
            type: 'error',
            message: `未知指令: ${cmd}`,
            help: '使用 /help 查看可用指令'
          };
      }
    } catch (error) {
      console.error('处理人格指令失败:', error);
      return {
        type: 'error',
        message: '指令处理失败，请稍后重试',
        error: error.message
      };
    }
  }

  /**
   * 查找相似的人格名称
   */
  _findSimilarPersonaNames(query) {
    const queryLower = query.toLowerCase();
    const suggestions = [];
    
    this.personas.forEach(persona => {
      const nameLower = persona.name.toLowerCase();
      
      // 检查是否包含查询字符串
      if (nameLower.includes(queryLower)) {
        suggestions.push(persona.name);
      }
      // 检查编辑距离（简单实现）
      else if (this._calculateEditDistance(queryLower, nameLower) <= 2) {
        suggestions.push(persona.name);
      }
    });
    
    return suggestions.slice(0, 3); // 最多返回3个建议
  }

  /**
   * 计算编辑距离（简单实现）
   */
  _calculateEditDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * 验证人格数据
   */
  validatePersonaData(data) {
    const errors = [];
    
    // 验证名称
    if (!AIChat.Utils.validate.personaName(data.name)) {
      errors.push('人格名称无效（长度应在1-50字符之间）');
    }
    
    // 验证提示词
    if (!AIChat.Utils.validate.prompt(data.prompt)) {
      errors.push('系统提示词无效（长度应在1-2000字符之间）');
    }
    
    // 验证预设对话
    if (data.beginDialogs) {
      const beginDialogErrors = this._validateDialogs(data.beginDialogs, '预设对话');
      errors.push(...beginDialogErrors);
    }
    
    // 验证风格模仿对话
    if (data.moodImitationDialogs) {
      const moodDialogErrors = this._validateDialogs(data.moodImitationDialogs, '风格模仿对话');
      errors.push(...moodDialogErrors);
    }
    
    if (errors.length > 0) {
      console.warn('人格数据验证失败:', errors);
      this.lastValidationErrors = errors;
      return false;
    }
    
    return true;
  }

  /**
   * 验证对话数据
   */
  _validateDialogs(dialogs, type) {
    const errors = [];
    
    if (!Array.isArray(dialogs)) {
      errors.push(`${type}必须是数组格式`);
      return errors;
    }
    
    if (dialogs.length === 0) {
      return errors; // 空数组是有效的
    }
    
    // 验证对话对数
    if (dialogs.length % 2 !== 0) {
      errors.push(`${type}数量必须是偶数（成对出现）`);
    }
    
    // 验证每个对话项
    for (let i = 0; i < dialogs.length; i++) {
      const dialog = dialogs[i];
      const position = `${type}[${i + 1}]`;
      
      if (!dialog || typeof dialog !== 'object') {
        errors.push(`${position} 格式无效`);
        continue;
      }
      
      if (!dialog.role) {
        errors.push(`${position} 缺少角色字段`);
      } else if (!['user', 'assistant'].includes(dialog.role)) {
        errors.push(`${position} 角色无效，只能是 user 或 assistant`);
      }
      
      if (!dialog.content) {
        errors.push(`${position} 缺少内容字段`);
      } else if (typeof dialog.content !== 'string') {
        errors.push(`${position} 内容必须是字符串`);
      } else if (dialog.content.trim() === '') {
        errors.push(`${position} 内容不能为空`);
      } else if (dialog.content.length > 500) {
        errors.push(`${position} 内容过长（最多500字符）`);
      }
    }
    
    // 验证对话对的逻辑性
    if (dialogs.length >= 2 && dialogs.length % 2 === 0) {
      for (let i = 0; i < dialogs.length; i += 2) {
        const first = dialogs[i];
        const second = dialogs[i + 1];
        
        if (first && second) {
          const pairNum = Math.floor(i / 2) + 1;
          
          // 检查是否形成有效的对话对
          const isValidPair = 
            (first.role === 'user' && second.role === 'assistant') ||
            (first.role === 'assistant' && second.role === 'user');
          
          if (!isValidPair) {
            errors.push(`${type}第${pairNum}对的角色搭配无效（应该是user-assistant或assistant-user）`);
          }
        }
      }
    }
    
    return errors;
  }

  /**
   * 获取最后的验证错误
   */
  getLastValidationErrors() {
    return this.lastValidationErrors || [];
  }

  /**
   * 清除验证错误
   */
  clearValidationErrors() {
    this.lastValidationErrors = [];
  }

  /**
   * 保存人格到存储
   */
  async savePersona(persona) {
    await this.storage.savePersona(persona);
  }

  /**
   * 搜索人格
   */
  searchPersonas(query) {
    if (!query || query.trim() === '') {
      return this.personas;
    }
    
    const searchTerm = query.toLowerCase();
    return this.personas.filter(persona => 
      persona.name.toLowerCase().includes(searchTerm) ||
      persona.prompt.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * 获取人格统计信息
   */
  getPersonaStats(personaId) {
    const persona = this.personas.find(p => p.id === personaId);
    if (!persona) return null;
    
    return {
      id: persona.id,
      name: persona.name,
      createdAt: persona.createdAt,
      updatedAt: persona.updatedAt,
      messageCount: 0, // 将在聊天管理器中更新
      lastActiveAt: persona.updatedAt,
      hasAvatar: !!persona.avatar,
      hasBeginDialogs: persona.beginDialogs && persona.beginDialogs.length > 0,
      hasMoodDialogs: persona.moodImitationDialogs && persona.moodImitationDialogs.length > 0
    };
  }

  /**
   * 复制人格
   */
  async duplicatePersona(id) {
    try {
      const originalPersona = this.personas.find(p => p.id === id);
      if (!originalPersona) {
        throw new Error('人格不存在');
      }

      // 生成新的名称
      let newName = `${originalPersona.name} - 副本`;
      let counter = 1;
      while (this.personas.some(p => p.name === newName)) {
        newName = `${originalPersona.name} - 副本 ${counter}`;
        counter++;
      }

      const duplicatedPersona = {
        ...AIChat.Utils.deepClone(originalPersona),
        id: AIChat.Utils.generateId(),
        name: newName,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDefault: false
      };

      await this.savePersona(duplicatedPersona);
      this.personas.push(duplicatedPersona);
      
      console.log('复制人格成功:', duplicatedPersona.name);
      return duplicatedPersona;
    } catch (error) {
      console.error('复制人格失败:', error);
      throw error;
    }
  }

  /**
   * 批量导入人格
   */
  async batchImportPersonas(personasData) {
    try {
      const results = [];
      
      for (const personaData of personasData) {
        try {
          // 检查名称冲突
          let name = personaData.name;
          let counter = 1;
          while (this.personas.some(p => p.name === name)) {
            name = `${personaData.name} (${counter})`;
            counter++;
          }
          
          const persona = {
            ...personaData,
            id: AIChat.Utils.generateId(),
            name: name,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDefault: false
          };
          
          if (this.validatePersonaData(persona)) {
            await this.savePersona(persona);
            this.personas.push(persona);
            results.push({ success: true, persona: persona });
          } else {
            results.push({ success: false, error: '数据验证失败', data: personaData });
          }
        } catch (error) {
          results.push({ success: false, error: error.message, data: personaData });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log(`批量导入完成: ${successCount}/${personasData.length} 个人格导入成功`);
      
      return results;
    } catch (error) {
      console.error('批量导入人格失败:', error);
      throw error;
    }
  }

  /**
   * 获取人格使用频率统计
   */
  getUsageStats() {
    const stats = this.personas.map(persona => ({
      id: persona.id,
      name: persona.name,
      lastUsed: persona.updatedAt,
      createdAt: persona.createdAt,
      isDefault: persona.isDefault || false
    }));
    
    // 按最后使用时间排序
    stats.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
    
    return stats;
  }

  /**
   * 清理未使用的人格
   */
  async cleanupUnusedPersonas(daysThreshold = 30) {
    try {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - daysThreshold);
      
      const unusedPersonas = this.personas.filter(persona => 
        !persona.isDefault && 
        new Date(persona.updatedAt) < threshold
      );
      
      if (unusedPersonas.length === 0) {
        console.log('没有需要清理的人格');
        return [];
      }
      
      const cleanedPersonas = [];
      for (const persona of unusedPersonas) {
        try {
          await this.deletePersona(persona.id);
          cleanedPersonas.push(persona);
        } catch (error) {
          console.warn(`清理人格失败: ${persona.name}`, error);
        }
      }
      
      console.log(`清理了 ${cleanedPersonas.length} 个未使用的人格`);
      return cleanedPersonas;
    } catch (error) {
      console.error('清理人格失败:', error);
      throw error;
    }
  }

  /**
   * 导出人格数据
   */
  exportPersonas() {
    const exportData = {
      version: AIChat.CONFIG.version,
      exportTime: new Date().toISOString(),
      personas: this.personas.filter(p => !p.isDefault) // 不导出默认人格
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入人格数据
   */
  async importPersonas(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.personas || !Array.isArray(data.personas)) {
        throw new Error('无效的导入数据格式');
      }

      let importCount = 0;
      for (const personaData of data.personas) {
        try {
          // 检查名称冲突
          let name = personaData.name;
          let counter = 1;
          while (this.personas.some(p => p.name === name)) {
            name = `${personaData.name} (${counter})`;
            counter++;
          }
          
          const persona = {
            ...personaData,
            id: AIChat.Utils.generateId(),
            name: name,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDefault: false
          };
          
          if (this.validatePersonaData(persona)) {
            await this.savePersona(persona);
            this.personas.push(persona);
            importCount++;
          }
        } catch (error) {
          console.warn('跳过无效人格:', personaData.name, error);
        }
      }
      
      console.log(`成功导入 ${importCount} 个人格`);
      return importCount;
    } catch (error) {
      console.error('导入人格失败:', error);
      throw error;
    }
  }
}

// 导出人格管理器
window.AIChat.PersonaManager = PersonaManager;