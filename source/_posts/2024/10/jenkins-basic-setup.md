---
abbrlink: ''
categories:
- - 运维开发
date: '2024-10-01T18:16:45.169241+08:00'
tags:
- jenkins
- CI/CD
title: title
updated: '2025-01-12T18:16:45.992+08:00'
---
**jenkins网上有许多的教程都是安装jenkins的docker镜像，通过启动docker容器服务进而使用的jenkins服务，但是后续使用docker部署项目，就需要在docker容器里支持 **`docker`和`docker-compose`命令。对应地，有使用宿主机的docker环境和dokcer in docker的解决方案，但无论怎样，都有数不尽的坑，并且本来大家使用的服务器资源也不会太多，docker容器里新建docker部署将更为受限，因此，建议大家和我一样使用单机非docker安装jenkins。

**如果使用的是centos的系统，在安装之前首先需要更新yum源，以防止一些内部软件包由于版本过老影响接下来的安装。不过在这里还需要补充一点，现在的jenkins已经在2023年停止了对centos7的支持，如果有条件请使用centos8以上的系统，笔者这里由于腾讯云只支持centos7的系统安装，没得选择了。**

![image.png](https://static.zerotower.cn/images/2025/01/219b466eac4bfe5cf447aeb8148d63a2.webp)

## 安装jdk17

**可以运行命令：**

```
sudo yum install fontconfig java-17-openjdk
```

**如果安装不成功，可以选择其它的安装方式，例如**

```
sudo yum search jdk
```

![image.png](https://static.zerotower.cn/images/2025/01/96bd81b43c6430b904a2f967a1e5446c.webp)

**安装这个包**

```
sudo yum install jdk-17.x86_64
```

**之后可以通过**`java -version`命令查看java的版本，如果有证明安装成功，否则还需要配置相关的环境变量，这部分不再介绍，请自行查阅。

![image.png](https://static.zerotower.cn/images/2025/01/edfb59d593f738cc463fc55902cf1bb9.webp)

## 添加jenkins仓库和密钥并安装

**使用**`wget`命令安装仓库和密钥，确保获取最新的jenkins。

```
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
```

**接下来使用**`yum`命令安装jenkins

```
sudo yum install jenkins
```

## 启动服务

**可以使用**`systemctl`命令启动jenkins服务并设置开机自启

```
sudo systemctl start jenkins
sudo systemctl enable jenkins
```

**此时，jenkins服务已启动。**

**按网络上无数人的教程，都是赤裸裸启动一个服务了，但后续随着使用会发现许多的问题，例如jenkins服务占用内存过大，最后导致服务器的崩溃，特别是笔者的服务器仅仅是2核4G的情况下。**

**可以通过以下命令查看jenkins配置文件的地址**

```
sudo rpm -ql jenkins
```

![image.png](https://static.zerotower.cn/images/2025/01/a37feb931ff675deb81b870d86983dca.webp)

**需要注意的是，该文件默认是不可编辑的，仅可读，需要打开编辑之前使用**`chmod`命令给写权限。

```
sudo chmod 664 /usr/lib/systemd/system/jenkins.service # 赋予写权限
sudo vim /usr/lib/systemd/system/jenkins.service
```

![image.png](https://static.zerotower.cn/images/2025/01/8437e753445a73559f4612c8a4e9f185.webp)

**找到图中所示，红框部分就是需要加上的部分，限制最大内存占用2G。**

**然后重启jenkins服务**

```
sudo systemctl restart jenkins
```

**jenkins的服务默认在8080端口，请通过8080端口打开页面。如果你想使用其它的端口，也可以在**`/usr/lib/systemd/system/jenkins.service`文件中更改你的端口号。

![image.png](https://static.zerotower.cn/images/2025/01/c03719676fbe8e68a65bbe956762e5db.webp)

**如果使用了云服务，比如笔者的腾讯云，使用相关的端口，无论是页面还是其它的服务，外部访问都需要将对应的端口在防火墙规则放开：**

![image.png](https://static.zerotower.cn/images/2025/01/4bdfc52eadcd0089a03cbcd362585ef0.webp)

**到了这步，总算能在浏览器打开页面了：**

![image.png](https://static.zerotower.cn/images/2025/01/071807f6d8ecee3c63a6476dfe6393aa.webp)

**初次登录，我们需要输入密钥，同时也是admin用户的密码（建议不要修改）可以通过以下命令找到：**

```
cat /var/jenkins_home/secrets/initialAdminPassword
```

**安装推荐的插件：**

![image.png](https://static.zerotower.cn/images/2025/01/96ca52cc166ae801920255f9f6d32188.webp)

**创建一个用户，或者默认当前的admin用户，admin用户的密钥就是你输入的这个，记得妥善保管，后面就不好查找了。所以，还是自己创建一个记得住密码的用户吧。**

![image.png](https://static.zerotower.cn/images/2025/01/2b1c519571ba7200b9959a69c5445856.webp)

**自此，安装就算是完成了。但是接下来有些常用的插件将向你介绍，在这一步我们就提前安装好。**

## jenkins以root用户权限运行

**对于jenkins，为了后续部署时执行有关命令拥有root权限，我们可以将jenkins的运行权限设置为root**

```
sudo vim /usr/lib/systemd/system/jenkins.service
```

![image.png](https://static.zerotower.cn/images/2025/01/af7c74860c05c88c52610b55430c2273.webp)

**修改保存后，记得重启jenkins服务。**

```
sudo systemctl restart jenkins
```

## 常用的jenkins插件

### Gitee Plugin

**由于github访问都是科学上网的，国内为了部署还是尽量使用gitee或者自己的gitlab仓库，因此需要安装Gitee的插件。**

![image.png](https://static.zerotower.cn/images/2025/01/1806d9294b73bb1bfc510b14c39c6205.webp)

### Blue Ocean

**Blue Ocean是jenkins官方根据开发者的需求开发的一套更为美观的交互页面，具体介绍参考**[官网](https://www.jenkins.io/zh/doc/book/blueocean/)。

![image.png](https://static.zerotower.cn/images/2025/01/a195cf38e14518aad9ea38cff5632d34.webp)

**原来自带的页面：**

![image.png](https://static.zerotower.cn/images/2025/01/df8ed1d2cc7d8027bf4c35ad167f47a0.webp)

**Blue Ocean的页面：**

![image.png](https://static.zerotower.cn/images/2025/01/b874103975b4d9e569956be0b1aeefb8.webp)

### Generic Webhook Trigger

**用于支持后续自定义webhook服务的触发器**

![image.png](https://static.zerotower.cn/images/2025/01/9fe0cd9041ae1b21a86efadad2c2bd9f.webp)

# 安装docker

**jenkins环境安装好了，我们可以继续安装docker了。对于docker的安装，分别是docker命令和docker-compose命令。**

## 设置docker仓库并安装

```
sudo yum install -y yum-utils
#设置国内源加快安装速度
sudo yum-config-manager \
    --add-repo \
    https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
#安装docker
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

## 运行docker服务并设置开机自启

```
sudo systemctl start docker
sudo systemctl enable docker #设置开机自启
##检查版本号
docker -v
```

![image.png](https://static.zerotower.cn/images/2025/01/3f80befb625a22fa6d5fd143484584d9.webp)

## 安装docker-compose

**首先需要下载二进制文件，需要使用**`curl`命令下载。

**网上很多二进制文件的链接可能会失败的，各位安装时最好自己去拼接，为此，可以通过**[github仓库](https://github.com/docker/compose/releases)查看可用的版本。

**链接：**[https://github.com/docker/compose/releases](https://github.com/docker/compose/releases)

![image.png](https://static.zerotower.cn/images/2025/01/321165a3b2d706b9756e115a86028f4e.webp)

**拼接链接规则**

```
https://github.com/docker/compose/releases/download/<version>/<file-nname>
```

**<version>**就是realeases中的各个版本，注意从2开始，版本号前面有个“v”,然后使用`uname -r`命令查看当前的系统架构

![image.png](https://static.zerotower.cn/images/2025/01/3e8abe7951705f80f032156bca84d3c2.webp)

**你就知道具体使用哪个二进制安装包了**

**例如：**

```
https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64
```

**于是，可以有：**

```
curl -L https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64 >  /usr/local/soft/docker-compose
```

**"docker-compose"是下载的二进制文件不是目录。**

**由于使用的github，可能出现安装过慢的情况，为此，可以选择国内其它的下载服务。**

**需要下载一些docker-compose的插件**

```
yum -y install epel-release
yum install python3-pip
pip3 install --upgrade pip
pip3 install docker-compose
```

**二进制文件下载后，需要分别添加可执行权限和软链接。**

```
sudo chmod +x /usr/local/soft/docker-compose
ln -sf /usr/local/soft/docker-compose /usr/local/bin/docker-compose
```

**最后，使用以下命令确定版本号：**

```
docker-compose --version
```

![image.png](https://static.zerotower.cn/images/2025/01/3b5f12301720e1a17404a01451e9a470.webp)

**至此，我们的jenkins+docker的部署环境就准备好了。**

# 参考文章

[基于docker安装jenkins](https://juejin.cn/post/7067790095767568397#heading-2)

[centos7 安装docker-compose](https://www.cnblogs.com/technicianafei/p/17387154.html)

[jenkins 服务内存调整说明](https://www.cnblogs.com/rongfengliang/p/17242774.html)

[jenkins以root用户权限运行](https://www.cnblogs.com/zpzp/p/17135020.html)
