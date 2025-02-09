---
abbrlink: ''
categories:
- - 前端手写
date: '2025-02-09T18:57:06.149771+08:00'
tags:
- JavaScript
- 面试
title: 手写EventEmitter
updated: '2025-02-09T18:57:06.919+08:00'
---
## 前言

> Node.js也使用了很久了，但是原理却一直摸棱两可，最近读了《深入浅出Node.js》,了解到事件循环是整个的核心，因此，我开始了解其原理和events模块的部分实现。
> 基本的原理书里网上说得比我好太多了，我就不重复了。
> 了解了基本使用后，我尝试自己实现了一个。在实现中参考了很多别人写的以及评论区的改进说明，如果要自己实现我总结为以下几点:

* 属性：_events,_eventsCount
* 方法：on,off,once,emit,removeAllListeners
  `_events`存放了所有的事件和事件的回调函数数组,
  `_eventsCount`则是对所有的事件进行计数
  `on`方法绑定事件,接受一个事件名`type`和监听器`listener`作为参数
  `off`方法则是移除某个监听器，接受事件名`type`和监听器`listener`作为参数
  `once`与on大同小异，但是once加入的监听器只执行一次。
  `emit`触发事件，只要给定事件名`type`就可以实现触发
  `removeAllListeners`移除事件所有的监听器。

## 自定义实现代码

> 具体的代码如下所示,我为了同时巩固原来基础的语法没有使用ES6的语法，而是使用了原型的方法，可能写得也不咋滴，将就看看吧。

```javascript
/**
 * 自定义实现EnvetEmitter，为了巩固JS，尽量使用旧语法，除了let/const
 * _events  事件数组
 * _eventsCount  事件统计
 * _maxListeners  最大事件数
 * on  addEventListener   最大计数
 * once
 * off  removeListener
 * emit
 * removeAllListeners
 */

function EventEmitter(options={}){
    this._events={};
    this._eventsCount=0;
    var _DEFAULT_MAX_LISTENERS=10; //允许的最大事件数量
    this._maxListeners=options.maxListeners?options.maxListeners:_DEFAULT_MAX_LISTENERS;
}
//增加一个监听
EventEmitter.prototype.on=function(type,listener){
    if(!this._events){
        this._events={};  //确保子类继承的不为空
    }
    //exit the event?
    if(this._events[type]){
        this._events[type].push(listener);
        if(!this._maxListeners!=0 && this._events[type].length>this._maxListeners){
            throw new RangeError("监听器最大的数量是10个")
        }
    }
    else{
        this._events[type]=[listener];
        this._eventsCount++;
    }
}
//多一个选项
EventEmitter.prototype.addListener=function(type,listener,options={once:false}){
    if(options.once){
        this.on(type,listener);
    }
    else{
        this.once(type,listener);
    }

}

//once,增加一次就移除
EventEmitter.prototype.once=function(type,listener){
    var me=this;
    //参数传回
    function oneTime(...args){
        //改变this，this始终指向EventEmitter对象
        listener.call(me,...args);
        me.off(type,oneTime);
    }
    me.on(type,oneTime);
}

//remove Listener
EventEmitter.prototype.removeListener=function(type,listener){
    if(this._events[type]){
        var index=this._events[type].indexOf(listener);
        // console.log(index)
        if(index>=0){
            this._events[type].splice(index,1);
        }
    }
}
EventEmitter.prototype.off=EventEmitter.prototype.removeListener;


//移除所有的
EventEmitter.prototype.removeAllListeners=function(type){
    if(this._events[type]){
        this._events[type]=[];
    }
}

//触发
EventEmitter.prototype.emit=function(type,...args){
    if(this._events[type]){
        this._events[type].forEach(fn=>fn.call(this,...args))
    }
}

module.exports={
    EventEmitter
}
```

就这样了，大家有什么问题欢迎评论区留言，以后抽空再写ES6语法的。

...... 2020-03-19补充ES6写法......

```javascript
class EventEmitter {

    constructor() {
        this._events = Object.create({});
    }

    on(type, fn) {
        //参数校验
        if (!(typeof type == 'string')) {
            throw new TypeError('type must be string')
        }
        if (!(typeof fn === 'function')) {
            throw new TypeError('fn must be function!')
        }
        this._events = this._events || {};
        let row = this._events[type];
        Array.isArray(row) ? '' : this._events[type] = [];
        this._events[type].push(fn);

    }

    off(type, fn) {
        //不指定移除的函数就一处所有的
        if (!(typeof type == 'string')) {
            throw new TypeError('type must be string')
        }
        if (!this._events[type] || this._events[type].length == 0) {
            return;
        }
        if (!fn) {
            this._events[type] = [];
            return
        }
        let fns = this._events[type];
        fns = fns.filter((item) => item !== fn);
        this._events[type] = fns;
    }

    once(type, fn) {
        if (!(typeof type == 'string')) {
            throw new TypeError('type must be string')
        }
        if (!(typeof fn === 'function')) {
            throw new TypeError('fn must be function!')
        }

        const context = this;
        function oneFn(...args) {
            fn.call(context, ...args);
            context.off(type, oneFn);
        }
        context.on(type, oneFn);
    }

    emit(type, ...args) {
        if (!(typeof type == 'string')) {
            throw new TypeError('type must be string')
        }
        if (!this._events[type] || this._events[type].length == 0) {
            return;
        }
        this._events[type].forEach(fn => {
            fn.call(this, ...args);
        });
    }

}
```
