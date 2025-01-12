---
abbrlink: ''
categories: []
date: '2025-01-11T23:37:01.971256+08:00'
tags:
- nextjs
- react
- 组件库
title: 'Next搭建组件库文档（二）- 支持markdown动态渲染 '
updated: '2025-01-12T11:15:54.949+08:00'
---
# 导读

**本文所述依赖如下的库包及其版本**


| **包名**               | **版本号**  |
| ---------------------- | ----------- |
| **next**               | **14.2.15** |
| **react**              | **18.2.0**  |
| **react-dom**          | **18.2.0**  |
| **@mdx-js/lodaer**     | **3.1.0**   |
| **@mdx-js/react**      | **3.1.0**   |
| **@next/mdx**          | **15.0.2**  |
| **@types/mdx**         | **2.0.13**  |
| **remark-gfm**         | **4**       |
| **remark-frontmatter** | **5.0.0**   |
| **rehype-highlight**   | **7.0.1**   |
| **next-mdx-remote**    | **5.0.0**   |

**本文的开发环境****基于 Macbook Pro M1 MacOS 14.6.1。**

# 本地渲染支持

**由于我们的文档除了从**`packages/**`加载的动态文档，还有next.js内部固定的文档。让我们先实现next.js内部的markdown解析和mdx的支持。

## 安装依赖与本地配置

**参考**[官方网站的配置](https://nextjs.org/docs/pages/building-your-application/configuring/mdx#configure-nextconfigmjs)

`pnpm add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx`

**配置文件参考：**

```
import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode:true,
    output:'standalone',
    images:{
        //github pages 无法对图像优化
        unoptimized:true
    },
    //都是对应仓库名<reposity-name>
    // basePath:"/react-components",
    // assetPrefix:"/react-components",
    //支持这些后缀作为文件名
    pageExtensions:["js","jsx","ts","tsx","md","mdx"]
};

const withMDX = createMDX({
    extension: /\.mdx?$/,
    // Add markdown plugins here, as desired
})

export default withMDX(nextConfig);
```

**注意如上的配置中的**`extension: /\.mdx?$/` ，其表示以`.md`或`.mdx`为后缀的页面会被next.js解析。

**再****在项目的根目录下**添加文件: `mdx-components.tsx`

```
import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  }
}
```

**接着，添加 **`app/docs/page.md`页面，输入一些内容：

```
# 导读

本文基于以下包和版本配置：

|              包名               | 版本号  |
| :-----------------------------: | :-----: |
|              next               | 14.2.15 |
|              react              | 18.2.0  |
|            react-dom            | 18.2.0  |
|           tailwindcss           |  3.4.1  |
|         @changesets/cli         | 2.27.9  |
|         @commitlint/cli         | 19.5.0  |
| @commitlint/config-conventional | 19.5.0  |
|              husky              |  9.1.6  |
|           typescript            |  5.4.4  |


本文介绍的开发环境是**Macbook Pro M1 MacOS 14.6.1**。

# 项目启动与打包验证

## 创建项目

创建项目，使用next 14.2.15

```bash
npx reate-next-app@14.2.15
```

**使用app router的模式**

![](https://static.zerotower.cn/images/2025/01/0b28995f0fb05a11f8aff98814c16090.webp)

## 本地运行

```

于是，可在`http://lcoalhost:3000/docs`路径下看到

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1730298694262-ae364fe9-2859-455b-b57d-3103000ef5a5.png)

如果把上面`next.config.js`配置文件中的`extension: /\.mdx?$/`干掉，你就会得到一个next.js提示的编译错误：

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1730298940780-6f108254-fdc0-443c-ac47-643fa39126ef.png)

