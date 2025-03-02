---
abbrlink: ''
categories:
- - 技术杂谈
date: '2025-03-02T14:18:23.972072+08:00'
tags:
- 前端
- 性能优化
title: 首屏优化策略和具体措施
updated: '2025-03-02T14:18:24.391+08:00'
---
# 导读

前端开发中随着项目体积的增加，代码也会以一定数量级增加，所生成的静态资源文件也会随之增多，加上一般质量的网络，很容易出现较长时间的白屏问题，影响用户体验。加之笔者近期面试时也大量问到了性能优化的相关问题，特此记录本人既往工作中的实践和收罗而来的一些可行方法。

# 分析

首先针对某一大类问题，先整体上分析：白屏为什么出现？在导读描述中知道了是项目体积的过大，代码文件和行数增多引起的。用户通过客户端请求部署服务器上的资源，到本地解析加载渲染，其实就是两个主要阶段：**加载**和**渲染**。加载就是尽可能加载较少的资源、加载速度要快、不必要的不加载，渲染就是尽快渲染，充分理解浏览器的渲染线程和JS执行单线程是个互斥的过程，资源的解析和JS执行尽量不阻塞页面渲染、不引起䌘的重流和重绘。

为此，为了描述在加载和渲染上的问题，针对加载和渲染上的问题分别有**加载性能指标**和**渲染性能指标**。前者有：FCP(首次内容绘制)、LCP(最大内容绘制)、TTFB(首个字节请求时间)，后者有:CLS(累积布局偏移)、FPS(渲染帧率)、INP(交互到下一次渲染时间)。针对首屏白屏问题，重点就是加载及其相关指标。

# 网络层面

网络层面的要点：请求快、资源体积小、不重复请求。快就是网络请求响应要快，体积小可以加载压缩后的资源加载后再解压，如果重复的资源就要利用缓存策略，利用浏览器的缓存能力尽量不重复请求。

## 使用h2代替h1.1

笔者之前的公司很多项目部署到页面时使用h/1.1部署的，h/1.1在chrome上的并发上有所限制，一般为6次，我们可以部署时启用h2，例如Ngin的配置可以为：

```nginx
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name www.test.com;
 
  root /var/www/;
  index index.php;
 
  ssl on;
  ssl_certificate /ssl/www.test.com.pem;
  ssl_certificate_key /ssl/www.test.com.key;
}
```

需要注意的是，Nginx的H2支持一定需要开启https并配置证书。

## 使用CDN

也可以使用CDN，一些三方库可以通过`webpack`的``external`配置或者`vite`的`globals`，相关资源通过`<script>`标签加载CDN资源实现。

```js
// webpack.config.js
module.exports={
   externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
    }
}

//vite.config.js
export default {
  build:{
    rollupOptions:{
      output:{
        globals: {
          vue: "Vue",
          "vue-router": "VueRouter",
          "element-plus": "ElementPlus",
        },
      }
    }
  }
}
```

## 域名分片

如果就是不想使用H2就是想使用H1.1，其请求并发限制的是同一域名下的资源，那么可以设置多个子域名，把相关静态资源合理地分布到不同子域名下实现资源的并发下载，比如逼着之前做GIS开发，天地图等瓦片服务就是用了多个不同的子域名。

子域名可以如此开启：

* 在DNS设置多个子域名解析

  - `static1.example.com`
  - `static2.example.com`
  - `static3.example.com`
* 配置Nginx确保多个子域名指向同样的资源

```nginx
server {
    server_name static1.example.com static2.example.com static3.example.com;
    root /path/to/static/resources;
    location / {
        try_files $uri $uri/ =404;
    }
}
```

* 把资源分散到不同的域名下(css/js/image使用不同的子域名)

  - `static1.example.com/image1.jpg`
  - `static2.example.com/style.css`
  - `static3.example.com/script.js`
* 修改HTML的引用

```html
<link rel="stylesheet" href="https://static1.example.com/style.css">
<script src="https://static2.example.com/script.js"></script>
<img src="https://static3.example.com/image1.jpg" alt="Image">
```

一些CDN服务也提供了域名分片的方案，可以节省操作。不过需要注意的是，如果使用域名分片，就会导致浏览器需要解析多个域名(DNS耗时增加)，为此，可以使用`<link rel="dns-prefetch" href="https://static1.example.com/">`，利用link标签的能力实现DNS的提前解析。

也可以使用`webpack`的`publicPath`的配置

```js
module.exports = {
  output: {
    publicPath: 'https://static[hash:1].example.com/',
  },
};
```

## gzip压缩

还可以使用gzip压缩，让浏览器加载gzip压缩后的文件，再由浏览器自己解析后加载。要实现gzip的功能，需要打包工具和和Nginx的紧密配合。

* 打包工具配置

`webpack`使用[compression-webpack-plugin](https://www.npmjs.com/package/compression-webpack-plugin)，vite可以使用[vite-plugin-compression2](https://www.npmjs.com/package/vite-plugin-compression2)。

```js
//webpack.config.js
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  plugins:[
    new CompressionPlugin({
            filename: '[path].gz[query]',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240,
            minRatio: 0.8,
        })
  ]
}

//vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { compression } from "vite-plugin-compression2";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    compression({
      threshold: 1024 * 10, // 10 KB
      algorithm: "gzip",
    }),
  ],
});
```

* Nginx配置

```nginx
server{
    gzip on;
    gzip_buffers 32 4K;
    gzip_comp_level 6;
    gzip_min_length 100;
    gzip_types application/javascript text/css text/xml;
    gzip_disable "MSIE [1-6]\."; #配置禁用gzip条件，支持正则。此处表示ie6及以下不启用gzip（因为ie低版本不支持）
    gzip_vary on;
}
```

## 浏览器缓存

还可以充分利用浏览器的缓存策略，比如协商缓存和强制缓存等，以及IndexedDB方案。

例如通常使用`Cache-Control:max-age=3156000`开启为期一年的强制缓存。

而协商缓存可以分别使用`Last-Modified`和`If-Modified-Since`、`Etag`和`If-None-Match`两对方案实现。

其流程图(感谢知乎up：[前端森林](https://www.zhihu.com/people/feng-shuan-91))如下所示：

![img](https://static.zerotower.cn/images/2025/03/a95e14fac99ecc1d32ef7bda85245380.webp)

使用IndexedDB还可以存储一些结构化数据，具体参见参考文章，或者使用[idb](https://www.npmjs.com/package/idb)这个库。

## Service Worker离线缓存

通过`Service Worker API`可以实现更为复杂的离线缓存的功能。

* 在网页中注册`Service Worker`

```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js') // 指定 Service Worker 文件路径
      .then((registration) => {
        console.log('Service Worker 注册成功: ', registration);
      })
      .catch((error) => {
        console.log('Service Worker 注册失败: ', error);
      });
  });
}
```

* 编写`Service Worker`脚本

```js
const CACHE_NAME = 'my-site-cache-v1'; // 缓存名称
const urlsToCache = [
  '/', // 缓存首页
  '/styles/main.css', // 缓存 CSS 文件
  '/scripts/main.js', // 缓存 JS 文件
  '/images/logo.png', // 缓存图片
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  // 预缓存资源
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('已打开缓存');
      return cache.addAll(urlsToCache);
    }),
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 如果缓存中有请求的资源，则返回缓存
      if (response) {
        return response;
      }
      // 否则从网络请求
      return fetch(event.request);
    }),
  );
});

// 更新缓存
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName); // 删除旧缓存
          }
        }),
      );
    }),
  );
});
```

# 代码优化

## 代码分割

随着代码体积的增大，如果不优化打包配置项，很容易造成所有的js和css被打包到同一个文件之中，导致单个资源文件体积过大，加载缓慢，影响FCP、TTFB等性能指标。

对于`webpack`和`vite`这两主流的打包工具，其代码分割如下所示

```js
//webpack.config.js
module.exports = {
  optimization: {
        //splitChunks代码分割,拆分公共代码和vue相关代码
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vue: {
                    test: /[\\/]node_modules[\\/](vue|vuex|vue-router)[\\/]/,
                    name: 'vue',
                    chunks: 'all',
                },
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },
}

//vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        //manualChunks代码分割,拆分公共代码和vue相关代码
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
          if (id.includes("vue")) {
            return "vue";
          }
        },
      },
    },
  },
}

//如果觉得manualChunks麻烦还可以使用vite-plugin-chunk-split
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { chunkSplitPlugin } from "vite-plugin-chunk-split";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    //拆分公共代码和vue相关代码
    chunkSplitPlugin({
      // 拆分公共代码
      strategy: "single-vendor",
      customChunk: (args) => {
        let { file, id, moduleId, root } = args;
        if (file.includes("vue")) {
          return "vue";
        }
        if (file.includes("node_modules")) {
          return "vendor";
        }
      },
    }),
  ],
});
```

## 代码压缩

与代码分割不同，我们可以利用构建工具的能力，将开发中格式化的代码压缩，减小文件体积。

* 压缩js文件

`webpack`使用``TerserPlugin`，vite使用`@rollup/plugin-terser`。

```js
//webpack.config.js
const TerserWebpackPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
        minimize: true,
        minimizer:[new TerserWebpackPlugin()]
    },
}

//vite.config.js
import terser from "@rollup/plugin-terser";
export default {
  build: {
    rollupOptions: {
      plugins: [
        terser({
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
          output: {
            comments: false,
          },
        }),
      ],
    },
  },
}
```

