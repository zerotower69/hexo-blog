---
abbrlink: ''
categories:
  - - JavaScript
date: '2025-02-07T19:52:11.316224+08:00'
tags:
  - 手写题
  - 前端面试
title: JavaScript数组去重
updated: '2025-02-07T19:52:12.878+08:00'
description: 文章分析了JavaScript中10种数组去重方法的性能，从最优到最差排序。使用Set和Array.from的组合以O(n)时间复杂度居首，而依赖includes和indexOf的O(n²)方法效率较低，第三方库lodash因额外开销排名末尾。性能差异主要源于实现原理，高时效方法利用数据结构特性，低效方法则频繁遍历数组。
---
# 导读

在JavaScript中，数组去重有多种实现方式。本文将对10种常见的去重方法进行性能分析，并按执行时间从快到慢排序。

---

## 性能排序

以下是10种去重方法的性能排序（从最快到最慢）：

1. **使用 `Set`**
2. **使用 `Array.from` 和 `Set`**
3. **使用 `reduce` 和 `Set` 结合**
4. **使用 `Object` 或 `Map`**
5. **使用 `reduce` 和 `Object` 结合**
6. **使用 `filter` 和 `indexOf`**
7. **使用 `forEach` 和 `includes`**
8. **使用 `reduce`**
9. **使用 `for` 循环**
10. **使用 `lodash` 库**

---

## 性能分析

### 1. 使用 `Set`

`Set` 是专门用于存储唯一值的数据结构，其去重操作的时间复杂度为 **O(n)**，是所有方法中最快的。

```javascript
const uniqueArray = [...new Set(array)];
```

### 2. 使用 `Array.from` 和 `Set`

与直接使用 `Set` 类似，`Array.from` 将 `Set` 转换为数组，性能接近 `Set`。

```javascript
const uniqueArray = Array.from(new Set(array));
```

### 3. 使用 `reduce` 和 `Set` 结合

通过 `reduce` 和 `Set` 结合，性能略低于直接使用 `Set`，但仍非常高效。

```javascript
const uniqueArray = Array.from(array.reduce((acc, item) => acc.add(item), new Set()));
```

### 4. 使用 `Object` 或 `Map`

利用对象的键或 `Map` 的唯一性，时间复杂度为 **O(n)**，但由于对象操作的开销，性能略低于 `Set`。

```javascript
const uniqueArray = Object.keys(array.reduce((acc, item) => (acc[item] = true, acc), {}));
```

### 5. 使用 `reduce` 和 `Object` 结合

与上一种方法类似，但使用 `Object.values` 提取值，性能稍低。

```javascript
const uniqueArray = Object.values(array.reduce((acc, item) => (acc[item] = item, acc), {}));
```

### 6. 使用 `filter` 和 `indexOf`

`indexOf` 的时间复杂度为 **O(n)**，因此整体时间复杂度为 **O(n^2)**，性能较差。

```javascript
const uniqueArray = array.filter((item, index) => array.indexOf(item) === index);
```

### 7. 使用 `forEach` 和 `includes`

`includes` 的时间复杂度为 **O(n)**，因此整体时间复杂度为 **O(n^2)**，性能与 `filter` 和 `indexOf` 接近。

```javascript
const uniqueArray = [];
array.forEach(item => { if (!uniqueArray.includes(item)) uniqueArray.push(item); });
```

### 8. 使用 `reduce`

通过 `reduce` 和 `includes` 结合，时间复杂度为 **O(n^2)**，性能较差。

```javascript
const uniqueArray = array.reduce((acc, item) => (!acc.includes(item) && acc.push(item), acc), []);
```

### 9. 使用 `for` 循环

传统的 `for` 循环结合 `includes`，时间复杂度为 **O(n^2)**，性能较差。

```javascript
const uniqueArray = [];
for (let i = 0; i < array.length; i++) {
  if (!uniqueArray.includes(array[i])) uniqueArray.push(array[i]);
}
```

### 10. 使用 `lodash` 库

`lodash` 的 `_.uniq` 方法虽然方便，但由于是第三方库，性能通常不如原生方法。

```javascript
const uniqueArray = _.uniq(array);
```

---

## 总结


| 方法                          | 时间复杂度 | 性能排名 |
| ----------------------------- | ---------- | -------- |
| 使用`Set`                     | O(n)       | 1        |
| 使用`Array.from` 和 `Set`     | O(n)       | 2        |
| 使用`reduce` 和 `Set` 结合    | O(n)       | 3        |
| 使用`Object` 或 `Map`         | O(n)       | 4        |
| 使用`reduce` 和 `Object` 结合 | O(n)       | 5        |
| 使用`filter` 和 `indexOf`     | O(n^2)     | 6        |
| 使用`forEach` 和 `includes`   | O(n^2)     | 7        |
| 使用`reduce`                  | O(n^2)     | 8        |
| 使用`for` 循环                | O(n^2)     | 9        |
| 使用`lodash` 库               | O(n)       | 10       |
