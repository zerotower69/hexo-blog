---
abbrlink: ''
categories:
  - - 面试技巧
date: '2025-02-17T16:57:45.864718+08:00'
tags:
  - 前端面试
title: 设计类场景题答题策略
updated: '2025-02-17T16:57:46.393+08:00'
description: 本文探讨了设计类场景题的答题策略，重点围绕如何设计一个输入框并请求数据的场景展开。文章从用户体验、性能优化、前端安全和兼容性四个维度进行分析，涵盖了防抖、节流、请求取消、输入验证、缓存、XSS防护等技术细节，并提供了代码示例。通过合理的设计，确保用户操作流畅、响应及时，同时兼顾性能和安全性，最终提升整体用户体验。
---
# 导读

现在面试题会问到很多的场景题，例如【如何设计一个input框，输入内容请求数据，你会如何设计】。通常情况下可能只想到防抖功能，但却忘记了请求数据必定会请求接口，而基于用户侧来说，请求接口是异步的，用户并不清楚程序在后面干了什么；如果请求成功了最好，如果请求失败了呢？还有用户可能输入一些无效的或者不安全的内容，如果空白字符也就没有了请求接口的意义，如果是一些HTML片段，那么也容易构成XSS攻击。本文接下来从用户体验、性能优化（面向浏览器渲染、面向服务端请求）、前端安全、兼容性等四个大的维度展开。

# 用户体验

用户体验的核心是流畅无卡顿、且有友好的反馈、错误提示等。

## 确保用户操作及时响应

如果系统中除了该input框的交互以外，有其他任务执行，且任务涉及复杂计算、渲染的，有可能造成用户交互卡顿，因此尽量不在JS处理复杂计算和渲染；如确有必要，请使用`Web Workers`、`requestIdleCallback`和`OffscreenCanvas`等方案。

## 即时反馈

用户输入后势必需要调用接口从服务端拿到数据，这个过程必定是个耗时过程，接口应该做到尽快响应；除此之外，在输入时，给用户一个下拉选择的输入提示或是请求中在input框的右侧显示loading，皆在给用户提供人性化操作和请求期待。

## 错误提示

无论是用户输入不规范的错误信息或者调用接口失败时，都应该向用户弹出一个提示框（警告或者错误级别），提示用户输入信息有误或者请求失败。但需要注意的是，请求失败次数一旦过多，将会降低用户的使用意愿，因此前后端必须紧密配合，确保请求尽快兑现。

```js
inputEl.addEventListener("input", function(e) {
  const value = e.target.value.trim(); // 去除前后空格
  if (value) {
    fetch("/api", {
      method: "POST",
      body: JSON.stringify({ query: value })
    }).then((res) => {
      if (!res.ok) {
        throw new Error("请求失败");
      }
      return res.json();
    }).then((data) => {
      // 处理响应结果
    }).catch((err) => {
      // 错误提示
      console.error(err);
      alert("请求失败，请稍后重试");
    });
  }
});
```

## 历史搜索

可以使用`LocalStorage`存入用户输入的内容，并采取LRU算法按热度排序显示。用户此次输入内容在历史搜索记录中，这样，用户直接鼠标或者手指触发就可以一键输入想输入的内容，节省用户的输入耗时。

```js
const HISTORY_KEY = "search_history";
const MAX_HISTORY_ITEMS = 10;

function saveSearchHistory(query) {
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  history = history.filter(item => item !== query); // 去重
  history.unshift(query); // 添加到最前面
  if (history.length > MAX_HISTORY_ITEMS) {
    history.pop(); // 移除最旧的记录
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function getSearchHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
}
```

# 性能优化

## 防抖

用户的输入常会快于渲染时间+请求时间，为了避免频繁的请求，需要做防抖处理，只在用户输入的最后一个字符后发送请求，而不是每输入一个字符就发送一个请求。

例如，用户搜索“达拉崩吧”，不能每输入一个字就请求一次（输入建议除外）搜索结果，必定是设置大约50ms左右的防抖以减少非用户期望的请求。

```js
function debounce(func, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

inputEl.addEventListener("input", debounce(function(e) {
  const value = e.target.value.trim();
  if (value) {
    fetch("/api", {
      method: "POST",
      body: JSON.stringify({ query: value })
    }).then((res) => {
      // 处理响应结果
    }).catch((err) => {
      // 错误提示
    });
  }
}, 300));
```

## 取消请求

