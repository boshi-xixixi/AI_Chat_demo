/**
 * 设置管理器
 * 负责应用设置的管理、验证、保存和加载
 */

class SettingsManager {
  constructor(storage) {
    this.storage = storage;
    this.settings = {};
    this.defaultSettings = this._getDefaultSettings();
    this.isInitialized = false;
    this.eventListeners = new Map();
  }

  /**
   * 获取默认设置
   */
  _getDefaultSettings() {
    return {
      // API设置
      apiProvider: 'volcano', // 'volcano' | 'ollama'
      volcanoApiKey: '',
      volcanoEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      volcanoModel: 'doubao-1.5-pro-32k-250115',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama2',
      
      // UI设置
      theme: 'light', // 'light' | 'dark'
      language: 'zh-CN', // 'zh-CN' | 'en-US'
      compactMode: false,
      
      // 默认人格设置
      defaultPersonaId: null,
      
      // 数据管理设置
      autoSave: true,
      maxChatHistory: 1000,
      maxMemoryEntries: 500,
      dataRetentionDays: 90,
      
      // 隐私设置
      dataStorageConsent: false,
      analyticsEnabled: false,
      
      // 高级设置
      debugMode: false,
      experimentalFeatures: false,
      
      // 通知设置
      enableNotifications: true,
      soundEnabled: true,
      
      // 导入导出设置
      lastBackupDate: null,
      autoBackupEnabled: false,
      autoBackupInterval: 7 // 天
    };
  }

