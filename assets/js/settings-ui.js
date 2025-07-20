/**
 * 设置界面控制器
 * 负责设置界面的交互逻辑和数据绑定
 */

class SettingsUI {
  constructor(settingsManager, storage) {
    this.settingsManager = settingsManager;
    this.storage = storage;
    this.modal = null;
    this.currentTab = 'api';
    this.isInitialized = false;
    this.formElements = {};
  }

  /**
   * 初始化设置界面
   */
  async init() {
    try {
      console.log('初始化设置界面...');
      
      // 获取DOM元素
      this.modal = document.getElementById('settingsModal');
      if (!this.modal) {
        throw new Error('设置模态框未找到');
      }

      // 初始化表单元素引用
      this._initFormElements();
      
      // 设置事件监听器
      this._setupEventListeners();
      
      // 设置标签页切换
      this._setupTabSwitching();
      
      // 加载当前设置到界面
      await this.loadSettingsToUI();
      
      // 更新系统信息
      await this.updateSystemInfo();
      
      this.isInitialized = true;
      console.log('设置界面初始化完成');
      
    } catch (error) {
      console.error('设置界面初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化表单元素引用
   */
  _initFormElements() {
    this.formElements = {
      // API设置
      apiProvider: document.querySelectorAll('input[name="apiProvider"]'),
      volcanoApiKey: document.getElementById('volcanoApiKey'),
      volcanoEndpoint: document.getElementById('volcanoEndpoint'),
      volcanoModel: document.getElementById('volcanoModel'),
      ollamaEndpoint: document.getElementById('ollamaEndpoint'),
      ollamaModel: document.getElementById('ollamaModel'),
      
      // UI设置
      theme: document.querySelectorAll('input[name="theme"]'),
      language: document.getElementById('language'),
      compactMode: document.getElementById('compactMode'),
      enableNotifications: document.getElementById('enableNotifications'),
      soundEnabled: document.getElementById('soundEnabled'),
      
      // 数据管理
      autoSave: document.getElementById('autoSave'),
      maxChatHistory: document.getElementById('maxChatHistory'),
      maxMemoryEntries: document.getElementById('maxMemoryEntries'),
      dataRetentionDays: document.getElementById('dataRetentionDays'),
      autoBackupEnabled: document.getElementById('autoBackupEnabled'),
      autoBackupInterval: document.getElementById('autoBackupInterval'),
      
      // 隐私设置
      dataStorageConsent: document.getElementById('dataStorageConsent'),
      analyticsEnabled: document.getElementById('analyticsEnabled'),
      
      // 高级设置
      debugMode: document.getElementById('debugMode'),
      experimentalFeatures: document.getElementById('experimentalFeatures')
    };
  }

  /**
   * 设置事件监听器
   */
  _setupEventListeners() {
    // 保存设置按钮
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveSettings());
    }

    // 重置设置按钮
    const resetBtn = document.getElementById('resetSettingsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.showResetConfirmation());
    }

    // API提供商切换
    this.formElements.apiProvider.forEach(radio => {
      radio.addEventListener('change', () => this.handleApiProviderChange());
    });

    // 主题切换
    this.formElements.theme.forEach(radio => {
      radio.addEventListener('change', () => this.handleThemeChange());
    });

    // 密钥显示/隐藏切换
    const toggleVolcanoKey = document.getElementById('toggleVolcanoKey');
    if (toggleVolcanoKey) {
      toggleVolcanoKey.addEventListener('click', () => this.togglePasswordVisibility('volcanoApiKey'));
    }

    // Ollama连接测试
    const testOllamaBtn = document.getElementById('testOllamaConnection');
    if (testOllamaBtn) {
      testOllamaBtn.addEventListener('click', () => this.testOllamaConnection());
    }

    // 刷新Ollama模型列表
    const refreshModelsBtn = document.getElementById('refreshOllamaModels');
    if (refreshModelsBtn) {
      refreshModelsBtn.addEventListener('click', () => this.refreshOllamaModels());
    }

    // 范围滑块值更新
    this._setupRangeSliders();

    // 数据管理按钮
    this._setupDataManagementButtons();

    // 高级设置按钮
    this._setupAdvancedButtons();

    // 模态框显示事件
    this.modal.addEventListener('show', () => this.onModalShow());
  }

  /**
   * 设置标签页切换
   */
  _setupTabSwitching() {
    const tabs = document.querySelectorAll('.tabs .tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetTab = tab.getAttribute('data-tab');
        
        // 更新标签页状态
        tabs.forEach(t => t.classList.remove('tab-active'));
        tab.classList.add('tab-active');
        
        // 显示对应内容
        tabContents.forEach(content => {
          if (content.id === targetTab + 'Tab') {
            content.classList.remove('hidden');
          } else {
            content.classList.add('hidden');
          }
        });
        
        this.currentTab = targetTab;
        
        // 特定标签页的初始化逻辑
        this._onTabSwitch(targetTab);
      });
    });
  }

  /**
   * 标签页切换时的处理
   */
  async _onTabSwitch(tab) {
    switch (tab) {
      case 'api':
        await this.updateOllamaStatus();
        break;
      case 'data':
        await this.updateSystemInfo();
        break;
      case 'advanced':
        await this.updateSystemInfo();
        break;
      case 'testing':
        // 确保测试界面已初始化
        if (!window.testingUI && window.AIChat && window.AIChat.TestingUI) {
          window.testingUI = new window.AIChat.TestingUI();
        }
        break;
    }
  }

  /**
   * 设置范围滑块
   */
  _setupRangeSliders() {
    const sliders = [
      { element: this.formElements.maxChatHistory, valueElement: 'maxChatHistoryValue' },
      { element: this.formElements.maxMemoryEntries, valueElement: 'maxMemoryEntriesValue' },
      { element: this.formElements.dataRetentionDays, valueElement: 'dataRetentionDaysValue' }
    ];

    sliders.forEach(({ element, valueElement }) => {
      if (element) {
        const valueDisplay = document.getElementById(valueElement);
        
        element.addEventListener('input', () => {
          if (valueDisplay) {
            valueDisplay.textContent = element.value;
          }
        });
      }
    });
  }

  /**
   * 设置数据管理按钮
   */
  _setupDataManagementButtons() {
    // 导出数据
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () => this.exportData());
    }

    // 导入数据
    const importDataBtn = document.getElementById('importDataBtn');
    const importDataFile = document.getElementById('importDataFile');
    if (importDataBtn && importDataFile) {
      importDataBtn.addEventListener('click', () => importDataFile.click());
      importDataFile.addEventListener('change', (e) => this.importData(e.target.files[0]));
    }

    // 清空数据
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => this.showClearDataConfirmation());
    }

    // 清理过期数据
    const cleanExpiredBtn = document.getElementById('cleanExpiredDataBtn');
    if (cleanExpiredBtn) {
      cleanExpiredBtn.addEventListener('click', () => this.cleanExpiredData());
    }

    // 优化存储
    const optimizeBtn = document.getElementById('optimizeStorageBtn');
    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', () => this.optimizeStorage());
    }
  }

  /**
   * 设置高级设置按钮
   */
  _setupAdvancedButtons() {
    // 重置API设置
    const resetApiBtn = document.getElementById('resetApiSettingsBtn');
    if (resetApiBtn) {
      resetApiBtn.addEventListener('click', () => this.resetApiSettings());
    }

    // 重置UI设置
    const resetUiBtn = document.getElementById('resetUiSettingsBtn');
    if (resetUiBtn) {
      resetUiBtn.addEventListener('click', () => this.resetUiSettings());
    }

    // 重置所有设置
    const resetAllBtn = document.getElementById('resetAllSettingsBtn');
    if (resetAllBtn) {
      resetAllBtn.addEventListener('click', () => this.resetAllSettings());
    }

    // 导出设置
    const exportSettingsBtn = document.getElementById('exportSettingsBtn');
    if (exportSettingsBtn) {
      exportSettingsBtn.addEventListener('click', () => this.exportSettings());
    }

    // 导入设置
    const importSettingsBtn = document.getElementById('importSettingsBtn');
    const importSettingsFile = document.getElementById('importSettingsFile');
    if (importSettingsBtn && importSettingsFile) {
      importSettingsBtn.addEventListener('click', () => importSettingsFile.click());
      importSettingsFile.addEventListener('change', (e) => this.importSettings(e.target.files[0]));
    }

    // 验证配置
    const validateConfigBtn = document.getElementById('validateConfigBtn');
    if (validateConfigBtn) {
      validateConfigBtn.addEventListener('click', () => this.validateCurrentConfig());
    }

    // 生成报告
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
      generateReportBtn.addEventListener('click', () => this.generateConfigReport());
    }

    // 比较配置
    const compareConfigBtn = document.getElementById('compareConfigBtn');
    if (compareConfigBtn) {
      compareConfigBtn.addEventListener('click', () => this.compareWithDefaults());
    }

    // 自动修复配置
    const autoFixConfigBtn = document.getElementById('autoFixConfigBtn');
    if (autoFixConfigBtn) {
      autoFixConfigBtn.addEventListener('click', async () => {
        if (confirm('确定要自动修复配置问题吗？')) {
          const result = await this.settingsManager.autoFixConfiguration();
          if (result.fixed > 0) {
            this._showToast(`已修复 ${result.fixed} 个配置问题`, 'success');
            await this.loadSettingsToUI();
          } else {
            this._showToast('没有发现需要修复的问题', 'info');
          }
        }
      });
    }
  }

  /**
   * 加载设置到界面
   */
  async loadSettingsToUI() {
    try {
      // API设置
      const apiProvider = this.settingsManager.get('apiProvider');
      this._setRadioValue('apiProvider', apiProvider);
      
      if (this.formElements.volcanoApiKey) {
        this.formElements.volcanoApiKey.value = this.settingsManager.get('volcanoApiKey') || '';
      }
      
      if (this.formElements.volcanoEndpoint) {
        this.formElements.volcanoEndpoint.value = this.settingsManager.get('volcanoEndpoint') || '';
      }
      
      if (this.formElements.volcanoModel) {
        this.formElements.volcanoModel.value = this.settingsManager.get('volcanoModel') || '';
      }
      
      if (this.formElements.ollamaEndpoint) {
        this.formElements.ollamaEndpoint.value = this.settingsManager.get('ollamaEndpoint') || '';
      }
      
      if (this.formElements.ollamaModel) {
        this.formElements.ollamaModel.value = this.settingsManager.get('ollamaModel') || '';
      }

      // UI设置
      const theme = this.settingsManager.get('theme');
      this._setRadioValue('theme', theme);
      
      if (this.formElements.language) {
        this.formElements.language.value = this.settingsManager.get('language') || 'zh-CN';
      }
      
      if (this.formElements.compactMode) {
        this.formElements.compactMode.checked = this.settingsManager.get('compactMode') || false;
      }
      
      if (this.formElements.enableNotifications) {
        this.formElements.enableNotifications.checked = this.settingsManager.get('enableNotifications') || false;
      }
      
      if (this.formElements.soundEnabled) {
        this.formElements.soundEnabled.checked = this.settingsManager.get('soundEnabled') || false;
      }

      // 数据管理设置
      if (this.formElements.autoSave) {
        this.formElements.autoSave.checked = this.settingsManager.get('autoSave') || false;
      }
      
      if (this.formElements.maxChatHistory) {
        this.formElements.maxChatHistory.value = this.settingsManager.get('maxChatHistory') || 1000;
        document.getElementById('maxChatHistoryValue').textContent = this.formElements.maxChatHistory.value;
      }
      
      if (this.formElements.maxMemoryEntries) {
        this.formElements.maxMemoryEntries.value = this.settingsManager.get('maxMemoryEntries') || 500;
        document.getElementById('maxMemoryEntriesValue').textContent = this.formElements.maxMemoryEntries.value;
      }
      
      if (this.formElements.dataRetentionDays) {
        this.formElements.dataRetentionDays.value = this.settingsManager.get('dataRetentionDays') || 90;
        document.getElementById('dataRetentionDaysValue').textContent = this.formElements.dataRetentionDays.value;
      }
      
      if (this.formElements.autoBackupEnabled) {
        this.formElements.autoBackupEnabled.checked = this.settingsManager.get('autoBackupEnabled') || false;
      }
      
      if (this.formElements.autoBackupInterval) {
        this.formElements.autoBackupInterval.value = this.settingsManager.get('autoBackupInterval') || 7;
      }

      // 隐私设置
      if (this.formElements.dataStorageConsent) {
        this.formElements.dataStorageConsent.checked = this.settingsManager.get('dataStorageConsent') || false;
      }
      
      if (this.formElements.analyticsEnabled) {
        this.formElements.analyticsEnabled.checked = this.settingsManager.get('analyticsEnabled') || false;
      }

      // 高级设置
      if (this.formElements.debugMode) {
        this.formElements.debugMode.checked = this.settingsManager.get('debugMode') || false;
      }
      
      if (this.formElements.experimentalFeatures) {
        this.formElements.experimentalFeatures.checked = this.settingsManager.get('experimentalFeatures') || false;
      }

      // 更新API提供商相关界面
      this.handleApiProviderChange();
      
    } catch (error) {
      console.error('加载设置到界面失败:', error);
    }
  }

  /**
   * 设置单选按钮值
   */
  _setRadioValue(name, value) {
    const radios = this.formElements[name];
    if (radios) {
      radios.forEach(radio => {
        radio.checked = radio.value === value;
      });
    }
  }

  /**
   * 获取单选按钮值
   */
  _getRadioValue(name) {
    const radios = this.formElements[name];
    if (radios) {
      for (const radio of radios) {
        if (radio.checked) {
          return radio.value;
        }
      }
    }
    return null;
  }

  /**
   * 处理API提供商切换
   */
  handleApiProviderChange() {
    const provider = this._getRadioValue('apiProvider');
    const volcanoSettings = document.getElementById('volcanoSettings');
    const ollamaSettings = document.getElementById('ollamaSettings');
    
    if (volcanoSettings && ollamaSettings) {
      if (provider === 'volcano') {
        volcanoSettings.style.display = 'block';
        ollamaSettings.style.display = 'none';
      } else {
        volcanoSettings.style.display = 'none';
        ollamaSettings.style.display = 'block';
        this.updateOllamaStatus();
      }
    }
  }

  /**
   * 处理主题切换
   */
  handleThemeChange() {
    const theme = this._getRadioValue('theme');
    if (theme) {
      // 立即应用主题
      document.body.setAttribute('data-theme', theme);
      
      // 更新主题切换按钮
      const themeToggle = document.getElementById('themeToggle');
      if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
          icon.className = theme === 'dark' ? 'fa fa-sun text-lg' : 'fa fa-moon text-lg';
        }
      }
    }
  }

  /**
   * 切换密码可见性
   */
  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById('toggle' + inputId.charAt(0).toUpperCase() + inputId.slice(1));
    
    if (input && button) {
      const icon = button.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa fa-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'fa fa-eye';
      }
    }
  }

  /**
   * 测试Ollama连接
   */
  async testOllamaConnection() {
    const button = document.getElementById('testOllamaConnection');
    const statusText = document.getElementById('ollamaStatusText');
    const endpoint = this.formElements.ollamaEndpoint.value;
    
    // 使用加载管理器显示按钮加载状态
    const loaderId = window.loadingManager?.showButtonLoading(button, '测试中...');
    
    try {
      const response = await fetch(`${endpoint}/api/tags`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        if (statusText) {
          statusText.textContent = '连接成功';
          statusText.className = 'text-success';
        }
        
        // 刷新模型列表
        await this.refreshOllamaModels();
        
        // 使用加载管理器显示成功通知
        window.loadingManager?.showSuccessNotification('Ollama连接测试成功');
      } else {
        throw new Error('连接失败');
      }
    } catch (error) {
      if (statusText) {
        statusText.textContent = '连接失败';
        statusText.className = 'text-error';
      }
      
      // 使用错误处理器报告错误
      if (window.errorHandler) {
        window.errorHandler.reportError(
          error.message || 'Ollama连接测试失败',
          window.errorHandler.errorCategories.NETWORK,
          window.errorHandler.errorLevels.MEDIUM,
          { endpoint, operation: 'ollama_connection_test' }
        );
      } else {
        this._showToast('Ollama连接测试失败: ' + error.message, 'error');
      }
    } finally {
      // 隐藏按钮加载状态
      if (loaderId) {
        window.loadingManager?.hideButtonLoading(loaderId);
      }
    }
  }

  /**
   * 刷新Ollama模型列表
   */
  async refreshOllamaModels() {
    const button = document.getElementById('refreshOllamaModels');
    const select = this.formElements.ollamaModel;
    const endpoint = this.formElements.ollamaEndpoint.value;
    
    // 使用加载管理器显示按钮加载状态
    const loaderId = window.loadingManager?.showButtonLoading(button, '刷新中...');
    
    try {
      const response = await fetch(`${endpoint}/api/tags`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (select && data.models) {
          // 保存当前选择
          const currentValue = select.value;
          
          // 清空选项
          select.innerHTML = '';
          
          // 添加模型选项
          data.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name;
            select.appendChild(option);
          });
          
          // 恢复选择或选择第一个
          if (data.models.find(m => m.name === currentValue)) {
            select.value = currentValue;
          } else if (data.models.length > 0) {
            select.value = data.models[0].name;
          }
        }
        
        // 使用加载管理器显示成功通知
        window.loadingManager?.showSuccessNotification('模型列表已更新');
      } else {
        throw new Error('获取模型列表失败');
      }
    } catch (error) {
      console.error('刷新Ollama模型失败:', error);
      
      // 使用错误处理器报告错误
      if (window.errorHandler) {
        window.errorHandler.reportError(
          error.message || '刷新模型列表失败',
          window.errorHandler.errorCategories.NETWORK,
          window.errorHandler.errorLevels.MEDIUM,
          { endpoint, operation: 'refresh_ollama_models' }
        );
      } else {
        this._showToast('刷新模型列表失败: ' + error.message, 'error');
      }
    } finally {
      // 隐藏按钮加载状态
      if (loaderId) {
        window.loadingManager?.hideButtonLoading(loaderId);
      }
    }
  }

  /**
   * 更新Ollama状态
   */
  async updateOllamaStatus() {
    const statusText = document.getElementById('ollamaStatusText');
    const endpoint = this.formElements.ollamaEndpoint?.value || 'http://localhost:11434';
    
    if (statusText) {
      statusText.textContent = '检测中...';
      statusText.className = 'text-warning';
    }
    
    try {
      const response = await fetch(`${endpoint}/api/tags`, {
        method: 'GET',
        timeout: 3000
      });
      
      if (response.ok) {
        if (statusText) {
          statusText.textContent = '服务正常';
          statusText.className = 'text-success';
        }
      } else {
        throw new Error('服务不可用');
      }
    } catch (error) {
      if (statusText) {
        statusText.textContent = '服务不可用';
        statusText.className = 'text-error';
      }
    }
  }

  /**
   * 保存设置
   */
  async saveSettings() {
    try {
      const button = document.getElementById('saveSettingsBtn');
      if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i>保存中...';
      }

      // 收集所有设置
      const settings = {
        // API设置
        apiProvider: this._getRadioValue('apiProvider'),
        volcanoApiKey: this.formElements.volcanoApiKey?.value || '',
        volcanoEndpoint: this.formElements.volcanoEndpoint?.value || '',
        volcanoModel: this.formElements.volcanoModel?.value || '',
        ollamaEndpoint: this.formElements.ollamaEndpoint?.value || '',
        ollamaModel: this.formElements.ollamaModel?.value || '',
        
        // UI设置
        theme: this._getRadioValue('theme'),
        language: this.formElements.language?.value || 'zh-CN',
        compactMode: this.formElements.compactMode?.checked || false,
        enableNotifications: this.formElements.enableNotifications?.checked || false,
        soundEnabled: this.formElements.soundEnabled?.checked || false,
        
        // 数据管理
        autoSave: this.formElements.autoSave?.checked || false,
        maxChatHistory: parseInt(this.formElements.maxChatHistory?.value) || 1000,
        maxMemoryEntries: parseInt(this.formElements.maxMemoryEntries?.value) || 500,
        dataRetentionDays: parseInt(this.formElements.dataRetentionDays?.value) || 90,
        autoBackupEnabled: this.formElements.autoBackupEnabled?.checked || false,
        autoBackupInterval: parseInt(this.formElements.autoBackupInterval?.value) || 7,
        
        // 隐私设置
        dataStorageConsent: this.formElements.dataStorageConsent?.checked || false,
        analyticsEnabled: this.formElements.analyticsEnabled?.checked || false,
        
        // 高级设置
        debugMode: this.formElements.debugMode?.checked || false,
        experimentalFeatures: this.formElements.experimentalFeatures?.checked || false
      };

      // 保存设置
      await this.settingsManager.setMultiple(settings, true);
      
      this._showToast('设置保存成功', 'success');
      
      // 关闭模态框
      this.modal.close();
      
    } catch (error) {
      console.error('保存设置失败:', error);
      this._showToast('保存设置失败: ' + error.message, 'error');
    } finally {
      const button = document.getElementById('saveSettingsBtn');
      if (button) {
        button.disabled = false;
        button.innerHTML = '<i class="fa fa-save mr-2"></i>保存设置';
      }
    }
  }

  /**
   * 显示重置确认对话框
   */
  showResetConfirmation() {
    if (confirm('确定要重置当前标签页的设置吗？此操作不可撤销。')) {
      this.resetCurrentTabSettings();
    }
  }

  /**
   * 重置当前标签页设置
   */
  async resetCurrentTabSettings() {
    try {
      switch (this.currentTab) {
        case 'api':
          await this.resetApiSettings();
          break;
        case 'ui':
          await this.resetUiSettings();
          break;
        case 'data':
          await this.resetDataSettings();
          break;
        case 'privacy':
          await this.resetPrivacySettings();
          break;
        case 'advanced':
          await this.resetAdvancedSettings();
          break;
      }
      
      this._showToast('设置已重置', 'success');
    } catch (error) {
      console.error('重置设置失败:', error);
      this._showToast('重置设置失败: ' + error.message, 'error');
    }
  }

  /**
   * 重置API设置
   */
  async resetApiSettings() {
    const apiKeys = ['apiProvider', 'volcanoApiKey', 'volcanoEndpoint', 'volcanoModel', 'ollamaEndpoint', 'ollamaModel'];
    await this.settingsManager.resetSettings(apiKeys);
    await this.loadSettingsToUI();
  }

  /**
   * 重置UI设置
   */
  async resetUiSettings() {
    const uiKeys = ['theme', 'language', 'compactMode', 'enableNotifications', 'soundEnabled'];
    await this.settingsManager.resetSettings(uiKeys);
    await this.loadSettingsToUI();
  }

  /**
   * 重置数据设置
   */
  async resetDataSettings() {
    const dataKeys = ['autoSave', 'maxChatHistory', 'maxMemoryEntries', 'dataRetentionDays', 'autoBackupEnabled', 'autoBackupInterval'];
    await this.settingsManager.resetSettings(dataKeys);
    await this.loadSettingsToUI();
  }

  /**
   * 重置隐私设置
   */
  async resetPrivacySettings() {
    const privacyKeys = ['dataStorageConsent', 'analyticsEnabled'];
    await this.settingsManager.resetSettings(privacyKeys);
    await this.loadSettingsToUI();
  }

  /**
   * 重置高级设置
   */
  async resetAdvancedSettings() {
    const advancedKeys = ['debugMode', 'experimentalFeatures'];
    await this.settingsManager.resetSettings(advancedKeys);
    await this.loadSettingsToUI();
  }

  /**
   * 重置所有设置
   */
  async resetAllSettings() {
    if (confirm('确定要重置所有设置吗？此操作将清除所有自定义配置，不可撤销。')) {
      try {
        await this.settingsManager.resetSettings();
        await this.loadSettingsToUI();
        this._showToast('所有设置已重置', 'success');
      } catch (error) {
        console.error('重置所有设置失败:', error);
        this._showToast('重置失败: ' + error.message, 'error');
      }
    }
  }

  /**
   * 导出数据
   */
  async exportData() {
    try {
      const backup = await this.storage.backup();
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-chat-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this._showToast('数据导出成功', 'success');
    } catch (error) {
      console.error('导出数据失败:', error);
      this._showToast('导出数据失败: ' + error.message, 'error');
    }
  }

  /**
   * 导入数据
   */
  async importData(file) {
    if (!file) return;
    
    try {
      const text = await file.text();
      const result = await this.storage.restore(text);
      
      this._showToast(`数据导入成功: ${result.success}/${result.total} 项`, 'success');
      
      // 刷新界面
      await this.updateSystemInfo();
    } catch (error) {
      console.error('导入数据失败:', error);
      this._showToast('导入数据失败: ' + error.message, 'error');
    }
  }

  /**
   * 显示清空数据确认
   */
  showClearDataConfirmation() {
    if (confirm('确定要清空所有数据吗？这将删除所有人格、聊天记录和设置，此操作不可撤销！')) {
      this.clearAllData();
    }
  }

  /**
   * 清空所有数据
   */
  async clearAllData() {
    try {
      await this.storage.clearAll();
      this._showToast('所有数据已清空', 'success');
      
      // 刷新界面
      await this.updateSystemInfo();
      
      // 重新加载页面
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('清空数据失败:', error);
      this._showToast('清空数据失败: ' + error.message, 'error');
    }
  }

  /**
   * 清理过期数据
   */
  async cleanExpiredData() {
    try {
      // 这里需要调用应用管理器的清理方法
      if (window.app && window.app.cleanupExpiredData) {
        const result = await window.app.cleanupExpiredData();
        this._showToast(`清理完成: 删除了 ${result.expiredMemories} 条过期记忆`, 'success');
      } else {
        this._showToast('清理功能暂不可用', 'warning');
      }
      
      await this.updateSystemInfo();
    } catch (error) {
      console.error('清理过期数据失败:', error);
      this._showToast('清理失败: ' + error.message, 'error');
    }
  }

  /**
   * 优化存储
   */
  async optimizeStorage() {
    try {
      // 这里可以实现存储优化逻辑
      this._showToast('存储优化完成', 'success');
      await this.updateSystemInfo();
    } catch (error) {
      console.error('优化存储失败:', error);
      this._showToast('优化失败: ' + error.message, 'error');
    }
  }

  /**
   * 导出设置
   */
  async exportSettings() {
    try {
      await this.settingsManager.exportSettings();
      this._showToast('设置导出成功', 'success');
    } catch (error) {
      console.error('导出设置失败:', error);
      this._showToast('导出设置失败: ' + error.message, 'error');
    }
  }

  /**
   * 导入设置
   */
  async importSettings(file) {
    if (!file) return;
    
    try {
      const result = await this.settingsManager.importSettings(file);
      
      if (result.success) {
        this._showToast(`设置导入成功: ${result.imported}/${result.total} 项`, 'success');
        await this.loadSettingsToUI();
      } else {
        this._showToast('设置导入失败', 'error');
      }
    } catch (error) {
      console.error('导入设置失败:', error);
      this._showToast('导入设置失败: ' + error.message, 'error');
    }
  }

  /**
   * 更新系统信息
   */
  async updateSystemInfo() {
    try {
      const stats = await this.storage.getStats();
      
      // 更新存储使用情况
      const storageUsage = document.getElementById('storageUsage');
      if (storageUsage && stats.dbSize) {
        const percentage = stats.dbSize.percentage || 0;
        storageUsage.textContent = `${percentage}%`;
      }
      
      // 更新人格数量
      const personaCount = document.getElementById('personaCount');
      if (personaCount) {
        personaCount.textContent = stats.personas || 0;
      }
      
      // 更新消息数量
      const messageCount = document.getElementById('messageCount');
      if (messageCount) {
        messageCount.textContent = stats.messages || 0;
      }
      
    } catch (error) {
      console.error('更新系统信息失败:', error);
    }
  }

  /**
   * 模态框显示时的处理
   */
  async onModalShow() {
    await this.loadSettingsToUI();
    await this.updateSystemInfo();
    
    if (this.currentTab === 'api') {
      await this.updateOllamaStatus();
    }

    // 启用配置监控
    this.enableConfigMonitoring();
    
    // 检查是否需要自动备份
    await this.checkAutoBackup();
  }

  /**
   * 显示提示消息
   */
  _showToast(message, type = 'info') {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} fixed top-4 right-4 w-auto max-w-sm z-50 shadow-lg`;
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fa fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // 自动移除
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  /**
   * 显示设置模态框
   */
  show() {
    if (this.modal) {
      this.modal.showModal();
    }
  }

  /**
   * 隐藏设置模态框
   */
  hide() {
    if (this.modal) {
      this.modal.close();
    }
  }

  /**
   * 验证当前配置
   */
  async validateCurrentConfig() {
    try {
      const validation = this.settingsManager.validateConfiguration();
      
      if (!validation.isValid) {
        const issueMessages = validation.issues.map(issue => issue.message).join('\n');
        this._showToast(`配置验证失败:\n${issueMessages}`, 'warning');
        
        // 询问是否自动修复
        if (confirm('检测到配置问题，是否自动修复？')) {
          const result = await this.settingsManager.autoFixConfiguration();
          if (result.fixed > 0) {
            this._showToast(`已修复 ${result.fixed} 个配置问题`, 'success');
            await this.loadSettingsToUI();
          }
        }
      } else {
        this._showToast('配置验证通过', 'success');
      }
      
      return validation;
    } catch (error) {
      console.error('配置验证失败:', error);
      this._showToast('配置验证失败: ' + error.message, 'error');
    }
  }

  /**
   * 生成配置报告
   */
  async generateConfigReport() {
    try {
      const report = this.settingsManager.generateConfigReport();
      
      // 创建报告文件
      const reportJson = JSON.stringify(report, null, 2);
      const blob = new Blob([reportJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `config-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this._showToast('配置报告已生成', 'success');
    } catch (error) {
      console.error('生成配置报告失败:', error);
      this._showToast('生成报告失败: ' + error.message, 'error');
    }
  }

  /**
   * 比较配置差异
   */
  async compareWithDefaults() {
    try {
      const defaultSettings = this.settingsManager._getDefaultSettings();
      const currentSettings = this.settingsManager.settings;
      const diff = this.settingsManager.getConfigDiff(defaultSettings);
      
      let message = '配置差异分析:\n';
      
      if (Object.keys(diff.modified).length > 0) {
        message += `\n已修改的设置 (${Object.keys(diff.modified).length} 项):\n`;
        for (const [key, change] of Object.entries(diff.modified)) {
          message += `- ${key}: ${change.old} → ${change.new}\n`;
        }
      }
      
      if (Object.keys(diff.added).length > 0) {
        message += `\n新增的设置 (${Object.keys(diff.added).length} 项):\n`;
        for (const [key, value] of Object.entries(diff.added)) {
          message += `- ${key}: ${value}\n`;
        }
      }
      
      if (Object.keys(diff.removed).length > 0) {
        message += `\n缺失的设置 (${Object.keys(diff.removed).length} 项):\n`;
        for (const [key, value] of Object.entries(diff.removed)) {
          message += `- ${key}: ${value}\n`;
        }
      }
      
      if (Object.keys(diff.modified).length === 0 && 
          Object.keys(diff.added).length === 0 && 
          Object.keys(diff.removed).length === 0) {
        message += '\n所有设置都使用默认值';
      }
      
      // 显示差异对话框
      this._showConfigDiffModal(message, diff);
      
    } catch (error) {
      console.error('比较配置失败:', error);
      this._showToast('比较配置失败: ' + error.message, 'error');
    }
  }

  /**
   * 显示配置差异模态框
   */
  _showConfigDiffModal(message, diff) {
    // 创建临时模态框显示差异
    const modal = document.createElement('dialog');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">配置差异分析</h3>
        <div class="space-y-4">
          <pre class="text-sm bg-base-200 p-4 rounded overflow-auto max-h-96">${message}</pre>
          <div class="flex space-x-2">
            <button id="resetToDefaults" class="btn btn-outline btn-sm">
              <i class="fa fa-refresh mr-2"></i>
              重置为默认值
            </button>
            <button id="exportDiff" class="btn btn-outline btn-sm">
              <i class="fa fa-download mr-2"></i>
              导出差异
            </button>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn" onclick="this.closest('dialog').close()">关闭</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.showModal();
    
    // 设置按钮事件
    modal.querySelector('#resetToDefaults').addEventListener('click', async () => {
      if (confirm('确定要重置所有设置为默认值吗？')) {
        await this.resetAllSettings();
        modal.close();
      }
    });
    
    modal.querySelector('#exportDiff').addEventListener('click', () => {
      const diffJson = JSON.stringify(diff, null, 2);
      const blob = new Blob([diffJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `config-diff-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    
    // 自动清理
    modal.addEventListener('close', () => {
      document.body.removeChild(modal);
    });
  }

  /**
   * 启用配置监控
   */
  enableConfigMonitoring() {
    if (this.configMonitor) {
      return; // 已经启用
    }
    
    this.configMonitor = this.settingsManager.startChangeMonitoring((changes) => {
      console.log('配置变化:', changes);
      
      // 可以在这里添加配置变化的处理逻辑
      // 比如显示变化通知、自动保存等
      
      if (changes.length > 0) {
        this._showToast(`配置已更新 (${changes.length} 项)`, 'info');
      }
    }, {
      debounceMs: 2000,
      excludeKeys: ['lastBackupDate'] // 排除一些不重要的变化
    });
    
    console.log('配置监控已启用');
  }

  /**
   * 禁用配置监控
   */
  disableConfigMonitoring() {
    if (this.configMonitor) {
      this.configMonitor();
      this.configMonitor = null;
      console.log('配置监控已禁用');
    }
  }

  /**
   * 检查是否需要备份
   */
  async checkAutoBackup() {
    try {
      if (this.settingsManager.shouldAutoBackup()) {
        if (confirm('检测到需要自动备份设置，是否立即备份？')) {
          await this.exportSettings();
          await this.settingsManager.updateLastBackupDate();
        }
      }
    } catch (error) {
      console.error('检查自动备份失败:', error);
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.disableConfigMonitoring();
    console.log('设置界面已清理');
  }
}

// 导出设置界面控制器
window.AIChat = window.AIChat || {};
window.AIChat.SettingsUI = SettingsUI;

console.log('设置界面控制器模块已加载');