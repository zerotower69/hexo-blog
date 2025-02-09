---
abbrlink: z
categories:
  - - JavaScript
date: '2025-01-11T17:36:45.852477+08:00'
tags:
  - promise
  - javascript
  - 前端
title: 一网打尽手写Promise
updated: '2025-01-11T17:36:46.304+08:00'
description: 文章详解手写Promise的实现原理，从Promise A+规范入手，阐述状态机转换、then方法链式调用及微任务队列处理机制。结合queueMicroTask API分析异步任务调度原理，手写各个核心方法（then/catch/finally）及静态方法（all/any/race）。通过测试验证符合规范，并解析async/await作为语法糖的底层Promise逻辑。附带两则事件循环面试题，帮助突破异步编程核心难点。
---
# 导读

**首先，让我们回顾一下**`Promise`的定义，为了偷懒，就直接复制粘贴了：

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1710465302802-20ad1096-57a4-466a-ae04-921364d41f61.png)

**可以看到，Promise是一个允许异步操作的代理，我更愿意简单点叫它“容器”。**

**在各大面试题中，手写Promise是一道高频题，笔者自己也遇到了好几次，同时其也涉及到****事件循环**的有关知识，为了进一步强化大家对于其原理和事件循环中**微任务队列**的关系，随将用比较长的篇幅着重介绍这些内容，并包含其`PromiseLike`、`Awaited`等`typescript`的类型推断。

**如果你想直接查看代码，请移步我的**

