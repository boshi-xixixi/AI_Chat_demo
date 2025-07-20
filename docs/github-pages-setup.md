# GitHub Pages 部署指南

本指南将帮助你将Enhanced AI Chat应用部署到GitHub Pages，让用户可以直接在线使用。

## 🚀 快速部署

### 1. Fork项目
1. 访问项目GitHub页面
2. 点击右上角的"Fork"按钮
3. 选择你的GitHub账户

### 2. 启用GitHub Pages
1. 进入你Fork的仓库
2. 点击"Settings"标签页
3. 在左侧菜单中找到"Pages"
4. 在"Source"部分选择"GitHub Actions"
5. 保存设置

### 3. 配置仓库信息
编辑以下文件中的占位符：

#### README.md
```markdown
# 替换所有的 "your-username" 为你的GitHub用户名
[🚀 在线体验](https://your-username.github.io/enhanced-ai-chat)
```

#### package.json
```json
{
  "repository": {
    "url": "https://github.com/your-username/enhanced-ai-chat.git"
  },
  "homepage": "https://your-username.github.io/enhanced-ai-chat/"
}
```

### 4. 触发部署
1. 对仓库进行任何提交（比如更新README）
2. GitHub Actions会自动运行
3. 几分钟后，你的应用就会在 `https://your-username.github.io/enhanced-ai-chat` 上线

## 🔧 高级配置

### 自定义域名
如果你有自己的域名：

1. 在仓库根目录创建`CNAME`文件：
```
your-domain.com
```

2. 在域名DNS设置中添加CNAME记录：
```
www.your-domain.com -> your-username.github.io
```

3. 在GitHub Pages设置中启用"Enforce HTTPS"

### 环境变量配置
如果需要配置特定的环境变量：

1. 在仓库的"Settings" > "Secrets and variables" > "Actions"中添加
2. 在`.github/workflows/deploy.yml`中使用：
```yaml
env:
  CUSTOM_CONFIG: ${{ secrets.CUSTOM_CONFIG }}
```

### 分支策略
默认配置会在推送到`main`或`master`分支时自动部署。如果需要修改：

编辑`.github/workflows/deploy.yml`：
```yaml
on:
  push:
    branches: [ your-branch-name ]
```

## 📊 监控部署

### 查看部署状态
1. 在仓库页面点击"Actions"标签
2. 查看最新的workflow运行状态
3. 点击具体的运行查看详细日志

### 部署失败排查
常见问题和解决方案：

#### 1. 权限问题
确保在仓库设置中启用了GitHub Actions的写权限：
- Settings > Actions > General
- 选择"Read and write permissions"

#### 2. Pages未启用
确保在Settings > Pages中选择了"GitHub Actions"作为源

#### 3. 文件路径问题
检查所有文件路径是否正确，特别是JavaScript和CSS文件的引用

## 🔄 自动更新

### 同步上游更新
如果原项目有更新，你可以同步到你的Fork：

```bash
# 添加上游仓库
git remote add upstream https://github.com/original-repo/enhanced-ai-chat.git

# 获取上游更新
git fetch upstream

# 合并更新
git checkout main
git merge upstream/main

# 推送更新
git push origin main
```

### 自动同步（可选）
可以使用GitHub Actions自动同步上游更新：

创建`.github/workflows/sync-upstream.yml`：
```yaml
name: Sync Upstream

on:
  schedule:
    - cron: '0 0 * * 0'  # 每周日运行
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Sync upstream changes
        id: sync
        uses: aormsby/Fork-Sync-With-Upstream-action@v3.4
        with:
          upstream_sync_repo: original-repo/enhanced-ai-chat
          upstream_sync_branch: main
          target_sync_branch: main
          target_repo_token: ${{ secrets.GITHUB_TOKEN }}
```

## 🛠️ 故障排除

### 常见错误

#### 404错误
- 检查GitHub Pages是否正确启用
- 确认仓库是公开的
- 验证文件路径是否正确

#### 样式丢失
- 检查CSS文件路径
- 确认CDN链接可访问
- 验证相对路径设置

#### JavaScript错误
- 查看浏览器控制台错误
- 检查API配置是否正确
- 确认所有依赖文件都已包含

### 调试技巧

1. **本地测试**：
```bash
# 启动本地服务器测试
python -m http.server 8000
```

2. **检查构建日志**：
在GitHub Actions页面查看详细的构建和部署日志

3. **浏览器开发者工具**：
使用F12开发者工具检查网络请求和控制台错误

## 📈 性能优化

### CDN优化
确保所有外部资源使用CDN：
```html
<!-- TailwindCSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- DaisyUI -->
<link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.min.css" rel="stylesheet">

<!-- Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

### 缓存策略
GitHub Pages自动启用缓存，但你可以通过以下方式优化：

1. 为静态资源添加版本号
2. 使用适当的文件命名策略
3. 压缩JavaScript和CSS文件

## 🔒 安全考虑

### HTTPS
GitHub Pages自动提供HTTPS，确保：
- 所有外部资源使用HTTPS
- API调用使用安全连接
- 避免混合内容警告

### API密钥安全
- 不要在代码中硬编码API密钥
- 使用客户端存储（localStorage）
- 提供清晰的安全说明

## 📞 获取帮助

如果遇到部署问题：

1. 查看[GitHub Pages文档](https://docs.github.com/en/pages)
2. 在项目仓库创建Issue
3. 查看GitHub Actions的运行日志
4. 参考项目的故障排除文档

---

部署成功后，你的Enhanced AI Chat应用就可以在线使用了！记得在社交媒体上分享你的部署链接。