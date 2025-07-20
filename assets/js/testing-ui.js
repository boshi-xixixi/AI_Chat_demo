/**
 * 测试界面控制器
 * 管理测试界面的交互和显示
 */

class TestingUI {
  constructor() {
    this.testSuite = null;
    this.isRunning = false;
    this.currentResults = null;
    
    this.elements = {
      // 测试按钮
      runAllTestsBtn: null,
      runCoreTestsBtn: null,
      runStorageTestsBtn: null,
      runApiTestsBtn: null,
      runPerformanceTestsBtn: null,
      runIntegrationTestsBtn: null,
      checkDataIntegrityBtn: null,
      clearTestDataBtn: null,
      
      // 调试按钮
      enableDebugModeBtn: null,
      showPerformanceStatsBtn: null,
      exportDebugLogBtn: null,
      clearCacheBtn: null,
      simulateErrorBtn: null,
      memoryUsageBtn: null,
      
      // API模拟器
      mockType: null,
      mockResponse: null,
      enableMockBtn: null,
      disableMockBtn: null,
      testMockBtn: null,
      
      // 结果显示
      testProgress: null,
      testProgressBar: null,
      testResultsContainer: null,
      testStats: null,
      totalTests: null,
      passedTests: null,
      failedTests: null,
      passRate: null
    };
    
    this.init();
  }

  /**
   * 初始化测试界面
   */
  init() {
    this.initElements();
    this.bindEvents();
    this.initTestSuite();
    
    console.log('测试界面控制器初始化完成');
  }

  /**
   * 初始化DOM元素
   */
  initElements() {
    // 测试按钮
    this.elements.runAllTestsBtn = document.getElementById('runAllTestsBtn');
    this.elements.runCoreTestsBtn = document.getElementById('runCoreTestsBtn');
    this.elements.runStorageTestsBtn = document.getElementById('runStorageTestsBtn');
    this.elements.runApiTestsBtn = document.getElementById('runApiTestsBtn');
    this.elements.runPerformanceTestsBtn = document.getElementById('runPerformanceTestsBtn');
    this.elements.runIntegrationTestsBtn = document.getElementById('runIntegrationTestsBtn');
    this.elements.checkDataIntegrityBtn = document.getElementById('checkDataIntegrityBtn');
    this.elements.clearTestDataBtn = document.getElementById('clearTestDataBtn');
    
    // 调试按钮
    this.elements.enableDebugModeBtn = document.getElementById('enableDebugModeBtn');
    this.elements.showPerformanceStatsBtn = document.getElementById('showPerformanceStatsBtn');
    this.elements.exportDebugLogBtn = document.getElementById('exportDebugLogBtn');
    this.elements.clearCacheBtn = document.getElementById('clearCacheBtn');
    this.elements.simulateErrorBtn = document.getElementById('simulateErrorBtn');
    this.elements.memoryUsageBtn = document.getElementById('memoryUsageBtn');
    
    // API模拟器
    this.elements.mockType = document.getElementById('mockType');
    this.elements.mockResponse = document.getElementById('mockResponse');
    this.elements.enableMockBtn = document.getElementById('enableMockBtn');
    this.elements.disableMockBtn = document.getElementById('disableMockBtn');
    this.elements.testMockBtn = document.getElementById('testMockBtn');
    
    // 结果显示
    this.elements.testProgress = document.getElementById('testProgress');
    this.elements.testProgressBar = document.getElementById('testProgressBar');
    this.elements.testResultsContainer = document.getElementById('testResultsContainer');
    this.elements.testStats = document.getElementById('testStats');
    this.elements.totalTests = document.getElementById('totalTests');
    this.elements.passedTests = document.getElementById('passedTests');
    this.elements.failedTests = document.getElementById('failedTests');
    this.elements.passRate = document.getElementById('passRate');
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 测试按钮事件
    this.elements.runAllTestsBtn?.addEventListener('click', () => this.runAllTests());
    this.elements.runCoreTestsBtn?.addEventListener('click', () => this.runTestsByCategory('core'));
    this.elements.runStorageTestsBtn?.addEventListener('click', () => this.runTestsByCategory('storage'));
    this.elements.runApiTestsBtn?.addEventListener('click', () => this.runTestsByCategory('api'));
    this.elements.runPerformanceTestsBtn?.addEventListener('click', () => this.runTestsByCategory('performance'));
    this.elements.runIntegrationTestsBtn?.addEventListener('click', () => this.runTestsByCategory('integration'));
    this.elements.checkDataIntegrityBtn?.addEventListener('click', () => this.checkDataIntegrity());
    this.elements.clearTestDataBtn?.addEventListener('click', () => this.clearTestData());
    
    // 调试按钮事件
    this.elements.enableDebugModeBtn?.addEventListener('click', () => this.toggleDebugMode());
    this.elements.showPerformanceStatsBtn?.addEventListener('click', () => this.showPerformanceStats());
    this.elements.exportDebugLogBtn?.addEventListener('click', () => this.exportDebugLog());
    this.elements.clearCacheBtn?.addEventListener('click', () => this.clearCache());
    this.elements.simulateErrorBtn?.addEventListener('click', () => this.simulateError());
    this.elements.memoryUsageBtn?.addEventListener('click', () => this.showMemoryUsage());
    
    // API模拟器事件
    this.elements.enableMockBtn?.addEventListener('click', () => this.enableMock());
    this.elements.disableMockBtn?.addEventListener('click', () => this.disableMock());
    this.elements.testMockBtn?.addEventListener('click', () => this.testMock());
  }

