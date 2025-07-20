/**
 * 测试套件和调试工具
 * 提供核心功能的单元测试、API模拟测试和数据完整性检查
 */

class TestSuite {
  constructor() {
    this.tests = new Map();
    this.mockData = new Map();
    this.testResults = [];
    this.isRunning = false;
    this.debugMode = false;
    
    // 测试配置
    this.config = {
      timeout: 5000,
      retries: 3,
      parallel: false,
      verbose: true
    };
    
    // 模拟数据生成器
    this.dataGenerator = new TestDataGenerator();
    
    // API模拟器
    this.apiMocker = new APIMocker();
    
    // 数据完整性检查器
    this.integrityChecker = new DataIntegrityChecker();
    
    this.initializeTests();
  }

  /**
   * 初始化所有测试用例
   */
  initializeTests() {
    // 核心功能测试
    this.registerCoreTests();
    
    // 存储测试
    this.registerStorageTests();
    
    // API测试
    this.registerAPITests();
    
    // 人格管理测试
    this.registerPersonaTests();
    
    // 聊天管理测试
    this.registerChatTests();
    
    // 性能测试
    this.registerPerformanceTests();
    
    // 集成测试
    this.registerIntegrationTests();
    
    console.log(`测试套件初始化完成，共 ${this.tests.size} 个测试用例`);
  }

  /**
   * 注册核心功能测试
   */
  registerCoreTests() {
    this.addTest('core-utils-generateId', async () => {
      const id1 = AIChat.Utils.generateId();
      const id2 = AIChat.Utils.generateId();
      
      this.assert(typeof id1 === 'string', 'ID应该是字符串');
      this.assert(id1.length > 0, 'ID不应该为空');
      this.assert(id1 !== id2, '生成的ID应该是唯一的');
      
      return { success: true, message: 'ID生成功能正常' };
    });

    this.addTest('core-utils-formatTime', async () => {
      const now = new Date();
      const formatted = AIChat.Utils.formatTime(now);
      
      this.assert(typeof formatted === 'string', '格式化时间应该是字符串');
      this.assert(formatted === '刚刚', '当前时间应该显示为"刚刚"');
      
      const pastTime = new Date(now.getTime() - 5 * 60 * 1000); // 5分钟前
      const pastFormatted = AIChat.Utils.formatTime(pastTime);
      this.assert(pastFormatted.includes('分钟前'), '过去时间应该显示分钟');
      
      return { success: true, message: '时间格式化功能正常' };
    });

    this.addTest('core-utils-validation', async () => {
      // 测试人格名称验证
      this.assert(AIChat.Utils.validate.personaName('测试人格'), '有效人格名称应该通过验证');
      this.assert(!AIChat.Utils.validate.personaName(''), '空人格名称应该验证失败');
      this.assert(!AIChat.Utils.validate.personaName('a'.repeat(51)), '过长人格名称应该验证失败');
      
      // 测试提示词验证
      this.assert(AIChat.Utils.validate.prompt('测试提示词'), '有效提示词应该通过验证');
      this.assert(!AIChat.Utils.validate.prompt(''), '空提示词应该验证失败');
      
      // 测试对话对数验证
      this.assert(AIChat.Utils.validate.dialogPairs([1, 2]), '偶数个对话应该通过验证');
      this.assert(!AIChat.Utils.validate.dialogPairs([1, 2, 3]), '奇数个对话应该验证失败');
      
      return { success: true, message: '数据验证功能正常' };
    });
  }