  /**
   * 初始化设置管理器
   */
  async init() {
    try {
      console.log('初始化设置管理器...');
      
      // 加载设置
      await this.loadSettings();
      
      // 验证设置
      this.validateSettings();
      
      // 应用设置
      await this.applySettings();
      
      this.isInitialized = true;
      console.log('设置管理器初始化完成');
      
      return true;
    } catch (error) {
      console.error('设置管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载设置
   */
  async loadSettings() {
    try {
      const savedSettings = await this.storage.loadAllSettings();
      
      // 合并默认设置和保存的设置
      this.settings = {
        ...this.defaultSettings,
        ...savedSettings
      };
      
      console.log('设置加载完成:', Object.keys(this.settings).length, '项');
    } catch (error) {
      console.warn('加载设置失败，使用默认设置:', error);
      this.settings = { ...this.defaultSettings };
    }
  }

  /**
   * 验证设置
   */
  validateSettings() {
    const validators = {
      apiProvider: (value) => ['volcano', 'ollama'].includes(value),
      theme: (value) => ['light', 'dark'].includes(value),
      language: (value) => ['zh-CN', 'en-US'].includes(value),
      maxChatHistory: (value) => Number.isInteger(value) && value > 0 && value <= 10000,
      maxMemoryEntries: (value) => Number.isInteger(value) && value > 0 && value <= 5000,
      dataRetentionDays: (value) => Number.isInteger(value) && value > 0 && value <= 365,
      autoBackupInterval: (value) => Number.isInteger(value) && value > 0 && value <= 30
    };

    let hasInvalidSettings = false;

    for (const [key, validator] of Object.entries(validators)) {
      if (this.settings.hasOwnProperty(key) && !validator(this.settings[key])) {
        console.warn(`设置项 ${key} 值无效:`, this.settings[key], '使用默认值:', this.defaultSettings[key]);
        this.settings[key] = this.defaultSettings[key];
        hasInvalidSettings = true;
      }
    }

    if (hasInvalidSettings) {
      console.log('检测到无效设置，已重置为默认值');
    }
  }

  /**
   * 应用设置
   */
  async applySettings() {
    try {
      // 应用主题
      await this.applyTheme();
      
      // 应用语言
      await this.applyLanguage();
      
      // 应用紧凑模式
      this.applyCompactMode();
      
      // 触发设置应用事件
      this._triggerEvent('settingsApplied', this.settings);
      
    } catch (error) {
      console.error('应用设置失败:', error);
    }
  }

  /**
   * 应用主题设置
   */
  async applyTheme() {
    const theme = this.settings.theme;
    const body = document.body;
    
    // 设置data-theme属性
    body.setAttribute('data-theme', theme);
    
    // 更新主题切换按钮图标
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.className = theme === 'dark' ? 'fa fa-sun text-lg' : 'fa fa-moon text-lg';
      }
    }
    
    console.log('主题已应用:', theme);
  }

  /**
   * 应用语言设置
   */
  async applyLanguage() {
    const language = this.settings.language;
    
    // 设置HTML lang属性
    document.documentElement.lang = language;
    
    // 这里可以添加国际化逻辑
    console.log('语言已应用:', language);
  }

  /**
   * 应用紧凑模式
   */
  applyCompactMode() {
    const body = document.body;
    
    if (this.settings.compactMode) {
      body.classList.add('compact-mode');
    } else {
      body.classList.remove('compact-mode');
    }
    
    console.log('紧凑模式:', this.settings.compactMode ? '已启用' : '已禁用');
  }

  /**
   * 获取设置值
   */
  get(key, defaultValue = null) {
    if (!this.isInitialized) {
      console.warn('设置管理器未初始化');
      return defaultValue;
    }
    
    return this.settings.hasOwnProperty(key) ? this.settings[key] : defaultValue;
  }

  /**
   * 设置值
   */
  async set(key, value, save = true) {
    if (!this.isInitialized) {
      throw new Error('设置管理器未初始化');
    }
    
    const oldValue = this.settings[key];
    this.settings[key] = value;
    
    if (save) {
      await this.saveSetting(key, value);
    }
    
    // 触发设置变更事件
    this._triggerEvent('settingChanged', { key, value, oldValue });
    
    // 如果是需要立即应用的设置，立即应用
    await this._applyImmediateSetting(key, value);
  }

  /**
   * 立即应用某些设置
   */
  async _applyImmediateSetting(key, value) {
    switch (key) {
      case 'theme':
        await this.applyTheme();
        break;
      case 'language':
        await this.applyLanguage();
        break;
      case 'compactMode':
        this.applyCompactMode();
        break;
    }
  }

  /**
   * 批量设置
   */
  async setMultiple(settings, save = true) {
    const changes = [];
    
    for (const [key, value] of Object.entries(settings)) {
      const oldValue = this.settings[key];
      this.settings[key] = value;
      changes.push({ key, value, oldValue });
    }
    
    if (save) {
      await this.saveAllSettings();
    }
    
    // 触发批量变更事件
    this._triggerEvent('settingsChanged', changes);
    
    // 应用设置
    await this.applySettings();
  }

  /**
   * 保存单个设置
   */
  async saveSetting(key, value) {
    try {
      await this.storage.saveSetting(key, value, 'general');
      console.log(`设置已保存: ${key} = ${value}`);
    } catch (error) {
      console.error(`保存设置失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 保存所有设置
   */
  async saveAllSettings() {
    try {
      const savePromises = Object.entries(this.settings).map(([key, value]) =>
        this.storage.saveSetting(key, value, 'general')
      );
      
      await Promise.all(savePromises);
      console.log('所有设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
      throw error;
    }
  }

  /**
   * 重置设置
   */
  async resetSettings(keys = null) {
    try {
      if (keys === null) {
        // 重置所有设置
        this.settings = { ...this.defaultSettings };
        await this.saveAllSettings();
        console.log('所有设置已重置为默认值');
      } else {
        // 重置指定设置
        const keysArray = Array.isArray(keys) ? keys : [keys];
        
        for (const key of keysArray) {
          if (this.defaultSettings.hasOwnProperty(key)) {
            this.settings[key] = this.defaultSettings[key];
            await this.saveSetting(key, this.settings[key]);
          }
        }
        
        console.log('指定设置已重置:', keysArray);
      }
      
      // 应用设置
      await this.applySettings();
      
      // 触发重置事件
      this._triggerEvent('settingsReset', keys);
      
    } catch (error) {
      console.error('重置设置失败:', error);
      throw error;
    }
  }

  /**
   * 导出设置
   */
  async exportSettings() {
    try {
      const exportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        settings: { ...this.settings }
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // 创建下载链接
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-chat-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('设置导出完成');
      return true;
    } catch (error) {
      console.error('导出设置失败:', error);
      throw error;
    }
  }

  /**
   * 导入设置
   */
  async importSettings(file) {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (!importData.settings) {
        throw new Error('无效的设置文件格式');
      }
      
      // 验证导入的设置
      const validSettings = {};
      const invalidSettings = [];
      
      for (const [key, value] of Object.entries(importData.settings)) {
        if (this.defaultSettings.hasOwnProperty(key)) {
          // 进行值验证
          if (this._validateSettingValue(key, value)) {
            validSettings[key] = value;
          } else {
            invalidSettings.push({ key, value, reason: '值验证失败' });
          }
        } else {
          invalidSettings.push({ key, value, reason: '未知设置项' });
        }
      }
      
      // 应用导入的设置
      await this.setMultiple(validSettings, true);
      
      console.log('设置导入完成:', Object.keys(validSettings).length, '项');
      if (invalidSettings.length > 0) {
        console.warn('跳过的无效设置:', invalidSettings);
      }
      
      // 触发导入事件
      this._triggerEvent('settingsImported', { validSettings, invalidSettings });
      
      return {
        success: true,
        imported: Object.keys(validSettings).length,
        total: Object.keys(importData.settings).length,
        invalid: invalidSettings.length
      };
    } catch (error) {
      console.error('导入设置失败:', error);
      throw error;
    }
  }

  /**
   * 验证单个设置值
   */
  _validateSettingValue(key, value) {
    const validators = {
      apiProvider: (value) => ['volcano', 'ollama'].includes(value),
      theme: (value) => ['light', 'dark'].includes(value),
      language: (value) => ['zh-CN', 'en-US'].includes(value),
      maxChatHistory: (value) => Number.isInteger(value) && value > 0 && value <= 10000,
      maxMemoryEntries: (value) => Number.isInteger(value) && value > 0 && value <= 5000,
      dataRetentionDays: (value) => Number.isInteger(value) && value > 0 && value <= 365,
      autoBackupInterval: (value) => Number.isInteger(value) && value > 0 && value <= 30,
      volcanoApiKey: (value) => typeof value === 'string',
      volcanoEndpoint: (value) => typeof value === 'string' && value.length > 0,
      volcanoModel: (value) => typeof value === 'string' && value.length > 0,
      ollamaEndpoint: (value) => typeof value === 'string' && value.length > 0,
      ollamaModel: (value) => typeof value === 'string' && value.length > 0,
      compactMode: (value) => typeof value === 'boolean',
      autoSave: (value) => typeof value === 'boolean',
      dataStorageConsent: (value) => typeof value === 'boolean',
      analyticsEnabled: (value) => typeof value === 'boolean',
      enableNotifications: (value) => typeof value === 'boolean',
      soundEnabled: (value) => typeof value === 'boolean',
      debugMode: (value) => typeof value === 'boolean',
      experimentalFeatures: (value) => typeof value === 'boolean',
      autoBackupEnabled: (value) => typeof value === 'boolean'
    };

    const validator = validators[key];
    if (validator) {
      return validator(value);
    }
    
    // 如果没有特定验证器，检查基本类型匹配
    const defaultValue = this.defaultSettings[key];
    return typeof value === typeof defaultValue;
  }

  /**
   * 创建设置备份
   */
  async createBackup() {
    try {
      const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        type: 'settings',
        settings: { ...this.settings },
        metadata: {
          totalSettings: Object.keys(this.settings).length,
          customizedSettings: Object.keys(this.settings).filter(key => 
            this.settings[key] !== this.defaultSettings[key]
          ).length
        }
      };
      
      return JSON.stringify(backupData, null, 2);
    } catch (error) {
      console.error('创建设置备份失败:', error);
      throw error;
    }
  }

  /**
   * 从备份恢复设置
   */
  async restoreFromBackup(backupData) {
    try {
      const backup = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;
      
      if (!backup.settings || backup.type !== 'settings') {
        throw new Error('无效的设置备份格式');
      }
      
      // 验证备份版本兼容性
      if (backup.version && !this._isVersionCompatible(backup.version)) {
        console.warn('备份版本可能不兼容:', backup.version);
      }
      
      // 验证并恢复设置
      const validSettings = {};
      const invalidSettings = [];
      
      for (const [key, value] of Object.entries(backup.settings)) {
        if (this.defaultSettings.hasOwnProperty(key)) {
          if (this._validateSettingValue(key, value)) {
            validSettings[key] = value;
          } else {
            invalidSettings.push({ key, value });
          }
        }
      }
      
      // 应用恢复的设置
      await this.setMultiple(validSettings, true);
      
      console.log('设置恢复完成:', Object.keys(validSettings).length, '项');
      
      return {
        success: true,
        restored: Object.keys(validSettings).length,
        invalid: invalidSettings.length,
        timestamp: backup.timestamp
      };
    } catch (error) {
      console.error('恢复设置失败:', error);
      throw error;
    }
  }

  /**
   * 检查版本兼容性
   */
  _isVersionCompatible(version) {
    // 简单的版本兼容性检查
    const currentVersion = '1.0.0';
    const [currentMajor] = currentVersion.split('.').map(Number);
    const [backupMajor] = version.split('.').map(Number);
    
    return currentMajor === backupMajor;
  }

  /**
   * 获取配置差异
   */
  getConfigDiff(otherSettings) {
    const diff = {
      added: {},
      modified: {},
      removed: {}
    };
    
    // 检查新增和修改的设置
    for (const [key, value] of Object.entries(otherSettings)) {
      if (!this.settings.hasOwnProperty(key)) {
        diff.added[key] = value;
      } else if (this.settings[key] !== value) {
        diff.modified[key] = {
          old: this.settings[key],
          new: value
        };
      }
    }
    
    // 检查删除的设置
    for (const key of Object.keys(this.settings)) {
      if (!otherSettings.hasOwnProperty(key)) {
        diff.removed[key] = this.settings[key];
      }
    }
    
    return diff;
  }

  /**
   * 合并设置配置
   */
  async mergeSettings(otherSettings, strategy = 'overwrite') {
    try {
      let mergedSettings = { ...this.settings };
      
      switch (strategy) {
        case 'overwrite':
          // 直接覆盖
          mergedSettings = { ...mergedSettings, ...otherSettings };
          break;
          
        case 'preserve':
          // 保留现有设置，只添加新的
          for (const [key, value] of Object.entries(otherSettings)) {
            if (!mergedSettings.hasOwnProperty(key)) {
              mergedSettings[key] = value;
            }
          }
          break;
          
        case 'newer':
          // 使用更新的设置（需要时间戳信息）
          // 这里简化为覆盖策略
          mergedSettings = { ...mergedSettings, ...otherSettings };
          break;
      }
      
      // 验证合并后的设置
      const validSettings = {};
      for (const [key, value] of Object.entries(mergedSettings)) {
        if (this.defaultSettings.hasOwnProperty(key) && this._validateSettingValue(key, value)) {
          validSettings[key] = value;
        }
      }
      
      // 应用合并后的设置
      await this.setMultiple(validSettings, true);
      
      console.log('设置合并完成:', Object.keys(validSettings).length, '项');
      
      return {
        success: true,
        merged: Object.keys(validSettings).length,
        strategy
      };
    } catch (error) {
      console.error('合并设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取API配置
   */
  getApiConfig() {
    return {
      provider: this.get('apiProvider'),
      volcano: {
        apiKey: this.get('volcanoApiKey'),
        endpoint: this.get('volcanoEndpoint'),
        model: this.get('volcanoModel')
      },
      ollama: {
        endpoint: this.get('ollamaEndpoint'),
        model: this.get('ollamaModel')
      }
    };
  }

  /**
   * 获取UI配置
   */
  getUiConfig() {
    return {
      theme: this.get('theme'),
      language: this.get('language'),
      compactMode: this.get('compactMode')
    };
  }

  /**
   * 获取数据管理配置
   */
  getDataConfig() {
    return {
      autoSave: this.get('autoSave'),
      maxChatHistory: this.get('maxChatHistory'),
      maxMemoryEntries: this.get('maxMemoryEntries'),
      dataRetentionDays: this.get('dataRetentionDays'),
      autoBackupEnabled: this.get('autoBackupEnabled'),
      autoBackupInterval: this.get('autoBackupInterval')
    };
  }

  /**
   * 检查是否需要自动备份
   */
  shouldAutoBackup() {
    if (!this.get('autoBackupEnabled')) {
      return false;
    }
    
    const lastBackup = this.get('lastBackupDate');
    if (!lastBackup) {
      return true;
    }
    
    const daysSinceBackup = (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceBackup >= this.get('autoBackupInterval');
  }

  /**
   * 更新最后备份时间
   */
  async updateLastBackupDate() {
    await this.set('lastBackupDate', new Date().toISOString());
  }

  /**
   * 添加事件监听器
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  _triggerEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件处理器错误 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 获取设置统计信息
   */
  getStats() {
    return {
      totalSettings: Object.keys(this.settings).length,
      defaultSettings: Object.keys(this.defaultSettings).length,
      customizedSettings: Object.keys(this.settings).filter(key => 
        this.settings[key] !== this.defaultSettings[key]
      ).length,
      isInitialized: this.isInitialized
    };
  }

  /**
   * 获取配置模板
   */
  getConfigTemplate(category = null) {
    const templates = {
      api: {
        apiProvider: this.defaultSettings.apiProvider,
        volcanoApiKey: '',
        volcanoEndpoint: this.defaultSettings.volcanoEndpoint,
        volcanoModel: this.defaultSettings.volcanoModel,
        ollamaEndpoint: this.defaultSettings.ollamaEndpoint,
        ollamaModel: this.defaultSettings.ollamaModel
      },
      ui: {
        theme: this.defaultSettings.theme,
        language: this.defaultSettings.language,
        compactMode: this.defaultSettings.compactMode,
        enableNotifications: this.defaultSettings.enableNotifications,
        soundEnabled: this.defaultSettings.soundEnabled
      },
      data: {
        autoSave: this.defaultSettings.autoSave,
        maxChatHistory: this.defaultSettings.maxChatHistory,
        maxMemoryEntries: this.defaultSettings.maxMemoryEntries,
        dataRetentionDays: this.defaultSettings.dataRetentionDays,
        autoBackupEnabled: this.defaultSettings.autoBackupEnabled,
        autoBackupInterval: this.defaultSettings.autoBackupInterval
      },
      privacy: {
        dataStorageConsent: this.defaultSettings.dataStorageConsent,
        analyticsEnabled: this.defaultSettings.analyticsEnabled
      },
      advanced: {
        debugMode: this.defaultSettings.debugMode,
        experimentalFeatures: this.defaultSettings.experimentalFeatures
      }
    };
    
    return category ? templates[category] : { ...this.defaultSettings };
  }

  /**
   * 验证配置完整性
   */
  validateConfiguration() {
    const issues = [];
    
    // 检查必需的设置
    const requiredSettings = ['apiProvider', 'theme', 'language'];
    for (const key of requiredSettings) {
      if (!this.settings.hasOwnProperty(key) || this.settings[key] === null || this.settings[key] === undefined) {
        issues.push({
          type: 'missing',
          key,
          message: `缺少必需的设置项: ${key}`
        });
      }
    }
    
    // 检查API配置
    if (this.settings.apiProvider === 'volcano' && !this.settings.volcanoApiKey) {
      issues.push({
        type: 'incomplete',
        key: 'volcanoApiKey',
        message: '火山引擎API密钥未配置'
      });
    }
    
    // 检查数值范围
    const numericChecks = [
      { key: 'maxChatHistory', min: 100, max: 10000 },
      { key: 'maxMemoryEntries', min: 100, max: 5000 },
      { key: 'dataRetentionDays', min: 1, max: 365 },
      { key: 'autoBackupInterval', min: 1, max: 30 }
    ];
    
    for (const check of numericChecks) {
      const value = this.settings[check.key];
      if (typeof value === 'number' && (value < check.min || value > check.max)) {
        issues.push({
          type: 'range',
          key: check.key,
          message: `${check.key} 值超出有效范围 (${check.min}-${check.max}): ${value}`
        });
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * 自动修复配置问题
   */
  async autoFixConfiguration() {
    const validation = this.validateConfiguration();
    
    if (validation.isValid) {
      return { fixed: 0, issues: [] };
    }
    
    const fixedIssues = [];
    
    for (const issue of validation.issues) {
      try {
        switch (issue.type) {
          case 'missing':
            if (this.defaultSettings.hasOwnProperty(issue.key)) {
              await this.set(issue.key, this.defaultSettings[issue.key]);
              fixedIssues.push(issue);
            }
            break;
            
          case 'range':
            const defaultValue = this.defaultSettings[issue.key];
            if (defaultValue !== undefined) {
              await this.set(issue.key, defaultValue);
              fixedIssues.push(issue);
            }
            break;
        }
      } catch (error) {
        console.error(`修复配置问题失败 (${issue.key}):`, error);
      }
    }
    
    console.log(`自动修复了 ${fixedIssues.length} 个配置问题`);
    
    return {
      fixed: fixedIssues.length,
      issues: fixedIssues
    };
  }

  /**
   * 生成配置报告
   */
  generateConfigReport() {
    const validation = this.validateConfiguration();
    const stats = this.getStats();
    
    const report = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      validation,
      statistics: stats,
      configuration: {
        api: this.getApiConfig(),
        ui: this.getUiConfig(),
        data: this.getDataConfig()
      },
      customizations: Object.keys(this.settings).filter(key => 
        this.settings[key] !== this.defaultSettings[key]
      ).map(key => ({
        key,
        current: this.settings[key],
        default: this.defaultSettings[key]
      }))
    };
    
    return report;
  }

  /**
   * 监控设置变化
   */
  startChangeMonitoring(callback, options = {}) {
    const { 
      debounceMs = 1000,
      includeKeys = null,
      excludeKeys = null 
    } = options;
    
    let changeTimeout;
    const changes = [];
    
    const handleChange = (data) => {
      // 过滤键
      if (includeKeys && !includeKeys.includes(data.key)) return;
      if (excludeKeys && excludeKeys.includes(data.key)) return;
      
      changes.push({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      // 防抖处理
      clearTimeout(changeTimeout);
      changeTimeout = setTimeout(() => {
        if (changes.length > 0) {
          callback([...changes]);
          changes.length = 0;
        }
      }, debounceMs);
    };
    
    this.addEventListener('settingChanged', handleChange);
    
    // 返回停止监控的函数
    return () => {
      this.removeEventListener('settingChanged', handleChange);
      clearTimeout(changeTimeout);
    };
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.eventListeners.clear();
    console.log('设置管理器已清理');
  }
}

// 导出设置管理器
window.AIChat = window.AIChat || {};
window.AIChat.SettingsManager = SettingsManager;

console.log('设置管理器模块已加载');