[GitHub - zerotower69/handle-promise-TPromise-: achieve myself promise by using queueMicroTask api.](https://github.com/zerotower69/handle-promise-TPromise-)

**。**

# 微任务队列

**或许你经常听到事件循环这一概念，除此之外还有JS是单线程的这一说法。首先，事件是JS的核心，JS为了实现异步操作，总是使用**[发布订阅的设计模式](1)，也就是在无法事先确定***任务***（代码中异步逻辑的部分，通常是函数，也叫回调函数），会使用**队列**（通常是数组）等结构储存这些任务，待某个未来的时间点事件被触发时**依次执行**（按进入队列的顺序），这个队列也叫**任务队列**。在JS这个“单线程”中，异步任务存放在异步任务队列中，而异步任务又分为**微任务**和**宏任务**，因此，JS单线程中的异步队列实际是**微任务队列**和**宏任务队列**的统称。但注意，前文的表述中“单线程”并不是说整个JS就是真的一个线程，在整个JS的宿主环境中（分别为**web浏览器环境**和**Node环境**）其实是有多个线程的，比如浏览器中还有**GUI渲染线程**、**http异步线程**等，Node环境还有**编译线程**、**垃圾回收线程**等。而单线程说的是执行JS代码的线程始终只有一个（除非Node环境中强制开启了子线程，process和child\_process），这个线程也称为**执行线程**，也就是说，真正运行JS逻辑块的只有一个线程，哪怕是异步队列中的任务的逻辑块，也是在事件触发时（执行时机到达），从队列中取出，放入到执行线程中执行。因此，准确地描述是：绝大多数情况下，JS代码是通过唯一一个执行线程来执行的。

**如果你想详细了解宏任务和微任务以及事件循环，可以阅读我的文章**

[从nextTick开始认识事件循环 - 掘金](https://juejin.cn/post/7254081954517450812)

**此外，如果你想更深入了解Promise以及事件循环的工作流程，可以参考国外的这篇文章：**

[Promise可视化](https://dev.to/lydiahallie/javascript-visualized-promises-async-await-5gke)

# queueMicroTask API

**为了能够使得第三方库、polyfill等能够执行微任务，JS环境（浏览器和Node）暴露了全局的**`queueMicroTask`接口，详细参考[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide#%E4%BB%BB%E5%8A%A1_vs_%E5%BE%AE%E4%BB%BB%E5%8A%A1)。其可以将一个回调函数视为一个微任务加入到微任务队列中，就像：

```
queueMicroTask(()=>{
  const name="task"
  console.log(name)
})
```

**这也为下文中我们完整地实现手写**`Promise`提供了可能。

# Promise A+规范

**在手写前，我们必须了解一下**

[Promises/A+](https://promisesaplus.com/)

**，其为现如今各大主流浏览器实现Promise的一个规范和参考标准，因此我们要想自己实现**`Promise`，也必须将其视为参考，并严格按照其规定实现。

**首先，规定了一个**`promise`实例（文中以大写的`Promise`表示统称、类和对象，以小写的`promise`表示`Promise`的实例）的状态一共为三类：`pending`、`fulfilled`、`rejected`，要记忆的话，分别对应\*\* 谈恋爱**、**结婚了**、**分手了\*\*三种结果。但与结婚了还可以分手不同，三种状态一经改变不可逆转，也不可以发生fulfilled到rejected和rejected到fulfilled的转变，其描述如下图所示。

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1710466727563-cfdc603f-488f-4537-bacd-1db497790c0d.png)

**如果你已经使用过**`Promise`,你会发现刚好对应着我们实例化时，智能拿到执行器中的`resolve`和`reject`两个回调函数，其刚好代表着`Promise`状态的仅有的两条转化路径。

**其次，**`Promise A+`规定了`Promise.prototype.then`方法接收`onFulfilled`和`onRejected`两个回调作为函数参数，最终返回一个新的`Promise`实例（记为p2）。而`onFulfilled`和`onRejected`这两个回调函数各自接收一个参数，`value`和`reason`，分别代表兑现（`fulfilled`）值和拒绝(`rejected`)理由，如同结婚时的彩礼嫁妆和分手时给的理由，这两个值又分别由实例化时的两个回调函数`resolve`和`reject`分别传入。

**也因为**`Promise.prototype.then`方法返回了p2，因此我们平时使用的`Promise`能够支持链式调用，但**每次链式后都会返回一个新的**`**Promise**`**实例**。

# 手写前分析

**在我们正式手写前，我们先通过一张思维导图来看看整个Promise的结构和所具备的方法：**

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1710471368012-250fba0c-3165-4a63-bde5-338f9e709653.png)

**可以看到除了**`Promise A+`的状态以及`Promise.prototype.then`方法，原型方法还有：`Promise.prototype.catch`和`Promise.prototype.finally`，静态方法有：`Promise.resolve`、`Promise.reject`、`Promise.any`、`Promise.allSetteld`、`Promise.race`和`Promise.all`。其中核心就是构造函数和`Promise.prototype.then`方法的实现，尤其是`Promise.prototype.then`方法，其它原型方法基本要依赖其实现。

**除了思维导图之外，还需注意一点，由于**`Promise`支持链式使用，链式时返回的都是一个新的`Promise`实例`new`，这就涉及了`newP`的状态将由上一个`promise`的状态或者内部回调函数的逻辑决定（相当于还没结婚呢就开始买车买房，这些承诺之间相互影响）。且我们使用`Promise`时，经常使用`catch`在这个`Promise链`中捕获之前reject的reason或者逻辑块中的异常，例如：

```
Promise.reject(4).then((value)=>{
    console.log('p1 value',value)
    return value
}).then((value)=>{
    console.log('p2 value',value)
    return value
}).then((value)=>{
    console.log('p3 value',value)
    return value
}).catch((reason)=>{
    console.log(reason)
})
```

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1710472622358-d007977f-60e1-4586-86af-325e65a910b7.png)

**如果没有了catch，就会抛出异常：**

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1710472667940-b32fa832-e774-4df0-bf26-026095d66cac.png)

**也就是说，我们value或者reason会****在链式中向下传递**，直到被使用或者捕获（统称为拦截）。

# 手写构造器部分

**为了充分理解构造器，手写采用ES6的class语法，但必须注意的是，class语法也只是原型链**`prototype`的语法糖，底层是一致的，`javascript`中的class并不是严格意义中的面向对象中的类。

**将我们手写的**`Promise`命名为`TPromise`，初始状态为`pending`：

```
const PENDING="pending"
const FULFILLED = "fulfilled"
const REJECTED = "rejected"

class TPromise{
    /**
     * @type {"pending"|"fulfiiled"|"rejected"}
     */
    status
    constructor(executor) {
        this.status=PENDING
    }
}
```

**接着参考**[MDN上对于构造函数的描述](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)，executor将会接收两个构造函数，分别用于更改`Promise`的状态。

* **resolve(vaue)**
* **reject(reason)**

**且我们知道，状态转变后就会执行之前添加的微任务（实际是将之前的任务添加到真实的微任务队列），那么，我们需要有一个队列存储我们传入的任务（回调函数），且状态从 **`pending`到`fulfilled`和`pending`到`rejected`两条路径，于是也就会有两个队列来维护存储这些回调，于是代码如下：

```
class TPromise{
      /**
     * @private
     * @type {"pending"|"fulfilled"|"rejected"}
     */
   status
    /**
     * @private
     */
    value
    /**
     * @private
     */
    reason
    /**
     * @private
     * @type {Callback[]}
     */
   onFulfilledCallbacks
    /**
     * @private
     * @type {Callback[]}
     */
   onRejectedCallbacks
    constructor(executor) {
       const that = this;
        this.status = PENDING
        this.onFulfilledCallbacks=[];
        this.onRejectedCallbacks=[];

        if(typeof executor !== 'function'){
            throw TypeError('executor 必须是函数')
        }
        //分别构建resolve和reject函数传入
       function resolve(value){
            if(that.status === 'pending'){
                //只有pending时进入
                that.status='fulfilled';
                that.value=value;
                that.onFulfilledCallbacks.forEach(cb=>{
                    isFunc(cb) && cb(value)
                })
            }
        }
        function reject(reason){
            if(that.status === 'pending'){
                that.status='rejected'
                that.reason =reason;
                that.onRejectedCallbacks.forEach(cb=>{
                    isFunc(cb) && cb(reason)
                })
            }
        }

        //如果executor抛出异常，直接reject掉
        try{
            executor.call(that,resolve,reject)
        } catch (e){
            reject(e)
        }
    }
}
```

**在之前的基础上，我们添加了**`onFulfilledCallbacks`和`onRejectedCallbacks`两个数组用于存储任务，并在定义的`resolve`和`reject`函数中逐一调用，并使用传入的`value`或`reason`值作为回调的参数。尤其需要注意的是，`resolve`和`reject`内部均判断了当前`TPromise`的状态是否还是`pending`，只有`TPromise`的状态还是`pending`才执行逻辑，满足`Promise A+`规范说的，**状态只改变一次，不可逆转**。且执行`executor`函数时，还要捕获内部的抛出的错误，如果抛出错误了，那么这个直接调用`reject`将状态设置为`rejected`，表示兑现失败。

# 手写Promise.prototype.then

`then`方法是整个`Promise`的灵魂所在，也就是它的内部创建了一个又一个的任务（回调函数），并立即将其加入到微任务队列，或是先添加到相对应的回调队列中等待`resolve`和`reject`调用时添加到微任务队列中。

**由于其返回一个新的**`TPromise`实例（记为newP，支持链式调用的本质），有：

```
 then(onFulfilled,onRejected){
        const that =this;
        return new TPromise((resolve,reject)=>{
            
        })
    }
```

**接着的逻辑是：如果此时的状态已经发生转变，也就是在**`executor`内部就调用了`resolve`或者`reject`，我们应该立即将任务送入微任务队列；如果状态还是`pending`，就应该把任务放入`TPromise`的回调队列中。

```

    then(onFulfilled,onRejected){
        const that =this;
        //不给对应的回调就把value和reason持续地向下传递
        onFulfilled = isFunc(onFulfilled)? onFulfilled :(value)=>value;
        onRejected = isFunc(onRejected)? onRejected:(reason)=>{
            throw reason
        };
        const promise= new TPromise(function(resolve,reject){
            //由上一个promise的状态决定新的promise是否立刻调用

            //方法封装
            //! 以下微任务也就是两个步骤，执行回调取值，得出结果就进一步判断结果的值的类型情况进一步兑现新创建的promise,
            //! 如果捕获到错误就直接reject
            function fulfilledCallback(value){
                queueMicrotask(()=>{
                    //!这里的逻辑块就是微任务
                    try{
                        const result = onFulfilled(value);
                        resolvePromise(promise,result,resolve,reject)
                    } catch (e){
                        reject(e)
                    }
                })
            }
            function rejectedCallback(reason){
                queueMicrotask(()=>{
                    //!这里的逻辑块就是微任务
                    try{
                        const result = onRejected(reason);
                        resolvePromise(promise,result,resolve,reject)
                    } catch (e){
                        reject(e)
                    }
                })
            }
            switch (that.status){
                //同步情况：调用queueMicroTask本身这个操作是同步的
                case 'fulfilled':
                    fulfilledCallback(that.value);
                    break;
                //同步情况
                case 'rejected':
                    rejectedCallback(that.reason);
                    break;
                default:
                {
                    //pending 状态，就是连微任务队列都没进，先暂存进入回调数组，
                    //待pending状态改变后再进入微任务队列中排队
                    //! 这里应用了发布订阅的设计模式
                    that.onFulfilledCallbacks.push(fulfilledCallback);
                    that.onRejectedCallbacks.push(rejectedCallback)
                }
            }
        });
        return promise
    }
```

**先看swtich部分，其就是实现了上述所说的状态变就利用**`queueMicroTask`加入微任务队列，状态不变入自身的回调队列。由于任务要么被直接加入微任务队列要么加入回调队列暂存，我先定义了`fulfilledCallback`和`rejectedCallback`函数，用来进一步封装并节省代码量。且可以通过代码看出，**加入微任务队列这一操作还是同步操作，异步的微任务行为是最终从微任务队列取出执行的阶段**，这一过程并不是我们控制的，我们真正做的还只是指定某个任务（回调函数）进入到微任务队列中！

**而微任务中的逻辑块中**

```
try{
    const result = onFulfilled(value);
    resolvePromise(promise,result,resolve,reject)
    } 
catch (e){
           reject(e)
    }
```

**其表示执行传入的**`onFulfilled`，并获取返回值，并捕获其中抛出的错误，如果抛出错误，返回的新的`TPromise`实例就调用`reject`回调使其状态变为`rejected`，否则将继续判断result的值处理，而这部分比较复杂，又单独利用外部定义的`resolvePromise`函数处理。而3-4行是为了判断`onFulfiiled`和`onRejected`回调是不是不传或者不是函数类型，如果是就把执行时传入的`value`或`reason`沿着`Promise链`向下传递，只有`reason`用`throw`语句抛出，就是因为`reject`如果被自动调用，其都是在`try...catch`语句中的`catch`部分被调用，而你既然要被`catch`捕获，自然就要先抛出了，只有链式上的每一环都`throw`抛出，层层传递，才能被最终的最后的`.catch((reason)=>)`所捕获执行。

**接着，解释下**`resolvePromise`函数，先上完整版本的代码：

```
function resolvePromise(promise,data,resolve,reject){
    if(data === promise){
       return reject(new TypeError('禁止循环引用'));
    }
    // 多次调用resolve或reject以第一次为主，忽略后边的
    let called = false
    if(((isObj(data)&& data!==null) || isFunc(data))){
        //这部分的写法是由Promise A+规范规定的
       try{
           const then = data.then
           if(isFunc(then)) {
               then.call(data, (value) => {
                   if (called) {
                       return
                   }
                   called = true
                   //递归执行，避免value是一个PromiseLike,Promise.resolve中的嵌套thenable在这里解决。
                   resolvePromise(promise, value, resolve, reject)
               }, (reason) => {
                   if (called) {
                       return
                   }
                   called = true
                   reject(reason)
                   }
               )
           } else{
               resolve(data)
           }
       } catch (e){
           if (called) {
               return
           }
           called = true
           reject(e)
       }
    } else{
        //data是null,undefined,普通引用值等
        resolve(data)
    }
}
```

**首先，什么叫****循环引用，就是一个**`**Promise**`**状态的改变取决于自身的状态的改变**，也就是先等我们结婚了再结婚，这显然是无稽之谈嘛，具体触发的可能情况在后续还会有说道，还请继续耐心看下去吧。

**接着，让我们重新看看**`[Promise A+规范](https://promisesaplus.com/)`。其谈到，对于`onFulfilled`和`onRejected`的返回值（都记为result），如果其是一个`Promise`实例，就用其兑现后的状态设置`newP`的状态，如果其是一个对象且具有`then`方法，那么其是一个`thenable`对象，对`result.then(onFulfilled,onRejected)`，执行并在其两个回调中，由于`onFulfilled`的参数`value`可能又是一个`Promise`实例或者`thenable`对象，递归调用`resolvePromise`函数，`onRejected`的参数`reason`则直接作为`newP`的`rejected`的`reason`；其它情况下，`newP`的状态均为`fulfilled`，其流程如下图所示：

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1713173237082-7ccc0f07-8ef5-4b97-a55b-6c32d282de8b.png)

