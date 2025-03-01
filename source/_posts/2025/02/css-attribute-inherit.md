---
abbrlink: ''
categories: []
date: '2025-02-21T23:25:57.176544+08:00'
tags: []
title: css属性的继承
updated: '2025-02-21T23:25:57.651+08:00'
description: 文章探讨了CSS属性的继承性，列出了可继承的属性如`color`、`font-family`等，以及不可继承的属性如`background`、`border`等。通过`inherit`关键字可以强制继承父级属性，帮助开发者更好地理解和使用CSS继承机制。
---
# 导读

面试时被问到css的哪些属性可以被继承，没有系统地回答，还混淆了一些无法被继承的属性，特此记录。

# 可以被继承的属性


| 属性           | 作用                                                                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| color          | 字体颜色                                                                                                                                                                     |
| font-family    | 字体                                                                                                                                                                         |
| font-size      | 字体大小                                                                                                                                                                     |
| font-style     | 字体样式                                                                                                                                                                     |
| font-variant   | font-variant属性用于设置字体变体，主要用于设置英文字体，实际上时设置文本字体是否为小型的大写字母。                                                                           |
| font-weight    | 字体的粗细                                                                                                                                                                   |
| letter-height  | 行距                                                                                                                                                                         |
| line-height    | 行高                                                                                                                                                                         |
| text-align     | 文本对齐方式                                                                                                                                                                 |
| text-indent    | 定义文字的首行缩进                                                                                                                                                           |
| text-transform | 控制文本的大小写,<br/>capitalize:将每个单词的首字符变为大写；<br/>uppercase:将每个单词的所有字符变为大写；<br/>lowercase：将每个单词的所有字符变为小写；none：没有任何影响； |
| visibility     | 元素隐藏与否                                                                                                                                                                 |
| white-space    | 用于定义元素内空白                                                                                                                                                           |
| word-spacing   | 词间距，每个单词之间的空白                                                                                                                                                   |

# 不可继承的属性


| 属性                  | 作用         |
| --------------------- | ------------ |
| background            | 背景         |
| border                | 边框         |
| display               |              |
| height                | 高度         |
| width                 | 宽度         |
| margin                | 外边距       |
| padding               | 内边距       |
| position              | 定位         |
| top/right/bottom/left | 上/右/下/左  |
| z-index               | 堆叠图层级别 |
| float                 | 浮动属性     |
| clear                 | 清除浮动     |

# 强制继承

使用`inherit`关键字可以强制继承父级的属性

```css
.box{
  color:inherit;
}
```
