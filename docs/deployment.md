# 部署指南

## 概述

AI人格聊天应用支持多种部署方式，从简单的静态文件托管到完整的CI/CD自动化部署。

## GitHub Pages 部署（推荐）

### 自动部署

项目已配置GitHub Actions自动部署，每次推送到main分支时会自动部署到GitHub Pages。

#### 配置步骤

1. **Fork项目**
   ```bash
   # 在GitHub上Fork项目到你的账户
   ```

2. **启用GitHub Pages**
   - 进入项目Settings
   - 找到Pages设置
   - Source选择"GitHub Actions"

3. **配置域名（可选）**
   - 在Pages设置中添加自定义域名
   - 配置DNS CNAME记录指向 `username.github.io`

4. **推送代码**
   ```bash
   git push origin main
   ```

自动部署完成后，访问 `https://username.github.io/ai-chat`

### 手动部署

如果需要手动部署到GitHub Pages：

```bash
# 1. 构建项目（如果需要）
# 本项目是纯静态文件，无需构建

# 2. 推送到gh-pages分支
git checkout -b gh-pages
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages

# 3. 在GitHub设置中选择gh-pages分支作为Pages源
```

## 静态文件托管

### Netlify 部署

1. **连接GitHub仓库**
   - 登录Netlify
   - 点击"New site from Git"
   - 选择GitHub仓库

2. **配置构建设置**
   ```yaml
   Build command: # 留空，无需构建
   Publish directory: .
   ```

3. **环境变量（可选）**
   ```
   NODE_ENV=production
   ```

4. **自定义域名**
   - 在Site settings中配置域名
   - 添加DNS记录

### Vercel 部署

1. **安装Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **部署项目**
   ```bash
   vercel --prod
   ```

3. **配置文件 (vercel.json)**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "**/*",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/$1"
       }
     ]
   }
   ```

### Cloudflare Pages

1. **连接GitHub**
   - 登录Cloudflare Pages
   - 连接GitHub仓库

2. **构建配置**
   ```yaml
   Build command: # 留空
   Build output directory: .
   Root directory: .
   ```

3. **环境变量**
   ```
   NODE_ENV=production
   ```

## 服务器部署

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/ai-chat;
    index index.html;
    
    # 启用gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### Apache 配置

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/ai-chat
    
    # 启用压缩
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>
    
    # 缓存配置
    <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </FilesMatch>
    
    # SPA路由支持
    <Directory /var/www/ai-chat>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

## Docker 部署

### Dockerfile

```dockerfile
FROM nginx:alpine

# 复制应用文件
COPY . /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  ai-chat:
    build: .
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    restart: unless-stopped
    
  # 可选：添加SSL终端
  ssl-proxy:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./ssl.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - ai-chat
    restart: unless-stopped
```

### 部署命令

```bash
# 构建镜像
docker build -t ai-chat .

# 运行容器
docker run -d -p 80:80 --name ai-chat ai-chat

