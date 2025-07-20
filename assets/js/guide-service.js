/**
 * 引导服务
 * 负责用户引导和Ollama状态检测
 */

class GuideService {
  constructor() {
    this.apiService = null;
    this.storage = null;
    this.ollamaStatusCheckInterval = null;
    this.statusCheckFrequency = 30000; // 30秒检查一次
    this.isMonitoring = false;
    this.lastOllamaStatus = null;
    this.guideStates = new Map();
    
    // 引导完成状态
    this.completedGuides = {
      welcome: false,
      ollamaSetup: false,
      firstPersona: false,
      firstChat: false
    };
    
    // Ollama常见问题和解决方案
    this.ollamaFAQ = [
      {
        question: "Ollama是什么？",
        answer: "Ollama是一个本地运行大语言模型的工具，让您可以在自己的电脑上运行AI模型，无需联网即可使用。",
        category: "基础"
      },
      {
        question: "如何安装Ollama？",
        answer: "访问 https://ollama.ai 下载适合您操作系统的安装包。支持Windows、macOS和Linux。",
        category: "安装"
      },
      {
        question: "Ollama安装后如何启动？",
        answer: "安装完成后，打开终端/命令提示符，输入 'ollama serve' 启动服务。或者直接运行Ollama应用程序。",
        category: "启动"
      },
      {
        question: "如何下载模型？",
        answer: "在终端中使用 'ollama pull 模型名' 命令。推荐模型：llama3.1:8b、qwen2:7b、gemma2:9b。",
        category: "模型"
      },
      {
        question: "推荐哪些模型？",
        answer: "初学者推荐：llama3.1:8b（平衡性能）、qwen2:7b（中文优化）、gemma2:9b（Google出品）。",
        category: "模型"
      },
      {
        question: "Ollama服务无法连接怎么办？",
        answer: "1. 确认Ollama已启动 2. 检查端口11434是否被占用 3. 尝试重启Ollama服务 4. 检查防火墙设置",
        category: "故障排除"
      },
      {
        question: "模型运行很慢怎么办？",
        answer: "1. 选择较小的模型（如7B而非13B）2. 确保有足够内存 3. 关闭其他占用资源的程序 4. 考虑使用量化版本",
        category: "性能"
      },
      {
        question: "如何查看已安装的模型？",
        answer: "在终端中输入 'ollama list' 查看所有已下载的模型。",
        category: "管理"
      },
      {
        question: "如何删除不需要的模型？",
        answer: "使用 'ollama rm 模型名' 命令删除指定模型，释放磁盘空间。",
        category: "管理"
      },
      {
        question: "内存不足怎么办？",
        answer: "1. 选择更小的模型 2. 关闭其他应用 3. 考虑使用量化模型（如q4版本）4. 增加虚拟内存",
        category: "故障排除"
      }
    ];
    
    // 推荐模型列表
    this.recommendedModels = [
      {
        name: "llama3.1:8b",
        description: "Meta最新模型，平衡性能与资源消耗",
        size: "4.7GB",
        category: "通用",
        difficulty: "初级",
        command: "ollama pull llama3.1:8b"
      },
      {
        name: "qwen2:7b", 
        description: "阿里巴巴开源模型，中文表现优秀",
        size: "4.4GB",
        category: "中文优化",
        difficulty: "初级",
        command: "ollama pull qwen2:7b"
      },
      {
        name: "gemma2:9b",
        description: "Google开源模型，指令遵循能力强",
        size: "5.4GB", 
        category: "指令遵循",
        difficulty: "初级",
        command: "ollama pull gemma2:9b"
      },
      {
        name: "mistral:7b",
        description: "Mistral AI模型，代码能力突出",
        size: "4.1GB",
        category: "代码",
        difficulty: "初级", 
        command: "ollama pull mistral:7b"
      },
      {
        name: "codellama:7b",
        description: "专门的代码生成模型",
        size: "3.8GB",
        category: "代码专用",
        difficulty: "中级",
        command: "ollama pull codellama:7b"
      }
    ];
  }

  /**
   * 初始化引导服务
   */
  async init(apiService, storage) {
    this.apiService = apiService;
    this.storage = storage;
    
    // 加载引导状态
    await this.loadGuideStates();
    
    // 开始监控Ollama状态
    this.startOllamaMonitoring();
    
    console.log('引导服务初始化完成');
  }

  /**
   * 加载引导状态
   */
  async loadGuideStates() {
    try {
      const states = await this.storage.loadSetting('guideStates', {});
      this.completedGuides = { ...this.completedGuides, ...states };
    } catch (error) {
      console.warn('加载引导状态失败:', error);
    }
  }

  /**
   * 保存引导状态
   */
  async saveGuideStates() {
    try {
      await this.storage.saveSetting('guideStates', this.completedGuides);
    } catch (error) {
      console.warn('保存引导状态失败:', error);
    }
  }

  /**
   * 标记引导完成
   */
  async markGuideCompleted(guideType) {
    this.completedGuides[guideType] = true;
    await this.saveGuideStates();
    console.log(`引导 ${guideType} 已完成`);
  }

  /**
   * 检查引导是否完成
   */
  isGuideCompleted(guideType) {
    return this.completedGuides[guideType] || false;
  }

