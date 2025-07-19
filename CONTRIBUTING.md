# 贡献指南

感谢你对AI人格聊天应用的关注！我们欢迎所有形式的贡献。

## 🤝 如何贡献

### 报告问题
- 使用 [Issue模板](.github/ISSUE_TEMPLATE/) 报告bug
- 提供详细的复现步骤
- 包含浏览器版本和操作系统信息

### 功能建议
- 在Issue中详细描述新功能
- 说明功能的使用场景和价值
- 如果可能，提供设计草图或原型

### 代码贡献
1. Fork 项目到你的GitHub账户
2. 创建功能分支：`git checkout -b feature/your-feature-name`
3. 进行开发并测试
4. 提交代码：`git commit -m "feat: add your feature"`
5. 推送分支：`git push origin feature/your-feature-name`
6. 创建Pull Request

## 📝 代码规范

### JavaScript规范
- 使用ES6+语法
- 函数和变量使用驼峰命名
- 类名使用帕斯卡命名
- 添加必要的注释

```javascript
// 好的示例
class PersonaManager {
  /**
   * 创建新人格
   * @param {Object} personaData - 人格数据
   * @returns {Promise<Object>} 创建的人格对象
   */
  async createPersona(personaData) {
    // 实现逻辑
  }
}
```

### HTML/CSS规范
- 使用语义化HTML标签
- CSS类名使用kebab-case
- 优先使用TailwindCSS和DaisyUI类

### 提交信息规范
使用约定式提交格式：
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

## 🧪 测试

### 本地测试
```bash
# 启动本地服务器
python -m http.server 8000

# 在浏览器中测试所有功能
# - 人格创建和编辑
# - 聊天功能
# - API调用
# - 数据存储
```

### 浏览器兼容性测试
确保在以下浏览器中正常工作：
- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 📚 开发环境设置

### 必需工具
- 现代浏览器
- 文本编辑器或IDE
- Git

### 可选工具
- Python (用于本地HTTP服务器)
- Node.js (用于某些开发工具)

### 项目结构
```
ai-chat/
├── index.html              # 主应用文件
├── assets/                 # 静态资源
│   ├── css/               # 自定义样式
│   ├── js/                # JavaScript模块
│   └── images/            # 图片资源
├── docs/                  # 文档
├── .github/               # GitHub配置
│   ├── ISSUE_TEMPLATE/    # Issue模板
│   └── workflows/         # GitHub Actions
├── README.md              # 项目说明
├── CONTRIBUTING.md        # 贡献指南
├── LICENSE               # 许可证
└── .gitignore           # Git忽略文件
```

## 🎯 开发重点

### 核心功能
1. **人格管理** - 创建、编辑、删除AI人格
2. **聊天系统** - 消息发送、接收、显示
3. **API集成** - 火山引擎和Ollama API调用
4. **数据存储** - IndexedDB本地存储
5. **用户引导** - 首次使用指导

### 扩展功能
1. **多媒体支持** - 图片、语音处理
2. **桌面应用** - Electron打包
3. **插件系统** - 可扩展架构
4. **主题系统** - 多种UI主题

## 🐛 调试技巧

### 浏览器开发者工具
- 使用Console查看日志
- 使用Network监控API调用
- 使用Application查看IndexedDB数据

### 常见问题
1. **CORS错误** - 使用本地HTTP服务器
2. **API调用失败** - 检查API密钥和网络
3. **数据丢失** - 检查IndexedDB支持

## 📖 学习资源

### 相关技术文档
- [TailwindCSS文档](https://tailwindcss.com/docs)
- [DaisyUI组件](https://daisyui.com/components/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

### AI API文档
- [火山引擎API文档](https://www.volcengine.com/docs)
- [Ollama API文档](https://github.com/ollama/ollama/blob/main/docs/api.md)

## 💬 交流讨论

- 创建Issue讨论功能和问题
- 在Pull Request中详细说明更改
- 保持友好和建设性的交流

## 🏆 贡献者

感谢所有贡献者的努力！你的名字将出现在这里。

---

再次感谢你的贡献！让我们一起打造更好的AI聊天体验。