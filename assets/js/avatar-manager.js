/**
 * 头像管理器
 * 负责头像的上传、处理、压缩和显示
 */

class AvatarManager {
  constructor() {
    this.maxFileSize = 2 * 1024 * 1024; // 2MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    this.maxDimensions = { width: 512, height: 512 };
    this.compressionQuality = 0.8;
  }

  /**
   * 处理头像文件上传
   * @param {File} file - 上传的文件
   * @returns {Promise<string>} - 返回base64编码的图片数据
   */
  async processAvatarFile(file) {
    try {
      // 验证文件
      this.validateFile(file);
      
      // 读取文件
      const imageData = await this.readFileAsDataURL(file);
      
      // 压缩图片
      const compressedImage = await this.compressImage(imageData);
      
      console.log('头像处理成功，原始大小:', this.formatFileSize(file.size), 
                  '压缩后大小:', this.formatFileSize(this.getBase64Size(compressedImage)));
      
      return compressedImage;
    } catch (error) {
      console.error('头像处理失败:', error);
      throw error;
    }
  }

  /**
   * 验证上传的文件
   * @param {File} file - 要验证的文件
   */
  validateFile(file) {
    if (!file) {
      throw new Error('请选择一个文件');
    }

    // 检查文件类型
    if (!this.allowedTypes.includes(file.type)) {
      throw new Error(`不支持的文件格式。支持的格式: ${this.allowedTypes.map(type => type.split('/')[1]).join(', ')}`);
    }

    // 检查文件大小
    if (file.size > this.maxFileSize) {
      throw new Error(`文件大小超过限制。最大允许: ${this.formatFileSize(this.maxFileSize)}`);
    }

    // 检查文件名
    if (file.name.length > 255) {
      throw new Error('文件名过长');
    }
  }

  /**
   * 读取文件为DataURL
   * @param {File} file - 要读取的文件
   * @returns {Promise<string>} - DataURL字符串
   */
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * 压缩图片
   * @param {string} imageDataURL - 图片的DataURL
   * @returns {Promise<string>} - 压缩后的DataURL
   */
  compressImage(imageDataURL) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // 计算新的尺寸
          const { width, height } = this.calculateNewDimensions(img.width, img.height);
          
          canvas.width = width;
          canvas.height = height;
          
