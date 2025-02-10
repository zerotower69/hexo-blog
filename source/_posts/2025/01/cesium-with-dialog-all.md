---
abbrlink: ''
categories:
- - cesium的学习
date: '2025-01-12T18:20:36.222132+08:00'
description: 文章介绍了如何在Cesium中实现跨框架的跟随式弹窗，通过封装TrackModel基类结合Cesium.postRender机制，解决了组件复用性低、框架耦合度高的问题，实现了点位动态跟随、相机高度自适应缩放及飞行定位功能。采用组件化设计分离UI与核心逻辑，并适配Vue2/Vue3/React等框架，通过自动化导入和框架特性对接提升开发效率。
tags:
- cesium
- 前端开发
title: Cesium全框架跟随弹窗的实现
updated: '2025-02-10T08:51:29.073+08:00'
---
# 导读

**我之前有一篇文章**[《Cesium+Vue3实现可跟踪的点位详情弹窗》](https://juejin.cn/post/7242217556622655545)介绍了我如何在Cesium上实现可跟随的点位弹窗，但由于当时我对Cesium和vue3的了解有限，当时的实现版本上有几个弊端：

**1)**`createApp`创建的是一个新的应用，其组件不可复用原有定义的组件，且组件库的组件需要另行注册。

**2）弹窗实现代码与vue3耦合度较高，由于笔者有时还需要使用vue2进行开发，不利于后期的适配。**

**3）cesium弹窗只是单纯的做到点位展示，没有动画效果、跟随相机高度的变化自动缩放等。**

**综上所述，我决定重写这个点位弹窗，以求实现功能逻辑(点位跟随、跟随缩放，移动实体跟随等)与UI层的解耦分离，以利于将来更多需求的添加和维护。**

# 弹窗核心功能的实现

**一切的开始，首先得给弹窗起一个名字，我按**`跟随`和`弹窗`分开命名，起了`trackModel`这个名字，创建弹窗的方法，也就是最终调用的`API`不管最终如何实现，都命名为`createTrackModel`。

## 封装为基础类`TrackModel`

**考虑到毕竟是一个通用的弹窗，其要求功能上实现与UI层面的抽离，那么功能逻辑上是最核心的部分，最终各版本的实现上必定是继承这个基础弹窗，那么功能逻辑就以类的形式封装为**`TrackModel`这个基础类。实现时，比如`vue3`为`class Vue3TrackModel extends TrackModel`,`vue2`则为`class Vue2TrackModel extends TrackModel`。这样，也有利于最终实现上根据各框架的特性给各实现类（`Vue3TrackModel`、`Vue2TrackModel`...）增加属性或者覆盖原来的方法。

## 一切的核心`Cesium.PostRender`

**为了介绍弹窗实现的功能，得重新花点笔墨介绍**`Cesium`中的`Scene.PostRender`，也就是后置场景渲染。首先，`Cesium`其实有着自己的一个渲染循环机制，就和浏览器上的事件循环一样，每隔一段时间自动重新渲染当前的场景`Scene`，而在渲染前后都会执行对应任务队列（不是浏览器事件队列那个!!!），因此有了`preRender`和`postRender`。那为什么我们不使用`preRender`实现弹窗呢？原因就是当前场景内的实体以及相机的位置和姿态在`preRender`还未更新，只有在`postRender`我们才能拿到最新的位置和姿态信息，因此我们必须用`postRender`实现我们的跟随弹窗。以下的功能也都是通过`Scene.postRender.addEventListener()`这个`API`添加监听事件来实现的。

**如果你需要了解更多**`**Cesium**`**渲染机制的详情，可以阅读这篇**[**官方文档**](https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/)**。**

## 点位跟随

**首先，我们的弹窗的本质是一个DOM，其实现地图上（显示屏幕）的跟随，其实也就是实现其在地图上（显示屏幕）的绝对定位。为此，我们需要知道的其实就是对应的实体或者模型在每一渲染帧之后的对应的屏幕坐标。**

