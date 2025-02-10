---
abbrlink: ''
categories: []
date: '2025-02-10T10:37:42.275842+08:00'
tags:
- JavaScript
title: JavaScript中的伪数组
updated: '2025-02-10T10:37:42.937+08:00'
---
# 基本概念

伪数组顾名思义就是长得很像数组，其具有数组的部分特征但是又和真实的数组相差很大。一般来说，伪数组和真正的数组有两点相同：

1. 都具有.length属性。
2. 都可以使用index下标的方式获取元素。

不同之处在于：

1. 伪数组不具备数组的一些原型方法，例如forEach。
2. 伪数组的数据类型是Object,而数组是Array。

![image.png](https://static.zerotower.cn/images/2025/02/c321c79559761916c60927c08a613704.webp)

![image.png](https://static.zerotower.cn/images/2025/02/75109492bf3af5a7a829b6077a6631e0.webp)
3.伪数组的长度不可变，而数组的长度可变。

# 遍历

除了都可以使用index之外，数组和伪数组都可以使用for...of...的方法进行遍历。

# 伪数组转为数组

如果要把一个伪数组转换为真正的数组，我们可以使用以下两种方法

1. Array.from()
   此方法可以一键把我们的伪数组转为数组

![image.png](https://static.zerotower.cn/images/2025/02/14b66ba287968283a48b7daf9b5389a7.webp)
2.使用Array.prototype.slice()
借用数组的原型方法，只需要改变this也可以一键转换

![image.png](https://static.zerotower.cn/images/2025/02/3d0c634fdcda03b8703fa8700329eb81.webp)

# 拓展

除了arguments，还有哪些对象是伪数组呢？