          // 设置高质量缩放
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height);
          
          // 转换为base64
          const compressedDataURL = canvas.toDataURL('image/jpeg', this.compressionQuality);
          
          resolve(compressedDataURL);
        } catch (error) {
          reject(new Error('图片压缩失败: ' + error.message));
        }
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      
      img.src = imageDataURL;
    });
  }

  /**
   * 计算新的图片尺寸（保持宽高比）
   * @param {number} originalWidth - 原始宽度
   * @param {number} originalHeight - 原始高度
   * @returns {Object} - 新的宽度和高度
   */
  calculateNewDimensions(originalWidth, originalHeight) {
    const { width: maxWidth, height: maxHeight } = this.maxDimensions;
    
    // 如果图片已经足够小，不需要缩放
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }
    
    // 计算缩放比例
    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);
    
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio)
    };
  }

  /**
   * 生成默认头像（首字母）
   * @param {string} name - 人格名称
   * @param {Object} options - 选项
   * @returns {string} - SVG格式的头像DataURL
   */
  generateDefaultAvatar(name, options = {}) {
    const {
      size = 128,
      backgroundColor = '#165DFF',
      textColor = '#FFFFFF',
      fontSize = null
    } = options;
    
    // 获取首字符
    const firstChar = this.getFirstChar(name);
    const actualFontSize = fontSize || Math.round(size * 0.4);
    
    // 创建SVG
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${backgroundColor}"/>
        <text x="${size/2}" y="${size/2}" 
              font-family="Inter, system-ui, sans-serif" 
              font-size="${actualFontSize}" 
              font-weight="600"
              fill="${textColor}" 
              text-anchor="middle" 
              dominant-baseline="central">${firstChar}</text>
      </svg>
    `;
    
    // 转换为DataURL
    const dataURL = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    
    return dataURL;
  }

  /**
   * 获取名称的首字符
   * @param {string} name - 名称
   * @returns {string} - 首字符
   */
  getFirstChar(name) {
    if (!name || typeof name !== 'string') {
      return 'A';
    }
    
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return 'A';
    }
    
    // 获取第一个字符
    const firstChar = trimmed.charAt(0).toUpperCase();
    
    // 如果是中文字符，直接返回
    if (/[\u4e00-\u9fff]/.test(firstChar)) {
      return firstChar;
    }
    
    // 如果是英文字符，返回大写
    if (/[A-Za-z]/.test(firstChar)) {
      return firstChar;
    }
    
    // 如果是数字或其他字符，返回默认
    return 'A';
  }

  /**
   * 创建头像显示元素
   * @param {string|null} avatarData - 头像数据（base64或null）
   * @param {string} name - 人格名称
   * @param {Object} options - 显示选项
   * @returns {HTMLElement} - 头像元素
   */
  createAvatarElement(avatarData, name, options = {}) {
    const {
      size = 'w-10 h-10',
      className = '',
      showBorder = false,
      clickable = false
    } = options;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = `avatar ${className}`;
    
    const innerDiv = document.createElement('div');
    innerDiv.className = `${size} rounded-full ${showBorder ? 'ring ring-primary ring-offset-2' : ''}`;
    
    if (avatarData && this.isValidBase64Image(avatarData)) {
      // 使用自定义头像
      const img = document.createElement('img');
      img.src = avatarData;
      img.alt = `${name}的头像`;
      img.className = 'w-full h-full object-cover';
      img.loading = 'lazy';
      
      // 添加错误处理
      img.onerror = () => {
        console.warn('头像加载失败，使用默认头像');
        this.setDefaultAvatarContent(innerDiv, name);
      };
      
      innerDiv.appendChild(img);
    } else {
      // 使用默认头像
      this.setDefaultAvatarContent(innerDiv, name);
    }
    
    if (clickable) {
      innerDiv.style.cursor = 'pointer';
      innerDiv.setAttribute('role', 'button');
      innerDiv.setAttribute('tabindex', '0');
    }
    
    avatarDiv.appendChild(innerDiv);
    return avatarDiv;
  }

  /**
   * 设置默认头像内容
   * @param {HTMLElement} element - 要设置的元素
   * @param {string} name - 人格名称
   */
  setDefaultAvatarContent(element, name) {
    const firstChar = this.getFirstChar(name);
    element.className = element.className.replace(/ring.*?ring-offset-2/, '').trim();
    element.className += ' bg-primary/10 flex items-center justify-center text-primary font-bold';
    element.textContent = firstChar;
    
    // 根据元素大小调整字体
    if (element.classList.contains('w-16') || element.classList.contains('h-16')) {
      element.style.fontSize = '1.25rem'; // text-xl
    } else if (element.classList.contains('w-12') || element.classList.contains('h-12')) {
      element.style.fontSize = '1rem'; // text-base
    } else {
      element.style.fontSize = '0.875rem'; // text-sm
    }
  }

  /**
   * 验证base64图片数据
   * @param {string} dataURL - 要验证的DataURL
   * @returns {boolean} - 是否有效
   */
  isValidBase64Image(dataURL) {
    if (!dataURL || typeof dataURL !== 'string') {
      return false;
    }
    
    // 检查是否是有效的DataURL格式
    const dataURLPattern = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/;
    return dataURLPattern.test(dataURL);
  }

  /**
   * 获取base64数据的大小
   * @param {string} base64String - base64字符串
   * @returns {number} - 字节大小
   */
  getBase64Size(base64String) {
    if (!base64String) return 0;
    
    // 移除data:image/...;base64,前缀
    const base64Data = base64String.split(',')[1] || base64String;
    
    // 计算实际字节大小
    const padding = (base64Data.match(/=/g) || []).length;
    return Math.floor((base64Data.length * 3) / 4) - padding;
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} - 格式化的大小字符串
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 重置头像（删除自定义头像）
   * @param {HTMLElement} avatarElement - 头像元素
   * @param {string} name - 人格名称
   */
  resetAvatar(avatarElement, name) {
    const innerDiv = avatarElement.querySelector('div');
    if (innerDiv) {
      innerDiv.innerHTML = '';
      this.setDefaultAvatarContent(innerDiv, name);
    }
  }

  /**
   * 预览头像
   * @param {string} avatarData - 头像数据
   * @param {HTMLElement} previewElement - 预览元素
   * @param {string} name - 人格名称
   */
  previewAvatar(avatarData, previewElement, name) {
    if (!previewElement) return;
    
    if (avatarData && this.isValidBase64Image(avatarData)) {
      const img = document.createElement('img');
      img.src = avatarData;
      img.alt = '头像预览';
      img.className = 'w-full h-full object-cover rounded-full';
      
      img.onerror = () => {
        this.setDefaultAvatarContent(previewElement, name);
      };
      
      previewElement.innerHTML = '';
      previewElement.appendChild(img);
    } else {
      this.setDefaultAvatarContent(previewElement, name);
    }
  }

  /**
   * 批量处理头像
   * @param {FileList} files - 文件列表
   * @returns {Promise<Array>} - 处理结果数组
   */
  async batchProcessAvatars(files) {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const processedAvatar = await this.processAvatarFile(files[i]);
        results.push({
          success: true,
          file: files[i],
          avatar: processedAvatar
        });
      } catch (error) {
        results.push({
          success: false,
          file: files[i],
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 从URL加载头像
   * @param {string} url - 图片URL
   * @returns {Promise<string>} - base64编码的图片
   */
  async loadAvatarFromURL(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // 验证文件类型
      if (!this.allowedTypes.includes(blob.type)) {
        throw new Error('不支持的图片格式');
      }
      
      // 验证文件大小
      if (blob.size > this.maxFileSize) {
        throw new Error('图片文件过大');
      }
      
      // 转换为File对象并处理
      const file = new File([blob], 'avatar.jpg', { type: blob.type });
      return await this.processAvatarFile(file);
    } catch (error) {
      console.error('从URL加载头像失败:', error);
      throw new Error('无法从URL加载头像: ' + error.message);
    }
  }

  /**
   * 获取头像颜色主题
   * @param {string} name - 人格名称
   * @returns {Object} - 颜色主题
   */
  getAvatarColorTheme(name) {
    // 基于名称生成一致的颜色
    const colors = [
      { bg: '#165DFF', text: '#FFFFFF' }, // 蓝色
      { bg: '#36D399', text: '#FFFFFF' }, // 绿色
      { bg: '#8B5CF6', text: '#FFFFFF' }, // 紫色
      { bg: '#F59E0B', text: '#FFFFFF' }, // 橙色
      { bg: '#EF4444', text: '#FFFFFF' }, // 红色
      { bg: '#06B6D4', text: '#FFFFFF' }, // 青色
      { bg: '#84CC16', text: '#FFFFFF' }, // 青绿色
      { bg: '#EC4899', text: '#FFFFFF' }  // 粉色
    ];
    
    // 使用名称的哈希值选择颜色
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  /**
   * 创建带颜色主题的默认头像
   * @param {string} name - 人格名称
   * @param {Object} options - 选项
   * @returns {string} - SVG DataURL
   */
  generateThemedDefaultAvatar(name, options = {}) {
    const theme = this.getAvatarColorTheme(name);
    return this.generateDefaultAvatar(name, {
      ...options,
      backgroundColor: theme.bg,
      textColor: theme.text
    });
  }
}

// 导出头像管理器
window.AIChat = window.AIChat || {};
window.AIChat.AvatarManager = AvatarManager;