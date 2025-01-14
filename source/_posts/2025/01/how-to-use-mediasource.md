---
abbrlink: ''
categories:
- - 音视频开发
date: '2025-01-14T22:34:30.058418+08:00'
tags:
- mediasource
title: mediaSource使用记录
updated: '2025-01-14T22:34:32.654+08:00'
---
# 导读

**看到网上有采用**`MediaSource`实践视频缓冲区的，我也抱着试一试的态度实践了一下，但是却有许多过不去的坎，特此记录。

**首先，可以从**[MDN官网](https://developer.mozilla.org/en-US/docs/Web/API/MediaSource)看到介绍，其可以附着在媒体元素上控制播放和资源加载。

**例如，可以和**`<video>`搭配：

```
<video></video>
<script>
 const video = document.getElementByTag("video");
 const mediaSource = new MediaSource()
 video.src = URL.createObjectURL(mediaSource)
</script>
```

**这将创建一个本地的blobURL，传给video.src:**

![image-20250114214816540](https://static.zerotower.cn/images/2025/01/cf5db3e1d8e5d8539cbaf7a0ba36b5b6.webp)

**其后可通过**`addSourceBuffer(mimeType)`创建一个[`SourceBuffer`](https://developer.mozilla.org/zh-CN/docs/Web/API/SourceBuffer)用于后续的操作。

**这里可以欣赏**[github](https://github.com/nickdesaulniers/netfix/blob/gh-pages/demo/bufferAll.html)上的例子：

```
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
  </head>
  <body>
    <video controls></video>
    <script>
      var video = document.querySelector('video');

      var assetURL = 'frag_bunny.mp4';
      // Need to be specific for Blink regarding codecs
      // ./mp4info frag_bunny.mp4 | grep Codec
      var mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

      if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
        var mediaSource = new MediaSource;
        //console.log(mediaSource.readyState); // closed
        video.src = URL.createObjectURL(mediaSource);
        mediaSource.addEventListener('sourceopen', sourceOpen);
      } else {
        console.error('Unsupported MIME type or codec: ', mimeCodec);
      }

      function sourceOpen (_) {
        //console.log(this.readyState); // open
        var mediaSource = this;
        var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
        fetchAB(assetURL, function (buf) {
          sourceBuffer.addEventListener('updateend', function (_) {
            mediaSource.endOfStream();
            video.play();
            //console.log(mediaSource.readyState); // ended
          });
          sourceBuffer.appendBuffer(buf);
        });
      };

      function fetchAB (url, cb) {
        console.log(url);
        var xhr = new XMLHttpRequest;
        xhr.open('get', url);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function () {
          cb(xhr.response);
        };
        xhr.send();
      };
    </script>
  </body>
</html>

```

**可以看到，其能力就是自定义请求媒体资源实现了加载，而自定义请求，则可以完全一些权限认证的操作。**

# mimeCodec

**可以通过安装**`mp4box`了解媒体文件的编码相关信息。

**首先安装**`mp4box`

```
brew install mp4box
```

**通过**`mp4box -info xxx`查看

![image-20250114220750253](https://static.zerotower.cn/images/2025/01/4cdd64a285650adfc4c031c7286e7087.webp)

**因此有**

```
var mimeCodec = 'video/mp4; codecs="avc1.640028, mp4a.40.2"';
...
 var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
```

# 使用MediaSource 做视频缓冲

**打开bilibili的一个视频，就可以从其进度条看到其在播放视频时总是预先加载部分视频，而不是整个加载或者播放时才加载，当暂停播放后加载到固定长度停止继续加载。**

**github上提供了**[类似的示例](https://github.com/nickdesaulniers/netfix/blob/gh-pages/demo/bufferWhenNeeded.html)

```
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
  </head>
  <body>
    <video controls></video>
    <script>
      var video = document.querySelector('video');

      var assetURL = 'frag_bunny.mp4';
      // Need to be specific for Blink regarding codecs
      // ./mp4info frag_bunny.mp4 | grep Codec
      var mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
      var totalSegments = 5;
      var segmentLength = 0;
      var segmentDuration = 0;
      var bytesFetched = 0;
      var requestedSegments = [];

      for (var i = 0; i < totalSegments; ++i) requestedSegments[i] = false;

      var mediaSource = null;
      if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
        mediaSource = new MediaSource;
        //console.log(mediaSource.readyState); // closed
        video.src = URL.createObjectURL(mediaSource);
        mediaSource.addEventListener('sourceopen', sourceOpen);
      } else {
        console.error('Unsupported MIME type or codec: ', mimeCodec);
      }

      var sourceBuffer = null;
      function sourceOpen (_) {
        sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
        getFileLength(assetURL, function (fileLength) {
          console.log((fileLength / 1024 / 1024).toFixed(2), 'MB');
          //totalLength = fileLength;
          segmentLength = Math.round(fileLength / totalSegments);
          //console.log(totalLength, segmentLength);
          fetchRange(assetURL, 0, segmentLength, appendSegment);
          requestedSegments[0] = true;
          video.addEventListener('timeupdate', checkBuffer);
          video.addEventListener('canplay', function () {
            segmentDuration = video.duration / totalSegments;
            video.play();
          });
          video.addEventListener('seeking', seek);
        });
      };

      function getFileLength (url, cb) {
        var xhr = new XMLHttpRequest;
        xhr.open('head', url);
        xhr.onload = function () {
            cb(xhr.getResponseHeader('content-length'));
          };
        xhr.send();
      };

      function fetchRange (url, start, end, cb) {
        var xhr = new XMLHttpRequest;
        xhr.open('get', url);
        xhr.responseType = 'arraybuffer';
        xhr.setRequestHeader('Range', 'bytes=' + start + '-' + end);
        xhr.onload = function () {
          console.log('fetched bytes: ', start, end);
          bytesFetched += end - start + 1;
          cb(xhr.response);
        };
        xhr.send();
      };

      function appendSegment (chunk) {
        sourceBuffer.appendBuffer(chunk);
      };

      function checkBuffer (_) {
        var currentSegment = getCurrentSegment();
        if (currentSegment === totalSegments && haveAllSegments()) {
          console.log('last segment', mediaSource.readyState);
          mediaSource.endOfStream();
          video.removeEventListener('timeupdate', checkBuffer);
        } else if (shouldFetchNextSegment(currentSegment)) {
          requestedSegments[currentSegment] = true;
          console.log('time to fetch next chunk', video.currentTime);
          fetchRange(assetURL, bytesFetched, bytesFetched + segmentLength, appendSegment);
        }
        //console.log(video.currentTime, currentSegment, segmentDuration);
      };

      function seek (e) {
        console.log(e);
        if (mediaSource.readyState === 'open') {
          sourceBuffer.abort();
          console.log(mediaSource.readyState);
        } else {
          console.log('seek but not open?');
          console.log(mediaSource.readyState);
        }
      };

      function getCurrentSegment () {
        return ((video.currentTime / segmentDuration) | 0) + 1;
      };

      function haveAllSegments () {
        return requestedSegments.every(function (val) { return !!val; });
      };

      function shouldFetchNextSegment (currentSegment) {
        return video.currentTime > segmentDuration * currentSegment * 0.8 &&
          !requestedSegments[currentSegment];
      };
    </script>
  </body>
</html>

```

**可以看到，其利用了HTTP协议的请求首部**[`Range`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Range)，并配合[`Content-Length`](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Length)响应头实现了对资源的部分请求。

**在**`MediaSource`的`sourceopen`事件回调中，递归请求资源并播放，实现了简单的缓冲设置。

# 自己尝试时发现的问题

## 这个过程涉及安装的一些库

### ffmpeg

```
brew install ffmpeg
```

**当我自己尝试这个示例时，我使用从bilibili下载了这个视频，直接利用github的示例，发现一个报错**

```
异常：InvalidStateError: Failed to read the 'buffered' property from 'SourceBuffer': This SourceBuffer has been removed from the parent media source. at SourceBuffer.invokeGetter
```

![image-20250114222131094](https://static.zerotower.cn/images/2025/01/253f0278e22ac70f7c182ad15fd0f6a8.webp)

**是由**`sourceBuffere.appendBuffer()`方法引起，这似乎是需要使用ffmpeg对视频转换处理

```
ffmpeg -i bilibili.mp4 -c:v copy -c:a copy -movflags frag_keyframe+empty_moov output.mp4
```

**浏览器上能显示进度条但是无法加载视频，无画面无声音。**

![image-20250114222511475](https://static.zerotower.cn/images/2025/01/8b813f4ff56192a6da0c655adfcd7af7.webp)

**控制台上的主要报错为：**

![image-20250114222604278](https://static.zerotower.cn/images/2025/01/6fa24e00d4d6b4fa1c1f9d22f4d30392.webp)

**当下还没找到原因，后续有时间继续探索**

# 参考文章

1. [利用MediaSource做分片加载](https://juejin.cn/post/7263776537749323831#heading-18)
2. [同上文，但是做了class的封装，代码更友好](https://juejin.cn/post/7128277376747700231)
3. [ffmpeg 实现mp4视频转换](https://21xrx.com/Articles/read_article/251040)
4. [微软官网的一个使用mp4box的例子](https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/samples/dn551368(v=vs.85))
5. [这篇提到了自适应网速的逻辑](https://developer.aliyun.com/article/1634463)
5. [ffmpeg官网](https://www.ffmpeg.org/)
