---
abbrlink: ''
categories: []
date: '2025-02-13T22:37:45.434867+08:00'
tags:
- Vue
title: vue中的JSX如何实现
updated: '2025-02-13T22:37:46.391+08:00'
---
# 导读

面试时被面试官问到了Vue的template和React的JSX有何不同，其中说到Vue3也能使用JSX，问Vue3是如何实现的。本文就来探讨一下这个功能。

# React的JSX

要说Vue的JSX，首先就需要谈到React的JSX。

比如一个App组件：

```jsx
import React from 'react';

function App() {
    return (
        <div>
            <h1>Hello, React 18!</h1>
        </div>
    )
}

export default App;
```

其使用webpack构建时，可以通过[@babel/preset-react](https://www.npmjs.com/package/@babel/preset-react)转为

```js
React.createElement("div",null,React.createElement("h1","Hello, React 18!"))
```

以此，React将创建虚拟节点，使用自己的渲染机制渲染。

# Vue的JSX

同理的，Vue也是使用的虚拟节点，且内置了`h`作为创建虚拟节点的函数，对于下述代码来说

```jsx
function App() {
    return (
        <div>
            <h1>Hello, Vue3!</h1>
        </div>
    )
}

export default App;
```

其应被转为:

```js
h("div",null,h("h1","Hello, Vue3!"))
```

经过查询，Vue提供了一个插件 [@vue/babel-plugin-jsx](https://www.npmjs.com/package/@vue/babel-plugin-jsx)。

和react一样，需要在babel文件中使用

```js
module.exports={
  plugins:[@vue/babel-plugin-jsx]
}
```

# Vue3中的JSX的行为不同

Vue3中的JSX支持插槽

```jsx
//默认插槽
const MyComponent = {
  setup(props, { slots }) {
    return () => (
      <div>
        {slots.default ? slots.default() : 'Default Content'}
      </div>
    );
  }
};

//具名插槽
const MyComponent = {
  setup(props, { slots }) {
    return () => (
      <div>
        {slots.header ? slots.header() : 'Header'}
        {slots.default ? slots.default() : 'Default Content'}
      </div>
    );
  }
};
```

而React的JSX要实现这样的功能，需要使用children，从这方面来看，Vue的JSX更为灵活。

# 总结

Vue的JSX和React的JSX都能够通过babel插件编译为生成虚拟节点的函数（React.createElement,Vue的h函数），其底层行为不一致；Vue的JSX支持插槽，比React的children更为灵活。
