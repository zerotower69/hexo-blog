---
abbrlink: ''
categories:
- - 项目实践
date: '2025-02-10T08:26:07.521448+08:00'
tags:
- Vue2
title: Vue2对数组和对象的复杂更新
updated: '2025-02-10T08:26:07.871+08:00'
---
# 问题描述

> 最近公司项目需要主表下添加若干个子表，而子表的某些字段之间有联动，且子表由和主表有联动。联动很简单，不就是监听嘛，但是请注意我们的数据结构是这样的。

```json
{
    "id":"",
    "name":"",
    "location":"",
    "account":"",
    "sub_table":[
        {
            "name":"",
            "location":"",
            "account":""
        }
    ]
}
```

子表数据都在`sub_table`里,`name`和`account`需要联动，子表的`account`与主表的`account`也会有联动。对于主表，`account`与`name`也需要联动。

> 主表监听`account`是容易的，但是子表怎么办呢？深度监听 deep:true?好的，本文结束，才怪!

# 解决方案

子表一旦改变了任意一个字段，且任何一个子表的改动都将触发监听,性能不要了？而且实际上业务里的联动效果比举例的多得多。所以应该考虑使用Vue的vm.$set方法了！
先监听数组sub_table的长度变化

```javascript
vm.$watch("sub_table.length",function(val){});
```

> 在函数里判断一下，把新的数组内的元素（是一个对象）整个设置为数据的一部分

```json
{
    "id":"",
    "name":"",
    "location":"",
    "account":"",
    "sub_table":[
        {
            "name":"",
            "location":"",
            "account":""
        },
        {
            "name":"",
            "location":"",
            "account":""
        },
        {
            "name":"",
            "location":"",
            "account":""
        }
    ],
    "subs":{
        "subs_item_0": {
            "name":"",
            "location":"",
            "account":""
        },
        "subs_item_1": {
            "name":"",
            "location":"",
            "account":""
        }
    }
}
```

==增加的部分如下图==

```json
 "subs":{
        "subs_item_0": {
            "name":"",
            "location":"",
            "account":""
        },
        "subs_item_1": {
            "name":"",
            "location":"",
            "account":""
        }
    }
```

注意变量名尽量复杂，万一和后端业务的数据模型名字重复之类发生冲突你就爆炸了。
接下来是不是就可以实现特定的字段监听了呢?
如果需要子表字段的多个监听，你可以写成下面的形式

```javascript
this.$set(data, "subs", {});

this.$watch("sub_table.length", (newVal, oldVal) => {
    //增加逻辑
    this.$set(data.subs, "sub_item_" + (newVal - 1), {});
    let needWatchKeys = ["account", "name"];
    this.data.sub_table.forEach((item, index) => {
        //监听字段过滤
        Object.keys(item)
            .filter(_ => needWatchKeys.includes(_))
            .forEach((_) => {
                this.$watch("data.subs.sub_item_" + (newVal - 1), (val, old) => {
                    switch (_) {
                        case "account":
                            accountChange(val, old, index);
                            break;
                        case "name":
                            nameChange(val, old, index);
                            break;
                        default:  //记得default是一个好习惯
                            break;
                    }
                })
            })
    })
});
```

# 改进的部分

当然，太多的switch不是那么友好，我们可以把监听部分单独抽离为一个函数，把需要设置的数组对象，vm.$set的字段名以及每个item的名字作为函数的参数，当然了，还可以利用ES6的Map对象做字段名和回调的映射，例如

```javascript
let map=new Map();
map.set("account",accountChange);
map.set("name",nameChange);

//方法内部
Object.keys(item)
            .filter(_ => needWatchKeys.includes(_))
            .forEach((_) => {
                this.$watch("data.subs.sub_item_" + (newVal - 1), (val, old) => {
                  map.get(_)(val,old,index)
            })
```

本文的灵感来源于：[思否技术圈](https://segmentfault.com/q/1010000023568512)](https://www.zerotower.cn)