  /**
   * 开始Ollama状态监控
   */
  startOllamaMonitoring() {
    if (this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = true;
    
    // 立即检查一次
    this.checkOllamaStatusAndGuide();
    
    // 设置定期检查
    this.ollamaStatusCheckInterval = setInterval(() => {
      this.checkOllamaStatusAndGuide();
    }, this.statusCheckFrequency);
    
    console.log('Ollama状态监控已启动');
  }

  /**
   * 停止Ollama状态监控
   */
  stopOllamaMonitoring() {
    if (this.ollamaStatusCheckInterval) {
      clearInterval(this.ollamaStatusCheckInterval);
      this.ollamaStatusCheckInterval = null;
    }
    
    this.isMonitoring = false;
    console.log('Ollama状态监控已停止');
  }

  /**
   * 检查Ollama状态并提供引导
   */
  async checkOllamaStatusAndGuide() {
    try {
      if (!this.apiService) {
        return;
      }
      
      const status = await this.apiService.checkOllamaStatus();
      const statusChanged = this.hasStatusChanged(status);
      
      // 更新状态
      this.lastOllamaStatus = status;
      
      // 触发状态变化事件
      this.dispatchStatusEvent(status, statusChanged);
      
      // 根据状态提供引导
      if (!status.available && statusChanged) {
        this.showOllamaUnavailableGuide(status);
      } else if (status.available && statusChanged) {
        this.showOllamaAvailableNotification(status);
      }
      
    } catch (error) {
      console.warn('Ollama状态检查失败:', error);
    }
  }

  /**
   * 检查状态是否发生变化
   */
  hasStatusChanged(newStatus) {
    if (!this.lastOllamaStatus) {
      return true;
    }
    
    return this.lastOllamaStatus.available !== newStatus.available;
  }

  /**
   * 触发状态事件
   */
  dispatchStatusEvent(status, statusChanged) {
    const event = new CustomEvent('ollamaStatusUpdate', {
      detail: {
        status,
        statusChanged,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * 显示Ollama不可用引导
   */
  showOllamaUnavailableGuide(status) {
    // 如果用户选择的是Ollama但服务不可用，显示引导
    if (this.apiService.currentProvider === 'ollama') {
      this.showOllamaSetupGuide();
    }
  }

  /**
   * 显示Ollama可用通知
   */
  showOllamaAvailableNotification(status) {
    if (status.models && status.models.length > 0) {
      this.showNotification('success', `Ollama服务已连接，发现 ${status.models.length} 个模型`);
    } else {
      this.showNotification('warning', 'Ollama服务已连接，但未发现任何模型');
      setTimeout(() => {
        this.showModelDownloadGuide();
      }, 2000);
    }
  }

  /**
   * 显示欢迎引导
   */
  async showWelcomeGuide() {
    if (this.isGuideCompleted('welcome')) {
      return false;
    }
    
    const modal = this.createWelcomeModal();
    document.body.appendChild(modal);
    modal.showModal();
    
    return true;
  }

  /**
   * 创建欢迎模态框
   */
  createWelcomeModal() {
    const modal = document.createElement('dialog');
    modal.className = 'modal';
    modal.id = 'welcomeGuideModal';
    
    modal.innerHTML = `
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="font-bold text-lg mb-4">
          <i class="fa fa-rocket text-primary mr-2"></i>
          欢迎使用AI人格聊天应用！
        </h3>
        
        <div class="space-y-4">
          <div class="alert alert-info">
            <i class="fa fa-shield-alt"></i>
            <div>
              <h4 class="font-bold">隐私保护</h4>
              <p class="text-sm">您的所有数据都存储在浏览器本地，完全私密安全。</p>
            </div>
          </div>
          
          <div class="steps steps-vertical lg:steps-horizontal w-full">
            <div class="step step-primary">选择AI服务</div>
            <div class="step">创建人格</div>
            <div class="step">开始对话</div>
          </div>
          
          <div class="grid md:grid-cols-2 gap-4">
            <div class="card bg-base-200">
              <div class="card-body p-4">
                <h4 class="font-bold text-primary">
                  <i class="fa fa-cloud mr-2"></i>
                  火山引擎API
                </h4>
                <p class="text-sm">云端AI服务，响应快速，需要API密钥</p>
                <ul class="text-xs mt-2 space-y-1">
                  <li>• 无需本地安装</li>
                  <li>• 模型更新及时</li>
                  <li>• 需要网络连接</li>
                </ul>
              </div>
            </div>
            
            <div class="card bg-base-200">
              <div class="card-body p-4">
                <h4 class="font-bold text-secondary">
                  <i class="fa fa-desktop mr-2"></i>
                  本地Ollama
                </h4>
                <p class="text-sm">本地AI服务，完全私密，需要安装配置</p>
                <ul class="text-xs mt-2 space-y-1">
                  <li>• 完全离线使用</li>
                  <li>• 数据完全私密</li>
                  <li>• 需要下载模型</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-action">
          <button class="btn btn-outline" onclick="this.closest('dialog').close()">
            稍后设置
          </button>
          <button class="btn btn-secondary" onclick="guideService.startOllamaSetup()">
            设置Ollama
          </button>
          <button class="btn btn-primary" onclick="guideService.startApiSetup()">
            配置API
          </button>
        </div>
      </div>
    `;
    
    return modal;
  }

  /**
   * 显示Ollama设置引导
   */
  async showOllamaSetupGuide() {
    const modal = this.createOllamaSetupModal();
    document.body.appendChild(modal);
    modal.showModal();
  }

  /**
   * 创建Ollama设置模态框
   */
  createOllamaSetupModal() {
    const modal = document.createElement('dialog');
    modal.className = 'modal';
    modal.id = 'ollamaSetupModal';
    
    modal.innerHTML = `
      <div class="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-lg">
            <i class="fa fa-desktop text-secondary mr-2"></i>
            Ollama设置引导
          </h3>
          <button class="btn btn-sm btn-circle btn-ghost" onclick="this.closest('dialog').close()">
            <i class="fa fa-times"></i>
          </button>
        </div>
        
        <div class="tabs tabs-boxed mb-4">
          <a class="tab tab-active" data-tab="status">状态检测</a>
          <a class="tab" data-tab="install">安装指南</a>
          <a class="tab" data-tab="models">模型管理</a>
          <a class="tab" data-tab="faq">常见问题</a>
        </div>
        
        <!-- 状态检测标签页 -->
        <div id="statusTab" class="tab-content">
          <div class="space-y-4">
            <div class="alert alert-info">
              <i class="fa fa-info-circle"></i>
              <span>正在检测Ollama服务状态...</span>
            </div>
            
            <div id="ollamaStatusResult" class="space-y-3">
              <!-- 状态结果将在这里显示 -->
            </div>
            
            <div class="flex space-x-2">
              <button class="btn btn-primary" onclick="guideService.refreshOllamaStatus()">
                <i class="fa fa-refresh mr-2"></i>
                重新检测
              </button>
              <button class="btn btn-outline" onclick="guideService.testOllamaConnection()">
                <i class="fa fa-plug mr-2"></i>
                测试连接
              </button>
            </div>
          </div>
        </div>
        
        <!-- 安装指南标签页 -->
        <div id="installTab" class="tab-content hidden">
          ${this.createInstallGuideContent()}
        </div>
        
        <!-- 模型管理标签页 -->
        <div id="modelsTab" class="tab-content hidden">
          ${this.createModelManagementContent()}
        </div>
        
        <!-- 常见问题标签页 -->
        <div id="faqTab" class="tab-content hidden">
          ${this.createFAQContent()}
        </div>
        
        <div class="modal-action">
          <button class="btn btn-outline" onclick="this.closest('dialog').close()">
            关闭
          </button>
          <button class="btn btn-primary" onclick="guideService.completeOllamaSetup()">
            完成设置
          </button>
        </div>
      </div>
    `;
    
    // 设置标签页切换
    this.setupTabSwitching(modal);
    
    // 立即检测状态
    setTimeout(() => {
      this.refreshOllamaStatus();
    }, 500);
    
    return modal;
  }

  /**
   * 创建安装指南内容
   */
  createInstallGuideContent() {
    return `
      <div class="space-y-6">
        <div class="alert alert-warning">
          <i class="fa fa-exclamation-triangle"></i>
          <div>
            <h4 class="font-bold">安装前准备</h4>
            <p class="text-sm">确保您的电脑有至少8GB内存和10GB可用磁盘空间</p>
          </div>
        </div>
        
        <div class="steps steps-vertical w-full">
          <div class="step step-primary">
            <div class="text-left">
              <h4 class="font-bold">1. 下载Ollama</h4>
              <p class="text-sm">访问官网下载适合您系统的版本</p>
              <div class="mt-2">
                <a href="https://ollama.ai" target="_blank" class="btn btn-sm btn-primary">
                  <i class="fa fa-external-link mr-2"></i>
                  访问官网
                </a>
              </div>
            </div>
          </div>
          
          <div class="step step-primary">
            <div class="text-left">
              <h4 class="font-bold">2. 安装Ollama</h4>
              <p class="text-sm">运行下载的安装包，按提示完成安装</p>
              <div class="mt-2 text-xs">
                <div class="bg-base-200 p-2 rounded">
                  <p><strong>Windows:</strong> 运行 .exe 文件</p>
                  <p><strong>macOS:</strong> 拖拽到应用程序文件夹</p>
                  <p><strong>Linux:</strong> 使用包管理器或脚本安装</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="step step-primary">
            <div class="text-left">
              <h4 class="font-bold">3. 启动服务</h4>
              <p class="text-sm">打开终端，运行启动命令</p>
              <div class="mt-2">
                <div class="mockup-code text-xs">
                  <pre><code>ollama serve</code></pre>
                </div>
                <p class="text-xs mt-1">或者直接运行Ollama应用程序</p>
              </div>
            </div>
          </div>
          
          <div class="step">
            <div class="text-left">
              <h4 class="font-bold">4. 下载模型</h4>
              <p class="text-sm">选择并下载您需要的AI模型</p>
              <div class="mt-2">
                <button class="btn btn-sm btn-outline" onclick="guideService.switchToModelsTab()">
                  查看推荐模型
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <h4 class="font-bold text-success">
              <i class="fa fa-lightbulb mr-2"></i>
              安装提示
            </h4>
            <ul class="text-sm space-y-1 mt-2">
              <li>• 首次启动可能需要管理员权限</li>
              <li>• 确保防火墙允许Ollama访问网络</li>
              <li>• 建议关闭杀毒软件的实时保护</li>
              <li>• 安装完成后重启电脑以确保服务正常</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 创建模型管理内容
   */
  createModelManagementContent() {
    const modelCards = this.recommendedModels.map(model => `
      <div class="card bg-base-200">
        <div class="card-body p-4">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h4 class="font-bold text-primary">${model.name}</h4>
              <p class="text-sm mt-1">${model.description}</p>
              <div class="flex items-center space-x-4 mt-2 text-xs">
                <span class="badge badge-outline">${model.size}</span>
                <span class="badge badge-secondary">${model.category}</span>
                <span class="badge badge-accent">${model.difficulty}</span>
              </div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="guideService.copyModelCommand('${model.command}')">
              <i class="fa fa-copy mr-1"></i>
              复制命令
            </button>
          </div>
          <div class="mt-3">
            <div class="mockup-code text-xs">
              <pre><code>${model.command}</code></pre>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
    return `
      <div class="space-y-4">
        <div class="alert alert-info">
          <i class="fa fa-info-circle"></i>
          <div>
            <h4 class="font-bold">模型下载说明</h4>
            <p class="text-sm">复制命令到终端执行，首次下载需要时间，请耐心等待</p>
          </div>
        </div>
        
        <div class="tabs tabs-boxed">
          <a class="tab tab-active" data-subtab="recommended">推荐模型</a>
          <a class="tab" data-subtab="installed">已安装</a>
          <a class="tab" data-subtab="commands">常用命令</a>
        </div>
        
        <div id="recommendedModels" class="subtab-content space-y-3">
          ${modelCards}
        </div>
        
        <div id="installedModels" class="subtab-content hidden">
          <div id="installedModelsList">
            <div class="text-center py-8">
              <i class="fa fa-spinner fa-spin text-2xl text-primary"></i>
              <p class="mt-2">正在获取已安装模型...</p>
            </div>
          </div>
          <button class="btn btn-outline btn-sm mt-4" onclick="guideService.refreshInstalledModels()">
            <i class="fa fa-refresh mr-2"></i>
            刷新列表
          </button>
        </div>
        
        <div id="modelCommands" class="subtab-content hidden">
          <div class="space-y-3">
            <div class="card bg-base-200">
              <div class="card-body p-4">
                <h4 class="font-bold">常用命令</h4>
                <div class="space-y-2 mt-2">
                  <div class="flex justify-between items-center">
                    <code class="text-sm">ollama list</code>
                    <span class="text-xs">查看已安装模型</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <code class="text-sm">ollama pull 模型名</code>
                    <span class="text-xs">下载模型</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <code class="text-sm">ollama rm 模型名</code>
                    <span class="text-xs">删除模型</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <code class="text-sm">ollama serve</code>
                    <span class="text-xs">启动服务</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 创建FAQ内容
   */
  createFAQContent() {
    const categories = [...new Set(this.ollamaFAQ.map(item => item.category))];
    
    const categoryTabs = categories.map(category => 
      `<a class="tab ${category === '基础' ? 'tab-active' : ''}" data-faq-category="${category}">${category}</a>`
    ).join('');
    
    const faqContent = categories.map(category => {
      const items = this.ollamaFAQ.filter(item => item.category === category);
      const itemsHtml = items.map((item, index) => `
        <div class="collapse collapse-arrow bg-base-200">
          <input type="radio" name="faq-${category}" ${index === 0 ? 'checked' : ''} />
          <div class="collapse-title text-sm font-medium">
            ${item.question}
          </div>
          <div class="collapse-content">
            <p class="text-sm">${item.answer}</p>
          </div>
        </div>
      `).join('');
      
      return `
        <div id="faq-${category}" class="faq-category-content ${category !== '基础' ? 'hidden' : ''}">
          <div class="space-y-2">
            ${itemsHtml}
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <div class="space-y-4">
        <div class="tabs tabs-boxed">
          ${categoryTabs}
        </div>
        
        ${faqContent}
        
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <h4 class="font-bold text-warning">
              <i class="fa fa-exclamation-triangle mr-2"></i>
              仍有问题？
            </h4>
            <p class="text-sm mt-2">
              如果以上解答无法解决您的问题，建议：
            </p>
            <ul class="text-sm mt-2 space-y-1">
              <li>• 访问 <a href="https://github.com/ollama/ollama" target="_blank" class="link">Ollama官方GitHub</a></li>
              <li>• 查看 <a href="https://ollama.ai/docs" target="_blank" class="link">官方文档</a></li>
              <li>• 检查系统兼容性和硬件要求</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 设置标签页切换
   */
  setupTabSwitching(modal) {
    const tabs = modal.querySelectorAll('.tab');
    const tabContents = modal.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // 移除所有活动状态
        tabs.forEach(t => t.classList.remove('tab-active'));
        tabContents.forEach(content => content.classList.add('hidden'));
        
        // 激活当前标签
        tab.classList.add('tab-active');
        const targetTab = tab.dataset.tab;
        const targetContent = modal.querySelector(`#${targetTab}Tab`);
        if (targetContent) {
          targetContent.classList.remove('hidden');
        }
      });
    });
    
    // 设置子标签页切换
    const subTabs = modal.querySelectorAll('[data-subtab]');
    subTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const parent = tab.closest('.tab-content');
        const siblingTabs = parent.querySelectorAll('[data-subtab]');
        const subContents = parent.querySelectorAll('.subtab-content');
        
        // 移除所有活动状态
        siblingTabs.forEach(t => t.classList.remove('tab-active'));
        subContents.forEach(content => content.classList.add('hidden'));
        
        // 激活当前标签
        tab.classList.add('tab-active');
        const targetSubTab = tab.dataset.subtab;
        const targetContent = parent.querySelector(`#${targetSubTab}Models, #${targetSubTab.replace('Models', 'Commands')}`);
        if (targetContent) {
          targetContent.classList.remove('hidden');
        }
      });
    });
    
    // 设置FAQ分类切换
    const faqTabs = modal.querySelectorAll('[data-faq-category]');
    faqTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const parent = tab.closest('.tab-content');
        const siblingTabs = parent.querySelectorAll('[data-faq-category]');
        const faqContents = parent.querySelectorAll('.faq-category-content');
        
        // 移除所有活动状态
        siblingTabs.forEach(t => t.classList.remove('tab-active'));
        faqContents.forEach(content => content.classList.add('hidden'));
        
        // 激活当前标签
        tab.classList.add('tab-active');
        const targetCategory = tab.dataset.faqCategory;
        const targetContent = parent.querySelector(`#faq-${targetCategory}`);
        if (targetContent) {
          targetContent.classList.remove('hidden');
        }
      });
    });
  }

  /**
   * 刷新Ollama状态
   */
  async refreshOllamaStatus() {
    const resultContainer = document.getElementById('ollamaStatusResult');
    if (!resultContainer) return;
    
    // 显示加载状态
    resultContainer.innerHTML = `
      <div class="flex items-center space-x-2">
        <i class="fa fa-spinner fa-spin text-primary"></i>
        <span>正在检测Ollama服务...</span>
      </div>
    `;
    
    try {
      const status = await this.apiService.checkOllamaStatus();
      this.displayOllamaStatus(status, resultContainer);
    } catch (error) {
      resultContainer.innerHTML = `
        <div class="alert alert-error">
          <i class="fa fa-exclamation-circle"></i>
          <span>检测失败: ${error.message}</span>
        </div>
      `;
    }
  }

  /**
   * 显示Ollama状态
   */
  displayOllamaStatus(status, container) {
    if (status.available) {
      container.innerHTML = `
        <div class="alert alert-success">
          <i class="fa fa-check-circle"></i>
          <div>
            <h4 class="font-bold">Ollama服务运行正常</h4>
            <p class="text-sm">端点: ${status.endpoint}</p>
            ${status.version ? `<p class="text-sm">版本: ${status.version}</p>` : ''}
          </div>
        </div>
        
        ${status.models && status.models.length > 0 ? `
          <div class="card bg-base-200">
            <div class="card-body p-4">
              <h4 class="font-bold">已安装模型 (${status.models.length}个)</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                ${status.models.slice(0, 6).map(model => `
                  <div class="flex justify-between items-center text-sm">
                    <span class="font-medium">${model.name}</span>
                    <span class="text-xs opacity-60">${model.size || 'Unknown'}</span>
                  </div>
                `).join('')}
                ${status.models.length > 6 ? `
                  <div class="col-span-full text-center">
                    <span class="text-xs opacity-60">还有 ${status.models.length - 6} 个模型...</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        ` : `
          <div class="alert alert-warning">
            <i class="fa fa-exclamation-triangle"></i>
            <div>
              <h4 class="font-bold">未发现模型</h4>
              <p class="text-sm">Ollama服务正常，但没有安装任何模型</p>
            </div>
          </div>
        `}
      `;
    } else {
      container.innerHTML = `
        <div class="alert alert-error">
          <i class="fa fa-exclamation-circle"></i>
          <div>
            <h4 class="font-bold">Ollama服务不可用</h4>
            <p class="text-sm">${status.error || '无法连接到Ollama服务'}</p>
          </div>
        </div>
        
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <h4 class="font-bold text-warning">可能的原因：</h4>
            <ul class="text-sm mt-2 space-y-1">
              <li>• Ollama未安装或未启动</li>
              <li>• 服务端口被占用或防火墙阻止</li>
              <li>• 服务地址配置错误</li>
              <li>• 系统资源不足</li>
            </ul>
            <div class="mt-3">
              <button class="btn btn-sm btn-primary" onclick="guideService.switchToInstallTab()">
                查看安装指南
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * 测试Ollama连接
   */
  async testOllamaConnection() {
    this.showNotification('info', '正在测试Ollama连接...');
    
    try {
      const status = await this.apiService.checkOllamaStatus();
      
      if (status.available) {
        this.showNotification('success', `连接成功！发现 ${status.models?.length || 0} 个模型`);
      } else {
        this.showNotification('error', `连接失败: ${status.error}`);
      }
    } catch (error) {
      this.showNotification('error', `测试失败: ${error.message}`);
    }
  }

  /**
   * 复制模型命令
   */
  async copyModelCommand(command) {
    try {
      await navigator.clipboard.writeText(command);
      this.showNotification('success', '命令已复制到剪贴板');
    } catch (error) {
      // 降级处理
      const textArea = document.createElement('textarea');
      textArea.value = command;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showNotification('success', '命令已复制到剪贴板');
    }
  }

  /**
   * 刷新已安装模型列表
   */
  async refreshInstalledModels() {
    const container = document.getElementById('installedModelsList');
    if (!container) return;
    
    container.innerHTML = `
      <div class="text-center py-8">
        <i class="fa fa-spinner fa-spin text-2xl text-primary"></i>
        <p class="mt-2">正在获取已安装模型...</p>
      </div>
    `;
    
    try {
      const status = await this.apiService.checkOllamaStatus();
      
      if (status.available && status.models && status.models.length > 0) {
        const modelsHtml = status.models.map(model => `
          <div class="card bg-base-200">
            <div class="card-body p-4">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h4 class="font-bold">${model.name}</h4>
                  <div class="flex items-center space-x-2 mt-1 text-xs">
                    <span class="badge badge-outline">${model.size || 'Unknown'}</span>
                    ${model.family ? `<span class="badge badge-secondary">${model.family}</span>` : ''}
                    ${model.parameters ? `<span class="badge badge-accent">${model.parameters}</span>` : ''}
                  </div>
                  ${model.modified_at ? `
                    <p class="text-xs opacity-60 mt-1">
                      最后使用: ${new Date(model.modified_at).toLocaleString()}
                    </p>
                  ` : ''}
                </div>
                <div class="dropdown dropdown-end">
                  <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-circle">
                    <i class="fa fa-ellipsis-v"></i>
                  </div>
                  <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40">
                    <li><a onclick="guideService.copyModelCommand('ollama run ${model.name}')">
                      <i class="fa fa-play mr-2"></i>运行
                    </a></li>
                    <li><a onclick="guideService.copyModelCommand('ollama rm ${model.name}')">
                      <i class="fa fa-trash mr-2 text-error"></i>删除
                    </a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        `).join('');
        
        container.innerHTML = modelsHtml;
      } else {
        container.innerHTML = `
          <div class="text-center py-8">
            <i class="fa fa-inbox text-4xl text-base-300"></i>
            <p class="mt-2">未发现已安装的模型</p>
            <button class="btn btn-sm btn-primary mt-2" onclick="guideService.switchToRecommendedTab()">
              查看推荐模型
            </button>
          </div>
        `;
      }
    } catch (error) {
      container.innerHTML = `
        <div class="alert alert-error">
          <i class="fa fa-exclamation-circle"></i>
          <span>获取模型列表失败: ${error.message}</span>
        </div>
      `;
    }
  }

  /**
   * 切换到安装标签页
   */
  switchToInstallTab() {
    const modal = document.getElementById('ollamaSetupModal');
    if (modal) {
      const installTab = modal.querySelector('[data-tab="install"]');
      if (installTab) {
        installTab.click();
      }
    }
  }

  /**
   * 切换到模型标签页
   */
  switchToModelsTab() {
    const modal = document.getElementById('ollamaSetupModal');
    if (modal) {
      const modelsTab = modal.querySelector('[data-tab="models"]');
      if (modelsTab) {
        modelsTab.click();
      }
    }
  }

  /**
   * 切换到推荐模型子标签页
   */
  switchToRecommendedTab() {
    this.switchToModelsTab();
    setTimeout(() => {
      const modal = document.getElementById('ollamaSetupModal');
      if (modal) {
        const recommendedTab = modal.querySelector('[data-subtab="recommended"]');
        if (recommendedTab) {
          recommendedTab.click();
        }
      }
    }, 100);
  }

  /**
   * 显示模型下载引导
   */
  showModelDownloadGuide() {
    const modal = this.createModelDownloadModal();
    document.body.appendChild(modal);
    modal.showModal();
  }

  /**
   * 创建模型下载模态框
   */
  createModelDownloadModal() {
    const modal = document.createElement('dialog');
    modal.className = 'modal';
    modal.id = 'modelDownloadModal';
    
    modal.innerHTML = `
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="font-bold text-lg mb-4">
          <i class="fa fa-download text-primary mr-2"></i>
          下载AI模型
        </h3>
        
        <div class="space-y-4">
          <div class="alert alert-info">
            <i class="fa fa-info-circle"></i>
            <div>
              <h4 class="font-bold">首次使用需要下载模型</h4>
              <p class="text-sm">推荐从小模型开始，下载时间取决于网络速度</p>
            </div>
          </div>
          
          <div class="grid gap-3">
            ${this.recommendedModels.slice(0, 3).map(model => `
              <div class="card bg-base-200">
                <div class="card-body p-4">
                  <div class="flex justify-between items-center">
                    <div>
                      <h4 class="font-bold text-primary">${model.name}</h4>
                      <p class="text-sm">${model.description}</p>
                      <div class="flex items-center space-x-2 mt-1">
                        <span class="badge badge-outline text-xs">${model.size}</span>
                        <span class="badge badge-secondary text-xs">${model.difficulty}</span>
                      </div>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="guideService.startModelDownload('${model.name}', '${model.command}')">
                      <i class="fa fa-download mr-1"></i>
                      下载
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="card bg-base-200">
            <div class="card-body p-4">
              <h4 class="font-bold">下载步骤：</h4>
              <ol class="text-sm mt-2 space-y-1">
                <li>1. 点击上方"下载"按钮复制命令</li>
                <li>2. 打开终端/命令提示符</li>
                <li>3. 粘贴并执行命令</li>
                <li>4. 等待下载完成</li>
                <li>5. 返回应用刷新状态</li>
              </ol>
            </div>
          </div>
        </div>
        
        <div class="modal-action">
          <button class="btn btn-outline" onclick="this.closest('dialog').close()">
            稍后下载
          </button>
          <button class="btn btn-primary" onclick="guideService.openFullModelGuide()">
            查看完整指南
          </button>
        </div>
      </div>
    `;
    
    return modal;
  }

  /**
   * 开始模型下载
   */
  async startModelDownload(modelName, command) {
    await this.copyModelCommand(command);
    
    // 显示下载指导
    this.showNotification('info', `命令已复制！请在终端执行: ${command}`, 5000);
    
    // 关闭模态框
    const modal = document.getElementById('modelDownloadModal');
    if (modal) {
      modal.close();
    }
    
    // 显示详细指导
    setTimeout(() => {
      this.showDownloadInstructions(modelName, command);
    }, 1000);
  }

  /**
   * 显示下载指导
   */
  showDownloadInstructions(modelName, command) {
    const modal = this.createDownloadInstructionsModal(modelName, command);
    document.body.appendChild(modal);
    modal.showModal();
  }

  /**
   * 创建下载指导模态框
   */
  createDownloadInstructionsModal(modelName, command) {
    const modal = document.createElement('dialog');
    modal.className = 'modal';
    modal.id = 'downloadInstructionsModal';
    
    modal.innerHTML = `
      <div class="modal-box w-11/12 max-w-lg">
        <h3 class="font-bold text-lg mb-4">
          <i class="fa fa-terminal text-primary mr-2"></i>
          下载 ${modelName}
        </h3>
        
        <div class="space-y-4">
          <div class="alert alert-warning">
            <i class="fa fa-clock-o"></i>
            <div>
              <h4 class="font-bold">请耐心等待</h4>
              <p class="text-sm">首次下载可能需要几分钟到几十分钟</p>
            </div>
          </div>
          
          <div class="steps steps-vertical w-full">
            <div class="step step-primary">
              <div class="text-left">
                <h4 class="font-bold">1. 打开终端</h4>
                <p class="text-sm">Windows: 按Win+R，输入cmd</p>
                <p class="text-sm">Mac: 按Cmd+Space，搜索Terminal</p>
                <p class="text-sm">Linux: 按Ctrl+Alt+T</p>
              </div>
            </div>
            
            <div class="step step-primary">
              <div class="text-left">
                <h4 class="font-bold">2. 执行命令</h4>
                <div class="mockup-code text-xs mt-2">
                  <pre><code>${command}</code></pre>
                </div>
                <button class="btn btn-xs btn-outline mt-1" onclick="guideService.copyModelCommand('${command}')">
                  再次复制
                </button>
              </div>
            </div>
            
            <div class="step">
              <div class="text-left">
                <h4 class="font-bold">3. 等待完成</h4>
                <p class="text-sm">看到"success"提示即表示下载完成</p>
              </div>
            </div>
          </div>
          
          <div class="card bg-base-200">
            <div class="card-body p-4">
              <h4 class="font-bold text-info">
                <i class="fa fa-lightbulb mr-2"></i>
                下载提示
              </h4>
              <ul class="text-sm space-y-1 mt-2">
                <li>• 确保网络连接稳定</li>
                <li>• 不要关闭终端窗口</li>
                <li>• 下载完成后可以关闭终端</li>
                <li>• 如果中断可以重新执行命令</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="modal-action">
          <button class="btn btn-outline" onclick="this.closest('dialog').close()">
            我知道了
          </button>
          <button class="btn btn-primary" onclick="guideService.checkDownloadProgress('${modelName}')">
            检查下载状态
          </button>
        </div>
      </div>
    `;
    
    return modal;
  }

  /**
   * 检查下载进度
   */
  async checkDownloadProgress(modelName) {
    this.showNotification('info', '正在检查下载状态...');
    
    try {
      const status = await this.apiService.checkOllamaStatus();
      
      if (status.available && status.models) {
        const foundModel = status.models.find(model => 
          model.name.toLowerCase().includes(modelName.toLowerCase())
        );
        
        if (foundModel) {
          this.showNotification('success', `模型 ${modelName} 下载完成！`);
          
          // 关闭指导模态框
          const modal = document.getElementById('downloadInstructionsModal');
          if (modal) {
            modal.close();
          }
          
          // 刷新模型列表
          setTimeout(() => {
            this.refreshInstalledModels();
          }, 1000);
        } else {
          this.showNotification('warning', `模型 ${modelName} 尚未下载完成，请继续等待`);
        }
      } else {
        this.showNotification('error', 'Ollama服务不可用，请检查服务状态');
      }
    } catch (error) {
      this.showNotification('error', `检查失败: ${error.message}`);
    }
  }

  /**
   * 打开完整模型指南
   */
  openFullModelGuide() {
    // 关闭当前模态框
    const modal = document.getElementById('modelDownloadModal');
    if (modal) {
      modal.close();
    }
    
    // 打开Ollama设置指南并切换到模型标签页
    setTimeout(() => {
      this.showOllamaSetupGuide();
      setTimeout(() => {
        this.switchToModelsTab();
      }, 500);
    }, 300);
  }

  /**
   * 完成Ollama设置
   */
  async completeOllamaSetup() {
    await this.markGuideCompleted('ollamaSetup');
    
    // 关闭模态框
    const modal = document.getElementById('ollamaSetupModal');
    if (modal) {
      modal.close();
    }
    
    this.showNotification('success', 'Ollama设置已完成！');
  }

  /**
   * 开始Ollama设置流程
   */
  async startOllamaSetup() {
    // 关闭欢迎模态框
    const welcomeModal = document.getElementById('welcomeGuideModal');
    if (welcomeModal) {
      welcomeModal.close();
    }
    
    // 显示Ollama设置指南
    setTimeout(() => {
      this.showOllamaSetupGuide();
    }, 300);
  }

  /**
   * 开始API设置流程
   */
  async startApiSetup() {
    // 关闭欢迎模态框
    const welcomeModal = document.getElementById('welcomeGuideModal');
    if (welcomeModal) {
      welcomeModal.close();
    }
    
    // 打开设置模态框
    setTimeout(() => {
      const settingsBtn = document.getElementById('settingsBtn');
      if (settingsBtn) {
        settingsBtn.click();
      }
    }, 300);
  }

  /**
   * 显示通知
   */
  showNotification(type, message, duration = 3000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} fixed top-4 right-4 w-auto max-w-sm z-50 shadow-lg`;
    notification.style.animation = 'slideInRight 0.3s ease-out';
    
    const icon = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle', 
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    }[type] || 'fa-info-circle';
    
    notification.innerHTML = `
      <i class="fa ${icon}"></i>
      <span>${message}</span>
      <button class="btn btn-sm btn-circle btn-ghost ml-2" onclick="this.parentElement.remove()">
        <i class="fa fa-times"></i>
      </button>
    `;
    
    document.body.appendChild(notification);
    
    // 自动移除
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }, duration);
  }

  /**
   * 显示数据存储信息
   */
  showDataStorageInfo() {
    const modal = this.createDataStorageModal();
    document.body.appendChild(modal);
    modal.showModal();
  }

  /**
   * 创建数据存储信息模态框
   */
  createDataStorageModal() {
    const modal = document.createElement('dialog');
    modal.className = 'modal';
    modal.id = 'dataStorageModal';
    
    modal.innerHTML = `
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="font-bold text-lg mb-4">
          <i class="fa fa-database text-primary mr-2"></i>
          数据存储说明
        </h3>
        
        <div class="space-y-4">
          <div class="alert alert-success">
            <i class="fa fa-shield-alt"></i>
            <div>
              <h4 class="font-bold">完全本地存储</h4>
              <p class="text-sm">您的所有数据都存储在浏览器本地，绝不上传到任何服务器</p>
            </div>
          </div>
          
          <div class="grid md:grid-cols-2 gap-4">
            <div class="card bg-base-200">
              <div class="card-body p-4">
                <h4 class="font-bold text-primary">存储内容</h4>
                <ul class="text-sm mt-2 space-y-1">
                  <li>• 人格设置和头像</li>
                  <li>• 聊天记录和历史</li>
                  <li>• API配置信息</li>
                  <li>• 应用偏好设置</li>
                </ul>
              </div>
            </div>
            
            <div class="card bg-base-200">
              <div class="card-body p-4">
                <h4 class="font-bold text-secondary">存储技术</h4>
                <ul class="text-sm mt-2 space-y-1">
                  <li>• IndexedDB (主要)</li>
                  <li>• LocalStorage (备用)</li>
                  <li>• 浏览器本地缓存</li>
                  <li>• 无服务器传输</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="card bg-base-200">
            <div class="card-body p-4">
              <h4 class="font-bold text-warning">
                <i class="fa fa-exclamation-triangle mr-2"></i>
                重要提醒
              </h4>
              <ul class="text-sm mt-2 space-y-1">
                <li>• 清除浏览器数据会删除所有聊天记录</li>
                <li>• 建议定期导出重要数据进行备份</li>
                <li>• 不同浏览器的数据是独立的</li>
                <li>• 隐私模式下的数据会在关闭时清除</li>
              </ul>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <button class="btn btn-outline flex-1" onclick="guideService.exportAllData()">
              <i class="fa fa-download mr-2"></i>
              导出数据
            </button>
            <button class="btn btn-outline flex-1" onclick="guideService.showStorageStats()">
              <i class="fa fa-chart-bar mr-2"></i>
              存储统计
            </button>
          </div>
        </div>
        
        <div class="modal-action">
          <button class="btn btn-primary" onclick="this.closest('dialog').close()">
            我知道了
          </button>
        </div>
      </div>
    `;
    
    return modal;
  }

  /**
   * 导出所有数据
   */
  async exportAllData() {
    try {
      this.showNotification('info', '正在导出数据...');
      
      const backup = await this.storage.backup();
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `ai-chat-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      this.showNotification('success', '数据导出成功！');
    } catch (error) {
      this.showNotification('error', `导出失败: ${error.message}`);
    }
  }

  /**
   * 显示存储统计
   */
  async showStorageStats() {
    try {
      const stats = await this.storage.getStats();
      const spaceInfo = await this.storage.checkStorageSpace();
      
      let statsHtml = '<div class="space-y-3">';
      
      if (stats) {
        statsHtml += `
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>人格数量: <span class="font-bold">${stats.personas || 0}</span></div>
            <div>消息数量: <span class="font-bold">${stats.messages || 0}</span></div>
            <div>设置项目: <span class="font-bold">${stats.settings || 0}</span></div>
            <div>会话数量: <span class="font-bold">${stats.sessions || 0}</span></div>
          </div>
        `;
      }
      
      if (spaceInfo) {
        const usedMB = (spaceInfo.used / 1024 / 1024).toFixed(2);
        const availableMB = (spaceInfo.available / 1024 / 1024).toFixed(2);
        
        statsHtml += `
          <div class="divider">存储空间</div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>已使用:</span>
              <span class="font-bold">${usedMB} MB</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>可用空间:</span>
              <span class="font-bold">${availableMB} MB</span>
            </div>
            <progress class="progress progress-primary w-full" value="${spaceInfo.percentage}" max="100"></progress>
            <div class="text-center text-xs opacity-60">${spaceInfo.percentage}% 已使用</div>
          </div>
        `;
      }
      
      statsHtml += '</div>';
      
      const modal = document.createElement('dialog');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">存储统计</h3>
          ${statsHtml}
          <div class="modal-action">
            <button class="btn btn-primary" onclick="this.closest('dialog').close()">关闭</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      modal.showModal();
      
    } catch (error) {
      this.showNotification('error', `获取统计信息失败: ${error.message}`);
    }
  }

  /**
   * 获取使用统计
   */
  getUsageStats() {
    return {
      completedGuides: Object.keys(this.completedGuides).filter(key => this.completedGuides[key]).length,
      totalGuides: Object.keys(this.completedGuides).length,
      isMonitoring: this.isMonitoring,
      lastStatusCheck: this.lastOllamaStatus?.lastChecked || null,
      statusCheckFrequency: this.statusCheckFrequency
    };
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.stopOllamaMonitoring();
    
    // 清理模态框
    const modals = [
      'welcomeGuideModal',
      'ollamaSetupModal', 
      'modelDownloadModal',
      'downloadInstructionsModal',
      'dataStorageModal'
    ];
    
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.remove();
      }
    });
    
    console.log('引导服务已清理');
  }

  /**
   * 关闭服务
   */
  close() {
    this.cleanup();
    this.apiService = null;
    this.storage = null;
  }
}

// 导出到全局命名空间
if (typeof window !== 'undefined') {
  window.AIChat = window.AIChat || {};
  window.AIChat.GuideService = GuideService;
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

console.log('引导服务已加载');