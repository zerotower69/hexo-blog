---
abbrlink: ''
categories:
  - - 技术杂谈
date: '2025-02-13T22:33:50.455561+08:00'
tags:
  - 前端概念
title: 受控组件和非受控组件
updated: '2025-02-13T22:33:51.144+08:00'
description: React 中的受控组件和非受控组件是处理表单元素的两种方式。受控组件通过 `state` 管理数据，适合需要实时校验和动态控制的场景；非受控组件依赖 DOM 管理数据，适合简单表单或高频输入场景。开发中优先推荐受控组件，但在性能或集成需求明确时，可选择非受控组件。
---
# 导读

**在 React 中，****受控组件（Controlled Components）**和**非受控组件（Uncontrolled Components）**是处理表单元素的两种不同方式。它们的核心区别在于**数据由谁管理**。

---

## 一、受控组件 (Controlled Components)

**定义**：表单元素的值由 React 的 `state` 控制，用户输入会触发状态更新，组件状态与用户输入始终保持同步。

### 特点

1. **表单的 **`value`（或 `checked`）属性绑定到 React 的 `state`。
2. **通过 **`onChange` 事件监听输入变化，更新 `state`。
3. **数据完全由 React 控制**，是“单一数据源”。

### 代码示例

```js
function ControlledForm() {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('提交的值:', inputValue);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button type="submit">提交</button>
    </form>
  );
}
```

### 优点

* **实时验证（例如输入时即时校验格式）。**
* **动态控制表单行为（如禁用提交按钮）。**
* **符合 React 的“单向数据流”设计。**

### 缺点

* **频繁输入时可能触发多次渲染（可通过防抖优化）。**

---

## 二、非受控组件 (Uncontrolled Components)

**定义**：表单元素的值由 DOM 自身管理，用户输入直接反映在 DOM 中，React 通过 `ref` 获取值。

### 特点

1. **表单的初始值通过 **`defaultValue` 或 `defaultChecked` 设置。
2. **使用 **`ref` 在需要时（如提交时）提取 DOM 中的当前值。
3. **数据由 DOM 管理**，React 不主动干预输入过程。

### 代码示例

```js
function UncontrolledForm() {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('提交的值:', inputRef.current.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        defaultValue="" // 初始值（可选）
        ref={inputRef}
      />
      <button type="submit">提交</button>
    </form>
  );
}
```

### 优点

* **代码更简单，减少状态更新次数。**
* **性能更高（适合高频输入场景）。**
* **便于与非 React 代码（如第三方库）集成。**

### 缺点

* **无法实时控制输入（如动态禁用按钮）。**
* **需要手动处理数据（例如提交时提取值）。**

---

## 三、如何选择？


| **场景**                       | **推荐方式**   |
| ------------------------------ | -------------- |
| **需要实时校验或动态表单行为** | **受控组件**   |
| **高频输入（如富文本编辑器）** | **非受控组件** |
| **简单表单，无需即时反馈**     | **非受控组件** |
| **与第三方库集成**             | **非受控组件** |

---

## 四、总结

* **受控组件**：通过 `state` 完全控制数据流，适合需要精确控制的场景。
* **非受控组件**：依赖 DOM 管理数据，适合简单场景或性能敏感场景。

**实际开发中，****推荐优先使用受控组件**，除非有明确的性能或集成需求。