  /**
   * 注册存储测试
   */
  registerStorageTests() {
    this.addTest('storage-initialization', async () => {
      const storage = new AIChat.StorageService();
      await storage.init();
      
      this.assert(storage.isReady, '存储服务应该初始化成功');
      
      storage.close();
      return { success: true, message: '存储服务初始化正常' };
    });

    this.addTest('storage-persona-crud', async () => {
      const storage = new AIChat.StorageService();
      await storage.init();
      
      // 创建测试人格
      const testPersona = this.dataGenerator.generatePersona();
      await storage.savePersona(testPersona);
      
      // 读取人格
      const savedPersona = await storage.getPersona(testPersona.id);
      this.assert(savedPersona !== null, '应该能够读取保存的人格');
      this.assert(savedPersona.id === testPersona.id, '读取的人格ID应该匹配');
      this.assert(savedPersona.name === testPersona.name, '读取的人格名称应该匹配');
      
      // 更新人格
      savedPersona.name = '更新后的名称';
      await storage.savePersona(savedPersona);
      
      const updatedPersona = await storage.getPersona(testPersona.id);
      this.assert(updatedPersona.name === '更新后的名称', '人格应该能够更新');
      
      // 删除人格
      await storage.deletePersona(testPersona.id);
      const deletedPersona = await storage.getPersona(testPersona.id);
      this.assert(deletedPersona === undefined, '删除的人格应该不存在');
      
      storage.close();
      return { success: true, message: '人格CRUD操作正常' };
    });

    this.addTest('storage-message-operations', async () => {
      const storage = new AIChat.StorageService();
      await storage.init();
      
      const testPersonaId = 'test-persona-' + Date.now();
      const testMessages = this.dataGenerator.generateMessages(testPersonaId, 10);
      
      // 保存消息
      for (const message of testMessages) {
        await storage.saveMessage(message);
      }
      
      // 读取聊天历史
      const chatHistory = await storage.loadChatHistory(testPersonaId, 5);
      this.assert(chatHistory.length === 5, '应该返回指定数量的消息');
      this.assert(chatHistory[0].personaId === testPersonaId, '消息应该属于正确的人格');
      
      // 清空聊天历史
      await storage.clearChatHistory(testPersonaId);
      const emptyChatHistory = await storage.loadChatHistory(testPersonaId);
      this.assert(emptyChatHistory.length === 0, '清空后应该没有消息');
      
      storage.close();
      return { success: true, message: '消息操作正常' };
    });

    this.addTest('storage-settings-operations', async () => {
      const storage = new AIChat.StorageService();
      await storage.init();
      
      // 保存设置
      await storage.saveSetting('testKey', 'testValue');
      
      // 读取设置
      const value = await storage.loadSetting('testKey');
      this.assert(value === 'testValue', '应该能够读取保存的设置');
      
      // 读取不存在的设置
      const defaultValue = await storage.loadSetting('nonExistentKey', 'default');
      this.assert(defaultValue === 'default', '不存在的设置应该返回默认值');
      
      // 删除设置
      await storage.deleteSetting('testKey');
      const deletedValue = await storage.loadSetting('testKey');
      this.assert(deletedValue === null, '删除的设置应该返回null');
      
      storage.close();
      return { success: true, message: '设置操作正常' };
    });
  }

  /**
   * 注册API测试
   */
  registerAPITests() {
    this.addTest('api-mock-volcano', async () => {
      // 设置模拟响应
      this.apiMocker.mockVolcanoAPI({
        choices: [{
          message: {
            role: 'assistant',
            content: '这是模拟的火山引擎响应'
          }
        }]
      });
      
      const apiService = new AIChat.APIService();
      const testMessages = [
        { role: 'user', content: '测试消息' }
      ];
      
      const response = await apiService.callVolcanoAPI(testMessages, 'test-model');
      this.assert(response.content === '这是模拟的火山引擎响应', '应该返回模拟响应');
      
      return { success: true, message: '火山引擎API模拟正常' };
    });

    this.addTest('api-mock-ollama', async () => {
      // 设置模拟响应
      this.apiMocker.mockOllamaAPI({
        message: {
          role: 'assistant',
          content: '这是模拟的Ollama响应'
        }
      });
      
      const apiService = new AIChat.APIService();
      const testMessages = [
        { role: 'user', content: '测试消息' }
      ];
      
      const response = await apiService.callOllamaAPI(testMessages, 'test-model');
      this.assert(response.content === '这是模拟的Ollama响应', '应该返回模拟响应');
      
      return { success: true, message: 'Ollama API模拟正常' };
    });

    this.addTest('api-error-handling', async () => {
      // 设置模拟错误
      this.apiMocker.mockError('network-error');
      
      const apiService = new AIChat.APIService();
      const testMessages = [
        { role: 'user', content: '测试消息' }
      ];
      
      try {
        await apiService.callVolcanoAPI(testMessages, 'test-model');
        this.assert(false, '应该抛出错误');
      } catch (error) {
        this.assert(error.message.includes('network'), '应该是网络错误');
      }
      
      return { success: true, message: 'API错误处理正常' };
    });
  }