  /**
   * 初始化测试套件
   */
  initTestSuite() {
    if (window.AIChat && window.AIChat.TestSuite) {
      this.testSuite = new window.AIChat.TestSuite();
      console.log('测试套件已初始化');
    } else {
      console.error('测试套件未找到');
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    if (!this.testSuite || this.isRunning) return;
    
    this.isRunning = true;
    this.updateProgress('运行所有测试...', true);
    
    try {
      const results = await this.testSuite.runAllTests();
      this.displayResults(results);
      this.showNotification('所有测试完成', 'success');
    } catch (error) {
      this.showNotification('测试运行失败: ' + error.message, 'error');
      console.error('测试运行失败:', error);
    } finally {
      this.isRunning = false;
      this.updateProgress('测试完成', false);
    }
  }

  /**
   * 按类别运行测试
   */
  async runTestsByCategory(category) {
    if (!this.testSuite || this.isRunning) return;
    
    this.isRunning = true;
    this.updateProgress(`运行${category}测试...`, true);
    
    try {
      const results = await this.testSuite.runTestsByCategory(category);
      this.displayResults(results);
      this.showNotification(`${category}测试完成`, 'success');
    } catch (error) {
      this.showNotification('测试运行失败: ' + error.message, 'error');
      console.error('测试运行失败:', error);
    } finally {
      this.isRunning = false;
      this.updateProgress('测试完成', false);
    }
  }

  /**
   * 检查数据完整性
   */
  async checkDataIntegrity() {
    if (!window.AIChat || !window.AIChat.DataIntegrityChecker) {
      this.showNotification('数据完整性检查器未找到', 'error');
      return;
    }
    
    this.updateProgress('检查数据完整性...', true);
    
    try {
      const checker = new window.AIChat.DataIntegrityChecker();
      const storage = window.app?.storage;
      
      if (!storage) {
        throw new Error('存储服务未初始化');
      }
      
      const results = await checker.checkAll(storage);
      this.displayIntegrityResults(results);
      
      if (results.overall.valid) {
        this.showNotification('数据完整性检查通过', 'success');
      } else {
        this.showNotification(`发现 ${results.overall.issues.length} 个问题`, 'warning');
      }
    } catch (error) {
      this.showNotification('数据完整性检查失败: ' + error.message, 'error');
      console.error('数据完整性检查失败:', error);
    } finally {
      this.updateProgress('检查完成', false);
    }
  }

  /**
   * 清理测试数据
   */
  async clearTestData() {
    if (!confirm('确定要清理所有测试数据吗？这将删除所有以"test-"开头的数据。')) {
      return;
    }
    
    this.updateProgress('清理测试数据...', true);
    
    try {
      if (this.testSuite) {
        await this.testSuite.cleanup();
      }
      
      // 清理测试人格和消息
      const storage = window.app?.storage;
      if (storage) {
        const personas = await storage.loadPersonas();
        const testPersonas = personas.filter(p => p.id.startsWith('test-'));
        
        for (const persona of testPersonas) {
          await storage.deletePersona(persona.id);
        }
      }
      
      this.showNotification(`清理了 ${testPersonas?.length || 0} 个测试人格`, 'success');
    } catch (error) {
      this.showNotification('清理测试数据失败: ' + error.message, 'error');
      console.error('清理测试数据失败:', error);
    } finally {
      this.updateProgress('清理完成', false);
    }
  }

  /**
   * 切换调试模式
   */
  toggleDebugMode() {
    if (this.testSuite) {
      if (this.testSuite.debugMode) {
        this.testSuite.disableDebugMode();
        this.elements.enableDebugModeBtn.innerHTML = '<i class="fa fa-bug mr-2"></i>启用调试模式';
        this.showNotification('调试模式已禁用', 'info');
      } else {
        this.testSuite.enableDebugMode();
        this.elements.enableDebugModeBtn.innerHTML = '<i class="fa fa-bug mr-2"></i>禁用调试模式';
        this.showNotification('调试模式已启用', 'info');
      }
    }
  }

  /**
   * 显示性能统计
   */
  showPerformanceStats() {
    const stats = window.app?.getStats();
    if (!stats) {
      this.showNotification('无法获取性能统计', 'error');
      return;
    }
    
    const statsWindow = window.open('', '_blank', 'width=800,height=600');
    statsWindow.document.write(`
      <html>
        <head>
          <title>性能统计</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .stat-section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .stat-title { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
            .stat-item { margin: 5px 0; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>应用性能统计</h1>
          <div class="stat-section">
            <div class="stat-title">生成时间</div>
            <div class="stat-item">${new Date().toLocaleString()}</div>
          </div>
          <div class="stat-section">
            <div class="stat-title">详细统计</div>
            <pre>${JSON.stringify(stats, null, 2)}</pre>
          </div>
        </body>
      </html>
    `);
  }

  /**
   * 导出调试日志
   */
  exportDebugLog() {
    const logs = [];
    
    // 收集控制台日志（如果可能）
    if (window.console && window.console.history) {
      logs.push(...window.console.history);
    }
    
    // 收集错误日志
    if (window.errorHandler) {
      const errorLog = window.errorHandler.getErrorLog();
      logs.push(...errorLog.map(error => ({
        type: 'error',
        timestamp: error.timestamp,
        message: error.message,
        details: error
      })));
    }
    
    // 收集测试结果
    if (this.currentResults) {
      logs.push({
        type: 'test-results',
        timestamp: new Date().toISOString(),
        data: this.currentResults
      });
    }
    
    const logData = {
      exportTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: logs
    };
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showNotification('调试日志已导出', 'success');
  }

  /**
   * 清理缓存
   */
  clearCache() {
    if (window.app) {
      window.app.cleanup();
      this.showNotification('缓存已清理', 'success');
    } else {
      this.showNotification('应用未初始化', 'error');
    }
  }

  /**
   * 模拟错误
   */
  simulateError() {
    const errorTypes = [
      { type: 'network', message: '网络连接错误' },
      { type: 'api', message: 'API调用失败' },
      { type: 'storage', message: '存储操作失败' },
      { type: 'validation', message: '数据验证错误' }
    ];
    
    const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    
    if (window.errorHandler) {
      window.errorHandler.reportError(
        randomError.message,
        randomError.type,
        'medium',
        { simulated: true, timestamp: new Date().toISOString() }
      );
    }
    
    this.showNotification(`模拟了一个${randomError.type}错误`, 'info');
  }

  /**
   * 显示内存使用情况
   */
  showMemoryUsage() {
    if (!('memory' in performance)) {
      this.showNotification('浏览器不支持内存监控', 'warning');
      return;
    }
    
    const memory = performance.memory;
    const memoryInfo = {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      usage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)}%`
    };
    
    alert(`内存使用情况：
已使用: ${memoryInfo.used}
总分配: ${memoryInfo.total}
限制: ${memoryInfo.limit}
使用率: ${memoryInfo.usage}`);
  }

  /**
   * 启用API模拟
   */
  enableMock() {
    if (!this.testSuite) {
      this.showNotification('测试套件未初始化', 'error');
      return;
    }
    
    const mockType = this.elements.mockType.value;
    const mockResponse = this.elements.mockResponse.value;
    
    try {
      if (mockType === 'success') {
        const response = mockResponse ? JSON.parse(mockResponse) : {
          message: { role: 'assistant', content: '这是模拟的成功响应' }
        };
        this.testSuite.apiMocker.mockVolcanoAPI(response);
        this.testSuite.apiMocker.mockOllamaAPI(response);
      } else {
        this.testSuite.apiMocker.mockError(mockType);
      }
      
      this.showNotification('API模拟已启用', 'success');
    } catch (error) {
      this.showNotification('启用API模拟失败: ' + error.message, 'error');
    }
  }

  /**
   * 禁用API模拟
   */
  disableMock() {
    if (this.testSuite) {
      this.testSuite.apiMocker.reset();
      this.showNotification('API模拟已禁用', 'success');
    }
  }

  /**
   * 测试API模拟
   */
  async testMock() {
    if (!this.testSuite) {
      this.showNotification('测试套件未初始化', 'error');
      return;
    }
    
    try {
      const result = await this.testSuite.runTest('api-mock-volcano');
      if (result.results[0].success) {
        this.showNotification('API模拟测试通过', 'success');
      } else {
        this.showNotification('API模拟测试失败', 'error');
      }
    } catch (error) {
      this.showNotification('API模拟测试失败: ' + error.message, 'error');
    }
  }

  /**
   * 更新进度显示
   */
  updateProgress(message, showProgress = false) {
    if (this.elements.testProgress) {
      this.elements.testProgress.textContent = message;
    }
    
    if (this.elements.testProgressBar) {
      if (showProgress) {
        this.elements.testProgressBar.classList.remove('hidden');
      } else {
        this.elements.testProgressBar.classList.add('hidden');
      }
    }
  }

  /**
   * 显示测试结果
   */
  displayResults(results) {
    this.currentResults = results;
    
    // 更新统计信息
    if (this.elements.testStats) {
      this.elements.testStats.classList.remove('hidden');
      this.elements.totalTests.textContent = results.total;
      this.elements.passedTests.textContent = results.passed;
      this.elements.failedTests.textContent = results.failed;
      this.elements.passRate.textContent = results.passRate;
    }
    
    // 显示详细结果
    if (this.elements.testResultsContainer) {
      this.elements.testResultsContainer.innerHTML = '';
      
      results.results.forEach(result => {
        const resultElement = this.createResultElement(result);
        this.elements.testResultsContainer.appendChild(resultElement);
      });
    }
  }

  /**
   * 创建结果元素
   */
  createResultElement(result) {
    const div = document.createElement('div');
    div.className = `alert ${result.success ? 'alert-success' : 'alert-error'} p-3`;
    
    div.innerHTML = `
      <div class="flex items-start space-x-3">
        <i class="fa ${result.success ? 'fa-check-circle' : 'fa-times-circle'} mt-1"></i>
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2 mb-1">
            <span class="font-medium">${result.name}</span>
            <span class="badge badge-xs">${result.category}</span>
            <span class="text-xs opacity-70">${result.duration.toFixed(2)}ms</span>
            ${result.retryCount > 0 ? `<span class="badge badge-warning badge-xs">重试${result.retryCount}次</span>` : ''}
          </div>
          <p class="text-sm">${result.message}</p>
          ${result.error ? `<details class="mt-2"><summary class="text-xs cursor-pointer">错误详情</summary><pre class="text-xs mt-1 p-2 bg-base-200 rounded">${result.error.stack || result.error.message}</pre></details>` : ''}
        </div>
      </div>
    `;
    
    return div;
  }

  /**
   * 显示数据完整性结果
   */
  displayIntegrityResults(results) {
    if (this.elements.testResultsContainer) {
      this.elements.testResultsContainer.innerHTML = '';
      
      // 总体结果
      const overallElement = document.createElement('div');
      overallElement.className = `alert ${results.overall.valid ? 'alert-success' : 'alert-error'} p-3`;
      overallElement.innerHTML = `
        <div class="flex items-center space-x-3">
          <i class="fa ${results.overall.valid ? 'fa-check-circle' : 'fa-times-circle'}"></i>
          <div>
            <span class="font-medium">数据完整性检查 ${results.overall.valid ? '通过' : '失败'}</span>
            ${!results.overall.valid ? `<p class="text-sm mt-1">发现 ${results.overall.issues.length} 个问题</p>` : ''}
          </div>
        </div>
      `;
      this.elements.testResultsContainer.appendChild(overallElement);
      
      // 详细结果
      Object.entries(results).forEach(([key, result]) => {
        if (key === 'overall') return;
        
        const element = document.createElement('div');
        element.className = `alert ${result.valid ? 'alert-info' : 'alert-warning'} p-3`;
        element.innerHTML = `
          <div class="flex items-start space-x-3">
            <i class="fa ${result.valid ? 'fa-check' : 'fa-exclamation-triangle'}"></i>
            <div class="flex-1">
              <div class="font-medium">${key} (${result.count} 项)</div>
              ${result.issues.length > 0 ? `
                <details class="mt-2">
                  <summary class="text-xs cursor-pointer">${result.issues.length} 个问题</summary>
                  <ul class="text-xs mt-1 space-y-1">
                    ${result.issues.map(issue => `<li>• ${issue}</li>`).join('')}
                  </ul>
                </details>
              ` : ''}
            </div>
          </div>
        `;
        this.elements.testResultsContainer.appendChild(element);
      });
    }
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info') {
    // 使用现有的通知系统
    if (window.loadingManager && window.loadingManager.showNotification) {
      window.loadingManager.showNotification(message, type);
    } else {
      // 备用通知方式
      console.log(`[${type.toUpperCase()}] ${message}`);
      
      // 简单的toast通知
      const toast = document.createElement('div');
      toast.className = `alert alert-${type} fixed top-4 right-4 z-50 w-auto max-w-sm`;
      toast.innerHTML = `
        <i class="fa fa-info-circle"></i>
        <span>${message}</span>
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }
  }

  /**
   * 获取测试列表
   */
  getTestList() {
    if (this.testSuite) {
      return this.testSuite.getTestList();
    }
    return [];
  }

  /**
   * 销毁测试界面
   */
  destroy() {
    if (this.testSuite) {
      this.testSuite.cleanup();
    }
    
    // 移除事件监听器
    Object.values(this.elements).forEach(element => {
      if (element && element.removeEventListener) {
        element.removeEventListener('click', () => {});
      }
    });
    
    console.log('测试界面控制器已销毁');
  }
}

// 导出测试界面控制器
window.AIChat = window.AIChat || {};
window.AIChat.TestingUI = TestingUI;

// 在DOM加载完成后初始化测试界面
document.addEventListener('DOMContentLoaded', () => {
  // 延迟初始化，确保其他模块已加载
  setTimeout(() => {
    if (window.AIChat && window.AIChat.TestSuite) {
      window.testingUI = new TestingUI();
      console.log('测试界面已初始化');
    }
  }, 1000);
});

console.log('测试界面控制器已加载');