**点击实体或者模型时，我们可以得到或者计算出其**`Cartesian3`位置坐标position，这个坐标是其在地球上的坐标，除非是运动状态下，否则不会移动，因此可以用此转为屏幕坐标。

**转屏幕坐标用两种方法。一个是**`Cesium.SceneTransforms.wgs84ToWindowCoordinates()`这个`API`，其将 `WGS84`坐标中的位置转换为窗口坐标，接收两个参数：`viewer.Scene`和`Cartesian3`，返回窗口坐标`Cesium.Cartesian2`；另一个是`Cesium.Scene.cartesianToCanvasCoordinates()`这个`API`，其将笛卡尔坐标中的位置转换为画布坐标，接收一个`Cesium.Cartesian3`作为参数，返回对应的画布坐标`Cesium.Cartesian2`。

`TrackModel`采用的是`Cesium.Scene.cartesianToCanvasCoordinates()`。

**于是，核心代码为**

```
 let screen = viewer.scene.cartesianToCanvasCoordinates(_this._position);
        _this._updateStyle(screen,_this._offset);
        //每一帧渲染结束后，都去更新弹窗的位置
        this._moveListener= function (){
            //84坐标转屏幕坐标
            screen = viewer.scene.cartesianToCanvasCoordinates(_this._position);
            if (screen) {
                //screenPoint为更新前的屏幕坐标
                if (screenPoint.x !== screen.x || screenPoint.y !== screen.y) {
                    //坐标发生变化就去更新弹窗位置
                    _this._updateStyle(screen,_this._offset);
                    screenPoint = screen;
                }
            }
        }
        this._viewer.scene.postRender.addEventListener(this._moveListener)
```

**这里的**`screenPoint`实际为`screen`在上一帧的值，由于`Cesium`在不断渲染，`postRender`添加的监听任务也在被不定时调用，如果点位对应的屏幕画布坐标尚未更新，我们是不需要重新计算更新弹窗位置的。

**在**`updateStyle`方法内部，我们传入的是屏幕坐标和屏幕偏移量。内部将根据屏幕坐标和偏移量，计算出弹窗应该被摆放的位置

**核心代码实现**

```
function updateStyle(screen,offset){
    const rootEl = document.getElementId("trackModel");
    const x=screen.x - offset.x;
    const y=screen.y - offset.y;
    setStyle(rootEl,"position",'absolute')
    setStyle(rootEl,"transform",`translate3d(${x},${y})`)
}
```

## 自动飞行

**当点击点位时，显示弹窗之外，我们也需要相机飞行到对应的位置。但是飞行时必须指定相机坐标和点位坐标之间的偏移量，以便于计算出相机的坐标，且是否需要飞行可以交给调用**`createTrackModel(options)`这个`API`决定，飞行时直接调用`Viewer.camera.flyTo`这个`API`就好了。

**核心代码有：**

```
//调用
createTrackModel({
    coordinate:{longitude:34.23,latitude:23.34,height:0},
    fly:true,
    flyOffset:{
        longitude:0.12,
        latitude:0.12,
        height:0,
        heading:43.22,
        pitch:23.12,
        roll:0
    }
})
//定义
function createTrackModel(options){
    const defaultFlyoffset={
        ...
    }
        ...
    if(options.fly){
        viewer.camera.flyTo({
            ......
        })
    }
}
```

## 跟随地图缩放

**除了基本的保持跟随外，在笔者的业务场景里，还需要弹窗能够根据当前相机的高度实现缩放。**

**就像这样：**

