---
abbrlink: ''
categories:
  - - react注意事项
date: '2025-02-14T11:58:19.583265+08:00'
tags:
  - react
title: 区分react的useEffect和useLayoutEffect
updated: '2025-02-14T11:58:20.139+08:00'
description: 本文详细区分了React中的`useEffect`和`useLayoutEffect`，重点分析了它们的执行时机和使用场景。`useEffect`适用于异步任务如数据获取和事件订阅，而`useLayoutEffect`则用于需要立即执行的DOM操作和视觉优化，如图片加载、字体调整和锚点定位等。通过具体代码示例，展示了如何在不同场景中选择合适的钩子函数。
---
# 导读

笔者在学习React，经常混淆`useEffect`和`useLayoutEffect`，傻傻分不清楚。接下来简要结合我的个人博客的开发经历从其底层执行和具体影响来具体分析。

# 执行时机

* useEffect

在浏览器完成（DOM）渲染后，异步执行，不会阻塞主线程。

* useLayoutEffect

在浏览器完成（DOM）渲染后，立刻执行，会阻塞主线程，因此会导致性能问题。

# 使用场景

## 获取文章数据使用useEffect

```jsx
import React, { useEffect, useState } from 'react';

function DataFetchingExample() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // 模拟数据获取
    fetch('https://jsonplaceholder.typicode.com/posts/1')
      .then((response) => response.json())
      .then((json) => {
        setData(json);
      });
  }, []); // 空依赖数组表示只在组件挂载时执行

  return (
    <div>
      {data ? (
        <div>
          <h2>{data.title}</h2>
          <p>{data.body}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default DataFetchingExample;
```

## 订阅事件和取消订阅使用useEffect

当需要监听窗口大小变化时。

```jsx
import React, { useEffect, useState } from 'react';

function EventSubscriptionExample() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    // 清理函数：在组件卸载时取消订阅
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // 空依赖数组表示只在组件挂载和卸载时执行

  return <p>Window width: {windowWidth}px</p>;
}

export default EventSubscriptionExample;
```

## 文章渲染后立刻高亮的

```jsx
import React, { useLayoutEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // 引入 Prism 主题

function BlogPost({ content }) {
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    if (contentRef.current) {
      // 对文章中的代码块进行语法高亮
      Prism.highlightAllUnder(contentRef.current);
    }
  }, [content]); // 依赖 content，确保内容更新时重新高亮

  return (
    <div ref={contentRef}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

export default BlogPost;
```

## 图片加载完成前显示占位符使用useLayoutEffect

```jsx
import React, { useLayoutEffect, useState, useRef } from 'react';

function LazyImage({ src, alt }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (img) {
      img.onload = () => {
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [src]); // 依赖 src，确保图片地址变化时重新加载

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!isLoaded && (
        <div style={{ background: '#eee', width: '100%', height: '200px' }}>
          Loading...
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        style={{ display: isLoaded ? 'block' : 'none', width: '100%' }}
      />
    </div>
  );
}

export default LazyImage;
```

## 文章目录（TOC）滚动定位使用useLayoutEffect

在文章定位后立刻绑定ref，确保目录项和文章标题位置对应正确。

```jsx
import React, { useLayoutEffect, useRef } from 'react';

function TableOfContents({ headings }) {
  const headingRefs = useRef([]);

  useLayoutEffect(() => {
    headingRefs.current = headingRefs.current.slice(0, headings.length);
  }, [headings]); // 依赖 headings，确保目录更新时重新绑定 ref

  const scrollToHeading = (index) => {
    const heading = headingRefs.current[index];
    if (heading) {
      heading.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div>
      <ul>
        {headings.map((heading, index) => (
          <li key={index} onClick={() => scrollToHeading(index)}>
            {heading.text}
          </li>
        ))}
      </ul>
      {headings.map((heading, index) => (
        <h2
          key={index}
          ref={(el) => (headingRefs.current[index] = el)}
          id={`heading-${index}`}
        >
          {heading.text}
        </h2>
      ))}
    </div>
  );
}

export default TableOfContents;
```

## 文章锚点自动滚动使用useLayoutEffect

文章页面加载后立刻滚动到指定位置，避免用户看到页面跳动。

```jsx
import React, { useLayoutEffect } from 'react';

function BlogPost({ content }) {
  useLayoutEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, []); // 空依赖数组，只在组件挂载时执行

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

export default BlogPost;
```

## 文章字体随着内容宽度和长度排版使用useLayoutEffect

防止用户看到字体的大小变化过程。

```jsx
import React, { useLayoutEffect, useRef } from 'react';

function BlogPost({ content }) {
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    if (contentRef.current) {
      const paragraphs = contentRef.current.querySelectorAll('p');
      paragraphs.forEach((p) => {
        if (p.textContent.length > 500) {
          p.style.fontSize = '14px';
        } else {
          p.style.fontSize = '16px';
        }
      });
    }
  }, [content]); // 依赖 content，确保内容更新时重新调整

  return (
    <div ref={contentRef}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

export default BlogPost;
```

## 文章内容中的数学公式渲染使用useLayoutEffect

确保用户立刻看到渲染完成的可读的数学公式。

```jsx
import React, { useLayoutEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function BlogPost({ content }) {
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    if (contentRef.current) {
      const mathElements = contentRef.current.querySelectorAll('.math');
      mathElements.forEach((element) => {
        katex.render(element.textContent, element, {
          throwOnError: false,
        });
      });
    }
  }, [content]); // 依赖 content，确保内容更新时重新渲染

  return (
    <div ref={contentRef}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

export default BlogPost;
```

# 总结

`useEffect`钩子常常用于异步任务：数据异步获取、事件订阅、解除订阅时；而``useLayoutEffect`用于立刻渲染，常用于立刻渲染的DOM操作、视觉优化（图片懒加载、文字缩放）以及交互优化(锚点定位等）
