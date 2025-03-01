---
abbrlink: ''
categories:
- - 小程序从入门到实践
date: '2025-03-01T10:33:24.796648+08:00'
tags:
- 小程序
- 生命周期
title: 小程序的生命周期
updated: '2025-03-01T10:33:25.238+08:00'
---
# 导读

小程序的生命周期主要有三大部分：**应用生命周期**、**页面生命周期**和**组件生命周期**。其中，应用生命周期和页面生命周期和其**双线程机制**(AppService逻辑线程和webview渲染线程)以及小程序的冷启动和热启动息息相关，下述关于应用生命周期的介绍也将穿插双线程的的一些流程。

# 应用生命周期

应用生命周期主要有以下几个:

* **onLaunch**

小程序冷启动后全局加载一次，可以在此展示启动信息，并调用微信登录

* **onShow**

  小程序从后台进入前台（通常是热启动）,和初次加载也就是冷启动时触发。可以在此，更新应用状态，设置全局变量等。
* **onHide**

应用关闭或者退出。小程序应用从前台进入后台时触发。

* **onError**

全局错误，JS脚本错误时触发。

- **onPageNotFound**

页面未找到时被触发。

# 页面生命周期

页面也有自己的生命周期，除此之外还有一些特殊的方法。其页面的生命周期流程可以参考下图：

![img](https://static.zerotower.cn/images/2025/03/0aba5a4d87f8fd50a068936b8391503d.webp)

* **onLoad**

页面加载后触发，此时的加载是页面实例**Page**被创建后立刻加载，此时AppService逻辑线程创建，等待webview渲染线程的通知。

此时可以做一些页面初始信息的获取

* **onShow**

有两点需要注意，第一点是紧跟onLoad触发后触发，因为页面加载也等同于页面从无到有，页面实例**Page**进入激活态（Active），此时未发生首次渲染；第二点是页面从存活态(Alive)进入激活态(Active)，相当于从后台进入前台，也会触发onShow。

* **onHide**

页面从前台进入后台时触发，此时页面实例从激活态（Active）转入存活态(Alive)

* **onReady**

这一生命周期函数有点复杂。其是AppService创建后等待webview渲染线程的创建完毕通知，当收到通知后，将通过JSBridge向渲染线程发送初次数据；当渲染进程**完成首次渲染（First Render）**后，通知逻辑线程，逻辑线程收到通知后，将触发onReady页面生命周期函数。

由于完成了初次渲染，可以在此操作DOM，并完成图表、地图的初始化。

* **onUnload**

当页面销毁后，也就是销毁Page实例前触发该页面生命周期函数。可以在这里清除定时器、释放地图等。

* **onRouteDone**

监听路由动画完成后触发。

## 页面的其他一些触发函数

* onPullDownRefresh

监听用户下拉动作

* onReachBottom

页面上拉触底事件的处理函数

* [onShareAppMessage](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onShareAppMessage-Object-object)

点击右上角转发时触发。

* [onShareTimeline](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onShareTimeline)

用户点击右上角发布到朋友圈

* [onAddToFavorites](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onAddToFavorites-Object-object)

用户点击右上角收藏

* [onPageScroll](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onPageScroll-Object-object)

页面滚动时触发的逻辑函数

* [onResize](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onResize-Object-object)

页面尺寸变化时触发

* [onTabItemTap](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onTabItemTap-Object-object)

当前是tab页时，点击tab会触发。

* [onSaveExitState](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html#onSaveExitState)

页面销毁前保留状态回调

# 组件生命周期

组件生命详细描述参考[微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/lifetimes.html)。

![image-20250301102905485](https://static.zerotower.cn/images/2025/03/b84b398ba227a72672314211a7580c5d.webp)

![image-20250301102952770](https://static.zerotower.cn/images/2025/03/0075a532a27b1adaeea53042121a8799.webp)

![image-20250301103057872](https://static.zerotower.cn/images/2025/03/36450254b400ebd28b91226494762f7a.webp)

# 总结

以上就是小程序相关的生命周期，需要结合小程序特有的双线程机制加强理解，以避免不规范的代码。
