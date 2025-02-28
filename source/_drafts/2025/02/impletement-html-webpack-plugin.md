---
abbrlink: ''
categories: []
date: '2025-02-28T23:00:46.060573+08:00'
tags: []
title: title
updated: '2025-02-28T23:00:46.729+08:00'
---
# 导读

面试经常会问`webpack`的运行流程，其中最为重要的就是`webpack`中的`loader`和`plugin`，后者的原理以及具体实现，乃至于平时有没有手写自定义的`plugin`也就成了常考的面试题。

下图是webpack的主要执行流程：

![image.png](https://static.zerotower.cn/images/2025/02/43a79bf137f071aa160358ccaf181eb7.webp)

具体文字参考：[从源码角度分析webpack打包产出及核心流程](https://juejin.cn/post/7002027415065083911)

而我们要简单分析`html-webpack-plugin`的源码流程，进而去实现一个自己的简单版本的`html-webpack-plugin`。

# plugin的本质

首先，`webpack`的`plugin`是一个类，其一般具有函数`appl()`，webpack每次实例化`plugin`后，将调用`apply()`方法，传入一个`compiler`对象作为参数，其为`webpack`实例化的一个打包对象，其会通过`hooks`属性暴露出一系列钩子

![e48b3ee168a6b8394580257f4f06198f.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4ffe575529df44e192bdfb8bc6ec9651~tplv-k3u1fbpfcp-zoom-in-crop-mark:1512:0:0:0.awebp)

因此，实现一个自定义的`plugin`大概是这样的：

```js
class MyPlugin{
    constructor(options) {
     // 用来接收配置的参数
    }
     apply(compiler){
     // 事件监听...
     }
 }
 module.exports = MyPlugin;

```

以下也将找到源码中的此部分开始解读。

# 源码大致流程

从根目录中的**index.js**进入

![image-20250228211701087](https://static.zerotower.cn/images/2025/02/83019646d67cc2fbca891cb037f8c464.webp)

同步地注入`HtmlwebpackPlugin`自身的钩子，拿到`compilation`这个上下文对象，所有静态资源代码存放于此。

`compilation.hooks.processAssets`用于处理已经存在的资源，`tapAsync`是注入一个异步钩子用于处理，通过调用`callback`结束处理。

从下图中看到，接下来的主要逻辑就是调用`generateHtml()`方法，生成实际的html文件；如果直接跳入`generateHtml()`方法，里面代码很多，就会一头雾，不如先想想处理逻辑何时终止？从而进一步看到，`callback`回调传入了`generateHtml()`方法，在`generateHtml()`中找到其调用，也就知道了`generateHtml()`逻辑的终止处。

![image-20250228212435629](https://static.zerotower.cn/images/2025/02/6a06e451b3595ce887fe5466c573ac0c.webp)

最终是在`emitHtmlPromise`的`then()`回调中找到调用的：

![image-20250228213412103](https://static.zerotower.cn/images/2025/02/468b586988f54a7c4b9a95e22552abbc.webp)

其定义又如下图所示。从本身的`emitHtmlPromise`也很容易联想到这个`promise`可能是最终生成html的静态文件，并插入到`webpack`已经处理好的静态资源中。不妨接着展开三个`then()`回调详细观察。

![image-20250228213609328](https://static.zerotower.cn/images/2025/02/580a85171d770b3d7906a2e294b0b68d.webp)

* 第一个``then()`回调里的逻辑如下。可以由`beforeEmit`知道主要是html代码放入`compilation`之前的逻辑。

  ![image-20250228221121314](https://static.zerotower.cn/images/2025/02/122226b7a2b74c5595b92ab58fce0427.webp)
* 第二个`then()`回调里的逻辑如下。可以由`compilation.emitAsset`知道是把生成的html代码插入到`compilation`静态资源的。

  ![image-20250228221336643](https://static.zerotower.cn/images/2025/02/58d827dcf8d076d549a72292b07ad01c.webp)
* 第三个`then()`可以看到代码如下。可以由`afterEmit`知道主要是把html代码放入`compilation`之后的逻辑。

![image-20250228222037252](https://static.zerotower.cn/images/2025/02/4ce5f3868cc2e3c142ac6203e94983f6.webp)

三个`then()`回调里的核心就是获取`compilation.emitAsset`，其把生成的`html`代码通过`compiler.webpack.sources.RawSource`包装后插入到所有的静态资源文件中(在所有的文件完成之后)。

接着，由于`emitHtmlPromise`由`injectedHtmlPromise`而来，需要关注后者的具体定义，如下图所示。

![image-20250228222542625](https://static.zerotower.cn/images/2025/02/b4ec94a4f0f7aaac9b431c50d657413c.webp)

可以看到，其由`Promise.all`而来，依赖于两个小`promise`：`assetTagGroupsPromise`和`templateExecutionPromise`。结合第一个`then()`回调，从命中上，`assetTagGroupPromise`应该是具体静态资源的归类分组，也就是需要插入到最终生成的`html`中的js、css等静态资源文件；`templateExecutionPromise`则和html模板相关。自此，需要关心三件事：1)静态资源的分类归档，可能涉及到过滤操作(并不是所有生成的静态资源都要插入html)；2）html模板的读取，传递模板(options.template)和默认模板；3）这些静态资源如何注入。

## 第一个问题：静态资源的分类

需要知道有哪些静态资源会被插入到html中？主要是js、css但可能还有一些图片资源。

可以找到以下源码。关键的函数就是`generatedScriptTags()`和`generateStyleTags()`，分别是用于生成script标签和link[rel="stylesheet"]标签的描述对象。

![image-20250228223744952](https://static.zerotower.cn/images/2025/02/28ab5959a6f7c596c62da1114ee148c1.webp)

先看看`generatedScriptTags()`，其能通过`this.options.scriptLoading`属性设置`js`脚本的加载方式。

![image-20250228224154883](https://static.zerotower.cn/images/2025/02/7b3e70a9032389138e6711ce04460043.webp)

`generateStyleTags()`定义如何生成link[rel="stylesheet"]样式加载标签。

![image-20250228224543134](https://static.zerotower.cn/images/2025/02/d742792b71ee8bb5fc46f81893a6ea04.webp)

两个方法均返回下述的对象结构，磨平了差异，为注入逻辑提供了遍历。

```ts
{
  tagName:"script"|"link";
  voidTag:boolean;
  meta:{plugin:"html-webpack-plugin"},
  attributes:Object  
}
```

## 第二个问题：html模板文件的读取

待定

## 第三个问题：静态资源的注入

待定

# 实现简单版本的html-webpack-plugin

```js
const path = require('path');
const fs = require('fs');

class HTMLWebpackPlugin{
    constructor(options = {}) {
        //设置默认的options相关值
        this.options = {
            template: path.resolve(__dirname, 'default-template.html'),
            filename: 'index.html',
            publicPath: "/",
            title: 'Webpack App',
            ...options
        }

        //设置template模板缓存,省得每次重新读取
        this.templateCache = new Map();
    }
   /**
    * 
    * @param {import('webpack').Compiler} compiler 
    */
    apply(compiler) { 
        //注册compilation 钩子，当webpack开始新的编译时，这个钩子会被触发
        //compilation 是一个代表当前编译的上下文
        compiler.hooks.compilation.tap('HTMLWebpackPlugin', (compilation) => {
            //注册processAssets 钩子，当 webpack 构建好所有资源后，这个钩子会被触发,这里是webpack5的写法
            compilation.hooks.processAssets.tapAsync({
                name: 'HTMLWebpackPlugin',
                //添加额外的资源到输出中
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
            }, async (assets, callback) => {
                try {
                    //生成html
                    const html = await this.generateHtml(compilation);
                    //将生成的html添加到compilation.assets中
                    compilation.emitAsset(this.options.filename, new compiler.webpack.sources.RawSource(html));
                    //执行callback
                    callback();
                } catch (error) { 
                    //执行callback时，传递error
                    callback(error);
                }
            });
        });
    }

    /**
     * 
     * @param {import('webpack').Compilation} compilation 
     * @returns 
     */
    async generateHtml(compilation) {
    // 1. 读取模板（带缓存）
    const templateContent = await this.readTemplate(this.options.template);
  
    // 2. 生成资源标签
    const tags = this.generateTags(compilation);
  
    // 3. 替换模板变量
    return templateContent
      .replace('<%= htmlWebpackPlugin.tags.head %>', tags.head.join('\n'))
        .replace('<%= htmlWebpackPlugin.tags.body %>', tags.body.join('\n'))
        .replace('<%= htmlWebpackPlugin.options.title %>', this.options.title);
    }

    /**
     * 读取模板文件
     * @param {string} templatePath 
     * @returns 
     */
    async readTemplate(templatePath) {
    // 缓存检查，如果已经读取过，直接返回
    if (this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath);
    }
  
    // 没有缓存，直接读取文件内容
    const content = await fs.promises.readFile(templatePath, 'utf-8');
  
    // 再存入缓存
    this.templateCache.set(templatePath, content);
    return content;
    }
  
    /**
     * 标签生成
     * @param {import('webpack').Compilation} compilation 
     * @returns 
     */
    generateTags(compilation) {
    const { publicPath } = this.options;
    const head = [];
    const body = [];
  
    // 遍历所有资源
        Object.keys(compilation.assets).forEach(assetName => {
        // 根据后缀名判断是 JS 文件还是 CSS 文件
      if (assetName.endsWith('.js')) {
        body.push(
          `<script src="${publicPath}${assetName}"></script>`
        );
      } else if (assetName.endsWith('.css')) {
        head.push(
          `<link href="${publicPath}${assetName}" rel="stylesheet">`
        );
      }
    });

    return { head, body };
  }
}

module.exports = HTMLWebpackPlugin;
```

# 参考文章

* [6. 从源码角度深度剖析html-webpack-plugin执行过程](https://juejin.cn/post/7007324339926204452)
