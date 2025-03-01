---
abbrlink: ''
categories: []
date: '2025-02-21T20:58:34.657032+08:00'
tags:
  - react
  - webpack
title: 使用webpack启动react
updated: '2025-02-21T22:18:15.754+08:00'
description: 本文介绍了如何通过webpack自定义配置来启动React应用，摆脱对脚手架的依赖。内容包括安装webpack、babel及相关loader，配置webpack和babel文件，以及设置package.json中的脚本命令，帮助开发者实现更灵活的打包和开发环境配置。
---
```

# 导读

经常使用脚手架来启动react应用，但是在复杂项目中我们需要使用`webpack`自定义来优化我们项目具体的打包配置的，本篇主要是记录如何使用`webpack`而不是依赖于脚手架本身来构建`react`应用。

# 安装webpack三件套

首先，我们需要安装以下三个库


| 库名               | 地址 | 用途 |
| ------------------ | ---- | ---- |
| webpack            |      |      |
| webpack-cli        |      |      |
| webpack-dev-server |      |      |

```bash
npm i -D webpack@5 webpack-cli webpack-dev-server
```

# 安装babel、loader、htmlwebpackplugin


| 库名                | 地址                                              | 用途                                      |
| ------------------- | ------------------------------------------------- | ----------------------------------------- |
| @babel/core         | https://babeljs.io/docs/babel-core                | babel中的transform过程，将字符串解析为AST |
| @babel/preset-env   | https://babeljs.io/docs/babel-preset-env          | 允许使用最新的语法                        |
| @babel/preset-react | https://www.npmjs.com/package/@babel/preset-react | 转换React 的JSX                           |
| babel-loader        | https://www.npmjs.com/package/babel-loader        | webpack loader时 babel转换                |
| css-loader          | https://www.npmjs.com/package/css-loader          | 主要处理import 导入的css文件              |
| style-loader        | https://www.npmjs.com/package/style-loader        | 将css注入到loader中                       |

```bash
npm i -D @babel/core @babel/preset-env @babel/preset-react babel
-loader style-loader css-loader html-webpack-plugin
```

# webpack的配置文件

注意入口文件``main.js`、`module.rules`以及`plugin`的配置，并指定输出的文件名和输出路径；resolve负责指定需要被解析的文件格式。

```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {
    static: path.join(__dirname, 'dist'),
    compress: true,
    port: 3000,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
```

# 配置babel文件

还需要配置babel文件，告诉babel如何解析React的JSX。

通常是将JSX替换为 `React.createElement('div',null)`的格式，而这样的格式往往是创建出需要的虚拟DOM节点。

```js
{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}
```

# 配置package.json中scripts脚本

```json
{
  "scripts": {
    "start": "webpack serve --mode development",
    "build": "webpack --mode production"
  },
}
```

使用`npm run start`开发模式下启动，使用`npm run build`打包模式。