上述所说的防抖也不一定就能取消所有非用户期望的请求，且用户在第一次搜索结果还没响应就又搜索了一次，此时需要废弃用户之前的无效请求，于是需要取消请求。取消请求通常可以使用`AbortController`实现。

```js
let abortController;

inputEl.addEventListener("input", debounce(function(e) {
  const value = e.target.value.trim();
  if (value) {
    if (abortController) {
      abortController.abort(); // 取消之前的请求
    }
    abortController = new AbortController();
    fetch("/api", {
      method: "POST",
      body: JSON.stringify({ query: value }),
      signal: abortController.signal
    }).then((res) => {
      // 处理响应结果
    }).catch((err) => {
      if (err.name !== "AbortError") {
        console.error(err);
        alert("请求失败，请稍后重试");
      }
    });
  }
}, 300));
```

## 节流

在某些场景下，可能需要节流代替防抖。例如在指定时间内只允许搜索一次，例如付费搜索或者会员等级限定搜索次数、或是防止爬虫工具等在规定时间内限制搜索次数。

```js
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

inputEl.addEventListener("input", throttle(function(e) {
  const value = e.target.value.trim();
  if (value) {
    fetch("/api", {
      method: "POST",
      body: JSON.stringify({ query: value })
    }).then((res) => {
      // 处理响应结果
    }).catch((err) => {
      // 错误提示
    });
  }
}, 1000));
```

## 输入验证

用户可能输入空字符或者无意义的标点符号，又或者输入长度不符合要求，可以在输入后验证输入，如果输入无意义将跳过请求。

```js
inputEl.addEventListener("input", function(e) {
  const value = e.target.value.trim();
  if (value.length > 3) { // 输入长度大于3才发送请求
    fetch("/api", {
      method: "POST",
      body: JSON.stringify({ query: value })
    }).then((res) => {
      // 处理响应结果
    }).catch((err) => {
      // 错误提示
    });
  }
});
```

## 缓存

用户可能在同一时间内多次搜索相同的内容，可以设置一个`key-value`对象，key为用户输入的内容，value为之前返回的结果数据。一旦用户再次输入后，可以直接从缓存中拿出数据，减少请求次数。

```js
const cache = new Map();

inputEl.addEventListener("input", function(e) {
  const value = e.target.value.trim();
  if (value) {
    if (cache.has(value)) {
      // 从缓存中获取数据
      const data = cache.get(value);
      // 处理缓存数据
    } else {
      fetch("/api", {
        method: "POST",
        body: JSON.stringify({ query: value })
      }).then((res) => {
        return res.json();
      }).then((data) => {
        cache.set(value, data); // 缓存数据
        // 处理响应结果
      }).catch((err) => {
        // 错误提示
      });
    }
  }
});
```

# 前端安全

前端安全有一条准则：**永远不要相信用户的输入**。有些目的不纯粹的用户可能会输入一些HTML文本或者片段，并以此发起XSS攻击。因此，在正式调用接口前，需要净化用户的输入，例如使用`dompurify`这个库。

```js
import DOMPurify from "dompurify";

inputEl.addEventListener("input", function(e) {
  const value = DOMPurify.sanitize(e.target.value.trim()); // 净化输入
  if (value) {
    fetch("/api", {
      method: "POST",
      body: JSON.stringify({ query: value })
    }).then((res) => {
      // 处理响应结果
    }).catch((err) => {
      // 错误提示
    });
  }
});
```

# 兼容性

用户的输入框可能是在移动端页面，或者同时兼容PC和移动端设备，那么就需要响应式布局或者媒体查询提供不同的样式，以保证input正常显示且符合用户的直观感受。

```css
/* 响应式布局 */
input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
}

@media (min-width: 768px) {
  input {
    width: 50%;
  }
}
```

# 总结

本文从【如何设计一个input框，输入内容请求数据，你会如何设计】出发，介绍了设计场景面试题中需要注意的问题。总的来说，需要分别从用户体验、性能优化、前端安全和兼容性四大方面。涉及到接口请求，务必考虑到`loading`的交互提示、取消请求、结果缓存、防抖和节流、接口错误提示等；而对于用户的输入，要考虑到两点：是否有意义的输入？默认用户输入内容不安全。基于以上角度，设计类场景题就能很好地应对了。当然，这还有补充一点，如果涉及到渲染性能，特别是渲染帧的问题，还可能涉及到具体的常见的性能指标、指标的测量和具体用户措施上。