## 插件的使用
注意到：上方的文档样式着实太丑了，且断行不对、代码没有格式化🤢；因此我们可以选择使用一些插件，本部分[参考官方文档](https://nextjs.org/docs/pages/building-your-application/configuring/mdx#remark-and-rehype-plugins)。

remark用来处理markdown文档，用来进行ast解析等，[可以在github中找到有趣的插件](https://github.com/remarkjs/remark/blob/main/doc/plugins.md#list-of-plugins)。

rehype用来处理html，[可在github中找到有趣的插件](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md#list-of-plugins)。

本节使用的插件配置如下：

```tsx
import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import rehypeHighlight from 'rehype-highlight'
...
const withMDX = createMDX({
    extension: /\.mdx?$/,
    options:{
        //处理md象github那样，出来formatter语法
        remarkPlugins:[remarkGfm,remarkFrontmatter],
        rehypePlugins:[rehypeHighlight]
    }
    // Add markdown plugins here, as desired
})
```

**再****在**`**src/layout.tsx**`**文件中**新增**highlight**的样式文件

```
import "highlight.js/styles/lightfair.css"
```

**重新访问 **`http://lcoalhost:3000/docs`

![](https://static.zerotower.cn/images/2025/01/fe904f940ca381944698595d162b4ba0.webp)

**看起来确实美观得多了🎆。**

**按照官网的教程，这里的**`page.md`还可以写成`page.mdx`，这里就不再赘述，请自行查阅官方文档。

# 加载其它库包下的文档

## 前置知识串讲

**上文的内容几乎都是官方文档中的内容，而我们真正要做的，是****加载来自**`**packages/**/docs/index.md**`**这个路径下的文档**。以项目为例，需要加载`packages/image-gallery/docs/index.md`，并显示在页面上，

**目标是访问/docs/image-gallery时能加载这个markdown文件，也就是**`packages/image-gallery/docs/index.md`。

**这里要重点说明：由于组件库包都是已知的，对应的文档就是已知的，加上我们的页面还是部署在github pages上，且应该是个静态的页面，每次更新文档或者组件库都会重新构建。这类构建方式是SSG，而非SSR服务端渲染。**

**如果你不了解什么是SSR，什么是SSG，傻傻分不清楚，请看看这篇文章**[《一文搞懂：什么是SSR、SSG、CSR？前端渲染技术全解析》](https://segmentfault.com/a/1190000044882791)。

**为了将我们的应用以SSG的方式构建，我们需要在**`next.config.js`将output设置为 `export`。

![](https://static.zerotower.cn/images/2025/01/a394cecc33dc4101a3fb58b0012e8a87.webp)

**接着，要构建SSG，我们肯定要告知next.js 当前存在哪些页面，也就是明确哪些组件库是有文档的。**

**由于我们最终通过/docs/[slug]路径访问，这个[slug]可能是**`image-gallery`也可能是`color-pciker`，因此[slug]是个动态路径，于是我们的next.js也需要使用动态路由的方式构建我们的文档（PS：如果你对nextjs的路由不够了解，可以参考[@神说要有光 大佬](https://juejin.cn/user/2788017216685118) 的 [《Next.js 的路由为什么这么奇怪？》](https://juejin.cn/post/7296330137284788275)）。

**于是新建一个**`src/app/docs/[slug]/page.tsx`页面文件，其除了页面渲染函数外，还有一个用于SSG指定构建路径的函数 `generateStaticParams()`，该函数在next.js以SSG构建时执行。详情参考[官方文档](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration#dynamic-paths-getstaticpaths)。

![](https://static.zerotower.cn/images/2025/01/4321d0458b97b0280630043bc4af71d8.webp)

**一开始，如果没有指定**`generateStaticParams()`函数，启动页面就会报错：

![](https://static.zerotower.cn/images/2025/01/f10c18fac3337f678f91dd5b8c1d4516.webp)

**加上这个**`generateParams()`函数，但是只返回空数组：

![](https://static.zerotower.cn/images/2025/01/0cd46a0d2108a37b4834fcd5ff7244c0.webp)

**又是不同的报错信息：**

![](https://static.zerotower.cn/images/2025/01/1e0d287725b1a53d6aff661d5bb4ec0c.webp)

**给定一个默认的对象，并在页面正常时显示 slug的匹配值：**

![](https://static.zerotower.cn/images/2025/01/06de6348db726d279352c8740a596aa8.webp)

**此时页面正常显示：**

![](https://static.zerotower.cn/images/2025/01/a6123bbf074893d15a710af5f2aaead2.webp)

**但是！访问/docs/image-gallery 还是不行的。**

![](https://static.zerotower.cn/images/2025/01/507c2946c39b194caf8787d83f116674.webp)

**除非我们也把它加上我们的**`generateStaticParams()`函数的返回值：

![](https://static.zerotower.cn/images/2025/01/2130c3e6a7c2db3dbff0c176718eea61.webp)

**这下页面也正常了！**

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1730309511942-fff6a72a-2fdb-4f50-a628-c0dcf67fd6aa.png)

**到了这一步，你可能对**`generateStaticParams()`和动态路由[slug]有了一定的了解，其底层其实是一种`**results.include([slug])**`的**匹配机制**。而且，假若我们需要对`packages/**`下的每个组件库更新文档，每次都要来到这个`src/app/docs/[slug]/page.tsx`文件下，修改一下`generateStaticParams()`函数的返回值，你为了简化操作可能会有：

![](https://static.zerotower.cn/images/2025/01/05cc1638343a5e4b75fa7698da88aded.webp)

**但是这样操作显然不太友好，这样的命令式更新实在是蛋疼(看着就头疼)！**

**而大多数组件库，如果你更新文档都是去仓库编辑对应的**`.md`文件就好了，并不会要求开发者做复杂的额外配置。因此，我们需要约定一种方式，实现声明式地更新文档。

## 动态读取可用路径并加载.md文档的内容

**其实，上文中，已经对这个声明式做了说明 **`packages/[slug]/docs/index.md`，我们构建时自动识别这样的路径，取出[slug]的值并以合法的形式作为`generateStaticParams()`的返回值。

**首先，读取packages路径下所有的路径，如果子路径存在/docs/index.md 这样的文件，我们就过滤为一个数组，并以合法的格式返回。**

**详细的代码为：**

```
import fs from "fs"
import path from "path"

export async function generateStaticParams(props){
    const files =fs.readdirSync(path.join(process.cwd(),'packages'))
        .filter(file=>fs.existsSync(path.join(process.cwd(),'packages',file,'docs','index.md')))
    return files.map(file => ({ slug: file } ))
}


export default function Page(props){
    const {params} = props
    return <div>slug:{params.slug}</div>
}
```

**接着我们的页面就是能正常访问的了。**

**接着，在**`Page()`页面渲染函数，我们确保了已经拿到合法的路径，到这里，我们可以直接读取这份`.md`文件。

`Page()`函数代码如下：

```
export default async function Page({params}:{params:{slug:string}}){
    const slug = params.slug;
    const content = await fs.promises.readFile(path.join(process.cwd(),'packages',slug,'docs','index.md'), 'utf-8');

    return <>
        <div>slug:{params.slug}</div>
        <div>{content}</div>
    </>
}
```

![](https://static.zerotower.cn/images/2025/01/0ce3195a862f5e3ea199ff6fe6b4a2cf.webp)

![](https://static.zerotower.cn/images/2025/01/a6bf6bbb41daa1ea4a84572fb9512c05.webp)

**到这里，我们已经打通了只要每新增组件，并按照要求放置**`.md`文档(`packages/**/docs/index.md`)，就可以实现动态访问了。

**但是目前，我们加载的是原生的markdown文件内容，并没有处理为正确的html并支持组件化渲染，要实现这一点，这是下一节中的内容。**

## 安装next-mdx-remote

**上一节实现了加载**`packages/**/docs/index.md`这个路径下的文档，本文将继续探索完成html部分的渲染。

**第一步，参考官方的教程，我们使用**[next-mdx-remote](https://nextjs.org/docs/app/building-your-application/configuring/mdx#remote-mdx)。

**安装下载它：**

`pnpm add next-mdx-remote -w`

**之后在**`src/app/docs/[slug]/page.tsx`页面中使用：

```
import {MDXRemote} from "next-mdx-remote/rsc"
...
export default async function Page({params}:{params:{slug:string}}){
    const slug = params.slug;
    const content = await fs.promises.readFile(path.join(process.cwd(),'packages',slug,'docs','index.md'), 'utf-8');

    return <>
        <div>slug:{params.slug}</div>
        {/*<div>{content}</div>*/}
        <MDXRemote source={content} />
    </>
}
```

**打开浏览器，访问/docs/color-picker，看到渲染成功了**

![](https://static.zerotower.cn/images/2025/01/599412becdc36ab9358e8f0bb4b1a453.webp)

**必须要强调的是：import 是从**`next-mdx-remote/rsc`导入的`MDXRemote`，而不是直接从`next-mdx-remote`导入。虽然`next-mdx-remote`也可以导出`MDXRemote`组件，但是用法完全不同。具体异同笔者也不是很清楚，可以[参考官方文档自行研究](https://nextjs.org/docs/app/building-your-application/configuring/mdx#remote-mdx)。

## 远程加载后的文档美化

**接着，笔者又发现一新的问题，在上述部分（本地渲染支持）中，笔者在**`next.config.js`中配置的`remarkPlugins`和`rehypePlugins`没有生效。因为它们只处理本地加载的`.md`或者`.mdx`文档，不处理“远程”加载的文件内容，于是，该项目也需要配置这些插件。

**参考代码如下：**

```
import fs from "fs"
import path from "path"
import {MDXRemote} from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import rehypeHighlight from "rehype-highlight";

export async function generateStaticParams(props){
    const files =fs.readdirSync(path.join(process.cwd(),'packages'))
        .filter(file=>fs.existsSync(path.join(process.cwd(),'packages',file,'docs','index.md')))
    return files.map(file => ({ slug: file } ))
}


export default async function Page({params}:{params:{slug:string}}){
    const slug = params.slug;
    const content = await fs.promises.readFile(path.join(process.cwd(),'packages',slug,'docs','index.md'), 'utf-8');

    return <>
        <div>slug:{params.slug}</div>
        {/*<div>{content}</div>*/}
        <MDXRemote source={content} options={{
            mdxOptions:{
                remarkPlugins:[remarkGfm,remarkFrontmatter],
                rehypePlugins:[rehypeHighlight]
            }
        }}/>
    </>
}

```

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1730329764079-5581052b-5e13-42d0-8f7b-ea0b93eb84eb.png)

**可以看到，**`MDXRemote`里的配置和`next.config.js`完全一致，继续刷新浏览器，可以看到上线了正确的断行还有`highlight`代码块解析。

![](https://static.zerotower.cn/images/2025/01/6fdf7ccdb72e59ae6aaf9a9a390889e9.webp)

**为了后续方便，笔者将**`MDXRemote`的使用封装为组件`RemoteConntent`，并放置到`/src/components/marddown/RemoteContent.tsx`。

```
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import rehypeHighlight from "rehype-highlight";
import {MDXRemote} from "next-mdx-remote/rsc";

const RemoteContent:React.FC<{source:string}>=({source})=>{
    return <MDXRemote source={source} options={{
        mdxOptions:{
            remarkPlugins:[remarkGfm,remarkFrontmatter],
            rehypePlugins:[rehypeHighlight]
        }
    }}/>
}

export default RemoteContent
```

![](https://static.zerotower.cn/images/2025/01/0f6f682a75a47da7b8c8018f7accd29a.webp)

**具体使用，在**`/src/app/docs/[slug].page.tsx`中，使用`RemoteContent`替换`MDXRemote`。

```
import RemoteContent from "@/components/markdown/RemoteContent"
...
export default async function Page({params}:{params:{slug:string}}){
    const slug = params.slug;
    const content = await fs.promises
        .readFile(path.join(process.cwd(),'packages',slug,'docs','index.md'), 'utf-8');

    return <>
        <div>slug:{params.slug}</div>
        {/*<div>{content}</div>*/}
        <RemoteContent source={content} />
    </>
}
```

**至此，markdown解析的集成算是搞定了，按上一篇的打包说明，尝试看看打包后是正常的不。**

**执行 **`pnpm build`命令后，得到了一个报错：

![](https://static.zerotower.cn/images/2025/01/d0c1f3322816d3089ce821360e74a9ee.webp)

**这是我们的项目中ts不允许使用any，在项目根目录下的**`tsconfig.json`

**文件中新增 **`noImplicitAny:false`即可

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1730356312157-4f10f84e-4d3c-4e02-9474-c6b8221c10c4.png)

**可以看到，打包是成功了的。**

![](https://cdn.nlark.com/yuque/0/2024/png/25532991/1730356432955-a2dbc375-963e-42b2-949a-a4a494503b0c.png)

**接着，我们cd 到打包生成的**`out`目录，它就是我们使用`SSG`模式打包后输出的所有静态资源。

**允许**`serve`命令，可以通过`npm i -g serve`安装，它将帮助我们在此目录下生成一个web服务器，就好像配置了nginx一样，接着就可以在浏览器中验证我们的功能了！

![](https://static.zerotower.cn/images/2025/01/c1a635cd73960ccfdbd2046704eafe46.webp)

**在浏览器中访问 **`http://localhost:3000/docs/image-gallery`，显示是正常的。

![](https://static.zerotower.cn/images/2025/01/985715381387ce1398ec76e2e67c4571.webp)

**说明引入的markdown功能开发和部署下都是没问题的，就可以放心地把代码推送到仓库了。**

**可通过**[github查看相关的代码](https://github.com/zerotower69/react-components/tree/demos)，可回退到本次[提交记录](https://github.com/zerotower69/react-components/commit/3c0361a0a23b4a542867a9c4e0d6ff518a8f6c37)。(`git reset --hard 3c0361a`)

# 本文小结

**本文介绍了next.js 如何加载next.js项目中的**`.md`的markdown文档和从外部加载markdown字符串并解析。

**接着，声明式指定加载**`packages/**/docs/index.md`路径的markdown字符串，并使用remark.js和rehype.js插件来实现markdown的美化和代码高亮。

# 参考文档

1. [一文搞懂：什么是SSR、SSG、CSR？前端渲染技术全解析](https://segmentfault.com/a/1190000044882791)
2. [Next.js 的路由为什么这么奇怪？](https://juejin.cn/post/7296330137284788275)
3. [使用 Next.js 搭建 Monorepo 组件库文档](https://blog.csdn.net/qq_36380426/article/details/128739164?utm_source=miniapp_weixin)