**由此，**`Promise.prototype.then`方法的逻辑已经完全实现，并严格遵循了`Promise A+`规范。

# 手写Promise.prototype.catch

**从**[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch#%E8%AF%AD%E6%B3%95)可知，`Promise.prototype.catch`只接收一个`onRejected`回调作为参数，其等价于`this.then(null,onRejected)`。

**因此，其内部实现为：**

```
 catch(onRejected){
       return this.then(null,onRejected)
    }
```

**也就是说，其就是添加一个rejected时应该执行的微任务。**

# 手写Promise.resolve

**从**

[Promise.resolve() - JavaScript | MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve)

**可知，**`Promise.resolve`是Promise上的一个静态方法，其将给定的值转为一个Promise，如果给定的值`value`就是一个`Promise`实例，直接返回；否则就直接返回一个新的Promise，并直接使用`resolve`将其兑现（可能是`fulfilled`也可能是`rejected`）。

**于是有以下代码：**

```
static resolve(value){
        //!1.如果value是promise直接返回
        if(value instanceof TPromise){
            return value
        }
       return new TPromise((resolve)=>{
           //thenable的情况实际上通过 resolvePromise完成了
           resolve(value)
       })
    }
```

# 手写Promise.reject

**从**[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject)可知，静态方法`Promise.reject`返回一个已拒绝（rejected）的`<font style="color:rgb(27, 27, 27);"> </font><font style="color:rgb(27, 27, 27);">Promise</font><font style="color:rgb(27, 27, 27);"> </font>`对象，拒绝原因为给定的参数，无论给定的`<font style="color:rgb(27, 27, 27);">reason</font>`是什么，`<font style="color:rgb(27, 27, 27);">reject</font>`本身的行为就是拒绝，如同我和你分手的原因是因为我有了新欢，新欢将来结婚了还是分手还不知道，但我现在就要和你分手，这就是`<font style="color:rgb(27, 27, 27);">reason</font>`及时也是一个`<font style="color:rgb(27, 27, 27);">Promise</font>`对象也可以表示拒绝的理由，于是代码就很简单了。

```
static reject(reason){
        //静态reject就是实例化后马上reject掉
        return new TPromise((resolve,reject)=>{
            reject(reason)
        })
    }
```

# 手写Promise.prototype.finally

**从**[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally)可知，`Promise.prototype.finally`是注册一个会在`Promise`兑现（无论是`fulfilled`还是`rejected`）时都会执行的函数，其不代表着`Promise链`的终结，依旧会返回一个**等效**的`Promise`对象。如果处理程序抛出错误或返回被拒绝的 promise，那么 finally() 返回的 promise 将以该值被拒绝。否则，处理程序的返回值不会影响原始 promise 的状态。

**这里的等效其实就是说，接到的value还要继续向下传递，接到的reason还得继续抛出，但如果finally强制指定了**`rejected`状态的`Promise`，或者抛出错误，那么还是得`rejected`。看看以下代码：

```
Promise.resolve(5).finally(()=>{
    console.log('finally fn')
}).then((value)=>{
    console.log(value)
})
//output:
//finally fn
//5
```

```
Promise.reject(5).finally(()=>{
    console.log('finally fn')
}).catch((reason)=>{
    console.log(reason)
})
//output:
//finally fn
//5
```

**其也利用**`Promise.prototype.then`实现，代码为：

```
finally(onFinally){
        //!假定 result = onFinally()
        //! 使用 throw语句的原因在于我们只有在 try{} catch(e){ reject(e)} 的catch部分才会调用reject(),
        //!也就是说，reason先被catch（捕获）才会被reject调用在promise中链式传递，finally不会处理
        //!reason会让其继续传递，因此必须使用 throw 语句继续将其抛出，等待下游的try{} catch(e){} 将其再次捕获
        //之所以用TPromise.resolve,是由于onFinally()的结果可能是Promise,必须等待其兑现此时的promise
       return this.then(
           //这个value为 pr.finally() 这个pr 的 fulfilled 状态下的value，它将不受result的影响传递下去
           value=>TPromise.resolve(onFinally()).then(()=>value,
                   //这个reason为onFinally 显示指定一个 rejected的promise而产生，并传递下去
                   newReason=>{throw newReason}),
           //这个reason 为 pr.finally() 这个pr 的 rejected状态下的 reason,只要 result不是一个rejected状态的promise,它将接着传递下去
           (reason)=>TPromise.resolve(onFinally()).then(()=>{
               throw reason
           },(newReason)=>{
               throw newReason
           })
           )
    }
```

**在**`.finally(onFinally)`这个`Promise`对象时，接收到其的`value`或`reason`，但`onFinally()`的返回值（记为`fResult`）未定，其可能是`Promise`对象也有可能是`thenable`对象，更有可能是其它类型，我们统一使用`Promise.resolve`将其处理为真的`Promise`对象`fP`，当`fP`敲定时（状态为`fulfilled`或者`rejected`）

# 手写其它静态方法

**以下几个静态方法都有一些共同的特性，给定一个可迭代对象（Array、Map、Set、String等任何具有[Symbol.iterator]属性的对象，如果你还不了解可迭代对象，请查阅**[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol/iterator)），将返回一个新的`Promise`对象。可迭代对象中的每一个元素可以是`Promise`对象也可以不是`Promise`对象，因此，内部就使用`Promise.resolve`将其处理为`Promise`对象，在此，约定把这些`Promise`对象称为`p1、p2、p3、... 、pn`，它们状态从`pending`转为`fulfilled`时的value值分别记为`V1、V2、V3、... 、Vn`，状态从`pending`转为`rejected`时的reason值分别为`R1、R2、R3、... 、Rn`。而每个方法放回的`Promise`对象，记为`P`，其状态都将由`p1、p2、p3、... 、pn`等共同决定。

**在下述的示例图中，我会使用****蓝色**表示`pending`的`Promise`对象，**绿色**表示`fulfilled`的`Promise`对象，**红色**表示`rejected`的`Promise`对象。

## Promise.all

**从**[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)得知，`Promise.all`返回的`Promise`对象`P`，由p1、p2、p3、... 、pn 共同决定：只有所有的`Promise`对象被兑现为`fulfilled`，其`P`的状态才为`fulfilled`，且value值为所有`Promise`的value值的有序数组，`value=[V1,V2,...,Vn]`如图所示；

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1710499215742-86668df7-1801-4ecc-ba4f-48b005fe2908.png)

