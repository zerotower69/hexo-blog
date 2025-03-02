---
abbrlink: ''
categories:
- - 插件开发
date: '2025-03-02T20:17:53.811087+08:00'
tags:
- webpack
- 前端
title: webpack实现外链跳转拦截插件
updated: '2025-03-02T20:17:54.279+08:00'
---
记录实现一个自己实现一个`webpck`的`plugin`用于实现所有的外链拦截跳转。后序可以增设一些配置项，作为更通用的插件。

```js
const { Compilation } = require('webpack');

class ExternalLinkInterceptorPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('ExternalLinkInterceptorPlugin', (compilation) => {
      // 处理 HTML 文件
      compilation.hooks.processAssets.tap(
        {
          name: 'ExternalLinkInterceptorPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        (assets) => {
          for (const assetName in assets) {
            if (assetName.endsWith('.html')) {
              let content = assets[assetName].source();

              // 注入拦截逻辑
              content = this.injectInterceptor(content);

              // 更新资源内容
              compilation.updateAsset(assetName, {
                source: () => content,
                size: () => content.length,
              });
            }
          }
        }
      );
    });
  }

  // 注入拦截逻辑
  injectInterceptor(content) {
    // 使用正则表达式匹配所有 <a> 标签
    return content.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi, (match, quote, href) => {
      // 判断是否是外链
      if (this.isExternalLink(href)) {
        // 注入 onclick 事件
        return `<a href="${href}" onclick="return confirm('您即将跳转到外部网站：${href}\\n是否继续？');"`;
      }
      return match;
    });
  }

  // 判断是否是外链
  isExternalLink(url) {
    return /^https?:\/\//i.test(url) && !url.startsWith(window.location.origin);
  }
}

module.exports = ExternalLinkInterceptorPlugin;
```
