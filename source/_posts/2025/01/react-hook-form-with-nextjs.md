---
abbrlink: ''
categories:
  - - nextjs
date: '2025-01-11T20:59:23.666357+08:00'
tags:
  - nextjs
  - react
title: nextjs 使用react-hook-form和zod实现登录表单验证和提交
updated: '2025-01-11T20:59:25.854+08:00'
description: 文章介绍了在Next.js应用中如何利用react-hook-form和zod实现登录表单的验证与提交，通过定义Zod Schema进行数据校验并生成TypeScript类型，结合hookform/resolvers完成集成，详细展示了表单UI错误提示、提交按钮状态控制及异步处理流程，提升开发效率与用户体验。
---
---


---
# 背景说明

nextjs 使用中不可避免地会碰到使用表单，尤其是登录表单。而对于提交表单来说要关注的几个要素就是数据收集、数据校验和数据提交（涉及异步操作）。本文将围绕这几个要素，并通过[zod](https://zod.dev/)和[react-hook-form](https://www.react-hook-form.com/)提供的能力实现登录表单。

本文所述依赖如下的库包及其版本


| 包名                | 版本号  |
| ------------------- | ------- |
| next                | 14.2.15 |
| react               | 18.2.0  |
| react-dom           | 18.2.0  |
| zod                 | 3.24.1  |
| react-hook-form     | 7.54.2  |
| @hookform/resolvers | 3.9.1   |

本文的开发环境**基于 Macbook Pro M1 MacOS 14.6.1。**

# zod 简单上手

zod 提供了简单的表单校验器，且支持typescript,并弥补了typescrip对运行时代码无法校验的不足，通过一次定义，不仅可以通过safeParse方法验证表单数据，导出错误，还可以通过z.infer推断表单模型的typescript类型。
下载

```bash
pnpm add zod
```

以邮箱登录表单为例

```ts
export const loginSchema = z.object({
    email: z.string().email("邮箱地址格式错误").min(1, "邮箱地址不能为空"),
    password: z.string().min(1, "密码不能为空")
})

export type LoginData = z.infer<typeof loginSchema>
```

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/968b9bd07d6e486f8069aa065acc76b5~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg56iL5bqP5ZGY6Zu25aGU:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzQ2NjExODYyNzMzMDQxMyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1737205057&x-orig-sign=lj17KpSprN3XE1iqgHoIerBGiF4%3D)

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/9af225242f5548cc92cff9fd30419dc9~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg56iL5bqP5ZGY6Zu25aGU:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzQ2NjExODYyNzMzMDQxMyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1737205057&x-orig-sign=A7%2FNnShE3LVnCNp0UwkExv%2FJbzw%3D)

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/721c7075ed694362945ef23f2ba3a247~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg56iL5bqP5ZGY6Zu25aGU:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzQ2NjExODYyNzMzMDQxMyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1737205057&x-orig-sign=IwIKEN%2B64vZwh5NqXwQ9CJ8npsA%3D)

可以看到，我们可以使用`z.object()`定义模型，通过`schema.safeParse()`方法返回的对象`resp`。
通过`resp.success`可以判断数据是否校验成功，一旦校验成功则通过`resp.data`获取输入的表单数据，否则可以使用`resp.error`获取校验错误。

# 登录表单的UI实现

由于css样式比较繁琐，这里使用[shadcn ui]()这个组件库+Tailwindcss。其中有邮箱和密码的输入框还有一个用于提交表单的按钮。

```ts
export default function LoginForm() {
  return (
    <form>
      <div>
        <Label htmlFor="login-email">邮箱：</Label>
        <Input
          id="login-email"
          type="text"
          autoComplete="off"
          placeholder="请输入您的邮箱地址"
          className={cn(
            "border",
            "focus-visible:!outline-none focus-visible:ring-1 focus-visible:ring-gray-500"
          )}
        />
      </div>
      <div>
        <Label htmlFor="login-pwd">密码：</Label>
        <Input
          id="login-pwd"
          type="password"
          autoComplete="new-password"
          placeholder="请输入密码："
          className={cn(
            "border",
            "focus-visible:!outline-none focus-visible:ring-1 focus-visible:ring-gray-500"
          )}
        />
      </div>
      <Button className="w-full">登录</Button>
    </form>
  );
}
```

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/1bf40c043fe346a09b5239dc5db38bff~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg56iL5bqP5ZGY6Zu25aGU:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzQ2NjExODYyNzMzMDQxMyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1737205057&x-orig-sign=57zSIFnCG771X4%2Bo2KL4viqsw%2FI%3D)

# 使用 react-hook-form

## 基本使用

react-hook-form 提供了许多用于表单的hook，在这使用的是[`useForm`](https://www.react-hook-form.com/api/useform/)这个hook。
基本用法如下：

```tsx
import {useForm} from "react-hook-form"
export default function Page(){
const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    register,
  } = useForm();
    return <form onSubmit={handleSubmit((data)=>{
        console.log("data",data)
    })}>
    <Label htmlFor="login-email">邮箱：</Label>
    <Input
          id="login-email"
          type="text"
          autoComplete="off"
          placeholder="请输入您的邮箱地址"
          {...register("email")}
          className={cn(
            "border",
            "focus-visible:!outline-none focus-visible:ring-1 focus-visible:ring-gray-500"
          )}
        />
    </form>
}
```

可以看到`useForm`导出了三个方法和一个对象，其中最为重要的当属`handleSubmit`和`register`方法，一个用来注册某些原生属性或者事件以及校验规则。对于校验规则，其提供了一个resolver属性允许使用第三方的表单校验库去完成。

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
...
const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    register,
  } = useForm({ resolver: zodResolver(loginSchema) });
