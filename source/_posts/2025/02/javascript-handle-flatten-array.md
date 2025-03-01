---
abbrlink: ''
categories:
  - - 前端手写
date: '2025-02-10T11:16:27.436448+08:00'
tags:
  - JavaScript
  - 面试
title: JavaScript数组扁平化
updated: '2025-02-10T11:16:27.897+08:00'
description: 本文介绍了JavaScript数组扁平化的三种方法：递归法、迭代法以及利用JS特性的toString + split法。递归法通过判断子项是否为数组进行递归处理，迭代法则利用`Array.prototype.some()`和`concat`实现扁平化。最后，通过JS的`toString`和`split`特性快速实现扁平化。面试时建议优先考虑迭代法，避免递归的复杂性，同时掌握JS基础特性也能提供更简洁的解决方案。
---
# 递归法

```js
function flatten(arr) {
    function fn(arr, ans = []) {
        if (Array.isArray(arr)) {
            for (const item of arr) {
                if (Array.isArray(item)) {
                    fn(item,ans)
                } else {
                    ans.push(item)
                }
            }
        }
        return ans
    }

    return fn(arr)
}

const array = [1,2,[3,[4,5,[6]]]]
console.log(flatten(array))
```

**继续递归条件: 子项是数组。**

**终止递归条件：子项不是数组，遍历完成。**

# 迭代法

```js
function flatten(arr) {
    while (arr.some(item => Array.isArray(item))) {
        arr = [].concat(...arr)
    }
    return arr
}

const array = [1,2,[3,[4,5,[6]]]]
console.log(flatten(array))
```

**由于扁平化的核心就是数组子项是否还是数组，这就符合**`Array.prototype.some()`的使用逻辑，且使用`[].concat`这种字面量的形式也不用像递归法那样开辟新的变量了。

但是面试时如果需要兼容更老的ES版本，比如ES3，还需要手写实现`Array.prototype.some()`。

# toString + split 利用JS本身的特性

**嵌套数组使用toString后自动转为，分割的字符串，只需要把字符串反向处理回数组即可。**

```js
function flatten(arr) {
    return arr.toString().split(',').map(num=>parseInt(num))
}
```

# 总结

**手写这样的题有递归的方式就会有迭代的方式，面试时还是多想想以迭代法解决，递归比较原始但从笔者自己经验来看经常卡壳，遗忘某一步关键导致递归无法终止。当然，巧妙利用JS自身的某些特性也是不错的解法，但需要对JS的基础掌握得更为扎实。**
