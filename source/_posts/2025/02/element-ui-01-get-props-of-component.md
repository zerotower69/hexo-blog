---
abbrlink: ''
categories:
- - element组件库
date: '2025-02-10T08:34:02.796716+08:00'
tags:
- element-plus
title: element组件库系列（一）--如何捕获组件的props定义
updated: '2025-02-10T08:34:03.301+08:00'
---
---
theme: vue-pro
---
# 前言

这是element组件库系列文章，主要是平时使用element组件库的一些过程和心得，文章篇幅不定，有长有短，但主打一个实用（可能实用不一定是对你实用，不实用请轻喷）。废话少说，本篇将讲述我是如何使用typescript捕获到组件的props类型定义并进一步封装的。


| package      | version |
| ------------ | ------- |
| element-plus | 2.2.15  |
| Vue3         | 3.3.4   |

# 前置知识

阅读本文，你可能需要先了解以下typescript类型的三个知识点：

* [Parameters](https://hackernoon.com/a-guide-on-how-typescript-parameters-type-works)
* [typeof](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)
* [Exclude](https://juejin.cn/post/7199250631113965627)

在此简要说明，ts中的、`typeof`和js的`typeof`还是有着一些区别的，js中`typeof`只能识别基本类型而已，对于Array、Date两个只知道是对象，不知道是哪两个中的哪一个；而ts中的`typeof`完全可以精确识别出 Date和Array的类型。`Parameters`获取的是函数参数所有类型定义，返回一个参数的类型列表（也叫元组tuple）。

# 正文开始

## 1.需求来源说明

我在封装一个通用的列表组件时，内部使用了element-plus的table组件，期望我传递table-column的json配置(props和一个自定义实现的customRender函数)时，我配置这个json结构时我能有良好的类型提示。本想直接把element组件的props通过import导出，不幸的是，我发现element-plus并没有可以像ant-design-vue一样可供我提供导出的props定义。
以下是通过import导出ant-design-vue的Table组件的props类型定义，但element-plus没有。

![image-20230808220947618.png](%E5%BE%85%E5%8F%91%E5%B8%83%E6%96%87%E7%AB%A0.assets/6da786c32ae2572c053cff10d6fb3cca.webp)

## 2.分析问题

我们知道组件可以导出的，到处是一个value而不是type，难道我要加个`typeof`？然而，ElTableColumn是组件，`typeof`返回的是其组件的定义，并不是props的类型定义。好的，点进去直接copy这里的定义不就好了？（你觉得真的好吗？）

![image-20230808221311929.png](https://static.zerotower.cn/images/2025/02/113e088976d42b03040b5611b5927d88.webp)

真的让我有点头疼，我只好又开始研究`typeof`返回的值了。经过一番折腾（激光扫视），我看到了组件类型定义中有个setup属性，我们知道setup是个函数，其第一个参数是props，第二个参数是一个上下文对象。等等，这个props的类型不就是我们需要的吗，让我看看取setup看看编辑器会有什么提示。

![image-20230808222613028.png](https://static.zerotower.cn/images/2025/02/271d7a230efe8b23f2566215a372b539.webp)

我发现确实可以在setup定义中找到我所期待的props的定义，红色方框圈起来的一部分确实是我平时使用el-table-column会提示的属性。问题来了：我们如何捕获这里的定义，把它拿出来使用呢？

## 3.捕获类型

由于setup是一个函数，props相当于是它的某个参数，我要做的事就是捕获函数类型定义中的参数定义这部分。正好，ts提供了一个`Parameters`类型定义用来干这事。其在【前置知识】部分已经介绍，在这不再赘述。

于是，可以看到：

![image-20230808224427141.png](https://static.zerotower.cn/images/2025/02/1eac9f80c7274ff6d86d3281f1ce9c57.webp)

不是说好返回的是一个元组吗，咋是一个联合类型呢？而且我传给`Parameters`的setup的类型定义在报错哎，~~头秃，关机下班！~~

喝一口99年烧开的绿色蒸馏水，再看看我提取的setup类型定义，这次仔细地~~把它的身子舔一遍，不是~~，把它的提示代码从头到尾地看上一遍。我又发现了：小老弟，你咋又是个联合类型呢？回想一下：好像vue3在支持composition API的同时保留了options API，options API没有setup，所以整个组件定义中它并非是个函数，只是在composition API写法中是个函数（有点不确定，欢迎指正）。

![image-20230808224307347.png](https://static.zerotower.cn/images/2025/02/983dd66866207315857aba83a088d413.webp)

好了，setup再研究又得翻到源码实现了，~~本来这事就有点浪费时间，老板知道了不得把我企微踢了？~~回到上一步，我提取setup的时候有没有办法只提取联合类型的某个部分呢？别说，还真有，强大的ts早就考虑预言到了我会为此头秃，预定义了`Exclude`。其作用就是字面意思：**排除**，具体用法参考【前置知识】。

于是乎，正确地提取setup类型是这样的，把万恶的`undefined`给扬了！

![image-20230808225813065.png](https://static.zerotower.cn/images/2025/02/51b66cad8b8530b73585c2f96c0019e4.webp)

这才是我喜欢的小老弟嘛，上个小老弟太坏了，害我秃头，拉出去鞭尸。

新提取出的参数类型如下：

![image-20230808230006757.png](https://static.zerotower.cn/images/2025/02/7c53169075457e625da9a56d322ffeb3.webp)

终于是一个顺眼的元组小老弟了，~~再舔一舔~~，第一个是props的定义，第二个值是setup的上下文对象`SetupContext`。提示虽然看着长，但是名字一眼洞穿，只是编辑器哗啦提示一大串吓懵圈了而已。

我需要的是第一个props类型定义，所以让我把上述的代码合并起来一步到位吧：

![image-20230808230442527.png](https://static.zerotower.cn/images/2025/02/10d00663925a9170251709a80b612616.webp)

这一行代码写出来可真是不容易啊，加上我的业务customRender定义，终于得到了：

type ResultListTableColumn=
(Parameters<Exclude<(typeof ElTableColumn)['setup'],undefined>>[0]) & { customRender:(...args:any[])=>VNode };

大功告成，完结散花，告别秃头。这下真的可以关机下班了！让我们下篇再见！

---
