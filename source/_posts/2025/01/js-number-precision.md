---
abbrlink: ''
categories:
- - js基础知识
date: '2025-01-23T22:07:39.701754+08:00'
tags:
- javascript
- 面试
title: Javascript Number精度问题与解决
updated: '2025-01-23T22:07:40.276+08:00'
---
# 导读

**JS 面试中精度和小数四则运算不准确的问题是一个高频问题，下面是想关的记录。**

# 十进制与二进制

**下述举例了整数和小数的十进制和二进制相互转换的情况。**

```js
(57).toString(2) // 111001
parseInt("111001",2) // 57
(.1).toString(2) '0.0001100110011001100110011001100110011001100110011001101' //无限不循环小数
//由于计算机存储有限，四舍五入处理了
```

**由于**`0.1`被转换为二进制后，其是一个无限不循环小数，加上计算机存储空间有限，就被四舍五入了。

**对于JS，其Number类型实际上为双精度浮点型，采用**``IEEE 754`标准，其共8字节，用64位二进制表示，其中首位为符号为，11位表示阶码，剩余52位表示尾数。

![](https://static.zerotower.cn/images/2025/01/c68903ca098702871c409c24ec30203f.webp)

# 最大安全整数

**有上节，能安全被表示的数的范围为：**`-2^53~2^53-1`。因此，最大安全整数为`2^53-1`，实际是：`9007199254740991`。其可以通过`Number.MAX_SAFE_INTEGER`快速得出。

**其能表示的最大数为**`2**1023*1.99999999999999`

# 精度丢失问题

**下列计算出现了精度丢失的问题**

```js
.1+.2 //0.30000000000000004
1-.9 //0.09999999999999998
3*.3 // 0.8999999999999999
1.21/1.1 //1.0999999999999999
```

**使用**`toFixed()`方法对`0.105`保留两位小数`(0.105).toFixed(2)` 得到了 `0.10`，不是期望的`0.11`。

**使用**`toPercision()`方法可以看到其保留更多位数时是不准确的。

```
0.105.toPercision(19) //'0.104999999999999996'
```

# 手写保留指定小数位

```js
function digital(num,n){
  //n+1 为了保证四舍五入参数的位数也化为整数，如果直接乘以 Math.pow(10,n) 会造成其的精度丢失
  let ans = num*Math.pow(10,n+1)
  //ans /10 将精度转换位数再转为小数，由于小数位只有意味还不会丢失
  ans = Math.round(ans/10)
  //将取整后的结果转为小数,相当于复原小数位
  ans = ans /Math.pow(10,n)
  //调用toFixed() 的目的是为了补零
  return ans.toFixed(n)
}
```

# 使用外部库解决浮点数运算问题

## number-precision

```js
import NP from 'number-precision'
NP.strip(0.09999999999999998); // = 0.1
NP.plus(0.1, 0.2);             // = 0.3, not 0.30000000000000004
NP.plus(2.3, 2.4);             // = 4.7, not 4.699999999999999
NP.minus(1.0, 0.9);            // = 0.1, not 0.09999999999999998
NP.times(3, 0.3);              // = 0.9, not 0.8999999999999999
NP.times(0.362, 100);          // = 36.2, not 36.199999999999996
NP.divide(1.21, 1.1);          // = 1.1, not 1.0999999999999999
NP.round(0.105, 2);            // = 0.11, not 0.1
```

## bignumer.js

```js
import BigNumber from "bignumber.js";
let x = new BigNumber(123.4567);
let y = BigNumber('123456.7e-3');
let z = new BigNumber(x);
x.isEqualTo(y) && y.isEqualTo(z) && x.isEqualTo(z);      // true
```

# 参考

1. [B站视频](https://www.bilibili.com/video/BV1664y1x7pf?spm_id_from=333.788.player.switch&vd_source=edf202071ab94f11459d1f51166437fe&p=2)
2. [number-precision](https://www.npmjs.com/package/number-precision)
3. [bignumber.js](https://www.npmjs.com/package/bignumber.js)