  /**
   * 注册人格管理测试
   */
  registerPersonaTests() {
    this.addTest('persona-manager-crud', async () => {
      const storage = new AIChat.StorageService();
      await storage.init();
      
      const personaManager = new AIChat.PersonaManager(storage);
      await personaManager.init();
      
      // 创建人格
      const testPersona = this.dataGenerator.generatePersona();
      const createdPersona = await personaManager.createPersona(testPersona);
      
      this.assert(createdPersona.id, '创建的人格应该有ID');
      this.assert(createdPersona.name === testPersona.name, '人格名称应该匹配');
      
      // 获取所有人格
      const allPersonas = await personaManager.getAllPersonas();
      this.assert(allPersonas.length > 0, '应该有人格存在');
      
      // 更新人格
      createdPersona.name = '更新后的名称';
      const updatedPersona = await personaManager.updatePersona(createdPersona.id, createdPersona);
      this.assert(updatedPersona.name === '更新后的名称', '人格应该能够更新');
      
      // 删除人格
      await personaManager.deletePersona(createdPersona.id);
      const deletedPersona = await personaManager.getPersona(createdPersona.id);
      this.assert(!deletedPersona, '删除的人格应该不存在');
      
      storage.close();
      return { success: true, message: '人格管理器CRUD操作正常' };
    });

    this.addTest('persona-validation', async () => {
      const storage = new AIChat.StorageService();
      await storage.init();
      
      const personaManager = new AIChat.PersonaManager(storage);
      await personaManager.init();
      
      // 测试无效数据
      try {
        await personaManager.createPersona({
          name: '', // 空名称
          prompt: '测试提示词'
        });
        this.assert(false, '应该验证失败');
      } catch (error) {
        this.assert(error.message.includes('名称'), '应该是名称验证错误');
      }
      
      // 测试奇数对话对
      try {
        await personaManager.createPersona({
          name: '测试人格',
          prompt: '测试提示词',
          beginDialogs: [
            { role: 'user', content: '测试' }
          ]
        });
        this.assert(false, '应该验证失败');
      } catch (error) {
        this.assert(error.message.includes('对话'), '应该是对话验证错误');
      }
      
      storage.close();
      return { success: true, message: '人格数据验证正常' };
    });
  }

