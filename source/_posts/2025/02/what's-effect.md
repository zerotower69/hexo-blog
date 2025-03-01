---
abbrlink: ''
categories:
  - - 技术杂谈
date: '2025-02-16T23:24:49.916492+08:00'
tags:
  - 前端概念
title: 前端中的副作用是什么
updated: '2025-02-16T23:24:51.813+08:00'
description: 前端中的副作用指组件渲染外影响系统状态或环境的操作，如修改全局变量、操作DOM、网络请求等。React通过`useEffect`处理副作用，Vue使用`watch`、`watchEffect`或生命周期钩子。合理管理副作用可提升组件可预测性和性能。
---
# 导读

不管是vue还是react，都提到了副作用的概念，虽然大致知道是返回渲染视图之外对整个系统或者应用内部造成其它影响的叫做副作用，但具体哪些操作属于副作用，面试时常常答不上来，特以本文记录。

# 定义

**副作用（Side Effects）**：指的是在组件渲染过程中，除了返回 JSX（React）或模板（Vue）之外，还会执行一些**额外的操作**，这些操作可能会影响**组件之外的状态或环境**。

两个关键点：额外的操作、组件之外的状态和环境。组件本身上其表达式为：

`视图 = fn(props)`

fn即组件，而函数本身的定义上同样的输入必定得到同样的输出，具有确定性，也不会产生额外的作用。而副作用就相反，会额外的产生props到视图中额外地行为。

# React 中的副作用

## React 中的副作用范围

在React 中，副作用通常指的是:

- 修改全局变量。
- 操作 DOM 节点。
- 发起网络请求。
- 设置定时器或事件监听器。
- 修改 Redux 或 Context 中的状态。

## React 如何处理副作用

React 提供了 `useEffect` 钩子来处理副作用。`useEffect` 允许在函数组件中执行副作用操作，并在组件卸载时清理这些操作。

具体的案例如下：

### 示例1：修改文档标题

```jsx
import React, { useEffect, useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  // 副作用：修改文档标题
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]); // 依赖 count，当 count 变化时执行

  return (
    <div>
      <p>Count: {count}</p >
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

export default App;

```

### 示例 2：发起网络请求

```jsx
import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState(null);

  // 副作用：发起网络请求
  useEffect(() => {
    fetch('https://api.example.com/data')
      .then((response) => response.json())
      .then((data) => setData(data));
  }, []); // 空依赖数组，仅在组件挂载时执行

  return (
    <div>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : 'Loading...'}
    </div>
  );
}

export default App;

```

### 示例3: 设置定时器

```jsx
import React, { useEffect, useState } from 'react';

function App() {
  const [time, setTime] = useState(new Date());

  // 副作用：设置定时器
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // 清理副作用
    return () => clearInterval(timer);
  }, []); // 空依赖数组，仅在组件挂载时执行

  return <div>Current Time: {time.toLocaleTimeString()}</div>;
}

export default App;

```

# Vue中的副作用

## Vue 中的副作用范围

- 修改全局变量。
- 操作 DOM 节点。
- 发起网络请求。
- 设置定时器或事件监听器。
- 修改 Vuex 状态或者Pinia状态（全局状态管理）。

## Vue 如何处理副作用

Vue 提供了 `watch` 和 `watchEffect` 来处理副作用。此外，生命周期钩子（如 `mounted`、`updated`、`beforeUnmount`）也可以用于执行副作用。

### 示例1：修改文档的标题

```html
<template>
  <div>
    <p>Count: {{ count }}</p >
    <button @click="increment">Increment</button>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  setup() {
    const count = ref(0);

    // 副作用：修改文档标题
    watch(count, (newValue) => {
      document.title = `Count: ${newValue}`;
    });

    const increment = () => {
      count.value++;
    };

    return {
      count,
      increment,
    };
  },
};
</script>


```

### 示例2: 发起网络请求

```html
<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <pre>{{ data }}</pre>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const data = ref(null);
    const loading = ref(true);

    // 副作用：发起网络请求
    onMounted(async () => {
      const response = await fetch('https://api.example.com/data');
      data.value = await response.json();
      loading.value = false;
    });

    return {
      data,
      loading,
    };
  },
};
</script>

```

### 示例3: 设置定时器

```html
<template>
  <div>Current Time: {{ time }}</div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';

export default {
  setup() {
    const time = ref(new Date().toLocaleTimeString());

    // 副作用：设置定时器
    let timer;
    onMounted(() => {
      timer = setInterval(() => {
        time.value = new Date().toLocaleTimeString();
      }, 1000);
    });

    // 清理副作用
    onBeforeUnmount(() => {
      clearInterval(timer);
    });

    return {
      time,
    };
  },
};
</script>

```

# 两者对比


| 特性               | React                                | Vue                                             |
| ------------------ | ------------------------------------ | ----------------------------------------------- |
| **副作用处理方式** | `useEffect` 钩子                     | `watch`、`watchEffect`、生命周期钩子            |
| **依赖跟踪**       | 通过`useEffect` 的依赖数组           | 通过`watch` 或 `watchEffect` 自动跟踪           |
| **清理副作用**     | `useEffect` 返回清理函数             | `onBeforeUnmount` 或 `watchEffect` 返回清理函数 |
| **典型场景**       | 修改 DOM、网络请求、定时器、订阅事件 | 修改 DOM、网络请求、定时器、订阅事件            |

# 总结

### **四、总结**

- **React** 和 **Vue** 中的副作用都是指在组件渲染过程中执行的影响外部环境或状态的操作。
- React 使用 `useEffect` 处理副作用，Vue 使用 `watch`、`watchEffect` 或生命周期钩子。
- 通过合理管理副作用，也就是随着组件的生命周期结束而清除，可以确保组件的可预测性和性能优化。