![](https://cdn.nlark.com/yuque/0/2024/gif/25532991/1704349989318-a5a112a1-cfa5-43cc-8fd1-7b4b6d550918.gif)

**其最终实现也是css，将原有的**`transform:translate(0px,0px)`改为`transform:translate(0px,0px) scale(x,y)`就可以了，即新增`scale()`用于控制x,y两个方向的缩放比例。

**但如何指定其在不同相机高度范围下的缩放比列呢，我们可以利用**`Cesium.NearFarScalar`,其*表示一个标量值在眼睛空间中近距离和远距离处的下限和上限。*

**于是，我们的**`createTrackModel(options)`的`options`可以新增一个`scaleByDistance`属性，用于接收这个`Cesium.NearFarScalar`的值。除此之外，我们还可以同样可以自由地选择是否需要缩放功能，设定这个选项为`autoScale`,只有其值为`true`时才允许缩放。

**核心代码为：**

```
//使用时
createTrackModel({
  ...
  autoScale: true,
  //缩放比例在0.6--1.6之间
  scaleByDistance: new Cesium.NearFarScalar(0,1.6,6000,0.6)
})

//在TrackModel的updateStyle方法中
...
//默认样式
let scale3d = `scale3d(1,1,1)`;
//默认缩放比例为1
let scaleX = 1,scaleY = 1;
//相机位置
const cp = viewer.camera.positionWC;
//相机方位
const cd = viewer.camera.direction;
//点位位置和相机位置的距离
const distance = Cesium.Cartesian3.distance(position, cp);
if(options.autoScale){
  //只有autoScale为true只才计算缩放比例，否则缩放样式设置就是scale3d(1,1,1)
  let scaleByDistance = options.scaleByDistance;
  if (distance && scaleByDistance) {
     //near,nearValue,far,farValue取值，取不到就使用默认值
      let near = scaleByDistance.near || 0.0; // 0
      let nearValue = scaleByDistance.nearValue || 1.0; //1.6
      let far = scaleByDistance.far || Number.MAX_VALUE; //6000
      let farValue = scaleByDistance.farValue || 0.1; //0.6
      let f = distance / far;
      if (distance < near) {
        //距离比指定的最小距离还小时，采用最大缩放比例
          scaleX = nearValue;
          scaleY = nearValue;
        } 
      else if (distance > far) {
        //距离比指定的最大距离还大时，采用最小缩放比例
              scaleX = farValue;
              scaleY = farValue;
              } 
      else {
        //距离在设定的距离之间时，动态计算缩放比例
            const scale = farValue + (1 - f) * (nearValue - farValue);
            scaleX = scale;
            scaleY = scale;
          }
      }
  //最终的缩放样式    
  scale3d = `scale3d(${scaleX},${scaleY},1)`;
}
```

# TrackModel的UI接口

**在上一节中我们已经实现了**`trackModel`的功能逻辑，接下来我们来给它预留UI接口便于和各前端框架对接。

**其实很简单。我们已经知道**`trackModel`本质是一个DOM，我们只需要给它传递这个DOM结构的根节点root，命名为`$root`。

**当页面结构和样式由各前端框架实现渲染得出后，我们可以获取到**`trackModel`的`$root`，将它交给`TrackModel`类作为其一个私有属性.

**核心代码如下：**

```
//定义
class TrackModel {
    constructor(options){
        this._$root=options.el
    }
}
//实例化
const rootEl = document.getElementById("trackModel")
const instance = new TrackModel({el:rootEl})
```

**通过代码可以看出，**`trackModel`UI和功能逻辑实现解耦的关键就是`TrackModel`类只记录`trackModel`的`DOM`的根节点`$root`，压根不关心DOM里的具体结构以及样式。当`updateStyle()`方法被调用时，都是给根节点`$root`绑定新的`css`样式以此实现点位跟随、缩放以及指定相机高度显隐等逻辑功能。

# 各前端框架版本的实现

**最终**`trackModel`的实现依赖于各前端框架，之所以这样做，其实为了两个目的：一是以组件的形式管理弹窗，二是以命令式的方式即`createTrackModel()`调用组件。

## vue3的实现

**在**`vue3`中，可以利用`createVNode()`和`render()`两个`API`将`vue`组件渲染为真实的DOM结构。

**这两个**`API`顾名思义，`createVNode()`是将组件渲染为`Virtual DOM`，而`render()`将`Virtual DOM`渲染为`Real DOM`。之后我们就可以取到这个DOM的根节点`$root`传入`TrackModel`类中实例化了。

![](file:///Users/zerotower/Library/Containers/com.tencent.WeWorkMac/Data/Documents/Profiles/493486319F785A02FAE4745BCCD17A5C/Caches/Images/2024-01/eccfc70df21c8f15b8da5122f919670e_HD/%E4%BC%81%E4%B8%9A%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_1704279015783.png?lastModify=1736677189)![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1704347426472-7fca60a9-b082-4a93-a80d-a6087ff345fb.png)

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1704347432300-8c66494e-8f26-446c-ad2b-11c309b1860a.png)

**值得注意的是，通过**`createVNode()`创建出的`VNode`对象，有一个属性`appContext`，其含义叫应用上下文，用于存放应用中注册的组件、插件、指令等信息。因此，我们需要把`createApp()`创建的`App`对象中的上下文传给这个`VNode`对象。

**在假设我们的弹窗组件为**`TrackModel.vue`的情况下，核心代码有：

```
//trackmodel.js
import {createVNode,render} from "vue"
import TrackModelConstructor from "./TrackModel.vue"

let glolbalAppContext=null

function setupTrackModel(app){
  globalAppContext = app._context;
}

function createTrackModel(options){
  ...
  const vNode = createVNode(TrackModelConstructor,{});
  vNode.appContext =globalAppContext;
  const hostEl = document.createElement('div');
  render(vNode,hostEl);
  const $root = hostEl.firstElement;
  const instance = new TrackModel({
    ...
    el:$root
  })
  ...
}

//main.js
 const app = createApp(App);
 ...(完成插件引入、全局组件、全局指令等)
 setupTrackModel(app)
```

**但这样还有一个问题，就是createVNode中传入的组件，每个弹窗不一样怎么办？**

**对此，我是把一个弹窗拆分成了两个部分：外壳组件(Wrapper.vue)和内容组件（Content.vue）。外壳组件是通用的样式，有着关闭按钮，且可以调用**`TrackModel`传入的方法，而内容组件就是具体业务场景下每一个弹窗的具体内容，如图所示：

![外壳和内容组件01](https://cdn.nlark.com/yuque/0/2024/png/25532991/1704294624728-32c473e8-24ed-4e4f-b653-af34cd871ced.png)

![外壳和内容组件02](https://cdn.nlark.com/yuque/0/2024/png/25532991/1704294631455-273caeb3-fb40-477a-82ab-4d00b538ead7.png)

**红框中为外壳，弹窗的基础样式是这样的，绿框即为内容组件，每一类的点位对应的内容组件有所不同。且容易知道内容组件是子组件，且**`createVNode()`API中第一个参数是构建`virtual DOM`的根组件，即外壳，第二个参数为该组件需要接收的props，第三个参数children即为插槽对象。

**因此进一步地，核心代码有：**

```
//index.js
...
function createTrackModel(options){
  ...
  const vNode = createVNode(TrackModelConstructor,{},{
    default:options.child
  })
  ...
}

//使用的地方 something.jsx
import Content from "./Content.vue"
const props={}
createTrackModel({
  ...
  child:()=><Content {...props}/> //使用了jsx语法
})
...
//也可以是
import {h} from "vue"
import Content from "./Content.vue"
const props={}
createTrackModel({
  ...
  child:()=>h(Content,props) //使用h渲染函数
})
  ...
```

**但这样依旧有些繁琐，每次内容组件都得使用import导入，增加了使用负担，于是笔者将所有需要使用到的内容组件统一放入到一个目录下，并分别利用**`webpack`提供的`require.context()`和`vite`提供的`import.meta.glob()`实现.vue文件的自动化导入。

```
//require.context()
function loadAllContentComponents() {
  const files = require.context('./content', false, /\.vue$/);
  const map = new Map();
  files.keys().forEach((key) => {
    const mod = files(key).default;
    const name = mod?.name ?? key.replace(/.\/(\w+).vue/, '$1');
    if (mod) {
      map.set(name, mod);
    }
  });
  return map;
}
const componentsMap=loadAllContentComponents();

//import.meta.glob()
function loadAllContentComponents() {
  const modules = import.meta.glob('./content/*.vue', { eager: true });
  const map = new Map();
  Object.entries(modules).forEach(([key, component]) => {
    const name = key.replace(/.\/content\/(\w+).vue/, '$1');
    map.set(name, component.default);
  });
  return map;
}
const componentsMap=loadAllContentComponents();
```

**以此，笔者实现了内容组件的自动化导入。 **`componentsMap`为一个map，key为组件名，value即为组件对象。

**如图示，通过**`componentsMap.get('Hospital')`将取到`Hospital.vue`，通过`componentsMap.get('RailwayStation')`将取到`RailwayStation.vue`。

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1704294129151-0d4686d5-bd89-41e2-9c74-5fa917d9f99a.png)

**进一步地，**`createTrackModel`的定义可以写成：

```
import {isString,isFunction,isNull,isUndefined,isObject} from "lodash-es"
...

function createTrackModel(slot,options){
  ...
  let child = null
  if(isNull(slot) || isUndefined(slot)){
    return
  }
  //slot可以是字符串，直接代表要取出这个组件；也可以是一个对象{name:string;props:Record<string,any>}
//name表示组件名，props表示内容组件的props。
  if(isString(slot)){
    const component = componentsMap.get(slot)
    child = h(component);
  } else if(isObject(slot) && Reflect.has(slot,'name')){
    const component = componentsMap.get(slot.name)
    child =h(component,slot?.props??{});
  } else{
    return
  }
  const vNode = createVNode(TrackModelConstructor,{},{
    default:()=>child
  })
  ...
}
```

**至此，vue3版本的**`trackModel`已经实现，但`createTrackModel`还应有返回值，其返回两个函数，分别用来销毁弹窗和点位是实时移动时更新点位的位置。

```
function createTrackModel(slot,options){
  ...
  const instance = new TrackModel({
    ...
  });
  ...
  return {
    destroy:instance.destroy,
    updatePosition:instance.updatePosition
  }
}

//调用时
const {destroy,updatePosition} = createTrackModel(...)
...
//手动js内销毁弹窗
destroy()
//更新位置
updatePosition(cartesian3)
```

**到这里vue3版本的 **`trackModel`总算是实现了。

***最终的代码实现请参考***[***github***](https://github.com/zerotower69/cesium-dialog-all/blob/javascript/apps/vue3/src/components/TrackModel/index.jsx)

## vue2的实现

`vue2`版本的实现思路和`vue3`的基本相同，但不同的是`vue2`中的Vue是一个类，创建一个Vue应用其实就是实例化Vue。

```
//main.js
const app = new Vue()
```

**因此，**`vue2`没有了`createVNode`和`render`这些API。那要如何渲染呢？我们可以使用`Vue.extend()`这个API实现我们的功能。

`Vue.extend()`能接受一个组件对象（import导入的.vue文件或是直接的vue的Options API定义）。

**例如：**

```
//导入组件
import Vue from "vue"
import Main from "./main.vue"

const MainConstructor =Vue.extend(Main);
//这里相当于vue3中的createVNode(),此时的vm其实还是virtual DOM，不是real DOM
const vm = new Mainconstructor({}) //vm其实就是此时的根组件root component
const hostEl =document.createElement("div")
//$mount里干的相当于vue3的render()，此时vm被渲染为真实的DOM,并被挂载到宿主节点，
//但是hostEl.firstElement才是组件的根root
vm.$mount(hostEl) //挂载

//直接使用组件选项
import Vue from "vue"

const MainConstructor = Vue.extend({
  template:`<div id="msg">{{message}}</div>`,
  data(){
    return {
      message:"hello"
    }
  }
})
const vm = new Mainconstructor({}) //vm其实就是此时的根组件root component
const hostEl =document.createElement("div")
vm.$mount(hostEl)
console.log(vm.message) //"hello"
```

**代码中通过实例化**`Vue.extend()`创建的子类，其实相当于是对Vue的继承，`Vue.use()`和`Vue.component()`注册的插件和组件，vm中也能使用，无需向`vue3`那样指定应用的上下文。

**但这依然有一个问题，我们的内容组件也就是子组件在**`vue2`中又该如何渲染并传入？就像`vue3`中渲染函数`h()`和`createVNode()`那样！

**其实我们可以先打印vm到控制台观察观察：**

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1704335564496-1f1893cc-60bd-419e-a1aa-6f679903e041.png)

**可以看到vm里有一个属性**`$createElement()`，其是一个函数，通过[文档](about:blank)可以了解到，其相当于`vue3`中的`h()`函数。对于插槽则是通过对vm的`$slots`插槽对象直接赋值即可，

```
vm.$slots.default=[child] //vue2的插槽是VNode数组，而vue3的插槽是一个返回VNode的函数。
```

**这里的child就是使用**`vm.$createElement()`创建得到的`vNode`对象。

**至此，复用**`vue3`中的实现思路，`vue2`的实现核心逻辑如下：

```
import Vue from "vue"
import Main from "./TrackModel.vue"
import {isString,isFunction,isNull,isUndefined,isObject} from "lodash-es"

const MainConstructor = Vue.extend(Main)

function createTrackModel(slot,options){
  ...
  let component
  //这里和vue3一样，从组件映射Map compoenntsMap里取到对应的组件。
  if(isNull(slot) || isUndefined(slot)){
    return
  }
  if(isString(slot)){
    component = componentsMap.get(slot)
  } else if(isObject(slot) && Reflect.has(slot,'name')){
    component = componentsMap.get(slot.name)
  } else{
    return
  }
  const vm = new MainConstructor({
    propsData:{
      ...props
    }
  })
  //先实例化子类才能得到“h”函数
  const child = vm.$createElement(component,{
    props:{
      ...childProps
    }
  });
  vm.$slots.default=[child]
  const hostEl = document.createElement('div');
  vm.$mount(hostEl)
  const rootEl = hostEl.fistElement;
  //实例化TrackModel类
  const instance = new TrackModel({
    ...
    el:rootEl
  })
  ...
  return {
    destroy:instance.destroy,
    updatePosition:instance.updatePosition  
  }  
}

//调用
...
```

***最终的代码实现请参考***[***github***](https://github.com/zerotower69/cesium-dialog-all/blob/javascript/apps/vue2/src/component/TrackModel/index.js)

## react的实现

**对于**`react`，实现的思路大体上和也和vue的一致，但是具体的API实现差异较大，且渲染上是异步的。

**对于**`react`，其虽然底层也是采用了`virtual DOM`的技术方案，但react采用的是jsx的语法，并没有插槽的概念。

**对于**`React18`，结合官方提供的使用`createPortal()`[创建拟态弹窗的示例](https://react.dev/reference/react-dom/createPortal#rendering-a-modal-dialog-with-a-portal)，可以得到如下核心代码示例：

```
import {isString,isFunction,isNull,isUndefined,isObject} from "lodash-es"
import Main from "./TrackModel.jsx"

function createTrackModel(child,options){
  ...
  let Component =null
  //这里和vue一样，从组件映射Map compoenntsMap里取到对应的组件。但自动导入时，对应组件的文件后缀
  //为.jsx而不是.vue
  if(isNull(child) || isUndefined(child)){
    return
  }
  if(isString(child){
    Component = componentsMap.get(child)
  } else(isObject(child) && Reflect.has(child,'name')){
    Component = componentsMap.get(child.name)
  } else{
    return
  }
  ...
  const hostEl = document.createElement("div");
  const instance = new TrackModel({
    ...
      })
  const renderProps={};
  renderProps.setInstanceEl=function(el){
    instance.setRootEl(el,true)
  }
  function TrackModelWrapper(props){
    const childProps = child?.props ??{};
    return createPortal(
      <Main {...props}>
        <Component {...childProps}></Component>
      </Main>,
      document.body
        )
  }
  //异步强制变同步
  flushSync(()=>{
    createRoot(hostEl).render(
      <TrackModelWrapper {...renderProps}></TrackModelWrapper>
    )
  })
  ...
    //返回值
  return {
    destroy:instance.destroy,
    updatePosition:instance.updatePosition
  }
}
```

**在这里解释一下**`instance.setRootEl()`和使用`flushSync()`的原因：

**首先，**`createRoot(hostEl).render()`的渲染过程是个异步的过程，此时无法通过`hostEl.firstElement`拿到`trackModel`的`$root`。换个说法，虽然React也是`virtual DOM`，但其不像`vue`那样暴露给开发者，React内部的`VNode`对于开发者来说是个黑盒，我们无法拿到，也就不像vue那样能轻易取到`$root`元素。

**为此，我将取出**`$root`的逻辑使用`React Ref`实现，并将给`TrackModel`类传递`$root`的操作通过`setRootEl()`传递到(通过props的方式)组件内部，在`TrackModel`组件的生命周期`componentWillMount`中调用，建立了`React`组件和`TrackModel`实例之间的联系。因此，实例化`TrackModel`时也不必传入参数`el`，因此相关的初始化操作如果实例化未传递`el`选项，其将在`setRootEl()`被调用后执行。

**除此之外，如果其它前端框架的渲染过程也类似于React是个异步的情况，那么，同样建议使用**`instance.setRootEl`的方式建立弹窗UI层和`TrackModel`实例之间的联系。

***最终的代码实现请参考***[***github***](https://github.com/zerotower69/cesium-dialog-all/blob/javascript/apps/react/src/components/TrackModel/index.jsx)

# 为弹窗增加类型提示

**弹窗最终实现了，但由于使用**`createTrackModel`这个`API`时，其参数选项较多，自然地期望能有一些友好的自动提示，在`JavaScript`模式下，可以利用`jsdoc`加上`TypeScript`声明文件`.d.ts`实现。

**首先是声明文件的代码：**

```
declare module 'track-model'{
    //@ts-ignore
    import {Viewer,DistanceDisplayCondition,NearFarScalar} from "cesium"
    interface TrackModelOptions  {
        //弹窗唯一的id标识
        id:number;
        //弹窗根DOM
        rootEl:Element;
        //cesium viewer对象，不传就使用全局的Viewer实例
        viewer: Viewer
        //使用MutationObserver观察内容区DOM的变化，默认为true
        useObserver?:boolean
        //指定内容区DOM,否则使用rootEl
        observerEl?:HTMLElement
        //初始化后多久添加DOM的监听
        observerDuration?:number
        //点位坐标,lon:经度，lat:纬度，height:高度
        coordinate: {longitude: number; latitude: number; height?: number };
        //弹窗位置的屏幕坐标偏移量，单位：px
        offset?: { x?: number; y?: number };
        //全局是否唯一，单例模式？默认为true
        global?: boolean;
        //是否飞到对应的位置？默认为false
        fly?: boolean;
        //飞行的点位偏移量(相机位置)以及方向调整，lon,lat,height是指定的偏移量
        flyOffset?: {
            //偏移的经度,相对于coordinate.longitude，默认为0
            longitude?: number;
            //相对于coordinate.latitude偏移的纬度，默认为0
            latitude?: number;
            //相对于coordinate.height偏移的高度，默认为6000
            height?: number;
            //相机方位的heading，默认为当前相机方位heading
            heading?: number;
            //相机方位的pitch，默认为当前相机方位的pitch
            pitch?: number;
            //相机方位的roll，默认为当前相机方位的roll，通常是0
            roll?: number;
            //flyTo的飞行时间duration
            duration?:number
        };
        //相机飞行后执行的complete回调函数
        completeCallback?: (...args) => void;
        //弹窗的显示时机，是飞行前显示还是飞之后才显示，默认为beforeFly
        show?: "beforeFly" | "afterFly";
        //弹窗加载延时，可以用来等待某些DOM或者数据加载完成后再显示弹窗，建议在show为"beforeFly"时使用
        loadInterval?: number;
        //自适应地图缩放
        autoScale?: boolean;
        //根据到相机距离控制显隐
        distanceDisplayCondition?: DistanceDisplayCondition;
        //通过距离决定缩放比例
        scaleByDistance?: NearFarScalar;
    }
    type Direction ={
        heading:number;
        pitch:number;
        roll:number;
    }
    export {TrackModelOptions,Direction}
}
```

**在定义时使用**`jsdoc`

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1704356654804-05cf8899-61e8-4e27-bf51-7b23adbb91fc.png)

**当调用**`createTrackModel()`方法时，IDE就能加载到这些类型定义了,如图所示：

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1704356795896-b94cb62a-8260-4684-ab61-f9191ca0be63.png)

# 总结

1. **本文利用了**`Cesium.postRender`场景渲染，在每一帧渲染结束后调用监听函数实现了DOM弹窗的点位跟随、根据相机高度实现指定比例缩放等功能，此外，还实现了自动飞行等功能。
2. **在**`trackModel`弹窗的实现中，其功能逻辑只关心弹窗的根DOM`$root`，不关心弹窗的具体的UI实现；在`Cesiunm`的每一渲染帧结束后，最终功能的实现本质就是绑定css样式，做到了`trackModel`和UI层的解耦，并为最终全框架的实现提供了实现接口。
3. **对于弹窗各版本的实现中，充分利用了当前前端框架的组件化设计思想，将弹窗UI部分拆分为外壳区和内容区两个父子关系的组件，且内容区又利用了当前热门的打包工具**`webpack`和`vite`实现了自动化导入，省去了繁琐的`import`导入语句，最终又利用了各前端框架的渲染特性实现了弹窗DOM的渲染。

**感谢你能看到这里，最终实现请查看我的**[**github**](https://github.com/zerotower69/cesium-dialog-all)**，同时可以通过**[**github page**](https://zerotower69.github.io/cesium-dialog-all/)**查看我的弹窗效果。有问题欢迎评论区讨论或给我提**[**issue**](https://github.com/zerotower69/cesium-dialog-all/issues)**。如果能去给我一个star就更好了。**

# 参考资料

## API参考

1. [Cesium.postRender.addEventListener()](https://syzdev.cn/cesium-docs/advance/scene-load-event.html#%E5%9C%BA%E6%99%AF%E6%B8%B2%E6%9F%93%E4%BA%8B%E4%BB%B6)
2. [Cesium.SceneTransforms.wgs84ToWindowCoordinates()](http://cesium.xin/cesium/cn/Documentation1.95/SceneTransforms.html?classFilter=SceneTransforms)
3. [Cesium.Scene.cartesianToCanvasCoordinates()](http://cesium.xin/cesium/cn/Documentation1.95/Scene.html?classFilter=Scene)
4. [vue3 createVNode()](https://vuejs.org/guide/extras/render-function.html#creating-vnodes)
5. [vue3 render()](https://vuejs.org/api/options-rendering.html#render)
6. [vue3 h()](https://vuejs.org/guide/extras/render-function.html#creating-vnodes)
7. [vue2 Vue.extend()](https://v2.cn.vuejs.org/v2/api/#Vue-extend)
8. [React createPortal()](https://react.dev/reference/react-dom/createPortal)
9. [React flushSync() ](https://react.dev/reference/react-dom/flushSync#flushsync)

## 其它文章参考

**1.**[详细了解Cesium的渲染机制](https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/)

**2.**[Cesium的场景渲染](https://syzdev.cn/cesium-docs/advance/scene-load-event.html#%E5%9C%BA%E6%99%AF%E6%B8%B2%E6%9F%93%E4%BA%8B%E4%BB%B6)