# 使用docker-compose
docker-compose up -d
```

## CDN 配置

### Cloudflare CDN

1. **添加站点到Cloudflare**
2. **配置DNS记录**
   ```
   Type: CNAME
   Name: @
   Content: username.github.io
   ```

3. **优化设置**
   - 启用Auto Minify (CSS, JS, HTML)
   - 启用Brotli压缩
   - 设置Browser Cache TTL为1年
   - 启用Always Online

### AWS CloudFront

```json
{
  "DistributionConfig": {
    "CallerReference": "ai-chat-cdn",
    "Origins": [
      {
        "Id": "github-pages",
        "DomainName": "username.github.io",
        "CustomOriginConfig": {
          "HTTPPort": 443,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      }
    ],
    "DefaultCacheBehavior": {
      "TargetOriginId": "github-pages",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "managed-caching-optimized",
      "Compress": true
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
  }
}
```

## 环境配置

### 生产环境优化

1. **启用压缩**
   ```javascript
   // 在index.html中添加
   <script>
     if ('serviceWorker' in navigator) {
       navigator.serviceWorker.register('/sw.js');
     }
   </script>
   ```

2. **Service Worker (sw.js)**
   ```javascript
   const CACHE_NAME = 'ai-chat-v1';
   const urlsToCache = [
     '/',
     '/index.html',
     '/assets/js/core.js',
     // 添加其他静态资源
   ];
   
   self.addEventListener('install', (event) => {
     event.waitUntil(
       caches.open(CACHE_NAME)
         .then((cache) => cache.addAll(urlsToCache))
     );
   });
   
   self.addEventListener('fetch', (event) => {
     event.respondWith(
       caches.match(event.request)
         .then((response) => response || fetch(event.request))
     );
   });
   ```

3. **性能监控**
   ```javascript
   // 添加性能监控
   if ('performance' in window) {
     window.addEventListener('load', () => {
       const perfData = performance.getEntriesByType('navigation')[0];
       console.log('页面加载时间:', perfData.loadEventEnd - perfData.fetchStart);
     });
   }
   ```

### 安全配置

1. **Content Security Policy**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; 
                  script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; 
                  style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; 
                  font-src 'self' https://cdn.jsdelivr.net; 
                  connect-src 'self' https://ark.cn-beijing.volces.com http://localhost:11434;">
   ```

2. **HTTPS重定向**
   ```javascript
   // 强制HTTPS
   if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
     location.replace('https:' + window.location.href.substring(window.location.protocol.length));
   }
   ```

## 监控和日志

### 错误监控

```javascript
// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error);
  // 发送到监控服务
  if (typeof gtag !== 'undefined') {
    gtag('event', 'exception', {
      description: event.error.message,
      fatal: false
    });
  }
});

// Promise错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
});
```

### 性能监控

```javascript
// 性能指标收集
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'largest-contentful-paint') {
      console.log('LCP:', entry.startTime);
    }
    if (entry.entryType === 'first-input') {
      console.log('FID:', entry.processingStart - entry.startTime);
    }
  }
});

observer.observe({entryTypes: ['largest-contentful-paint', 'first-input']});
```

## 故障排除

### 常见问题

1. **CORS错误**
   ```
   解决方案：使用HTTPS或本地服务器
   ```

2. **CDN缓存问题**
   ```bash
   # 清除Cloudflare缓存
   curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
        -H "Authorization: Bearer {api_token}" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}'
   ```

3. **GitHub Pages构建失败**
   ```yaml
   # 检查.github/workflows/deploy.yml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: .
   ```

### 调试工具

1. **浏览器开发者工具**
   - Network面板检查资源加载
   - Console面板查看错误信息
   - Application面板检查存储数据

2. **在线工具**
   - [GTmetrix](https://gtmetrix.com/) - 性能测试
   - [WebPageTest](https://www.webpagetest.org/) - 详细性能分析
   - [SSL Labs](https://www.ssllabs.com/ssltest/) - SSL配置检查

## 备份和恢复

### 数据备份

```javascript
// 导出用户数据
async function exportUserData() {
  const data = {
    personas: await storageService.loadPersonas(),
    messages: await storageService.loadAllMessages(),
    settings: settingsManager.getAllSettings(),
    timestamp: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-chat-backup-${Date.now()}.json`;
  a.click();
}
```

### 数据恢复

```javascript
// 导入用户数据
async function importUserData(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  
  // 恢复人格数据
  for (const persona of data.personas) {
    await storageService.savePersona(persona);
  }
  
  // 恢复消息数据
  for (const message of data.messages) {
    await storageService.saveChatMessage(message);
  }
  
  // 恢复设置
  settingsManager.importSettings(data.settings);
}
```

## 更新和维护

### 版本更新

1. **检查更新**
   ```javascript
   async function checkForUpdates() {
     const response = await fetch('/version.json');
     const { version } = await response.json();
     const currentVersion = localStorage.getItem('app-version');
     
     if (version !== currentVersion) {
       // 显示更新提示
       showUpdateNotification();
     }
   }
   ```

2. **自动更新**
   ```javascript
   // Service Worker更新
   self.addEventListener('message', (event) => {
     if (event.data && event.data.type === 'SKIP_WAITING') {
       self.skipWaiting();
     }
   });
   ```

### 维护任务

1. **定期清理**
   ```javascript
   // 清理旧数据
   async function cleanupOldData() {
     const cutoffDate = new Date();
     cutoffDate.setMonth(cutoffDate.getMonth() - 3);
     
     await storageService.deleteMessagesOlderThan(cutoffDate);
   }
   ```

2. **性能优化**
   ```javascript
   // 压缩数据库
   async function compressDatabase() {
     await storageService.compressMessages();
   }
   ```

通过以上配置，你可以将AI人格聊天应用部署到各种环境中，确保稳定运行和良好的用户体验。