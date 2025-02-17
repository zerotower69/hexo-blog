---
abbrlink: ''
categories: []
date: '2025-02-16T23:44:03.208202+08:00'
tags:
- JavaScript
title: JavaScript对象的遍历
updated: '2025-02-17T10:36:37.265+08:00'
---
# 导读

最新面试被问到了如何去遍历一个`Object`，以下就简单记录一下几种方法和不同吧。

# for...in...

使用`for...in...`可以遍历一个对象，其可以迭代所有的字符串属性，包括从原型链继承来的。[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/for...in)

```js
const object = { a: 1, b: 2, c: 3 };

for (const property in object) {
  console.log(`${property}: ${object[property]}`);
}
```

但如果只想用自己的属性，可以通过`Object.prototype.hasOwnProperty`判断

```js
const originObject = { a: 1, b: 2, c: 3 }
const object = Object.create(originObject);
object.d=4

for (const property in object) {
  if(object.hasOwnProperty(property)){
      console.log(`${property}: ${object[property]}`);
  }
}
```

# Object.keys

**`Object.keys()`** 静态方法返回一个由给定对象自身的可枚举的字符串键属性名组成的数组。

[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/keys)

```js
const object = { a: 1, b: 2, c: 3 };
const keys = Object.keys(object);
```

# 总结

如果需要查找包含原型继承的属性，用`for...in..`，否则用`Object.keys()`。因为`for...in...`需要查找原型链，其效率会比较慢，不如`Object.keys()`。