**而只要**`p1、p2、p3、... 、pn `中任意一个`Promise`对象兑现为`rejected`，`P`的状态也为`rejected`，且reason值为第一个兑现为`rejected`的`Promise`的reason值（记为`Rq`），如下图所示：

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1710509100273-ab58d699-4049-4568-8fd4-84a57d4ba4ac.png)

```
 static all(values){
        //values不是一个可迭代对象就报错
        if(!isIterator(values)){
            throw new TypeError('values must be an iterable object.')
        }
        return new TPromise((resolve,reject)=>{
            //返回结果，all,values
            const results= [];
            //fulfilled 计数器
            let count =0;
            //遍历顺序
            let index =0;
            //使用 for...of遍历可迭代对象
            for(const value of values){
                //避免闭包问题
                let resultIndex = index;
                index++;
                const p = TPromise.resolve(value).then(value=>{
                    //!在此保证最终返回的promise,在fulfilled时，所有的兑现值均按参数传递时的顺序
                    results[resultIndex]= value;
                    //fulfilled中统计次数，一旦count和传入的promises长度相等，就说明所有的promise均fulfilled了。
                    count++
                    if(count === index){
                        resolve(results)
                    }
                },(reason)=>{
                    reject(reason)
                });
            }
            if(index===0){
                //表示没有遍历，遍历对象为空
                resolve(results)
            }
        })
    }

//判断一个值是不是可迭代对象
function isIterator(val){
   return typeof val[Symbol.iterator] === 'function'
}
```

