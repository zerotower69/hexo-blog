---
abbrlink: ''
categories:
- - 前端概念
date: '2025-02-16T23:42:23.419035+08:00'
tags:
- 工程化
title: package.json中的sideEffects
updated: '2025-02-16T23:42:24.829+08:00'
---
# 导读

最近了解到`package.json`中一直被忽略的一个属性`sideEffects`，其标识了模块是否会对全局应用产生副作用。下面将来解释一下吧。

# sideEffects的工作原理

#### **1. Tree Shaking 的基础**

Tree Shaking 是打包工具通过静态分析移除未使用代码的优化技术。

如果模块被标记为无副作用，且未被其他模块使用，打包工具会将其移除。

#### **2. 副作用的影响**

如果模块有副作用，即使未被其他模块使用，打包工具也不能移除它（因为副作用可能会影响应用的行为）。

通过 `sideEffects` 字段明确标记副作用，打包工具可以更安全地进行 Tree Shaking。

# sideEffects 的注意事项

#### **1. 确保正确标记副作用**

如果错误地将有副作用的模块标记为无副作用，可能会导致应用行为异常。

例如，如果 polyfill 文件被错误地标记为无副作用，可能会被错误地移除。

#### **2. 测试 Tree Shaking 效果**

在开发库时，建议使用打包工具（如 Webpack 或 Rollup）测试 Tree Shaking 的效果，确保 `sideEffects` 配置正确。

#### **3. 与 `babel.config.js` 的配合**

如果使用 Babel 编译代码，确保 `babel.config.js` 中的 `preset-env` 配置不会将模块转换为 CommonJS 格式（因为 CommonJS 不支持 Tree Shaking）。

以下是一个babel的示例：

```js
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { modules: false }] // 保留 ES 模块语法
  ]
};
```

# 总结

`sideEffects` 字段是优化 Tree Shaking 的重要配置，通过明确标记模块的副作用，可以帮助打包工具更安全地移除未使用的代码，从而减少最终打包体积。在开发库时，务必根据实际情况正确配置 `sideEffects`，并测试 Tree Shaking 的效果。
