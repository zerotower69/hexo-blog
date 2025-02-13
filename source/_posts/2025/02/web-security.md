---
abbrlink: ''
categories:
- - 技术杂谈
date: '2025-02-13T13:18:08.994315+08:00'
tags:
- 前端安全
title: 前端安全概念和一些实际操作
updated: '2025-02-13T13:18:09.882+08:00'
---
# 导读

笔者最近在疯狂面试，有些面试官会经常问到前端安全相关的内容。我背八股文时老是在背：XSS(跨站脚本攻击)、CSRF(跨站请求伪造)、CSP(内容安全策略)、Clickjacking(点击劫持)等。但实际上面试官想知道的不仅仅是概念层面，而是我们求职者在平时开发上如何规避这些常规的安全性问题，避免产品上线后埋下隐患。

下文就将结合笔者本人的技术栈:Vue、React、Next.js，谈一谈总结到的解决方法。

# XSS（跨站脚本攻击）

- **Vue**：

  - 默认转义：使用 `{{ }}` 插值时自动转义 HTML。
  - 风险点：`v-html` 指令会渲染原始 HTML，需用 `DOMPurify` 等库净化内容。

  ```vue
  <div v-html="purifiedContent"></div>
  <script>
  import DOMPurify from 'dompurify';
  export default {
    data() { return { content: '<script>alert(1)</script>' }; },
    computed: {
      purifiedContent() { return DOMPurify.sanitize(this.content); }
    }
  };
  </script>
  ```
- **React**：

  - 自动转义：JSX 中的变量会被转义。
  - 风险点：`dangerouslySetInnerHTML`，需净化内容。

  ```jsx
  import DOMPurify from 'dompurify';
  function SafeComponent({ content }) {
    const clean = DOMPurify.sanitize(content);
    return <div dangerouslySetInnerHTML={{ __html: clean }} />;
  }
  ```

# CSRF（跨站请求伪造）

- **通用方案**：

  - 后端生成 CSRF Token，前端在请求头或表单中携带。
  - 设置 Cookie 的 `SameSite` 属性为 `Strict` 或 `Lax`，同网站，同域名等。
- **Next.js 示例**（API 路由）：

  ```javascript
  // 生成 Token 并存入 Session
  import { csrfToken } from 'csrf';
  export async function getServerSideProps(context) {
    const token = csrfToken(context.req);
    return { props: { token } };
  }
  // 提交时验证
  export default function handler(req, res) {
    if (req.method === 'POST') {
      if (!validateCsrfToken(req.headers['x-csrf-token'], req.session.token)) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }
    }
  }
  ```

# CSP（内容安全策略）

对加载内容、图片、媒体资源和脚本策略控制。具体示例可参考[MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP)

- **Next.js 配置**（`next.config.js`）：

  示例使用的是严格安全策略。

  ```javascript
  module.exports = {
    async headers() {
      return [{
        source: '/(.*)',
        headers: [{
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline'"
        }]
      }];
    }
  };
  ```

# 点击劫持（Clickjacking）

具体案例介绍查看[MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/X-Frame-Options)

- **Next.js 设置 HTTP 头**：

  ```javascript
  // next.config.js
  headers: [{
    key: 'X-Frame-Options',
    value: 'DENY'
  }]
  ```

# 依赖安全

- 使用 `npm audit` 或 `yarn audit` 检查漏洞，集成 Snyk 或 Dependabot 自动更新。

  说明：Dependabot是Github提供的功能，需要在github仓库中设置并打开。

  一份相关的配置文件`.github/dependabot.yml`参考如下：

  ```yaml
  version: 2
  updates:
    - package-ecosystem: "npm" # 表示依赖项是 npm 包
      directory: "/" # 表示依赖文件位于仓库的根目录
      schedule:
        interval: "daily" # 每天检查更新
      versioning-strategy: increase # 更新到更高的版本
      allow:
        # 可以指定允许更新的包名
        - dependency-name: "express"
      ignore:
        # 可以指定忽略的包名和版本范围
        - dependency-name: "moment"
          versions: [">=2.0.0"]
  ```

# CORS(跨域资源共享)

相关概念参考[MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)。

* Next.js

```js
// next.config.js
module.exports = {
  async headers() {
    return [{
      source: '/api/(.*)',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://trusted-domain.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST' },
      ],
    }];
  },
};
```

* Nest.js

```ts

```

---

# 框架/技术栈特有安全实践

## Vue

- **服务端渲染（SSR）**：避免直接将用户输入注入模板，使用 `vue-server-renderer` 的 `createRenderer` 自动转义。
- **第三方库**：谨慎使用 `vue-sanitize` 等插件过滤内容。

## React

- **属性注入风险**：检查动态属性（如 `href`）是否包含 `javascript:`。

  ```jsx
  const userInput = 'javascript:alert(1)';
  <a href={userInput}>Click</a> // 危险！
  // 解决方案：校验协议
  const safeUrl = userInput.startsWith('http') ? userInput : '#';
  ```
- **PropTypes 校验**：防止传递危险内容。

  ```jsx
  import PropTypes from 'prop-types';
  MyComponent.propTypes = { content: PropTypes.string.isRequired };
  ```

## Next.js

- **API 路由安全**：

  - 身份验证：使用 `next-auth` 库管理会话。
  - 输入验证：使用 `zod` 或 `yup` 校验请求体。
- **中间件防护**（Next.js 12+）：

  ```javascript
  // middleware.js
  import { NextResponse } from 'next/server';
  export function middleware(req) {
    const token = req.cookies.get('auth-token');
    if (!token) return NextResponse.redirect('/login');
    return NextResponse.next();
  }
  ```