  /**
   * 注册聊天管理测试
   */
  registerChatTests() {
    this.addTest('chat-manager-operations', async () => {
      const storage = new AIChat.StorageService();
      await storage.init();
      
      const chatManager = new AIChat.ChatManager(storage);
      const testPersonaId = 'test-persona-' + Date.now();
      
      // 发送消息
      const userMessage = await chatManager.sendMessage('测试用户消息', testPersonaId, 'user');
      this.assert(userMessage.id, '消息应该有ID');
      this.assert(userMessage.content === '测试用户消息', '消息内容应该匹配');
      
      const aiMessage = await chatManager.sendMessage('测试AI回复', testPersonaId, 'assistant');
      this.assert(aiMessage.role === 'assistant', 'AI消息角色应该正确');
      
      // 获取聊天历史
      const chatHistory = await chatManager.getChatHistory(testPersonaId);
      this.assert(chatHistory.length === 2, '应该有2条消息');
      
      // 搜索消息
      const searchResults = await chatManager.searchMessages(testPersonaId, '测试');
      this.assert(searchResults.length === 2, '搜索应该找到2条消息');
      
      // 获取消息统计
      const stats = await chatManager.getMessageStats(testPersonaId);
      this.assert(stats.totalMessages === 2, '统计应该显示2条消息');
      this.assert(stats.userMessages === 1, '应该有1条用户消息');
      this.assert(stats.assistantMessages === 1, '应该有1条AI消息');
      
      // 清空聊天历史
      await chatManager.clearChatHistory(testPersonaId);
      const emptyChatHistory = await chatManager.getChatHistory(testPersonaId);
      this.assert(emptyChatHistory.length === 0, '清空后应该没有消息');
      
      storage.close();
      return { success: true, message: '聊天管理器操作正常' };
    });

    this.addTest('chat-message-compression', async () => {
      const storage = new AIChat.StorageService();
      await storage.init();
      
      const chatManager = new AIChat.ChatManager(storage);
      const testPersonaId = 'test-persona-' + Date.now();
      
      // 发送长消息（触发压缩）
      const longContent = 'a'.repeat(1000);
      const longMessage = await chatManager.sendMessage(longContent, testPersonaId, 'user');
      
      this.assert(longMessage.metadata.compressed, '长消息应该被压缩');
      this.assert(longMessage.originalLength === 1000, '应该记录原始长度');
      
      // 获取消息时应该自动解压缩
      const chatHistory = await chatManager.getChatHistory(testPersonaId);
      this.assert(chatHistory[0].content === longContent, '获取时应该自动解压缩');
      
      storage.close();
      return { success: true, message: '消息压缩功能正常' };
    });
  }

  /**
   * 注册性能测试
   */
  registerPerformanceTests() {
    this.addTest('performance-large-dataset', async () => {
      const storage = new AIChat.StorageService();
      await storage.init();
      
      const chatManager = new AIChat.ChatManager(storage);
      const testPersonaId = 'perf-test-' + Date.now();
      
      const startTime = performance.now();
      
      // 创建大量消息
      const messagePromises = [];
      for (let i = 0; i < 100; i++) {
        messagePromises.push(
          chatManager.sendMessage(`测试消息 ${i}`, testPersonaId, i % 2 === 0 ? 'user' : 'assistant')
        );
      }
      
      await Promise.all(messagePromises);
      
      const saveTime = performance.now() - startTime;
      
      // 测试读取性能
      const readStartTime = performance.now();
      const chatHistory = await chatManager.getChatHistory(testPersonaId, 50);
      const readTime = performance.now() - readStartTime;
      
      this.assert(chatHistory.length === 50, '应该返回50条消息');
      this.assert(saveTime < 5000, '保存100条消息应该在5秒内完成');
      this.assert(readTime < 1000, '读取50条消息应该在1秒内完成');
      
      // 清理测试数据
      await chatManager.clearChatHistory(testPersonaId);
      
      storage.close();
      return { 
        success: true, 
        message: `性能测试通过 - 保存: ${saveTime.toFixed(2)}ms, 读取: ${readTime.toFixed(2)}ms` 
      };
    });

    this.addTest('performance-memory-usage', async () => {
      if (!('memory' in performance)) {
        return { success: true, message: '浏览器不支持内存监控，跳过测试' };
      }
      
      const initialMemory = performance.memory.usedJSHeapSize;
      
      // 创建大量对象
      const objects = [];
      for (let i = 0; i < 10000; i++) {
        objects.push(this.dataGenerator.generateMessage('test-persona', 'user'));
      }
      
      const peakMemory = performance.memory.usedJSHeapSize;
      
      // 清理对象
      objects.length = 0;
      
      // 强制垃圾回收（如果可能）
      if (window.gc) {
        window.gc();
      }
      
      // 等待一段时间让垃圾回收生效
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;
      
      this.assert(memoryIncrease < 10 * 1024 * 1024, '内存增长应该小于10MB');
      
      return { 
        success: true, 
        message: `内存使用正常 - 增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB` 
      };
    });
  }