**其中，只解释如何使得在**`Promise`兑现无序的情况下使得最终`fulfilled`状态时的value数组有序，下述的其它静态方法也同理。

**就是实例化**`Promise`时，就创建一个结果数组`results`，然后遍历传入的可迭代对象，并更新迭代的下标（由于我们使用`for...of`遍历一个可迭代对象，只能得到元素无法取得下标），很明显地，下标应该是有序的，当兑现为`fulfilled`时，按下标放入`results`数组中，而不是直接`push`；并使用一个计数变量`count`统计总的`fulfilled`的次数，当其和下标相等时，就是所有的`Promise`均为`fulfilled`，此时调用`resolve`回调兑现返回的`P`的状态，如果有任意`Promise`被兑现为`rejected`，就直接调用`reject`将`P`兑现为`rejected`，且由于`P`的状态已发生改变，就算后续其他`Promise`被兑现为`rejected`调用了`reject`回调，`P`的状态也不会再发生变化了。

## Promise.any

**从**[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/any)得知，`Promise.any`返回的`Promise`对象`P`，由p1、p2、p3、... 、pn 共同决定：只要任意一个`Promise`兑现为`fulfilled`，`P`的状态为`fulfilled`，如下图所示：

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1710510219222-69612ba9-ec1b-452b-bce5-ff6d700020b8.png)

