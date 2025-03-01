---
abbrlink: ''
categories: []
date: '2025-03-01T18:37:18.218235+08:00'
tags: []
title: 并发请求与最大重试
updated: '2025-03-01T18:37:19.055+08:00'
description: 文章介绍了一个用于处理并发请求并支持重试的JavaScript函数。通过`requestAll`函数发送多个请求，并在请求失败时进行重试，直到所有请求成功或达到最大重试次数。代码使用`Promise.allSettled`和递归实现重试逻辑，确保在请求失败时能够自动重试，最终返回所有请求的结果。
---
# 题目要求

手写一个函数，发送任意多个请求，其中有失败的，重发请求，直到所有的都成功或者超出最大重试的次数，才返回最终的结果。

# 代码

逻辑在注释里，看注释解释

```js

//总请求函数
function requestAll(urls = [], maxTries = 3) {
    return Promise.allSettled(urls.map(url=>singleRequest(url,maxTries)))
}

//外层单个请求定义
function singleRequest(url, maxTries = 3) { 
    return new Promise((resolve, reject) => {
        let requestCount = 0; //计数器
        //内部定义循环调用
        function _request(url) {
            fetch(url).then((res) => {
                //接口成功直接返回
                const data = res.json();
                resolve(data);
            }).catch(err => {
                //接口失败,但是计数器未超过3
                if (requestCount++ <= maxTries) {
                    console.warn('Request Error,but requestCount is ' + requestCount)
                    _request(url);
                } else {
                    //当计数器大于3真的失败了
                    reject(err);
                }
            })
        }
        _request(url);
    })
}
```