- **静态资源 SRI**：在 `next.config.js` 中为脚本添加完整性校验。
- Next.js一些安全头的配置

  ```js
  // next.config.js
  module.exports = {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            // 防御 XSS
            { key: 'X-XSS-Protection', value: '1; mode=block' },
            // 禁止 MIME 类型嗅探
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            // 防止点击劫持
            { key: 'X-Frame-Options', value: 'DENY' },
            // 严格 CSP（需根据项目调整）
            { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'" },
          ],
        },
      ];
    },
  };
  ```

---

# 更多的实际例子

## 前端无感刷新token(axios)

```js
// Axios 拦截器示例（React）
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshToken(); // 调用刷新 Token 接口
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return axios(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

## 动态加载脚本并添加完整性校验(SRI)

```js
// Vue 示例
mounted() {
  const script = document.createElement('script');
  script.src = 'https://example.com/analytics.js';
  script.integrity = 'sha256-xxxx';
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}
```

## 使用rel="noopener noreferrer"(防止钓鱼攻击)

```jsx
// React 示例
<a href=" " target="_blank" rel="noopener noreferrer">Link</a >
```

## 对Next.js API请求采取请求速率限制

```jsx
// 使用 `rate-limiter-flexible` 库
import { RateLimiterMemory } from 'rate-limiter-flexible';
const limiter = new RateLimiterMemory({ points: 5, duration: 60 });

export default async function handler(req, res) {
  try {
    await limiter.consume(req.socket.remoteAddress);
  } catch {
    return res.status(429).json({ error: 'Too many requests' });
  }
}
```

## 文件上传限制上传类型和大小

* 前端部分

  ```jsx
  // React 示例
  <input
    type="file"
    accept=".jpg,.png"
    onChange={(e) => {
      if (e.target.files[0].size > 5 * 1024 * 1024) {
        alert('File too large!');
      }
    }}
  />
  ```
* 后端二次验证

```js
// pages/api/upload.js
import { createReadStream } from 'fs';
import fileType from 'file-type';

export default async function handler(req, res) {
  const stream = createReadStream(req.file.path);
  const type = await fileType.fromStream(stream);
  if (!['jpg', 'png'].includes(type.ext)) {
    fs.unlinkSync(req.file.path); // 删除非法文件
    return res.status(400).json({ error: 'Invalid file type' });
  }
}
```

## 验证重定向参数

```js
// Vue 路由守卫示例
router.beforeEach((to, from, next) => {
  if (to.query.redirect) {
    const allowedDomains = ['https://trusted.com', '/internal-path'];
    if (!allowedDomains.some(domain => to.query.redirect.startsWith(domain))) {
      delete to.query.redirect; // 删除非法重定向
    }
  }
  next();
});
```

## 客户端的敏感数据

* 使用环境变量

  ```jsx
  // .env.local
  API_KEY=xxxx

  // 页面中使用
  export async function getServerSideProps() {
    const data = await fetch('https://api.example.com', {
      headers: { Authorization: process.env.API_KEY },
    });
  }
  ```
* 混淆前端代码（webpack terser）

```js
// next.config.js
module.exports = {
  productionBrowserSourceMaps: false, // 禁用 Source Map
  webpack: (config) => {
    config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true;
    return config;
  },
};
```

## 异常行为的监控

例如，登录失败五次以上，上传行为日志（获取到IP）

```js
// pages/api/log.js
export default function handler(req, res) {
  if (req.body.action === 'login' && req.body.failedAttempts > 5) {
    console.warn(`Suspicious login activity from IP: ${req.socket.remoteAddress}`);
    // 发送告警到监控系统（如 Sentry）
  }
  res.status(200).end();
}
```

## Cloudflare Turnstile 人机识别，防止自动化攻击

不收集用户隐私，只通过用户的行为模式。

* 在前端网页中添加一个TurnStile的脚本，并渲染组件。
* TurnStile在后台分析用户的行为模式（鼠标移动、点击频率）判断是否人为。
* 生成token。如果验证通过，TurnStile会生成一个加密的Token，发送到后端验证。
* 后端可通过Cloudflare的API，也可以通过云函数的方式验证Token的有效性，确保请求来自合法用户。

# 面试回答注意事项

## Vue 中如何避免 XSS？

- 答：避免使用 `v-html`，必须使用时用 `DOMPurify` 净化内容；确保服务端渲染时数据转义。

## React 的 `dangerouslySetInnerHTML` 有什么风险？

- 答：直接插入原始 HTML 可能导致 XSS，应始终先净化内容，并使用 `DOMPurify` 处理。

## Next.js 中如何配置 CSP？

- 答：在 `next.config.js` 的 `headers` 中设置 `Content-Security-Policy`，或使用自定义服务器中间件添加 HTTP 头。

## 如何防范 CSRF？Next.js 中的实现？

- 答：使用 CSRF Token 验证，Next.js 可在 API 路由中通过 `getServerSideProps` 传递 Token，并在提交时校验。

## JWT 存储在前端哪里最安全？

- 答：存储在 `httpOnly` Cookie 中，避免被 XSS 窃取，同时设置 `SameSite=Lax` 和 `Secure` 标志（HTTPS）。

---

# 总结

- **框架特性**：Vue/React 的自动转义机制需配合安全实践（如避免危险 API），Next.js 需合理配置 HTTP 头和中间件。
- **工具链**：使用净化库（DOMPurify）、安全头扫描工具（SecurityHeaders.com）、依赖审计工具。
- **开发习惯**：永远不信任用户输入，输出前转义/净化，最小化第三方依赖风险。
