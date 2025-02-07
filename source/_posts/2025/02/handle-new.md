---
abbrlink: ''
categories:
- - JavaScript
date: '2025-02-07T23:19:35.571660+08:00'
tags:
- 前端面试
- 手写题
title: 手写实现new
updated: '2025-02-07T23:19:37.128+08:00'
---
# 描述

手写一个函数`myNew`实现`new`操作符。

# new干了什么


1. **在内存中创建一个新的对象obj**
2. **将新对象的[[Prototype]]被赋值为构造函数的prototype属性**
3. **将构造函数中的this指向新对象obj**
4. **执行构造函数中的代码获取返回值**
5. **如果构造函数返回非空对象，则返回该对象；否则返回刚创建的新对象**


# 手写

```js


function myNew() {
    // 创建一个新对象
    let obj = Object.create(null);
    // 获取构造函数
    let Constructor = Array.prototype.shift.call(arguments); //获取参数数组的第一个，也就是传入的构造函数
    // 实现继承
    obj.__proto__ = Constructor.prototype;
    // 执行构造函数,并让构造函数的this指向新对象
    let result = Constructor.apply(obj, arguments);
    // 返回结果，非空对象返回结果，否则返回新对象
    return typeof result === 'object' ? result : obj;
}
```

# 测试例子

```js
function Person(name, age) {
    this.name = name;
    this.age = age;
    return {
        name: 'return name',
        age: 18
    }
}

const p = myNew(Person, 'Tom', 18);
console.log(p); // { name: 'return name', age: 18 }
```