  /**
   * 注册集成测试
   */
  registerIntegrationTests() {
    this.addTest('integration-full-conversation-flow', async () => {
      // 模拟完整的对话流程
      const storage = new AIChat.StorageService();
      await storage.init();
      
      const personaManager = new AIChat.PersonaManager(storage);
      await personaManager.init();
      
      const chatManager = new AIChat.ChatManager(storage);
      
      // 创建测试人格
      const testPersona = this.dataGenerator.generatePersona();
      const createdPersona = await personaManager.createPersona(testPersona);
      
      // 设置为当前人格
      personaManager.setCurrentPersona(createdPersona);
      
      // 模拟对话
      await chatManager.sendMessage('你好', createdPersona.id, 'user');
      await chatManager.sendMessage('你好！很高兴见到你。', createdPersona.id, 'assistant');
      await chatManager.sendMessage('今天天气怎么样？', createdPersona.id, 'user');
      await chatManager.sendMessage('今天天气很好，阳光明媚。', createdPersona.id, 'assistant');
      
      // 验证对话历史
      const chatHistory = await chatManager.getChatHistory(createdPersona.id);
      this.assert(chatHistory.length === 4, '应该有4条消息');
      
      // 验证消息统计
      const stats = await chatManager.getMessageStats(createdPersona.id);
      this.assert(stats.userMessages === 2, '应该有2条用户消息');
      this.assert(stats.assistantMessages === 2, '应该有2条AI消息');
      
      // 导出聊天记录
      const exportedChat = await chatManager.exportChatHistory(createdPersona.id, 'json');
      this.assert(exportedChat.includes('你好'), '导出的聊天记录应该包含对话内容');
      
      // 清理测试数据
      await personaManager.deletePersona(createdPersona.id);
      
      storage.close();
      return { success: true, message: '完整对话流程测试通过' };
    });

    this.addTest('integration-data-consistency', async () => {
      const storage = new AIChat.StorageService();
      await storage.init();
      
      // 运行数据完整性检查
      const integrityResults = await this.integrityChecker.checkAll(storage);
      
      this.assert(integrityResults.personas.valid, '人格数据应该完整');
      this.assert(integrityResults.messages.valid, '消息数据应该完整');
      this.assert(integrityResults.settings.valid, '设置数据应该完整');
      
      storage.close();
      return { success: true, message: '数据一致性检查通过' };
    });
  }

