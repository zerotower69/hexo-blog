---
abbrlink: ''
categories:
- - js基础知识
date: '2025-01-23T22:30:26.550583+08:00'
tags:
- javascript
title: 判断函数是否有async 前缀
updated: '2025-02-07T19:58:21.612+08:00'
---
# 问题

**字节有一道面试题如何判断某个函数是否使用了**`async`前缀

```js
async function fn(){
  return void 0
}

function isAsyncFn(fn){
  //?
}
```

# 控制台查看

![image-20250123221711330](https://static.zerotower.cn/images/2025/01/04e70ffc1a65351df1bcbc863fb3ff02.webp)

**对于普通函数而言：**

![image-20250123221750440](https://static.zerotower.cn/images/2025/01/16d79d467b2cde16c4f514dbfd9eb1d1.webp)

**于是可以有：**

```js
function isAsyncFn(fn){
  return fn.constructor.prototype[Symbol.toStringTag] === 'AsyncFunction'
}
```

# 补充

![](https://static.zerotower.cn/images/2025/02/10ff6714280baf4574169b8406a0b0c4.webp)

可以看到，对于生成器函数，也可以使用`Symbol.toStringTag`来判断其类型，可有：

```js
function isGenerateFn(fn){
  return fn.constructor.prototype[Symbol.toStringTag] === 'GeneratorFunction'
}
```

```js

```
