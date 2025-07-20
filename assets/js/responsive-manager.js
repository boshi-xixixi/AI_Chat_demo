/**
 * 响应式设计管理器
 * 负责处理移动端适配、设备检测和界面自适应
 */
class ResponsiveManager {
  constructor() {
    this.isMobile = false;
    this.isTablet = false;
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    this.orientation = this.getOrientation();
    this.touchSupported = 'ontouchstart' in window;
    
    // 断点定义
    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    };
    
    // 侧边栏状态
    this.sidebarCollapsed = false;
    this.sidebarOverlay = null;
    
    this.init();
  }

  /**
   * 初始化响应式管理器
   */
  init() {
    this.detectDevice();
    this.setupEventListeners();
    this.initMobileLayout();
    this.setupTouchGestures();
    this.updateLayout();
    
    console.log('ResponsiveManager initialized', {
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      touchSupported: this.touchSupported,
      orientation: this.orientation
    });
  }

  /**
   * 设备检测
   */
  detectDevice() {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    this.isMobile = this.screenWidth < this.breakpoints.mobile;
    this.isTablet = this.screenWidth >= this.breakpoints.mobile && this.screenWidth < this.breakpoints.tablet;
    this.orientation = this.getOrientation();
    
    // 检测设备类型
    this.deviceType = this.detectDeviceType();
    this.pixelRatio = window.devicePixelRatio || 1;
    this.isHighDPI = this.pixelRatio > 1;
    
    // 检测浏览器和平台
    this.browser = this.detectBrowser();
    this.platform = this.detectPlatform();
  }

  /**
   * 检测设备类型
   */
  detectDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipod/.test(userAgent)) return 'iphone';
    if (/ipad/.test(userAgent)) return 'ipad';
    if (/android/.test(userAgent)) {
      return this.isMobile ? 'android-phone' : 'android-tablet';
    }
    if (/windows phone/.test(userAgent)) return 'windows-phone';
    
    return this.isMobile ? 'mobile' : this.isTablet ? 'tablet' : 'desktop';
  }

  /**
   * 检测浏览器
   */
  detectBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';
    
    return 'unknown';
  }

  /**
   * 检测平台
   */
  detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('mac')) return 'mac';
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('linux')) return 'linux';
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    
    return 'unknown';
  }

  /**
   * 获取设备方向
   */
  getOrientation() {
    if (screen.orientation) {
      return screen.orientation.angle === 0 || screen.orientation.angle === 180 ? 'portrait' : 'landscape';
    }
    return this.screenWidth > this.screenHeight ? 'landscape' : 'portrait';
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 窗口大小变化
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));

    // 方向变化
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });

    // 移动端菜单按钮
    const mobileMenuBtn = document.querySelector('.navbar-start .btn-ghost');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleSidebar();
      });
    }

    // 移动端人格列表和设置按钮
    const mobilePersonaList = document.getElementById('mobilePersonaList');
    const mobileSettings = document.getElementById('mobileSettings');
    
    if (mobilePersonaList) {
      mobilePersonaList.addEventListener('click', (e) => {
        e.preventDefault();
        this.showPersonaList();
      });
    }
    
    if (mobileSettings) {
      mobileSettings.addEventListener('click', (e) => {
        e.preventDefault();
        this.showSettings();
      });
    }
  }

  /**
   * 初始化移动端布局
   */
  initMobileLayout() {
    if (this.isMobile) {
      this.createSidebarOverlay();
      this.collapseSidebar();
      this.optimizeMobileChat();
    }
  }

  /**
   * 创建侧边栏遮罩层
   */
  createSidebarOverlay() {
    if (this.sidebarOverlay) return;
    
    this.sidebarOverlay = document.createElement('div');
    this.sidebarOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 hidden';
    this.sidebarOverlay.id = 'sidebarOverlay';
    
    this.sidebarOverlay.addEventListener('click', () => {
      this.collapseSidebar();
    });
    
    document.body.appendChild(this.sidebarOverlay);
  }

  /**
   * 切换侧边栏显示状态
   */
  toggleSidebar() {
    if (this.sidebarCollapsed) {
      this.expandSidebar();
    } else {
      this.collapseSidebar();
    }
  }

  /**
   * 展开侧边栏
   */
  expandSidebar() {
    const sidebar = document.getElementById('personaList');
    if (!sidebar) return;

    this.sidebarCollapsed = false;
    
    if (this.isMobile) {
      // 移动端：侧边栏覆盖显示
      sidebar.classList.remove('hidden', '-translate-x-full');
      sidebar.classList.add('fixed', 'left-0', 'top-16', 'z-50', 'h-[calc(100vh-4rem)]', 'w-80');
      
      if (this.sidebarOverlay) {
        this.sidebarOverlay.classList.remove('hidden');
      }
    } else {
      // 桌面端：正常显示
      sidebar.classList.remove('hidden');
    }
    
    // 添加展开动画
    sidebar.style.transform = 'translateX(0)';
    sidebar.style.transition = 'transform 0.3s ease-in-out';
  }

  /**
   * 折叠侧边栏
   */
  collapseSidebar() {
    const sidebar = document.getElementById('personaList');
    if (!sidebar) return;

    this.sidebarCollapsed = true;
    
    if (this.isMobile) {
      // 移动端：隐藏侧边栏
      sidebar.style.transform = 'translateX(-100%)';
      
      setTimeout(() => {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('fixed', 'left-0', 'top-16', 'z-50');
      }, 300);
      
      if (this.sidebarOverlay) {
        this.sidebarOverlay.classList.add('hidden');
      }
    }
  }

  /**
   * 优化移动端聊天界面
   */
  optimizeMobileChat() {
    const chatContainer = document.getElementById('chatContainer');
    const userMessage = document.getElementById('userMessage');
    
    if (chatContainer) {
      // 调整聊天容器高度
      chatContainer.style.height = 'calc(100vh - 8rem)';
    }
    
    if (userMessage) {
      // 优化输入框
      userMessage.style.fontSize = '16px'; // 防止iOS缩放
      userMessage.addEventListener('focus', this.handleMobileInputFocus.bind(this));
      userMessage.addEventListener('blur', this.handleMobileInputBlur.bind(this));
    }
    
    // 优化触摸目标大小
    this.optimizeTouchTargets();
  }

  /**
   * 优化触摸目标大小
   */
  optimizeTouchTargets() {
    if (!this.touchSupported) return;
    
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        button.style.minWidth = '44px';
        button.style.minHeight = '44px';
      }
    });
  }

  /**
   * 处理移动端输入框聚焦
   */
  handleMobileInputFocus() {
    if (!this.isMobile) return;
    
    // 延迟执行，等待虚拟键盘弹出
    setTimeout(() => {
      const chatMessages = document.getElementById('chatMessages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }, 300);
  }

  /**
   * 处理移动端输入框失焦
   */
  handleMobileInputBlur() {
    if (!this.isMobile) return;
    
    // 恢复视口
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }

  /**
   * 设置触摸手势支持
   */
  setupTouchGestures() {
    if (!this.touchSupported) return;
    
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    
    const sidebar = document.getElementById('personaList');
    const chatContainer = document.getElementById('chatContainer');
    
    // 侧边栏滑动手势
    if (sidebar && this.isMobile) {
      document.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }, { passive: true });
      
      document.addEventListener('touchmove', (e) => {
        if (!startX || !startY) return;
        
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
        
        const diffX = currentX - startX;
        const diffY = currentY - startY;
        
        // 水平滑动距离大于垂直滑动距离
        if (Math.abs(diffX) > Math.abs(diffY)) {
          // 从左边缘向右滑动，展开侧边栏
          if (startX < 20 && diffX > 50 && this.sidebarCollapsed) {
            this.expandSidebar();
          }
          // 在侧边栏上向左滑动，折叠侧边栏
          else if (startX < 320 && diffX < -50 && !this.sidebarCollapsed) {
            this.collapseSidebar();
          }
        }
      }, { passive: true });
      
      document.addEventListener('touchend', () => {
        startX = 0;
        startY = 0;
        currentX = 0;
        currentY = 0;
      }, { passive: true });
    }
    
    // 聊天消息区域的触摸优化
    if (chatContainer) {
      chatContainer.addEventListener('touchstart', (e) => {
        // 防止触摸时的默认行为
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
          return;
        }
      }, { passive: true });
    }
  }

  /**
   * 处理窗口大小变化
   */
  handleResize() {
    const oldIsMobile = this.isMobile;
    const oldIsTablet = this.isTablet;
    const oldScreenWidth = this.screenWidth;
    const oldScreenHeight = this.screenHeight;
    
    this.detectDevice();
    this.updateLayout();
    
    // 设备类型变化时重新初始化
    if (oldIsMobile !== this.isMobile || oldIsTablet !== this.isTablet) {
      this.handleDeviceTypeChange();
    }
    
    // 处理特定尺寸变化
    this.handleSpecificSizeChanges(oldScreenWidth, oldScreenHeight);
    
    // 优化不同设备的交互
    this.optimizeDeviceInteraction();
    
    console.log('Window resized', {
      width: this.screenWidth,
      height: this.screenHeight,
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      deviceType: this.deviceType,
      orientation: this.orientation
    });
  }

  /**
   * 处理特定尺寸变化
   */
  handleSpecificSizeChanges(oldWidth, oldHeight) {
    const widthChange = this.screenWidth - oldWidth;
    const heightChange = this.screenHeight - oldHeight;
    
    // 显著的宽度变化（可能是侧边栏展开/折叠或窗口调整）
    if (Math.abs(widthChange) > 100) {
      this.adjustChatLayout();
    }
    
    // 显著的高度变化（可能是虚拟键盘弹出/收起）
    if (Math.abs(heightChange) > 100) {
      this.handleVirtualKeyboard(heightChange < 0);
    }
    
    // 处理极小屏幕
    if (this.screenWidth < 360) {
      this.handleSmallScreen();
    }
    
    // 处理超宽屏幕
    if (this.screenWidth > 1920) {
      this.handleWideScreen();
    }
  }

  /**
   * 调整聊天布局
   */
  adjustChatLayout() {
    const chatMessages = document.getElementById('chatMessages');
    const chatContainer = document.getElementById('chatContainer');
    
    if (chatMessages && chatContainer) {
      // 重新计算聊天区域高度
      const containerHeight = chatContainer.offsetHeight;
      const headerHeight = document.querySelector('#currentPersonaHeader')?.offsetHeight || 0;
      const inputHeight = document.querySelector('.card-body:last-child')?.offsetHeight || 0;
      
      const messagesHeight = containerHeight - headerHeight - inputHeight - 32; // 32px for padding
      chatMessages.style.height = `${messagesHeight}px`;
      
      // 滚动到底部
      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 100);
    }
  }

  /**
   * 处理虚拟键盘
   */
  handleVirtualKeyboard(isVisible) {
    if (!this.isMobile) return;
    
    const chatContainer = document.getElementById('chatContainer');
    const chatMessages = document.getElementById('chatMessages');
    
    if (isVisible) {
      // 虚拟键盘弹出
      if (chatContainer) {
        chatContainer.style.height = 'calc(100vh - 12rem)';
      }
      
      // 延迟滚动到底部
      setTimeout(() => {
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 300);
    } else {
      // 虚拟键盘收起
      if (chatContainer) {
        chatContainer.style.height = this.orientation === 'landscape' 
          ? 'calc(100vh - 6rem)' 
          : 'calc(100vh - 8rem)';
      }
    }
  }

  /**
   * 处理小屏幕设备
   */
  handleSmallScreen() {
    const navbar = document.querySelector('.navbar');
    const buttons = document.querySelectorAll('.btn');
    
    // 压缩导航栏
    if (navbar) {
      navbar.style.padding = '0.25rem 0.5rem';
    }
    
    // 调整按钮大小
    buttons.forEach(button => {
      if (button.classList.contains('btn-primary')) {
        button.innerHTML = button.innerHTML.replace(/新建人格/, '新建');
      }
    });
    
    // 调整字体大小
    document.body.style.fontSize = '14px';
  }

  /**
   * 处理超宽屏幕
   */
  handleWideScreen() {
    const main = document.querySelector('main');
    const personaList = document.getElementById('personaList');
    
    if (main) {
      main.style.maxWidth = '1600px';
    }
    
    if (personaList) {
      personaList.style.width = '28rem';
    }
  }

  /**
   * 优化不同设备的交互
   */
  optimizeDeviceInteraction() {
    // iOS特定优化
    if (this.platform === 'ios') {
      this.optimizeForIOS();
    }
    
    // Android特定优化
    if (this.platform === 'android') {
      this.optimizeForAndroid();
    }
    
    // 高DPI屏幕优化
    if (this.isHighDPI) {
      this.optimizeForHighDPI();
    }
    
    // 触摸设备优化
    if (this.touchSupported) {
      this.optimizeForTouch();
    }
  }

  /**
   * iOS特定优化
   */
  optimizeForIOS() {
    // 防止iOS Safari的弹性滚动
    document.body.style.overscrollBehavior = 'none';
    
    // 优化输入框体验
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.style.fontSize = '16px'; // 防止缩放
      input.style.borderRadius = '8px'; // iOS风格圆角
    });
    
    // 处理iOS Safari的视口问题
    if (this.browser === 'safari') {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }
    }
  }

  /**
   * Android特定优化
   */
  optimizeForAndroid() {
    // Android Chrome的地址栏处理
    if (this.browser === 'chrome') {
      const chatContainer = document.getElementById('chatContainer');
      if (chatContainer) {
        chatContainer.style.height = 'calc(100vh - 8rem)';
      }
    }
    
    // 优化Android的触摸反馈
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(button => {
      button.style.touchAction = 'manipulation';
    });
  }

  /**
   * 高DPI屏幕优化
   */
  optimizeForHighDPI() {
    // 调整图标和图片的清晰度
    const icons = document.querySelectorAll('i.fa');
    icons.forEach(icon => {
      icon.style.transform = 'scale(1)';
      icon.style.transformOrigin = 'center';
    });
    
    // 优化头像显示
    const avatars = document.querySelectorAll('.avatar img');
    avatars.forEach(avatar => {
      avatar.style.imageRendering = 'crisp-edges';
    });
  }

  /**
   * 触摸设备优化
   */
  optimizeForTouch() {
    // 增加触摸目标大小
    const touchTargets = document.querySelectorAll('button, .btn, a, input, select, textarea');
    touchTargets.forEach(target => {
      const rect = target.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        target.style.minWidth = '44px';
        target.style.minHeight = '44px';
        target.style.padding = '0.5rem';
      }
    });
    
    // 优化滚动体验
    const scrollableElements = document.querySelectorAll('.overflow-y-auto');
    scrollableElements.forEach(element => {
      element.style.webkitOverflowScrolling = 'touch';
      element.style.scrollBehavior = 'smooth';
    });
  }

  /**
   * 处理方向变化
   */
  handleOrientationChange() {
    const oldOrientation = this.orientation;
    this.detectDevice();
    
    if (oldOrientation !== this.orientation) {
      this.updateLayout();
      this.handleOrientationSpecificChanges();
      
      console.log('Orientation changed', {
        from: oldOrientation,
        to: this.orientation,
        width: this.screenWidth,
        height: this.screenHeight
      });
    }
  }

  /**
   * 处理设备类型变化
   */
  handleDeviceTypeChange() {
    const sidebar = document.getElementById('personaList');
    
    if (this.isMobile) {
      // 切换到移动端
      this.createSidebarOverlay();
      this.collapseSidebar();
      this.optimizeMobileChat();
    } else {
      // 切换到桌面端
      if (sidebar) {
        sidebar.classList.remove('fixed', 'left-0', 'top-16', 'z-50', 'hidden');
        sidebar.style.transform = '';
        sidebar.style.transition = '';
      }
      
      if (this.sidebarOverlay) {
        this.sidebarOverlay.classList.add('hidden');
      }
      
      this.sidebarCollapsed = false;
    }
  }

  /**
   * 处理方向特定的变化
   */
  handleOrientationSpecificChanges() {
    if (this.isMobile) {
      const chatContainer = document.getElementById('chatContainer');
      
      if (this.orientation === 'landscape') {
        // 横屏模式：减少界面元素高度
        if (chatContainer) {
          chatContainer.style.height = 'calc(100vh - 6rem)';
        }
      } else {
        // 竖屏模式：恢复正常高度
        if (chatContainer) {
          chatContainer.style.height = 'calc(100vh - 8rem)';
        }
      }
    }
  }

  /**
   * 更新布局
   */
  updateLayout() {
    // 基本设备类型
    document.body.classList.toggle('mobile-layout', this.isMobile);
    document.body.classList.toggle('tablet-layout', this.isTablet);
    document.body.classList.toggle('desktop-layout', !this.isMobile && !this.isTablet);
    
    // 交互类型
    document.body.classList.toggle('touch-device', this.touchSupported);
    document.body.classList.toggle('mouse-device', !this.touchSupported);
    
    // 方向
    document.body.classList.toggle('landscape', this.orientation === 'landscape');
    document.body.classList.toggle('portrait', this.orientation === 'portrait');
    
    // 设备特定类型
    document.body.classList.toggle('device-iphone', this.deviceType === 'iphone');
    document.body.classList.toggle('device-ipad', this.deviceType === 'ipad');
    document.body.classList.toggle('device-android', this.deviceType.includes('android'));
    
    // 平台
    document.body.classList.toggle('platform-ios', this.platform === 'ios');
    document.body.classList.toggle('platform-android', this.platform === 'android');
    document.body.classList.toggle('platform-windows', this.platform === 'windows');
    document.body.classList.toggle('platform-mac', this.platform === 'mac');
    
    // 浏览器
    document.body.classList.toggle('browser-chrome', this.browser === 'chrome');
    document.body.classList.toggle('browser-safari', this.browser === 'safari');
    document.body.classList.toggle('browser-firefox', this.browser === 'firefox');
    
    // 屏幕特性
    document.body.classList.toggle('high-dpi', this.isHighDPI);
    document.body.classList.toggle('small-screen', this.screenWidth < 360);
    document.body.classList.toggle('large-screen', this.screenWidth > 1440);
    document.body.classList.toggle('ultra-wide', this.screenWidth > 1920);
    
    // 更新CSS自定义属性
    document.documentElement.style.setProperty('--screen-width', `${this.screenWidth}px`);
    document.documentElement.style.setProperty('--screen-height', `${this.screenHeight}px`);
    document.documentElement.style.setProperty('--pixel-ratio', this.pixelRatio);
  }

  /**
   * 显示人格列表（移动端）
   */
  showPersonaList() {
    if (this.isMobile) {
      this.expandSidebar();
    }
  }

  /**
   * 显示设置（移动端）
   */
  showSettings() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      settingsModal.showModal();
    }
  }

  /**
   * 获取当前设备信息
   */
  getDeviceInfo() {
    return {
      // 基本设备类型
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      isDesktop: !this.isMobile && !this.isTablet,
      
      // 设备特性
      deviceType: this.deviceType,
      touchSupported: this.touchSupported,
      orientation: this.orientation,
      
      // 屏幕信息
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight,
      pixelRatio: this.pixelRatio,
      isHighDPI: this.isHighDPI,
      
      // 平台和浏览器
      platform: this.platform,
      browser: this.browser,
      
      // 界面状态
      sidebarCollapsed: this.sidebarCollapsed,
      
      // 断点信息
      breakpoints: this.breakpoints
    };
  }

  /**
   * 防抖函数
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * 动态调整布局基于内容
   */
  adjustLayoutForContent() {
    // 调整人格列表高度
    this.adjustPersonaListHeight();
    
    // 调整聊天消息区域
    this.adjustChatMessagesHeight();
    
    // 调整模态框大小
    this.adjustModalSizes();
  }

  /**
   * 调整人格列表高度
   */
  adjustPersonaListHeight() {
    const personaList = document.getElementById('personaList');
    const personaItems = document.getElementById('personaItems');
    
    if (personaList && personaItems) {
      const availableHeight = this.screenHeight - 200; // 减去导航栏和边距
      const maxHeight = Math.min(availableHeight, 600);
      
      if (this.isMobile) {
        personaList.style.maxHeight = `${this.screenHeight - 100}px`;
      } else {
        personaList.style.maxHeight = `${maxHeight}px`;
      }
    }
  }

  /**
   * 调整聊天消息区域高度
   */
  adjustChatMessagesHeight() {
    const chatMessages = document.getElementById('chatMessages');
    const chatContainer = document.getElementById('chatContainer');
    
    if (chatMessages && chatContainer) {
      const containerRect = chatContainer.getBoundingClientRect();
      const headerHeight = document.querySelector('#currentPersonaHeader')?.offsetHeight || 0;
      const inputAreaHeight = document.querySelector('.card-body:last-child')?.offsetHeight || 0;
      
      const availableHeight = containerRect.height - headerHeight - inputAreaHeight - 32;
      chatMessages.style.height = `${Math.max(availableHeight, 200)}px`;
    }
  }

  /**
   * 调整模态框大小
   */
  adjustModalSizes() {
    const modals = document.querySelectorAll('.modal-box');
    
    modals.forEach(modal => {
      if (this.isMobile) {
        modal.style.width = '95%';
        modal.style.maxWidth = 'none';
        modal.style.margin = '1rem';
        modal.style.maxHeight = `${this.screenHeight - 100}px`;
      } else if (this.isTablet) {
        modal.style.width = '85%';
        modal.style.maxWidth = '600px';
      } else {
        modal.style.width = '';
        modal.style.maxWidth = '';
        modal.style.margin = '';
      }
    });
  }

  /**
   * 获取最佳列数（用于网格布局）
   */
  getOptimalColumns(itemWidth = 200, containerSelector = 'main') {
    const container = document.querySelector(containerSelector);
    if (!container) return 1;
    
    const containerWidth = container.offsetWidth;
    const availableWidth = containerWidth - 64; // 减去边距
    const columns = Math.floor(availableWidth / itemWidth);
    
    return Math.max(1, Math.min(columns, 6)); // 最少1列，最多6列
  }

  /**
   * 检查是否需要紧凑模式
   */
  shouldUseCompactMode() {
    return this.isMobile || this.screenWidth < 480 || this.screenHeight < 600;
  }

  /**
   * 应用紧凑模式
   */
  applyCompactMode(enable = true) {
    document.body.classList.toggle('compact-mode', enable);
    
    if (enable) {
      // 减少间距和填充
      const elements = document.querySelectorAll('.p-4, .p-6, .py-6, .px-4');
      elements.forEach(el => {
        el.classList.add('compact-padding');
      });
    } else {
      // 恢复正常间距
      const elements = document.querySelectorAll('.compact-padding');
      elements.forEach(el => {
        el.classList.remove('compact-padding');
      });
    }
  }

  /**
   * 销毁响应式管理器
   */
  destroy() {
    // 移除事件监听器
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    
    // 移除遮罩层
    if (this.sidebarOverlay) {
      this.sidebarOverlay.remove();
      this.sidebarOverlay = null;
    }
    
    // 重置样式
    const sidebar = document.getElementById('personaList');
    if (sidebar) {
      sidebar.style.transform = '';
      sidebar.style.transition = '';
      sidebar.classList.remove('fixed', 'left-0', 'top-16', 'z-50', 'hidden');
    }
    
    // 移除所有设备类
    const deviceClasses = [
      'mobile-layout', 'tablet-layout', 'desktop-layout',
      'touch-device', 'mouse-device', 'landscape', 'portrait',
      'device-iphone', 'device-ipad', 'device-android',
      'platform-ios', 'platform-android', 'platform-windows', 'platform-mac',
      'browser-chrome', 'browser-safari', 'browser-firefox',
      'high-dpi', 'small-screen', 'large-screen', 'ultra-wide',
      'compact-mode'
    ];
    
    deviceClasses.forEach(className => {
      document.body.classList.remove(className);
    });
    
    console.log('ResponsiveManager destroyed');
  }
}

// 导出响应式管理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveManager;
}