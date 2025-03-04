---
abbrlink: ''
categories:
- - 技术杂谈
date: '2025-03-04T12:32:54.753466+08:00'
tags:
- 浏览器缓存
- webpack
- vite
title: 强制缓存下更新文件
updated: '2025-03-04T12:32:55.128+08:00'
---
# **导读**

对于页面加载所需的资源，通常会利用浏览器自身的缓存策略避免重复加载，但每当版本迭代，总希望用户能访问最新的功能对应的文件资源，而不是缓存中的，特别是对于强制缓存而言，即使设置了`Cache-Control:max-age=3156000`，也会希望更新文件，以下就是可行的方案，共实际选择。

# **使用文件指纹**

笔者之前有过实践，在一个vue2的SPA项目中，可以通过文件指纹的方式，利用`webpack`的`contenthash`实现。

总体原理是旧版本的文件名是`app.8934.js`，已经被浏览器缓存，而其能被加载是因为`index.html`文件引入，而新版本`app.9876.js`由于没被引入没被缓存过，只要不缓存`index.html`，每次自然会引入新版本资源而不是旧版本资源。

```js
module.exports = {
output: {
  filename: '[name].[contenthash].js',
},
}
```

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        root /var/www/html;
        index index.html;

        # 针对 index.html 文件设置不缓存
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
}
```

除了`webpack`的配置，还需`nginx`的支持。

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        root /var/www/html;
        index index.html;

        # 针对 index.html 文件设置不缓存
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
}
```

对于vite，可以使用`rollup-plugin-hash`实现。

```js
import { rollup } from 'rollup';
import hash from 'rollup-plugin-hash';
 
rollup({
    entry: 'main.js',
    plugins: [
        hash({ 
            dest: 'main.[hash].js'
        })
    ]
});
```

实现一个文件指纹，还可以使用[fingerprintjs](https://fingerprint.com/)。

# **使用查询参数(Query String)**

例如，可以在具体文件后增加查询参数

```html
<script src="app.js?v=1.0.1"></script>
```

对比上面的文件指纹，其不需要构建工具的支持，但可能存在代理服务器不支持导致失效的问题。

# **使用 `Cache-Control: no-cache` 或 `must-revalidate`**

可以通过设置`cache-control`请求头，每次都向服务器发送请求。

```http
Cache-Control: no-store
```

或者

```http
Cache-Control: max-age=31536000,must-revalidate
```

但是这样每次都会向浏览器发送请求，将导致**无法充分利用浏览器的缓存能力**。

# **使用`Service Worker`**

利用`Service worker`能拦截网络请求的功能，可以更为精确地控制缓存，实现更为灵活的缓存控制机制。

* 注册`Service Worker`

```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

* **service worker 文件**

```js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('my-cache').then((cache) => {
      return cache.addAll(['/app.js']);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

此措施可以支持离线访问，但需要额外的配置，还需要注意不同浏览器的兼容问题。

# **使用版本化路径**

使用版本化路径，应对既要新版功能，又要保留原有版本功能的场景。

```html
<script src="/v1.0.1/app.js"></script>
```

但是需要Nginx等部署工具的支持，缺点是需要手动更新。

但其实也是不得缓存`index.html`文件，或者只缓存很短的时间。

# 总结

总而言之，强制缓存下更新文件可以通过文件指纹、查询参数、service worker和版本化路径解决，其中文件指纹和版本化目录都需要部署工具的配合（Nginx），而service worker可以实现离线缓存，版本化可以保留原有的功能等。

# 参考文章或文档

1. [webpack:contenthash](https://webpack.js.org/concepts/under-the-hood/#output)
2. [rollup-plugin-hash](https://www.npmjs.com/package/rollup-plugin-hash)