  /**
   * 添加测试用例
   */
  addTest(name, testFunction, options = {}) {
    this.tests.set(name, {
      name,
      function: testFunction,
      timeout: options.timeout || this.config.timeout,
      retries: options.retries || this.config.retries,
      category: options.category || 'general',
      description: options.description || ''
    });
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    if (this.isRunning) {
      throw new Error('测试正在运行中');
    }
    
    this.isRunning = true;
    this.testResults = [];
    
    console.log('开始运行测试套件...');
    const startTime = performance.now();
    
    try {
      const testEntries = Array.from(this.tests.entries());
      
      if (this.config.parallel) {
        // 并行运行测试
        const promises = testEntries.map(([name, test]) => this.runSingleTest(name, test));
        await Promise.all(promises);
      } else {
        // 串行运行测试
        for (const [name, test] of testEntries) {
          await this.runSingleTest(name, test);
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const summary = this.generateTestSummary(duration);
      console.log('测试套件运行完成:', summary);
      
      return summary;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 运行单个测试
   */
  async runSingleTest(name, test) {
    const result = {
      name,
      category: test.category,
      startTime: performance.now(),
      endTime: null,
      duration: 0,
      success: false,
      error: null,
      message: '',
      retryCount: 0
    };
    
    for (let attempt = 0; attempt <= test.retries; attempt++) {
      try {
        if (this.config.verbose) {
          console.log(`运行测试: ${name} (尝试 ${attempt + 1}/${test.retries + 1})`);
        }
        
        // 设置超时
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('测试超时')), test.timeout);
        });
        
        // 运行测试
        const testPromise = test.function.call(this);
        const testResult = await Promise.race([testPromise, timeoutPromise]);
        
        result.success = true;
        result.message = testResult.message || '测试通过';
        result.retryCount = attempt;
        break;
        
      } catch (error) {
        result.error = error;
        result.message = error.message;
        result.retryCount = attempt;
        
        if (attempt === test.retries) {
          result.success = false;
          if (this.config.verbose) {
            console.error(`测试失败: ${name}`, error);
          }
        } else {
          if (this.config.verbose) {
            console.warn(`测试失败，准备重试: ${name}`, error.message);
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
        }
      }
    }
    
    result.endTime = performance.now();
    result.duration = result.endTime - result.startTime;
    
    this.testResults.push(result);
    return result;
  }

  /**
   * 运行特定类别的测试
   */
  async runTestsByCategory(category) {
    const categoryTests = Array.from(this.tests.entries())
      .filter(([_, test]) => test.category === category);
    
    if (categoryTests.length === 0) {
      throw new Error(`没有找到类别为 "${category}" 的测试`);
    }
    
    this.isRunning = true;
    this.testResults = [];
    
    try {
      for (const [name, test] of categoryTests) {
        await this.runSingleTest(name, test);
      }
      
      return this.generateTestSummary();
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 运行单个测试用例
   */
  async runTest(testName) {
    const test = this.tests.get(testName);
    if (!test) {
      throw new Error(`测试 "${testName}" 不存在`);
    }
    
    this.testResults = [];
    const result = await this.runSingleTest(testName, test);
    
    return {
      total: 1,
      passed: result.success ? 1 : 0,
      failed: result.success ? 0 : 1,
      duration: result.duration,
      results: [result]
    };
  }

  /**
   * 生成测试摘要
   */
  generateTestSummary(totalDuration = null) {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.success).length;
    const failed = total - passed;
    
    const summary = {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total * 100).toFixed(2) + '%' : '0%',
      duration: totalDuration || this.testResults.reduce((sum, r) => sum + r.duration, 0),
      results: this.testResults,
      categories: this.groupResultsByCategory()
    };
    
    return summary;
  }

  /**
   * 按类别分组测试结果
   */
  groupResultsByCategory() {
    const categories = {};
    
    this.testResults.forEach(result => {
      const category = result.category || 'general';
      if (!categories[category]) {
        categories[category] = {
          total: 0,
          passed: 0,
          failed: 0,
          results: []
        };
      }
      
      categories[category].total++;
      if (result.success) {
        categories[category].passed++;
      } else {
        categories[category].failed++;
      }
      categories[category].results.push(result);
    });
    
    return categories;
  }

  /**
   * 断言函数
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(`断言失败: ${message}`);
    }
  }

  /**
   * 获取测试列表
   */
  getTestList() {
    return Array.from(this.tests.entries()).map(([name, test]) => ({
      name,
      category: test.category,
      description: test.description,
      timeout: test.timeout,
      retries: test.retries
    }));
  }

  /**
   * 清理测试数据
   */
  async cleanup() {
    // 清理模拟数据
    this.mockData.clear();
    
    // 重置API模拟器
    this.apiMocker.reset();
    
    // 清理测试结果
    this.testResults = [];
    
    console.log('测试环境已清理');
  }

  /**
   * 启用调试模式
   */
  enableDebugMode() {
    this.debugMode = true;
    this.config.verbose = true;
    console.log('调试模式已启用');
  }

  /**
   * 禁用调试模式
   */
  disableDebugMode() {
    this.debugMode = false;
    this.config.verbose = false;
    console.log('调试模式已禁用');
  }
}

/**
 * 测试数据生成器
 */
class TestDataGenerator {
  generatePersona(overrides = {}) {
    return {
      id: 'test-persona-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      name: '测试人格',
      prompt: '你是一个友好的AI助手，总是乐于帮助用户。',
      avatar: null,
      beginDialogs: [
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好！很高兴见到你。' }
      ],
      moodImitationDialogs: [
        { role: 'user', content: '今天心情不错' },
        { role: 'assistant', content: '那太好了！保持好心情很重要。' }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: false,
      ...overrides
    };
  }

  generateMessage(personaId, role = 'user', overrides = {}) {
    const contents = {
      user: ['你好', '今天天气怎么样？', '能帮我一个忙吗？', '谢谢你的帮助'],
      assistant: ['你好！很高兴见到你。', '今天天气很好。', '当然可以，我很乐意帮助你。', '不客气，随时为你服务。']
    };
    
    const roleContents = contents[role] || contents.user;
    const content = roleContents[Math.floor(Math.random() * roleContents.length)];
    
    return {
      id: 'test-message-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      personaId,
      role,
      content,
      timestamp: new Date(),
      metadata: {
        compressed: false,
        length: content.length,
        tokens: Math.ceil(content.length / 4)
      },
      ...overrides
    };
  }

  generateMessages(personaId, count = 10) {
    const messages = [];
    for (let i = 0; i < count; i++) {
      const role = i % 2 === 0 ? 'user' : 'assistant';
      messages.push(this.generateMessage(personaId, role));
    }
    return messages;
  }

  generateSettings() {
    return {
      defaultPersonaId: 'default-persona',
      apiSettings: {
        volcanoApiKey: 'test-api-key',
        ollamaEndpoint: 'http://localhost:11434',
        preferredModel: 'volcano'
      },
      uiSettings: {
        theme: 'light',
        language: 'zh-CN',
        autoSave: true
      }
    };
  }
}

/**
 * API模拟器
 */
class APIMocker {
  constructor() {
    this.mocks = new Map();
    this.originalFetch = null;
  }

