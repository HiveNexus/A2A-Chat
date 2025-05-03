# A2A Chat

这是一个基于 A2A（Agent-to-Agent） 协议的聊天应用，有以下特点：

* 数据本地存储，可以通过链接添加 Agent， 应用通过读取 Agent Card 展示 Agent 信息
* 通过对话方式使用 Agent，当前版本暂只支持发送文本
* 流式显示 Agent 的响应，支持 Artifact 的显示

关于 A2A 的详细介绍见：https://google.github.io/A2A/

## 开始使用

### 方法 1：本地部署（推荐）
1. 克隆本项目到本地

    git clone https://github.com/HiveNexus/a2a-chat.git

2. 安装依赖库

```
cd a2a-chat
npm install
```

3. 启动程序

```
//测试开发
npm run dev
//正式启动
npm run build
npm run start
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看。

### 方法 2：Docker 部署
因为目前几乎没有公开的基于 A2A 的服务，不建议使用 Docker 或公网部署。Google 提供的官方示例基本只能本地运行，只有通过本地 127.0.0.1 或局域网访问，所以更推荐方法 1。

```bash
# 拉取镜像

docker run -d --name a2a-chat hivenexus/a2a-chat:latest
```

在浏览器中打开 http://localhost:3000 查看。