**当所有的**`Promie`都被兑现为`rejected`时，`P`的状态为`rejected`，其`reason=[R1,R2,...,Rn]`，如下图所示：

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1710510329567-e5d1d70d-91e0-48f3-a38d-b0f045d2b2cb.png)

```
static any(values){
        if(!isIterator(values)){
            throw new TypeError('values must be an iterable object.')
        }
        return new TPromise((resolve,reject)=>{
            //结果，any ===> reasons
            const results= []
            //计数器，统计rejected 次数
            let count =0;
            //迭代时下标记录
            let index=0;
            for(const value of values){
                //避免闭包问题
                let resultIndex = index;
                index++;
                TPromise.resolve(value).then((value)=>{
                    resolve(value)
                },reason=>{
                    results[resultIndex]=reason;
                    count++
                    if(count === index){
                        reject(results)
                    }
                });
            }
            //如果下标不变，说明迭代对象为空
            if(index===0){
                reject(results)
            }
        })
    }

//判断一个值是不是可迭代对象
function isIterator(val){
   return typeof val[Symbol.iterator] === 'function'
}
```

## Promise.race

**从**[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)得知，`Promise.race`返回的`P`的状态随着第一个兑现的`Promise`对象决定。如果第一个兑现为`fulfilled`，`P`也兑现为`fulfilled`，且value值和其等同，如下图所示：

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1710498627829-df6df071-fdb7-4464-87c3-1b9dd5b0e139.png)

**当 第一个兑现的为**`rejected`，`P`也兑现为`rejected`，且reason值和其等同，如下图所示：

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1710498748023-df0f7994-9560-4b67-8fe8-0511675588cd.png)

```
 static race(values){
        if(!isIterator(values)){
            throw new TypeError('values must be an iterable object.')
        }
        return new TPromise((resolve,reject)=>{
            //遍历下标
            let index =0;
            for(const value of values){
                //避免闭包问题
                let resultIndex = index;
                index++;
                TPromise.resolve(value).then((value)=>{
                    resolve(value)
                },(reason)=>{
                    reject(reason)
                });
            }
        })
    }

//判断一个值是不是可迭代对象
function isIterator(val){
   return typeof val[Symbol.iterator] === 'function'
}
```

## Promise.allSettled

**从MDN得知，**`Promise.allSettled`返回一个状态为`fulfilled`的`Promise`对象，其为`p1、p2、p3、... 、pn `全部兑现后结果的有序数组，并将同时记录其兑现后的状态。

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1710510799939-93dd9b2e-4052-4212-a83f-df7db52c3772.png)

```
static allSettled(values){
        if(!isIterator(values)){
            throw new TypeError('values must be an iterable object.')
        }
        return new TPromise((resolve)=>{
            const results = [];
            //计数器，兑现个数统计
            let count=0;
            //迭代下标
            let index=0;
            for(const value of values){
                //避免闭包问题
                let resultIndex = index;
                index++;
                TPromise.resolve(value).then((value)=>{
                    //保证有序
                    results[resultIndex]={
                        status:'fulfilled',
                        value:value
                    };
                    count++;
                    if(count===index){
                        resolve(results)
                    }
                },(reason)=>{
                    //保证有序
                    results[resultIndex]={
                        status:'rejected',
                        reason:reason
                    };
                    count++;
                    if(count===index){
                        resolve(results)
                    }
                });
            }
            //可迭代对象为空
            if(index===0){
                resolve(results)
            }
        })
    }

//判断一个值是不是可迭代对象
function isIterator(val){
   return typeof val[Symbol.iterator] === 'function'
}
```

# 测试我们手写的promise

