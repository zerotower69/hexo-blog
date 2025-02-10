---
abbrlink: ''
categories:
- - cesium的学习
date: '2025-02-10T08:52:12.596998+08:00'
tags:
- cesium
title: cesium的场景渲染事件
updated: '2025-02-10T08:52:12.997+08:00'
---
# 导读

犹如前端系统中浏览器或者框架中的各类事件的应用，例如各种鼠标事件、渲染调度，在cesium中同样拥有相应的事件机制，特别是Cesium中的几个场景事件。

## 场景事件

* scene.preUpdate 场景更新之前

![image.png](https://static.zerotower.cn/images/2025/02/02b7ffa63476fb0f5cbf8f729f52be5b.webp)

* scene.postUpdate 场景更新之后立即执行

![image.png](https://static.zerotower.cn/images/2025/02/efcb0312fb5af77b15016bad8e3c41a1.webp)

* scene.preRender 场景渲染之前

![image.png](https://static.zerotower.cn/images/2025/02/e2d5a4dc0117096c768b784a3d660e9d.webp)

* scene.postRender 场景渲染之后

![image.png](https://static.zerotower.cn/images/2025/02/c5ba773ba480f37b2a76c3dcd26426ed.webp)

## 渲染循环

cesium会默认开启渲染循环`RenderLoop`

viewer.useDefaultRenderLoop = false // 关闭Cesium场景自动渲染
viewer.render() // 主动触发Ceisum场景渲染
//也可以在初始化就关闭场景的自动渲染
如要使用上述的场景事件，我们可以这样：

scene.preUpdate.addEventListener(callback)
scene.postUpdate.addEventListener(callback)
scene.preRender.addEventListener(callback)
scene.postRender.addEventListener(callback)
移除事件我们可以：

scene.preUpdate.removeEventListener(callback)
scene.postUpdate.removeEventListener(callback)
scene.preRender.removeEventListener(callback)
scene.postRender.removeEventListener(callback)
## 注意事项

从官方的描述中，最难以理解的就是`scene.postUpdate`和`scene.postRender`了。我们可能会想，要是更新后马上就渲染不就是没有区别了吗，甚至我们添加监听事件测试在控制台输出时也能看到两个事件几乎同时触发，不就真的等同于没有区别了？但其实不是的。

`Cesium`我们知道其渲染最终是通过`WebGL`实现的，在更新之后要想成功渲染，也必须对`Scene`中所有的对象对应地在`WebGL`中的上下文进行对应的更新，包括相机、光源、地球、模型和图元等等。接着，`Cesium`还必须重新计算那些视图矩阵和投影矩阵、以及光源的位置和方向，甚至还有上述对象的裁剪以及排序，以便`Cesium`画布进行正确地绘制。因此，在更新和渲染两大过程之间，`Cesium`还是有着大量的工作要做的，我们是绝对不可以简单把`scene.postUpdate`和`scene.postRender`视为等同，也正是如此，一些`DOM`相关的事件我们都是放在`scene.postRender`里的而不是`scene.postUpdate`。

## 参考文章

* [场景渲染事件](http://syzdev.cn/cesium-docs/advance/scene-load-event.html)
* [官方文档](https://cesium.com/learn/cesiumjs/ref-doc/Scene.html)
