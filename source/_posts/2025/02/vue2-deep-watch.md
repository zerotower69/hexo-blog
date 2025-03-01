---
abbrlink: ''
categories:
  - - vue项目实战经验
date: '2025-02-10T23:54:46.808999+08:00'
tags:
  - vue2
title: vue2深度属性嵌套
updated: '2025-02-10T23:54:47.570+08:00'
description: 本文探讨了在Vue2中监听深度嵌套属性的多种方法，包括使用`deep`属性、指定属性路径、`Vue.set`、计算属性以及升级到Vue3。每种方法都有其适用场景和优缺点，如`deep`属性简单但性能开销大，计算属性逻辑清晰但代码量多。选择合适的方法需根据具体需求和项目情况权衡。
---
# 导读

面试时被问到了如果监听一个嵌套属性很深的对象，直接使用watch可能会失效，因为Vue2的响应式系统默认是无法检测到深层嵌套属性的变化。和面试官讨论了一会儿，加上面试后问了一下DeepSeek，总结得到了可以采用的方法。

注意，以下内容，都将讨论对`user.address.city`的监听

```js
export default {
  data() {
    return {
      user: {
        name: 'John',
        address: {
          city: 'New York',
          zip: '10001'
        }
      }
    };
  }
};
```

# 使用options配置中的deep属性。

```js
watch: {
    user: {
      handler(newVal, oldVal) {
        console.log('User changed:', newVal);
      },
      deep: true // 深度监听
    }
  }
```

但这样，将导致整个`user`对象的所有层级的属性都被监听，会对性能造成很大的影响。

# 使用属性路径指定具体的监听属性

由于watch本身支持传入属性路径，我们可以直接把`user.address.city`传入。

```js
watch("user.address.city",{
  handler(newVal,oldVal){
    console.log("City changed: ",newVal)
  }
})
```

此方法不适合动态路径。

# 使用Vue.set 或者this.$set

如果响应式失效，那我们就使用`this.$set`确保数据是响应式的。

```js
methods:{
  updateCity(newVal){
    this.$set(this.user.address,"city",newVal)
  }
}
```

这样多了一次手动操作，繁琐一点。

# 使用计算属性

如果经常发生变化的，且属性嵌套深，可以使用computed做“截短”操作，生成一个新的变量，然后监听这个变量。

```js
computed:{
  userCity(){
    return this.user.address.city;
  }
},
watch:{
  userCity(newVal,oldVal){
    console.log("City changes:",newVal)
  }
}
```

由于computed本身有lazy和记忆功能，性能会更优，但当有很多的嵌套属性都需要更新，可能会造成代码量的增多。

# 升级到Vue3

由于Vue3响应式变量是迭代的方式（Vue2是嵌套递归）生成，且Proxy能拦截到特定的属性，天然不会发生不必要的监听。

# 总结

上述方法的优缺点总结如下：


| 方法         | 适用场景                     | 优点             | 缺点                                     |
| ------------ | ---------------------------- | ---------------- | ---------------------------------------- |
| deep: true   | 监听整个对象的变化           | 简单直接         | 性能开销较大                             |
| 监听具体属性 | 监听特定嵌套的属性           | 性能较好         | 需要明确路径，不支持动态路径             |
| Vue.set      | 动态属性的增加               | 确保响应式       | 代码比较繁琐                             |
| 计算属性     | 监听特定嵌套的属性           | 逻辑清晰         | 代码较多，复杂情况下将有很多的计算属性。 |
| 升级到Vue3   | 可以升级的项目且升级成本较低 | 更好的响应式性能 | 需要整个版本升级，技术和时间成本较大     |