```

对此，我们可以使用上节提到的zod来实现表单校验，通过安装[@hookform/resolvers](https://www.npmjs.com/package/@hookform/resolvers)导入`zodResolver`，传入上节定义号的表单校验模型。

## ts智能提示

再通过`useForm`传入`zod`推断的数据类型,可以在使用register方法时得到更好的智能提示。

```tsx
type LoginData = z.infer<typeof loginSchema>
useForm<LoginData>()
```

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/0e41912fb10f4285823f7a93d2d17d8b~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg56iL5bqP5ZGY6Zu25aGU:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzQ2NjExODYyNzMzMDQxMyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1737205057&x-orig-sign=HXG9qh6RNUzJdf%2FpGn4IW3qEtL0%3D)

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/5b94c7ad01734a1f8f4a7cceb078495a~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg56iL5bqP5ZGY6Zu25aGU:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzQ2NjExODYyNzMzMDQxMyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1737205057&x-orig-sign=OYJJadNAFnC%2FwxMxhwPWr5A9W%2FM%3D)

## 获取错误并修改表单样式

当表单校验发生错误时，常见的UI提示是输入框边框转为警告色，并在其下方显示对应的错误信息，就像下述这样，当邮箱地址格式错误显示错误的信息：

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/bde96e6228644e4c8cca0d649ed27303~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg56iL5bqP5ZGY6Zu25aGU:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzQ2NjExODYyNzMzMDQxMyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1737205057&x-orig-sign=KapHdzhM7RjA1UqjLHB%2ByKs7ydw%3D)
该错误信息在使用`zod`时已定义：

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/d1d30ca59f9545efaf636f734e9e480f~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg56iL5bqP5ZGY6Zu25aGU:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzQ2NjExODYyNzMzMDQxMyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1737205057&x-orig-sign=DKOKBJFUPSZZANTQmKQ5WLSZ21c%3D)

警告色样式可由tailwindcss提供：

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/9e7856b4559b42fd9dab8391f4635deb~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg56iL5bqP5ZGY6Zu25aGU:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzQ2NjExODYyNzMzMDQxMyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1737205057&x-orig-sign=ZMVSzUtvMmo7c%2FmNmj2phOtWQ5s%3D)
但如何知道字段校验错误，并取出这些错误提示信息呢。答案是上文导出的errors属性。

```tsx
const {formState:{errors}} = useForm()
```

导出errors属性，其也是一个对象，可通过`errors.[field].message`取出错误信息

```tsx
console.log(errors.email.message) \\邮箱地址格式错误
```

可以使用一个p标签显示信息

```tsx
<form>
    <Label htmlFor="login-email">邮箱：</Label>
    <Input
            id="login-email"
            type="text"
            {...register("email")}
            autoComplete="off"
            placeholder="请输入您的邮箱地址"
            className={cn(
              "border",
              "focus-visible:!outline-none focus-visible:ring-1 focus-visible:ring-gray-500",
              errors.email
                ? "border-red-500 focus-visible:!ring-red-700"
                : "border-gray-300 focus-visible:ring-gray-500"
            )}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
</form>
```

至此，实现了字段校验错误信息的显示和UI的警告色功能。

## 表单提交时按钮禁用

当表单在提交时往往是异步状态，在提交结束前我们往往期望暂时禁用提交按钮，直到本次提交完成（无论成功与否）。

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/037eeaf6ada14d0c8fe841a5a4a3bfb4~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg56iL5bqP5ZGY6Zu25aGU:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzQ2NjExODYyNzMzMDQxMyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1737205057&x-orig-sign=VCOo5%2B2AQHNQUkqeW4uPPyh5kMQ%3D)

在当前的示例中，点击登录按钮，按钮立刻处于禁用样式其文字页变更为【登录中...】，很容易想到需要一个布尔值在表单提交时设置为true添加到`button`的`disabled`属性和实现添加渲染不同的按钮文字。
幸运地是，`useForm`提供了这个属性，我们可以像得到`errors`对象属性一样，拿到这个布尔属性`isSubmitting`。

```tsx
const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    register,
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  
  return (
      ...
      <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "登录中..." : "登录"}
          </Button>
      ...
  )
```

到这，按钮提交时禁用也实现了。

当本示例的登录表单完成校验后将会触发`form`元素的提交事件，执行在`handleSubmit`中传入的回调函数：

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/0e7b0e646a4041a3b96140c806ba261f~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg56iL5bqP5ZGY6Zu25aGU:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzQ2NjExODYyNzMzMDQxMyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1737205057&x-orig-sign=%2Frqsu%2B0NSBAyT20mYEPFNvoLSbA%3D)

# 本文小结

本文通过登录表单的案例，介绍了如何使用`zod`和`react-hook-form`实现表单数据收集和校验的全过程和数据校验，并补充了一些需要的注意事项。
