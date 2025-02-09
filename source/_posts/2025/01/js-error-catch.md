---
abbrlink: ''
categories:
  - - js基础知识
date: '2025-01-23T17:36:02.335992+08:00'
tags:
  - 面试
  - javascript
title: JS中错误捕获小结
updated: '2025-01-23T17:36:04.843+08:00'
description: JavaScript中错误捕获常用方法包括：setTimeout异步回调需内部使用try-catch处理，Promise可通过.catch捕获异常，全局错误可通过window.onerror或error事件监听实现。不同场景需采用对应策略，如异步任务需关注执行上下文，Promise需显式捕获，全局监听则适合统一处理未捕获异常及埋点上报。
---
# 导读

**开发中，我们不可避免地会遇到捕获错误处理、做一些日志上报，埋点的功能，以下是一些常见的错误捕获方式。**

**# **对setTimeout错误捕获

**由于setTimeout的回调是异步任务，以下代码无法捕获执行错误**

```js
try {
    setTimeout(() => { 
        throw new Error('定时器错误')
    },10)
} catch (err) {
    console.log("捕获的",err)
}
```

**必须在setTimeout的回调里使用**`try...catch...`语句包裹

```js
setTimeout(() => {
  try {
    throw new Error("定时器错误");
  } catch (err) {
    console.log("捕获错误", err);
  }
}, 10);
```

# Promise的错误捕获

**对于**`promise`，可以这几使用`.catch`进行捕获

```js
const p = Promise.rejected()
p.catch(err=>{
  console.log("捕获的错误",err)
})
```

# 全局错误监听

**也可以使用**`window.onerror`处理全局未捕获的错误

```js
 window.onerror = function (msg, source, lineno, colno, error) {
        console.log("Window error:", {
          message: msg,
          source: source,
          lineNumber: lineno,
          columnNumber: colno,
          error: error,
        });
        return true; // Prevents the error from propagating
      };
```

**或者**

```js
window.addEventListener("error", (e) => {
        console.log("e", e);
      });
```
