---
abbrlink: ''
categories:
  - - css基础
date: '2025-02-10T22:49:24.096171+08:00'
tags:
  - css
title: css flexbox布局-flex属性
updated: '2025-02-14T12:00:51.886+08:00'
description: 本文详细介绍了CSS Flexbox布局中的`flex`属性，包括其三个子属性`flex-grow`、`flex-shrink`和`flex-basis`的作用及默认值。通过多个代码示例，展示了`flex`属性的常见简写形式及其应用场景，如实现三等分布局、固定侧边栏与动态主内容区、响应式收缩等。文章还通过图示直观展示了不同`flex`设置下的布局效果，帮助读者更好地理解和应用Flexbox布局。
---
# flex属性介绍

用于控制flex布局下，子元素的伸缩行为。实际上是三个子属性的简写。

```css
flex:<flex-grow> <flex-shrink> <flex-basis>;
```

* flex-grow: 定义项目的扩展比例。默认值为0。
* flex-shrink: 定义项目的收缩比例。默认值为1。

  如果容器空间不足，子项目会根据flex-shrink的值收缩，值越大，收缩越多。比如flex-shrink:3收缩比flex-shrink:1收缩得多。
* flex-basis: 定义项目的初始大小。默认值为auto。
* 内容类似于width，但是比width的优先级高。可以设置为固定值（200p x 、30%、content）。

# 常见的简写形式

* flex：initial（默认值）

  ```css
  flex: 0 1 auto; /*不扩展，不收缩、初始大小为内容宽度*/
  ```

  项目内保持内容宽度，空间不够了就会收缩。
* flex：auto

```css
flex: 1 1 auto/*可扩展，可收缩，初始大小为内容宽度*/
```

项目根据内容自动调整，并参与剩余空间的分配。

* flex：none

```css
flex: 0 0 auto; /*不扩展、不收缩、固定为内容宽度*/
```

项目完全固定宽度，不响应容器的变化。

* flex: \<number>，例如常用的flex：1。

```css
flex: 1 1 0%; /*可扩展、可收缩，初始大小为0%（强制平分剩余空间）*/
```

# 举例说明

* 常用的实现三等分

```html
<div class="parent">
      <div class="child"></div>
      <div class="child"></div>
      <div class="child"></div>
</div>
```

```css
.parent {
  display: flex;
  width: 320px;
  gap: 10px;
  border: 1px solid green;
}
.child {
  height: 50px;
}
.child:nth-child(1) {
  background-color: red;
  flex: 1;
}
.child:nth-child(2) {
  background-color: yellow;
  flex: 1;
}
.child:nth-child(3) {
  background-color: blue;
  flex: 1;
}
```

![image-20250210214330342](https://static.zerotower.cn/images/2025/02/228c8e0cb8206b25b6a47b4fd2c62cd5.webp)

如果只有红色的flex：1，则css有：

```css
.child:nth-child(1) {
  background-color: red;
  flex: 1;
}
.child:nth-child(2) {
  background-color: yellow;
}
.child:nth-child(3) {
  background-color: blue;
}
```

![image-20250210214642045](https://static.zerotower.cn/images/2025/02/072d53c2710ab88d98c747970e9a43f4.webp)

则单个flex:1占满了`总长度-gap累计长度`。

如果子项存在内容了，默认内容宽度

```html
 <div class="parent">
      <div class="child"></div>
      <div class="child"></div>
      <div class="child">
        <div style="padding: 10px">我是内容</div>
      </div>
    </div>
```

![image-20250210221736683](https://static.zerotower.cn/images/2025/02/bc2b0664c84d6015fb2ef128485d6cea.webp)

* 固定混合动态

比如常见的侧边栏固定宽度，主内容区填充剩余空间。

```html
<div class="container">
      <div class="sidebar"></div>
      <div class="main"></div>
</div>
```

```css
.container {
  display: flex;
  gap: 10px;
  width: 800px;
  border: 1px solid red;
}
.sidebar {
  flex: 0 0 200px;
  height: 100px;
  background-color: yellow;
}
.main {
  flex: 1;
  height: 100px;
  background-color: green;
}
```

![image-20250210223706452](https://static.zerotower.cn/images/2025/02/af7519ce42e427fe0dac2279fd782e80.webp)

* 响应式收缩

```html
<div class="container">
      <div class="item"></div>
</div>
```

```css
.container {
  display: flex;
  width: 300px;
  border: 1px solid red;
  height: 100px;
  gap: 10px;
}
.item {
  flex: 1 1 400px;
  background-color: yellow;
  margin-left: 30px;
}
```

![image-20250210224112850](https://static.zerotower.cn/images/2025/02/e75e578d918ddba667a272908a4b1f00.webp)
