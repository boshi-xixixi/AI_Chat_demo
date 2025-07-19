/**
 * MCP (Model Context Protocol) 服务
 * 负责实时信息获取和工具调用
 */

class MCPService {
  constructor() {
    this.tools = new Map();
    this.isInitialized = false;
    this.weatherApiKey = null;
    this.weatherEndpoint = 'https://api.openweathermap.org/data/2.5/weather';
  }

  /**
   * 初始化MCP服务
   */
  async init(storageService) {
    try {
      this.storage = storageService;
      
      // 加载API配置
      this.weatherApiKey = await this.storage.loadSetting('weatherApiKey', '');
      
      // 注册内置工具
      this._registerBuiltinTools();
      
      this.isInitialized = true;
      console.log('MCP服务初始化完成');
    } catch (error) {
      console.error('MCP服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 注册内置工具
   */
  _registerBuiltinTools() {
    // 时间工具
    this.registerTool('get_current_time', {
      description: '获取当前时间',
      parameters: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            description: '时间格式 (iso, locale, timestamp)',
            default: 'locale'
          },
          timezone: {
            type: 'string',
            description: '时区',
            default: 'Asia/Shanghai'
          }
        }
      },
      handler: this._getCurrentTime.bind(this)
    });

    // 天气工具
    this.registerTool('get_weather', {
      description: '获取指定城市的天气信息',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: '城市名称',
            required: true
          },
          units: {
            type: 'string',
            description: '温度单位 (metric, imperial)',
            default: 'metric'
          }
        },
        required: ['city']
      },
      handler: this._getWeather.bind(this)
    });

    // 计算器工具
    this.registerTool('calculate', {
      description: '执行数学计算',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: '数学表达式',
            required: true
          }
        },
        required: ['expression']
      },
      handler: this._calculate.bind(this)
    });

    // 随机数生成器
    this.registerTool('random_number', {
      description: '生成随机数',
      parameters: {
        type: 'object',
        properties: {
          min: {
            type: 'number',
            description: '最小值',
            default: 0
          },
          max: {
            type: 'number',
            description: '最大值',
            default: 100
          },
          count: {
            type: 'number',
            description: '生成数量',
            default: 1
          }
        }
      },
      handler: this._generateRandomNumber.bind(this)
    });

    console.log(`注册了 ${this.tools.size} 个内置工具`);
  }

  /**
   * 注册工具
   */
  registerTool(name, toolConfig) {
    this.tools.set(name, {
      name,
      description: toolConfig.description,
      parameters: toolConfig.parameters,
      handler: toolConfig.handler,
      enabled: true
    });
  }

  /**
   * 获取所有可用工具
   */
  getAvailableTools() {
    return Array.from(this.tools.values()).filter(tool => tool.enabled);
  }

  /**
   * 检测消息中的工具调用需求
   */
  detectToolRequests(message) {
    const requests = [];
    const content = message.toLowerCase();

    // 时间相关检测
    if (/时间|几点|现在|当前时间|什么时候/.test(content)) {
      requests.push({
        tool: 'get_current_time',
        confidence: 0.9,
        parameters: { format: 'locale' }
      });
    }

    // 天气相关检测
    const weatherMatch = content.match(/(.+?)(天气|气温|温度|下雨|晴天|阴天|多云|风|湿度)/);
    if (weatherMatch) {
      let city = '北京'; // 默认城市
      
      // 尝试提取城市名称
      const cityMatch = content.match(/(北京|上海|广州|深圳|杭州|南京|武汉|成都|重庆|西安|天津|青岛|大连|厦门|苏州|无锡|宁波|长沙|郑州|济南|福州|合肥|昆明|南昌|太原|石家庄|哈尔滨|长春|沈阳|呼和浩特|银川|西宁|拉萨|乌鲁木齐|海口|三亚|香港|澳门|台北)/);
      if (cityMatch) {
        city = cityMatch[1];
      }

      requests.push({
        tool: 'get_weather',
        confidence: 0.8,
        parameters: { city, units: 'metric' }
      });
    }

    // 计算相关检测
    const mathMatch = content.match(/计算|算一下|等于|加|减|乘|除|[\d+\-*/().\s]+=/);
    if (mathMatch) {
      // 尝试提取数学表达式
      const expressionMatch = content.match(/([\d+\-*/().\s]+)/);
      if (expressionMatch) {
        requests.push({
          tool: 'calculate',
          confidence: 0.7,
          parameters: { expression: expressionMatch[1].trim() }
        });
      }
    }

    // 随机数相关检测
    if (/随机|抽签|抽奖|随便|任意|random/.test(content)) {
      requests.push({
        tool: 'random_number',
        confidence: 0.6,
        parameters: { min: 1, max: 100, count: 1 }
      });
    }

    return requests;
  }

  /**
   * 执行工具调用
   */
  async executeTool(toolName, parameters = {}) {
    if (!this.isInitialized) {
      throw new Error('MCP服务未初始化');
    }

    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`工具不存在: ${toolName}`);
    }

    if (!tool.enabled) {
      throw new Error(`工具已禁用: ${toolName}`);
    }

    try {
      console.log(`执行工具: ${toolName}`, parameters);
      const result = await tool.handler(parameters);
      
      return {
        tool: toolName,
        success: true,
        result: result,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`工具执行失败: ${toolName}`, error);
      
      return {
        tool: toolName,
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * 批量执行工具
   */
  async executeTools(toolRequests) {
    const results = [];
    
    for (const request of toolRequests) {
      try {
        const result = await this.executeTool(request.tool, request.parameters);
        results.push({
          ...result,
          confidence: request.confidence
        });
      } catch (error) {
        results.push({
          tool: request.tool,
          success: false,
          error: error.message,
          confidence: request.confidence,
          timestamp: new Date()
        });
      }
    }
    
    return results;
  }

  /**
   * 获取当前时间
   */
  async _getCurrentTime(params = {}) {
    const { format = 'locale', timezone = 'Asia/Shanghai' } = params;
    const now = new Date();

    try {
      switch (format) {
        case 'iso':
          return {
            time: now.toISOString(),
            format: 'ISO 8601',
            timezone: 'UTC'
          };
        
        case 'timestamp':
          return {
            time: now.getTime(),
            format: 'Unix timestamp',
            timezone: 'UTC'
          };
        
        case 'locale':
        default:
          return {
            time: now.toLocaleString('zh-CN', {
              timeZone: timezone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              weekday: 'long'
            }),
            format: '本地时间',
            timezone: timezone,
            date: now.toLocaleDateString('zh-CN', { timeZone: timezone }),
            weekday: now.toLocaleDateString('zh-CN', { weekday: 'long', timeZone: timezone })
          };
      }
    } catch (error) {
      throw new Error(`时间格式化失败: ${error.message}`);
    }
  }

  /**
   * 获取天气信息
   */
  async _getWeather(params) {
    const { city, units = 'metric' } = params;

    if (!this.weatherApiKey) {
      // 返回模拟天气数据
      return this._getMockWeatherData(city);
    }

    try {
      const url = `${this.weatherEndpoint}?q=${encodeURIComponent(city)}&appid=${this.weatherApiKey}&units=${units}&lang=zh_cn`;
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`天气API请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        city: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        description: data.weather[0].description,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        visibility: data.visibility / 1000, // 转换为公里
        units: units === 'metric' ? '°C' : '°F',
        timestamp: new Date(data.dt * 1000)
      };
    } catch (error) {
      console.warn('获取真实天气数据失败，使用模拟数据:', error);
      return this._getMockWeatherData(city);
    }
  }

  /**
   * 获取模拟天气数据
   */
  _getMockWeatherData(city) {
    const conditions = ['晴天', '多云', '阴天', '小雨', '中雨'];
    const temperatures = [15, 18, 22, 25, 28, 30];
    
    return {
      city: city,
      country: 'CN',
      temperature: temperatures[Math.floor(Math.random() * temperatures.length)],
      feelsLike: temperatures[Math.floor(Math.random() * temperatures.length)],
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      pressure: Math.floor(Math.random() * 50) + 1000, // 1000-1050 hPa
      description: conditions[Math.floor(Math.random() * conditions.length)],
      windSpeed: Math.floor(Math.random() * 10) + 1, // 1-10 m/s
      windDirection: Math.floor(Math.random() * 360),
      visibility: Math.floor(Math.random() * 20) + 5, // 5-25 km
      units: '°C',
      timestamp: new Date(),
      note: '这是模拟数据，请配置真实的天气API密钥获取准确信息'
    };
  }

  /**
   * 执行数学计算
   */
  async _calculate(params) {
    const { expression } = params;

    try {
      // 安全的数学表达式计算
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      
      if (!sanitized || sanitized !== expression) {
        throw new Error('表达式包含不安全的字符');
      }

      // 使用Function构造器安全计算
      const result = Function(`"use strict"; return (${sanitized})`)();
      
      if (!isFinite(result)) {
        throw new Error('计算结果无效');
      }

      return {
        expression: expression,
        result: result,
        formatted: `${expression} = ${result}`
      };
    } catch (error) {
      throw new Error(`计算失败: ${error.message}`);
    }
  }

  /**
   * 生成随机数
   */
  async _generateRandomNumber(params) {
    const { min = 0, max = 100, count = 1 } = params;

    if (min >= max) {
      throw new Error('最小值必须小于最大值');
    }

    if (count < 1 || count > 100) {
      throw new Error('生成数量必须在1-100之间');
    }

    const numbers = [];
    for (let i = 0; i < count; i++) {
      numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }

    return {
      numbers: numbers,
      count: count,
      range: `${min}-${max}`,
      single: count === 1 ? numbers[0] : null
    };
  }

  /**
   * 设置天气API密钥
   */
  async setWeatherApiKey(apiKey) {
    this.weatherApiKey = apiKey;
    if (this.storage) {
      await this.storage.saveSetting('weatherApiKey', apiKey);
    }
  }

  /**
   * 启用/禁用工具
   */
  setToolEnabled(toolName, enabled) {
    const tool = this.tools.get(toolName);
    if (tool) {
      tool.enabled = enabled;
      console.log(`工具 ${toolName} ${enabled ? '已启用' : '已禁用'}`);
    }
  }

  /**
   * 获取工具统计信息
   */
  getToolStats() {
    const tools = Array.from(this.tools.values());
    
    return {
      total: tools.length,
      enabled: tools.filter(t => t.enabled).length,
      disabled: tools.filter(t => !t.enabled).length,
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        enabled: t.enabled
      }))
    };
  }

  /**
   * 格式化工具结果为自然语言
   */
  formatToolResult(toolResult) {
    if (!toolResult.success) {
      return `工具执行失败: ${toolResult.error}`;
    }

    switch (toolResult.tool) {
      case 'get_current_time':
        const timeData = toolResult.result;
        return `当前时间是 ${timeData.time}`;

      case 'get_weather':
        const weather = toolResult.result;
        let weatherText = `${weather.city}当前天气：${weather.description}，温度${weather.temperature}${weather.units}`;
        if (weather.feelsLike !== weather.temperature) {
          weatherText += `，体感温度${weather.feelsLike}${weather.units}`;
        }
        weatherText += `，湿度${weather.humidity}%，风速${weather.windSpeed}m/s`;
        if (weather.note) {
          weatherText += `\n注意：${weather.note}`;
        }
        return weatherText;

      case 'calculate':
        const calc = toolResult.result;
        return `计算结果：${calc.formatted}`;

      case 'random_number':
        const random = toolResult.result;
        if (random.count === 1) {
          return `随机数：${random.single}`;
        } else {
          return `生成了${random.count}个随机数：${random.numbers.join(', ')}`;
        }

      default:
        return `工具执行完成：${JSON.stringify(toolResult.result)}`;
    }
  }
}

// 导出MCP服务
window.AIChat = window.AIChat || {};
window.AIChat.MCPService = MCPService;

console.log('MCP服务已加载');