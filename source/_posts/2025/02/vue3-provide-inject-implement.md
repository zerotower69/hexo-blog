---
abbrlink: ''
categories:
  - - vue源码实现
date: '2025-02-11T08:55:26.466635+08:00'
tags:
  - vue3
  - 源码分析
title: vue3中provide/inject实现原理
updated: '2025-02-12T10:17:26.745+08:00'
description: Vue3中的`provide/inject`机制通过组件实例的`provides`属性实现数据注入，子组件通过原型链继承父组件的`provides`，确保数据隔离与共享。`provide`用于注入数据，`inject`用于获取数据，支持默认值和函数处理，适用于深层嵌套组件的上下文传递。
---
# 导读

Vue有一个注入全局上下文的机制，叫`provide/inject`，其可以向子级组件注入一些属性，无论嵌套得有多深。其效果和React的`Context`类似。本文将通过具体的源码详细说明其原理实现。

![prop drilling diagram](https://static.zerotower.cn/images/2025/02/d3d1199e178e9e53bea0a5858877c9a1.webp)

下方所述代码在[ `/core/packages/runtime-core/src/apiInject.ts`](https://github.com/vuejs/core/blob/2ab70c202fc54577d50ec6818870391ad8038a2a/packages/runtime-core/src/apiInject.ts#L11)

# provide

`provide` 接受两个参数，key和value，也就是注入数据的key值和具体注入的数据，key可接受string和Symbol类型。

先贴出源码

```js
export function provide<T, K = InjectionKey<T> | string | number>(
  key: K,
  value: K extends InjectionKey<infer V> ? V : T,
): void {
  if (!currentInstance) {
    if (__DEV__) {
      warn(`provide() can only be used inside setup().`)
    }
  } else {
    let provides = currentInstance.provides
    // by default an instance inherits its parent's provides object
    // but when it needs to provide values of its own, it creates its
    // own provides object using parent provides object as prototype.
    // this way in `inject` we can simply look up injections from direct
    // parent and let the prototype chain do the work.
    const parentProvides =
      currentInstance.parent && currentInstance.parent.provides
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    // TS doesn't allow symbol as index type
    provides[key as string] = value
  }
}
```

可以看到，组件上有个属性`provides`，最终开发者使用`provide`注入的数据都会设置在其身上，从``provide`开始往下的组件树，子组件使用`provide`时将同样使用父级组件的`provides`属性来创建自己的`provides`。

在这段代码中，需要注意的是[`Object.create()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/create)的使用。其传入一个现有的对象作为原型，创建一个新的对象。也就是说子级组件的`provides`从父级继承而来，是一个新的对象，保留父级组件`provides`属性的同时，也不会污染到父级组件`provides`，实现了隔离。但请注意：子组件的`provides`在创建时直接复用父级组件的`provides`或应用上下文对象的`provides`(当组件是根组件时)，也就是按需隔离，也就是使用`provide`时才使用`Object.create()`通过原型链实现隔离，否则每一子组件从创建开始就创建自己的`provides`，随着组件嵌套，这个原型链也将增长，进一步影响到性能。

# inject

`inject`接受三个参数，第一个参数就是`provide`使用的key，第二个就是上游父组件没有使用`provide`提供数据时默认的值，第三个则是是否默认第二个参数是函数。

```js
export function inject(
  key: InjectionKey<any> | string,
  defaultValue?: unknown,
  treatDefaultAsFactory = false,
) {
  // fallback to `currentRenderingInstance` so that this can be called in
  // a functional component
  const instance = currentInstance || currentRenderingInstance

  // also support looking up from app-level provides w/ `app.runWithContext()`
  if (instance || currentApp) {
    // to support `app.use` plugins,
    // fallback to appContext's `provides` if the instance is at root
    // #11488, in a nested createApp, prioritize using the provides from currentApp
    const provides = currentApp
      ? currentApp._context.provides
      : instance
        ? instance.parent == null
          ? instance.vnode.appContext && instance.vnode.appContext.provides
          : instance.parent.provides
        : undefined

    if (provides && (key as string | symbol) in provides) {
      // TS doesn't allow symbol as index type
      return provides[key as string]
    } else if (arguments.length > 1) {
      return treatDefaultAsFactory && isFunction(defaultValue)
        ? defaultValue.call(instance && instance.proxy)
        : defaultValue
    } else if (__DEV__) {
      warn(`injection "${String(key)}" not found.`)
    }
  } else if (__DEV__) {
    warn(`inject() can only be used inside setup() or functional components.`)
  }
}

```

首先通过`currentInstance`拿到组件渲染实例，同时，由于vue提供了函数式组件的的能力，将通过`currentRenderingInstance`拿到组件实例。通过`if(instance || currentApp)`判断当前是否有组件实例，如果没有就观察是否使用`app.runWithContext`注入了上下文，如果注入了`currentApp`有值。而`app.runWithContext`通常和`createApp()`使用有关。

```js
import {createApp} from "vue"
```

这里可以看看笔者之前的一篇文章：[Cesium+Vue3实现可跟踪的点位详情弹窗](https://juejin.cn/post/7242217556622655545)，其就是利用到`createApp()`这个函数。

```js
const provides = currentApp
      ? currentApp._context.provides
      : instance
        ? instance.parent == null
          ? instance.vnode.appContext && instance.vnode.appContext.provides
          : instance.parent.provides
        : undefined
```

上述的一大串的三元表达式，当`createApp`存在，此时是一个应用的概念，其组件`components`、`provides`、`exports`属性都保存在内部的上下文属性`_context`上，取出`provides`值；当组件示例存在但是没有父组件，意味着其为根组件，那么就从应用的上下文对象`appContext`取出provides。往下的逻辑就是取出`provides`对应的属性，如果没有属性且提供了默认值的情况，则使用默认值，否则返回的就是`undefined`。当然，在开发模式下，如果找不到也没有默认值，就打印警告。

# 总结

`provide/inject`给Vue提供了上下文对象的能力，无论组件嵌套多么深。其原理就是在组件实例或者上下文对象上设置了`provides`属性，子级组件创建时将复用父级组件的`provides`，并在需要时通过`Object.create()`原型继承父级`provides`。消费`provides`对象上的数据时，通过`inject`取出。
