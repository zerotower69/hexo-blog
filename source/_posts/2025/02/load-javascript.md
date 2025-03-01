---
abbrlink: ''
categories:
  - - 技术杂谈
date: '2025-02-20T08:58:03.693427+08:00'
tags:
  - javascript
title: JavaScript脚本的延迟加载
updated: '2025-02-20T08:58:04.183+08:00'
description: 本文介绍了JavaScript脚本延迟加载的几种方法，包括使用`defer`和`async`属性、动态创建`script`标签、使用动态加载库如`requireJS`和`systemjs`，以及通过`IntersectionObserver`实现懒加载。这些方法各有优缺点，适用于不同场景，如广告接入、长页面内容等，以提高页面加载性能。
---
# 导读

本文主要总结了一些异步加载`javascript`脚本的方法和优缺点。

# 1. defer属性

`<script>` 标签上的defer属性允许脚本在文档解析后加载，但在`DOMContentLoad`事件触发前执行，且仅适用于外部脚本。

```html
<script defer src="path/to/your-script.js>
```

# 2. async属性

和`defer`类似，加载时不会阻塞HTML文档的解析，但是其在加载后立即执行，不会等到整个文档解析完成后才加载，导致其执行顺序是不确定的。

```html
<script async src="path/to/your-script.js>
```

# 3.动态创建script标签

通过JS创建标签并插入到文档中

```js
var script = document.createElement('div')
script.src = "path/to/your-script.js";
document.body.appendChild(script);
```

# 4.使用动态加载库

[requireJS](https://www.npmjs.com/package/requirejs)

[systemjs](https://www.npmjs.com/package/systemjs)

# 5. IntersectionObserver

通过这个Observer，预先占位符的方式，空白div的`dataset`属性定义。

```html
<!DOCTYPE html>
<html>
<head>
  <title>Lazy Load Scripts with IntersectionObserver</title>
</head>
<body>
  <!-- 页面其他内容 -->
  <div style="height: 150vh;">滚动下方区域加载脚本...</div>

  <!-- 延迟加载脚本的占位元素 -->
  <div class="lazy-script" data-src="path/to/your-script.js"></div>
  <div class="lazy-script" data-src="path/to/another-script.js"></div>

  <script>
    // 1. 定义延迟加载函数
    function lazyLoadScript(placeholder, callback) {
      const src = placeholder.dataset.src;
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        // 脚本加载完成后停止观察并执行回调
        observer.unobserve(placeholder);
        callback && callback();
      };
      document.body.appendChild(script);
    }

    // 2. 创建 IntersectionObserver 实例
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 当占位元素进入视口时加载脚本
          lazyLoadScript(entry.target, () => {
            console.log('脚本已加载:', entry.target.dataset.src);
          });
        }
      });
    }, {
      rootMargin: '0px',   // 视口边界扩展
      threshold: 0.1       // 元素可见 10% 时触发
    });

    // 3. 查找所有占位元素并开始观察
    document.querySelectorAll('.lazy-script').forEach(el => {
      observer.observe(el);
    });
  </script>
</body>
</html>

```

这个方法用来图片懒加载也是同理的。

适用场景：无关核心的功能的三方脚本：广告接入、用户按需使用的功能，长页面内容等。