  mockVolcanoAPI(response) {
    this.mocks.set('volcano', response);
    this.setupFetchMock();
  }

  mockOllamaAPI(response) {
    this.mocks.set('ollama', response);
    this.setupFetchMock();
  }

  mockError(errorType) {
    this.mocks.set('error', errorType);
    this.setupFetchMock();
  }

  setupFetchMock() {
    if (!this.originalFetch) {
      this.originalFetch = window.fetch;
    }
    
    window.fetch = async (url, options) => {
      // 检查是否有错误模拟
      if (this.mocks.has('error')) {
        const errorType = this.mocks.get('error');
        switch (errorType) {
          case 'network-error':
            throw new Error('Network error occurred');
          case 'timeout':
            throw new Error('Request timeout');
          default:
            throw new Error('Unknown error');
        }
      }
      
      // 检查API类型并返回模拟响应
      if (url.includes('volces.com') && this.mocks.has('volcano')) {
        return {
          ok: true,
          json: async () => this.mocks.get('volcano')
        };
      }
      
      if (url.includes('localhost:11434') && this.mocks.has('ollama')) {
        return {
          ok: true,
          json: async () => this.mocks.get('ollama')
        };
      }
      
      // 默认调用原始fetch
      return this.originalFetch(url, options);
    };
  }

  reset() {
    this.mocks.clear();
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }
}

/**
 * 数据完整性检查器
 */
class DataIntegrityChecker {
  async checkAll(storage) {
    const results = {
      personas: await this.checkPersonas(storage),
      messages: await this.checkMessages(storage),
      settings: await this.checkSettings(storage),
      overall: { valid: true, issues: [] }
    };
    
    // 检查整体一致性
    results.overall.valid = results.personas.valid && 
                           results.messages.valid && 
                           results.settings.valid;
    
    if (!results.overall.valid) {
      results.overall.issues = [
        ...results.personas.issues,
        ...results.messages.issues,
        ...results.settings.issues
      ];
    }
    
    return results;
  }

