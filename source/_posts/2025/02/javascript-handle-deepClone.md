---
abbrlink: ''
categories:
- - 前端手写
date: '2025-02-10T13:16:48.100278+08:00'
tags:
- JavaScript
- 面试
title: JavaScript手写深拷贝
updated: '2025-02-10T13:16:48.918+08:00'
---
# 注意事项

* 属性值是数组
* 循环应用
* 是否是自身的属性而不是原型链继承而来的
* 注意null这个特殊的值（类型是对象）
* 注意Date、RegExp、Function这些特殊的值

# 递归法

## 不考虑Date等特殊情况

```js
function deepClone(obj) {
    function fn(obj,map = new Map()) {
        //不是对象直接返回
        if (typeof obj !== 'object' || obj === null) {
           return obj
        }
         //判断循环引用
        if (map.has(obj)) {
            return map.get(obj)
        }
        //处理数组
        if (Array.isArray(obj)) {
            const newArray = [];
            map.set(obj, newArray);
            for (const item of obj) {
                newArray.push(fn(obj,map))
            }
            return newArray
        }
        const newObj = {};
        map.set(obj, newObj);
        for (const key in obj) {
            //是不是自身的属性
            if (obj.hasOwnProperty(key)) {
                 newObj[key] = fn(obj[key],map)
            }
        }
        return newObj
    }
    return fn(obj)
}

const obj = {
    a: [1, 2, {e:'city'}],
    b: 13,
    c: undefined,
    d: { e: 'age' },
    g: null
}
obj.d.f = obj.d
const result = deepClone(obj)
console.log(result.d === result.d.f)
```

## 完整的深拷贝

```js
function deepClone(obj) {
    function fn(obj,map = new Map()) {
        //不是对象直接返回
        if (typeof obj !== 'object' || obj === null) {
           return obj
        }
         //判断循环引用
        if (map.has(obj)) {
            return map.get(obj)
        }
        //处理Date
        if (obj instanceof Date) {
            return new Date(obj)
        }
        //处理正则表达式
        if (obj instanceof RegExp) {
            return new RegExp(obj)
        }
        //函数通常是共享的
        if (typeof obj === 'function') {
            return obj
        }
        //处理数组
        if (Array.isArray(obj)) {
            const newArray = [];
            map.set(obj, newArray);
            for (const item of obj) {
                newArray.push(fn(obj,map))
            }
            return newArray
        }
        const newObj = {};
        map.set(obj, newObj);
        for (const key in obj) {
            //是不是自身的属性
            if (obj.hasOwnProperty(key)) {
                 newObj[key] = fn(obj[key],map)
            }
        }
        return newObj
    }
    return fn(obj)
}

const obj = {
    // a: [1, 2, 3],
    b: 13,
    c: undefined,
    d: { e: 'age' },
    g: null,
    h: new Date('2024-07-15'),
    j:/\d+/
}
// obj.d.f = obj.d
const result = deepClone(obj)
console.log(JSON.stringify(result),result.j instanceof RegExp)
```

# 迭代法

可以使用一个栈来存储用于拷贝的对象。走入while循环，退出条件是栈为空。

```js
function deepClone(obj) {
    //用栈模拟递归的过程
    const stack = [];
    const map = new Map();

    //初始化新的对象
    let newObj = Array.isArray(obj) ? [] : {};
    //建立联系，防止循环引用
    map.set(obj, newObj);
    //入栈
    stack.push({ origin: obj, copy: newObj })
  
    while (stack.length > 0) {
        const { origin, copy } = stack.pop();

        //遍历原始对象的属性
        for (let key in origin) {
            //自己的属性
            if (origin.hasOwnProperty(key)) {
                const value = origin[key];
                if (value === null || typeof value !== 'object') {
                    //基本值
                    copy[key] = value;
                    //检查循环引用
                } else if (value instanceof Date) { 
                    copy[key] = new Date(value)
                } else if (value instanceof RegExp) { 
                    copy[key] = new RegExp(value)
                } else if (typeof value === 'function') {
                    copy[key] = value
                 } else if (map.has(value)) {
                    copy[key] = map.get(value)
                } else {
                    //对象或者数组
                    const newValue = Array.isArray(value) ? [] : {};
                    copy[key] = newValue;
                    map.set(value, newValue); //储存拷贝的对象
                    //入栈
                    stack.push({origin:value,copy:newValue})
                }
            }
        }
    }
    return newObj
}
```