* 压缩css文件

`webpack`使用`mini-css-extract-plugin`。

```js
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  plugins: [new MiniCssExtractPlugin()],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
}
```

* 合并雪碧图

`webpack`使用`webpack-spritesmit`,`vite`使用`vite-plugin-sprite`。

```js
//webpack.config.js
const SpritesmithPlugin = require('webpack-spritesmith');

module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'images/[name].[hash].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new SpritesmithPlugin({
      src: {
        cwd: path.resolve(__dirname, 'src/assets/icons'), // 图标所在目录
        glob: '*.png', // 匹配的图标文件
      },
      target: {
        image: path.resolve(__dirname, 'src/assets/spritesheet.png'), // 输出的雪碧图文件
        css: path.resolve(__dirname, 'src/assets/spritesheet.css'), // 输出的 CSS 文件
      },
      apiOptions: {
        cssImageRef: './spritesheet.png', // CSS 中引用雪碧图的路径
      },
      spritesmithOptions: {
        padding: 10, // 图标之间的间距
      },
    }),
  ],
};


//vite.config.js
import { defineConfig } from 'vite';
import sprite from 'vite-plugin-sprite';

export default defineConfig({
  plugins: [
    sprite({
      symbolId: 'icon-[name]', // 生成的 symbol ID 格式
      include: 'src/assets/icons/*.png', // 图标文件路径
    }),
  ],
});
```

## 异步（动态）加载

异步加载和动态加载充分利用框架或者原生的特性，实现非阻塞效果。

* React动态加载

```jsx
const LazyComponent = React.lazy(() => import("./LazyComponent"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

* Vue动态加载

  ```vue
  const AsyncComponent = defineAsyncComponent(() =>
    import("./AsyncComponent.vue")
  );
  ```
* webpack动态加载

```js
import("./module").then((module) => {
  module.doSomething();
});
```

* JS脚本异步加载，不阻塞主线程

  ```html
  <script defer src="/path/to/self.js"></script>
  <script async src="/path/to/self.js"></script>
  ```

## 懒加载

延迟加载非关键资源，如图片、组件等。

* 图片懒加载(页面加载后)

  ```html
  <img data-src="image.jpg" class="lazyload" />
  <script>
    document.addEventListener("DOMContentLoaded", function () {
      const images = document.querySelectorAll(".lazyload");
      images.forEach((img) => {
        img.src = img.dataset.src;
      });
    });
  </script>
  ```
* 图片懒加载（可视区域加载）

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lazy Load Images with IntersectionObserver</title>
  <style>
    .lazy-image {
      width: 100%;
      height: auto;
      background: #f0f0f0;
      display: block;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div>
    <img class="lazy-image" data-src="https://picsum.photos/800/400?image=1" src="placeholder.jpg" alt="Image 1">
    <img class="lazy-image" data-src="https://picsum.photos/800/400?image=2" src="placeholder.jpg" alt="Image 2">
    <img class="lazy-image" data-src="https://picsum.photos/800/400?image=3" src="placeholder.jpg" alt="Image 3">
    <img class="lazy-image" data-src="https://picsum.photos/800/400?image=4" src="placeholder.jpg" alt="Image 4">
    <img class="lazy-image" data-src="https://picsum.photos/800/400?image=5" src="placeholder.jpg" alt="Image 5">
  </div>

  <script>
    // 1. 获取所有需要懒加载的图片
    const lazyImages = document.querySelectorAll('.lazy-image');

    // 2. 创建 IntersectionObserver 实例
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { // 如果图片进入视口
          const img = entry.target;
          img.src = img.dataset.src; // 将 data-src 的值赋给 src
          img.classList.remove('lazy-image'); // 移除懒加载类（可选）
          observer.unobserve(img); // 停止观察该图片
        }
      });
    }, {
      rootMargin: '0px', // 视口边缘的扩展区域
      threshold: 0.1     // 当图片 10% 进入视口时触发
    });

    // 3. 观察所有懒加载图片
    lazyImages.forEach(img => {
      observer.observe(img);
    });
  </script>
</body>
</html>
```

但是旧版浏览器可能需要做兼容处理：

```html
<script src="https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver"></script>
```

* 路由懒加载(Vue、React)

```jsx
const Home = React.lazy(() => import("./Home"));
const About = React.lazy(() => import("./About"));

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```

```js
const router = new VueRouter({
  routes: [
    {
      path: '/home',
      component: () => import(/* webpackChunkName: "home" */ './components/Home.vue')
    },
    {
      path: '/about',
      component: () => import(/* webpackChunkName: "about" */ './components/About.vue')
    }
  ]
});
```