  async checkPersonas(storage) {
    const result = { valid: true, issues: [], count: 0 };
    
    try {
      const personas = await storage.loadPersonas();
      result.count = personas.length;
      
      for (const persona of personas) {
        // 检查必需字段
        if (!persona.id) {
          result.issues.push(`人格缺少ID: ${JSON.stringify(persona)}`);
          result.valid = false;
        }
        
        if (!persona.name || persona.name.trim() === '') {
          result.issues.push(`人格名称为空: ${persona.id}`);
          result.valid = false;
        }
        
        if (!persona.prompt || persona.prompt.trim() === '') {
          result.issues.push(`人格提示词为空: ${persona.id}`);
          result.valid = false;
        }
        
        // 检查对话对数
        if (persona.beginDialogs && persona.beginDialogs.length % 2 !== 0) {
          result.issues.push(`人格预设对话数量为奇数: ${persona.id}`);
          result.valid = false;
        }
        
        if (persona.moodImitationDialogs && persona.moodImitationDialogs.length % 2 !== 0) {
          result.issues.push(`人格风格模仿对话数量为奇数: ${persona.id}`);
          result.valid = false;
        }
        
        // 检查时间戳
        if (!persona.createdAt || !persona.updatedAt) {
          result.issues.push(`人格缺少时间戳: ${persona.id}`);
          result.valid = false;
        }
      }
    } catch (error) {
      result.valid = false;
      result.issues.push(`检查人格数据时出错: ${error.message}`);
    }
    
    return result;
  }

  async checkMessages(storage) {
    const result = { valid: true, issues: [], count: 0 };
    
    try {
      // 获取所有人格
      const personas = await storage.loadPersonas();
      
      for (const persona of personas) {
        const messages = await storage.loadChatHistory(persona.id, 1000);
        result.count += messages.length;
        
        for (const message of messages) {
          // 检查必需字段
          if (!message.id) {
            result.issues.push(`消息缺少ID: ${JSON.stringify(message)}`);
            result.valid = false;
          }
          
          if (!message.personaId) {
            result.issues.push(`消息缺少人格ID: ${message.id}`);
            result.valid = false;
          }
          
          if (!['user', 'assistant', 'system'].includes(message.role)) {
            result.issues.push(`消息角色无效: ${message.id} - ${message.role}`);
            result.valid = false;
          }
          
          if (!message.content || message.content.trim() === '') {
            result.issues.push(`消息内容为空: ${message.id}`);
            result.valid = false;
          }
          
          if (!message.timestamp) {
            result.issues.push(`消息缺少时间戳: ${message.id}`);
            result.valid = false;
          }
          
          // 检查人格ID是否存在
          if (message.personaId !== persona.id) {
            result.issues.push(`消息人格ID不匹配: ${message.id}`);
            result.valid = false;
          }
        }
      }
    } catch (error) {
      result.valid = false;
      result.issues.push(`检查消息数据时出错: ${error.message}`);
    }
    
    return result;
  }

  async checkSettings(storage) {
    const result = { valid: true, issues: [], count: 0 };
    
    try {
      const settings = await storage.loadAllSettings();
      result.count = Object.keys(settings).length;
      
      // 检查关键设置
      const requiredSettings = ['defaultPersonaId'];
      
      for (const setting of requiredSettings) {
        if (!(setting in settings)) {
          result.issues.push(`缺少必需设置: ${setting}`);
          result.valid = false;
        }
      }
      
      // 检查默认人格是否存在
      if (settings.defaultPersonaId) {
        const defaultPersona = await storage.getPersona(settings.defaultPersonaId);
        if (!defaultPersona) {
          result.issues.push(`默认人格不存在: ${settings.defaultPersonaId}`);
          result.valid = false;
        }
      }
    } catch (error) {
      result.valid = false;
      result.issues.push(`检查设置数据时出错: ${error.message}`);
    }
    
    return result;
  }
}

// 导出测试套件
window.AIChat = window.AIChat || {};
window.AIChat.TestSuite = TestSuite;
window.AIChat.TestDataGenerator = TestDataGenerator;
window.AIChat.APIMocker = APIMocker;
window.AIChat.DataIntegrityChecker = DataIntegrityChecker;

console.log('测试套件已加载');