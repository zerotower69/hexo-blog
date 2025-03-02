---
abbrlink: ''
categories:
- - 前端手写题
date: '2025-03-02T19:49:52.532094+08:00'
tags:
- 前端
- 面试
title: Proxy实现加法拦截
updated: '2025-03-02T19:49:53.338+08:00'
---
# 题目描述

请实现以下编程结果

```js
const result1 = add[1][2]+3 // 6
const result2 = add[3][4][5]+6 //18
```

# 解答

该题是记录了属性之和，考虑使用Proxy解答，其能捕获捕获或者拦截到[[get]]操作。

但要注意的是，通过+号两侧，左侧是对象右侧是数字，会涉及到隐式转换。对象需要调用Primitive方法转为原始类型才能和数字相加，这时访问的属性为`Symbol.toPrimitive`。

```js
const obj ={sum:0};

const add = new Proxy(obj,{
  get(target,prop,receiver){
    if(prop == Symbol.toPrimitive){
      const res =target.sum;
      target.sum = 0;
      return ()=>res
    } else {
      target.sum +=parseInt(prop);
      return receiver
    }
  }
})
```