**手写完我们自己的**`TPromise`后，我们还需要进一步确认我们实现的`TPromise`是否全部符合`Promise A+规范`，为此，`Promise A+`官方提供了一个测试库[promises-aplus-tests](https://www.npmjs.com/package/promises-aplus-tests)。新建一个adapter.js 文件

```
module.exports={
    resolved:TPromise.resolve,
    rejected:TPromise.reject,
    deferred(){
        const result = {};
        result.promise = new TPromise((resolve, reject) => {
            result.resolve = resolve;
            result.reject = reject;
        });
        return result;
    }
}
```

**再新建一个test.js文件，使用这个测试库测试，其共拥有****872**个测试用例，通过了就真正完成了我们的手写`Promise`的全部过程。

```
const promisesAplusTests = require('promises-aplus-tests');
const adapter = require('./adapter');

promisesAplusTests(adapter, function (err) {
    if (err) {
        console.error('Promises/A+ 测试失败:');
        console.error(err);
    } else {
        console.log('Promises/A+ 测试通过');
    }
});
```

# 小结

**手写部分逐个分析了**`Promise`的构造函数、三个原型方法和六个静态方法。其中最重要的就是`Promise.prrototype.then`和`Promise.resolve`两个方法，因为其除了自身逻辑复杂，还被其他方法使用到，如果要在面试时利于不败之地，必须每行代码都要吃透。同时，通过手写，我们也逐步了解到，`Promise`真正异步的逻辑部分是使用`then`、`catch`、`finally`三个原型方法的回调函数部分，且`**Promise**`**本身不执行微任务，而是把微任务放入到**`**javascript**`**执行线程中的微任务队列中**。且`Promise`状态的流转只能发生一次，状态一经改变就意味着`Promise`已经兑现。

**记忆时，可以参考刚开始的思维导图，三个原型方法都支持链式调用；六个静态方法都会返回**`Promise`，按单词本身理解是记忆的最好方法。


| **方法**               | **记忆**                                              | **是否一定返回新的Promise** |
| ---------------------- | ----------------------------------------------------- | --------------------------- |
| **Promise.resolve**    | **resolve为解决，解决什么，当然是解决value为Promise** | **否**                      |
| **Promise.reject**     | **reject为拒绝，当然是无条件拒绝**                    | **是**                      |
| **Promise.all**        | **all，所有，所有的都“成功”**                       | **是**                      |
| **Promise.any**        | **any，任意，任意一个”成功“**                       | **是**                      |
| **Promise.race**       | **race，竞赛，状态是否改变的时间竞赛**                | **是**                      |
| **Promise.allSettled** | **allSettled，所有的都解决，所有的Promise都兑现了**   | **是**                      |

# async/await 是Promise的语法糖

`async/await`允许我们以一种更为简洁的方式实现promise的异步编程，省去我们链式操作的烦恼，其本质也是对于`Promise`的封装，是语法糖。经常有人说，`async/await`使得`Promise`同步化，但其本质还是`Promise`，你的代码逻辑还是会被送入微任务队列，怎么就同步了呢？还有的说法是`await`会阻塞代码，其实并不是，`javascript`可是号称非阻塞线程的，如果`await`真的阻塞一个几天以后才会执行的代码那还得了！那`await`其实只是把其后的逻辑块处理为一个返回promise的的异步函数，这也很容易让我们联想到`Promise.resolve`静态方法，其包裹的值将被处理为一个`Promise`对象，

**如下的代码：**

```
async function asyncFn(){
  console.log(1);
  const res = await aa();
  console.log(res);
  console.log(2)
}

function aa(){
  console.log(5)
  return 3
}
asyncFn()
console.log(4)

//output: 1 5 4 3 2
```

**等价于：**

```
function asyncFn(){
  console.log(1)
  return Promise.resolve(aa()).then(()=>{
    console.log(res)
    console.log(2)
  })
}

function aa(){
  console.log(5)
  return 3
}
asyncFn()
console.log(4)
```

**在**`JavaScript`中，如果函数不指定返回值，默认会返回undefined，于是上述的代码再次等价于：

```
function asyncFn(){
  console.log(1)
  return Promise.resolve(aa()).then(()=>{
    console.log(res)
    console.log(2)
    return undefined
  })
}

function aa(){
  console.log(5)
  return 3
}
asyncFn()
console.log(4)
```

**且我们知道，**`Promise.prototype.then`方法接收的`onFulfilled`回调的返回值又将决定新的`Promise`的状态，如果它不是`thenable`对象也不是`Promise`，它直接作为新`Promise`的value值。于是，下述的代码将输出`undefined`：

```
asyncFn().then((value)=>{
  console.log(value)
})
```

**这个**`undefined`的值并非`async/await`指定，而是函数默认的`return undefined`这一行为所导致，`async/await`只是做了一层包裹，于是乎，我们得到了`async/await`语法糖的实质：

```
async function(){
  await xxx
}

//等价于
function (){
  return Promise.resolve(xxx).then(()=>{

  })
}
```

**由于**`Promise.resolve`可以传入一个`promise`实例或者`thenable`对象，我们来看看函数`aa`如果也是返回一个`promise`的情况：

```
async function asyncFn(){
  console.log(1);
  const res = await aa();
  console.log(res);
  console.log(2)
}

function aa(){
  console.log(5)
  return Promise.reject(3)
}
asyncFn()
console.log(4)

//output: 1 5 4 3
```

**等价于：**

```
function asyncFn(){
    console.log(1);
    return Promise.resolve(aa())
        .then((res)=>{
            console.log(res);
            console.log(2);
            return undefined
    },reason => {
            console.log(reason)
        })
}

function aa(){
    console.log(5)
    return Promise.reject(3)
}
asyncFn()
console.log(4)
```

**可以明确看出，由于函数**`aa`返回的是`rejected`状态的`promise`，最终输出不会有2，而是输出 `1、5、4、3`。其中，由于`Promise.resolve`如果传入的是一个`promise`实例将直接返回，所以此刻在函数`asyncFn`中并不会新建一个`promise`实例，而是**直接使用函数**`**aa**`**返回的**`**promise**`**实例**。

**再次强调：****构造函数以及**`**resolve**`**和**`**reject**`**调用的过程均是同步行为，只有**`**then**`**、**`**catch**`**、**`**finally**`**三个原型方法传入的回调才会异步执行，且这三个原型方法调用的本身都是同步行为。**

**接下来我们再看，函数内有多个**`await`的情况：

```
async function asyncFn(){
    console.log(1);
    const res = await aa();
    console.log(res);
    console.log(2)
    const res2=await bb();
    console.log(6)
    console.log(res2)
}

function aa(){
    console.log(5)
    return 3
}

function bb(){
    console.log(7)
    return Promise.resolve(8)
}
asyncFn()
console.log(4)

//output 1 5 4 3 2 7 6 8 
```

**等价于：**

```
function asyncFn(){
    console.log(1);
    return Promise.resolve(aa()).then(async (res)=>{
        console.log(res);
        console.log(2)
        const res2=await bb();
        console.log(6)
        console.log(res2)
    })
}

function aa(){
    console.log(5)
    return 3
}

function bb(){
    console.log(7)
    return Promise.resolve(8)
}
asyncFn()
console.log(4)
```

**等价于：**

```
function asyncFn(){
    console.log(1);
    return Promise.resolve(aa()).then(async (res)=>{
        console.log(res);
        console.log(2)
        return Promise.resolve(bb()).then(
            res2=>{
                console.log(6)
                console.log(res2)
                return undefined;
            }
        )
    })
}

function aa(){
    console.log(5)
    return 3
}

function bb(){
    console.log(7)
    return Promise.resolve(8)
}
asyncFn()
console.log(4)
```

**等价于：**

```
function asyncFn(){
    console.log(1);
    console.log(5);
    const aaReturn = 3;
    return new Promise((resolve)=>{
        resolve(aaReturn)
    }).then((res)=>{
        console.log(res);
        console.log(2);
        console.log(7);
        // return Promise.resolve(8).then((res2)=>{
        //     console.log(6);
        //     console.log(res2)
        // })
        return new Promise((resolve)=>{
            resolve(8)
        }).then(res2=>{
            console.log(6);
            console.log(res2)
        })
    })

}

function aa(){
    console.log(5)
    return 3
}

function bb(){
    console.log(7)
    return Promise.resolve(8)
}
asyncFn()
console.log(4)
```

**由此，如果存在多个**`await`，先使用`Promise.resolve`替换第一个`await`语句，然后将剩下的语句塞入其`.then`方法的`onFulfilled`回调函数中，并且把`async`关键字挪到回调之前，即`onFulfilled`回调函数此时也是一个`async/await`函数，也就说明这个`onFulfilled`回调也将返回一个`promise`实例。重复此操作不停内嵌，直至所有的`await`语句被替换。最终，函数`asyncFn`返回的`promise`由最后一句`await`其后的返回所决定，由下述代码所输出的那样：

```
function asyncFn(){
    console.log(1);
    console.log(5);
    const aaReturn = 3;
    return new Promise((resolve)=>{
        resolve(aaReturn)
    }).then((res)=>{
        console.log(res);
        console.log(2);
        console.log(7);
        // return Promise.resolve(8).then((res2)=>{
        //     console.log(6);
        //     console.log(res2)
        // })
        return new Promise((resolve)=>{
            resolve(8)
        }).then(res2=>{
            console.log(6);
            console.log(res2)
            return 9 //新增
        })
    })

}

asyncFn().then(value=>{
  console.log(value) //输出9
});
console.log(4);

//output: 1 5 4 3 2 7 6 8 9
```

**且经过转换后，我们也看到了如果没有**`async/await`语法糖，**多个**`**promise**`**的嵌套将会引发我们经常听说的回调地狱**，而有了`async/await`就可以解决这个问题，增强了我们代码的可读性（但确实不利于直观地明白输出顺序了，面试害死人......）

# 经典面试题

**以下举例两道经典的面试题，请你先将其**`async/await`等价替换后，给出输出的结果，最终答案以及解析将发在评论区，欢迎留言讨论哦。

## 面试题01

```
async function async1() {
    console.log("A")
    await async2()
    console.log("B")
} 

async function async2() {
    console.log('C');
}

console.log('D')

setTimeout(function () { 
    console.log('E')
}, 0)

async1();

new Promise(function (resolve) {
    console.log('F')
    resolve()
}).then(function () {
    console.log('G')
})

console.log('H')
```

## 面试题02

```
async function asy1(){
  console.log(1);
  await asy2();
  console.log(2);
}

const asy2 = async ()=>{
  await setTimeout(()=>{
    Promise.resolve().then(()=>{
      console.log(3)
    });
    console.log(4);
  },0)
};

const asy3 = async ()=>{
  Promise.resolve().then(()=>{
    console.log(6);
  })
}

asy1();
console.log(7);
asy3();
```

# 补充1：构造函数中resolve的进一步解释说明

**将以下的代码通过 Chrome、Edge、FireFox浏览器以及Node环境下测试：**

```
new Promise(resolve=>{
    const resolvedPromise=Promise.resolve()
    resolve(resolvedPromise)
}).then(()=>{
    console.log('resolved promise')
})

Promise.resolve()
    .then(()=>{
        console.log('promise1')
    })
    .then(()=>{
        console.log('promise2')
    })
    .then(()=>{
        console.log('promise3')
    })

```

```
promise1
promise2      
resolved promise
promise3
```

**按照我们的构想以及测试我们手写的**`TPromise`，输出的结果似乎为：

```
resolved promise
promise1
promise2      
promise3
```

# 总结

**本文按照**`Promise A+规范`利用`queueMicroTask`API手写了`Promise`，并解释了微任务产生以及执行的具体时机。

**另外，介绍了**`promises-plus-tests`库用于测试我们的手写`Promise`是否完全符合`Promise A+规范`。

**最后，解释了**`async/await`如何等价转换为`Promise`，并留下两道经典面试题作为思考。

**所有的手写代码可以在我哥**[github仓库](https://github.com/zerotower69/handle-promise-TPromise-)查看。