`webpack`将以import(返回一个Promise)为分割点单独打包chunk，并可以自定义chunk命名（webpackChunkName:[name]）。

## tree shaking

`webpack`和`vite`都提供了静态分析的能力，移除未使用的代码，减少打包体积。

首先需要确保使用了ES6模块语法(**import/export**)。

`webpack`中mode设置为**production**

```js
module.exports = {
  mode: "production" //"none"|"development"|"production"
}
```

**vite**确认开启了rollup中的**treeshake**配置项（默认开启）

```js
export default {
  build: {
    rollupOptions: {
      treeshake: true,
    }
  }
}
```

## 图片优化

可以使用[imagemin](https://www.npmjs.com/package/imagemin)做图片压缩，或者使用webp代替jpg/png等图片格式。

* 使用imagemin

```js
import imagemin from 'imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';

const files = await imagemin(['images/*.{jpg,png}'], {
	destination: 'build/images',
	plugins: [
		imageminJpegtran(),
		imageminPngquant({
			quality: [0.6, 0.8]
		})
	]
});

console.log(files);
```

可以进一步封装为`webpack`或者`vite`的插件，或者使用``express`搭建简易的后端服务，实现图片压缩。

* 使用webp

笔者撰写博客文章时，就会使用编辑器的三方插件，将图片转为webp后再上传到图床。掘金社区还使用了`awebp`格式的图片，其基于`webp`增加了透明度的优化支持，能支持更丰富的场景。

![image-20250302132424295](https://static.zerotower.cn/images/2025/03/1ec4ed8744c0f06aa89db7f206ea4d5c.webp)

## 预加载和预渲染

可以提前加载其他页面需要的资源或者渲染页面。

* 预加载

```html
<link rel="preload" href="critical.css" as="style" />
<link rel="preload" href="critical.js" as="script" />
<link rel="preload" href="critical.png" as="image"/>
```

* 预渲染

```html
<link rel="prerender" href="https://example.com/next-page" />
```

# SSR方案

可以使用一些SSR的框架，例如`Vue`的上层框架`Nuxt.js`、`React`的上层框架`Next.js`。在服务端完成大多数HTML的解析和渲染，客户端再加载。特别是`Next.js`提出了服务端组件和流式加载的概念，前者减少了客户端请求的bundle文件，后者充分利用了浏览器的并发请求能力。

# 性能分析和监控

除了必要的优化手段，我们也需要采集实际上的加载性能指标并上报后台，常见的方案如下:

* LightHouse
* WebPageTest
* Sentry框架

# 总结

本文侧重于加载性能方面给出了一些具体的白屏优化措施：主要分为网络层面和代码优化方面。前者有使用h2、使用CDN、域名分片、gzip压缩、缓存策略等，后者分别结合了`webpack`和`vite`提供了代码分割、代码压缩、异步（动态）加载、懒加载、图片优化并充分利用打包工具自身的`tree shaking`特性。在本文的最后，还介绍了SSR的渲染方案和一些持续性的性能监控方案。

优化方案也不止上述说到的这些，如果你有更好的方案，欢迎评论区留言。也推荐各位阅读以下这本书，多读几遍，一定收益颇丰。

![img](https://static.zerotower.cn/images/2025/03/19f9b9d3fd1ab3e9043040c0c934fb8f.webp)

# 参考文章

1. [腾讯云社区：为Nginx开启H2支持](https://cloud.tencent.com/developer/article/2304791)
2. [npm：webpack-cdn-plugin](https://www.npmjs.com/package/webpack-cdn-plugin)
3. [MDN: 使用dns-fetch](https://developer.mozilla.org/zh-CN/docs/Web/Performance/Guides/dns-prefetch)
4. [博客园：Nginx中如何设置gzip](https://www.cnblogs.com/Renyi-Fan/p/11047490.html)
5. [深入理解浏览器的缓存机制](https://zhuanlan.zhihu.com/p/99340110)
6. [MDN：IndexedDB](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API)
7. [webpack: optimization.splitChunks](https://webpack.js.org/plugins/split-chunks-plugin/#optimizationsplitchunks)
8. [rollup:manualChunks](https://rollupjs.org/configuration-options/#output-manualchunks)
9. [MDN:IntersectionObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver)
10. [MDN: Service Worker](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API)
11. [知乎：Service Worker学习与实践（一）——离线缓存](https://zhuanlan.zhihu.com/p/44858068)
12. [webpack: Tree Shaking](https://webpack.js.org/guides/tree-shaking/#root)
13. [知乎：使用LightHouse分析前端性能](https://zhuanlan.zhihu.com/p/376925215)
14. [webpagetest](https://www.webpagetest.org/)
15. [Sentry官网](https://sentry.io/welcome/)
