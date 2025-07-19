# AI人格聊天应用

<div align="center">

![AI Chat](https://img.shields.io/badge/AI-Chat-blue)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

一个专注于自然对话体验的多人格AI聊天系统，让AI像真人一样与你聊天

[在线体验](https://your-username.github.io/ai-chat) | [下载桌面版](#桌面版下载) | [使用指南](#使用指南) | [贡献代码](#贡献)

</div>

## ✨ 特色功能

- 🎭 **多人格管理** - 创建不同性格的AI角色
- 🧠 **智能记忆** - AI记住你们的对话历史
- 🔄 **双API支持** - 火山引擎 + 本地Ollama
- 🌐 **实时信息** - 获取天气、时间等真实信息
- 💾 **本地存储** - 数据完全保存在你的浏览器中
- 📱 **响应式设计** - 完美适配手机、平板、电脑
- 🎨 **现代UI** - 基于DaisyUI的精美界面

## 🚀 快速开始

### 在线使用（推荐）
直接访问：[https://your-username.github.io/ai-chat](https://your-username.github.io/ai-chat)

### 本地使用
1. 下载项目文件
2. 双击打开 `index.html`
3. 开始聊天！

### 桌面版下载
- [Windows版本](releases/latest)
- [macOS版本](releases/latest)
- [Linux版本](releases/latest)

## 📖 使用指南

### 基础设置
1. **配置API** - 在设置中输入火山引擎API密钥
2. **本地Ollama** - 可选择使用本地Ollama模型
3. **创建人格** - 点击"新建人格"创建AI角色

### 人格管理
- **人格名称** - 用于区分不同的AI角色
- **系统提示词** - 定义AI的性格和背景
- **预设对话** - 设置对话开场白
- **风格模仿** - 让AI学习特定的说话风格

### 聊天功能
- **指令切换** - 使用 `/persona [名称]` 快速切换人格
- **实时信息** - 询问天气、时间等实时信息
- **对话记忆** - AI会记住之前的聊天内容

## 🛠️ 技术栈

- **前端**: HTML5 + JavaScript + TailwindCSS + DaisyUI
- **存储**: IndexedDB (本地浏览器存储)
- **API**: 火山引擎API + Ollama API
- **实时信息**: MCP (Model Context Protocol)
- **桌面版**: Electron (可选)

## 📁 项目结构

```
ai-chat/
├── index.html          # 主应用文件
├── assets/            # 静态资源
├── docs/              # 文档
├── .github/           # GitHub配置
└── README.md          # 项目说明
```

## 🔧 开发

### 环境要求
- 现代浏览器 (Chrome, Firefox, Safari, Edge)
- 本地HTTP服务器 (可选，用于避免CORS问题)

### 本地开发
```bash
# 克隆项目
git clone https://github.com/your-username/ai-chat.git

# 进入目录
cd ai-chat

# 启动本地服务器
python -m http.server 8000
# 或者
npx serve .

# 访问 http://localhost:8000
```

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md)

### 贡献方式
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [TailwindCSS](https://tailwindcss.com/) - CSS框架
- [DaisyUI](https://daisyui.com/) - UI组件库
- [火山引擎](https://www.volcengine.com/) - AI服务
- [Ollama](https://ollama.ai/) - 本地AI模型

## 📞 联系

如有问题或建议，请：
- 创建 [Issue](issues)
- 发送邮件到 your-email@example.com
- 关注项目获取最新动态

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！**

</div>