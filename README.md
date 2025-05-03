# A2A Chat

这是一个基于 A2A（[Agent-to-Agent](https://github.com/google/A2A)） 协议的聊天应用，有以下特点：

* 数据本地存储，可以通过链接添加 Agent， 应用通过读取 Agent Card 展示 Agent 信息
* 通过对话方式使用 Agent，当前版本暂只支持发送文本
* 流式显示 Agent 的响应，支持 Artifact 的显示

关于 A2A 的详细介绍见：
* https://google.github.io/A2A/
* https://github.com/google/A2A

## 概览
- **DEMO**： https://a2a-chat.vercel.app/chat
- **视频演示**：[Youtube](https://www.youtube.com/watch?v=tlvBmsueHS8)
- **截图**

![a2achat2](https://github.com/user-attachments/assets/50c973d1-8ac9-4578-94fd-80cfe03b9805)
![a2achat1](https://github.com/user-attachments/assets/d8db017f-6337-475a-820f-68b595977791)



## 开始使用

### 方法 1：本地部署（推荐）
1. 克隆本项目到本地

``` bash
git clone https://github.com/HiveNexus/a2a-chat.git
```
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
>注意： 因为目前几乎没有公开的基于 A2A 的服务，不建议使用 Vercel 或公网部署。Google 提供的官方示例基本只能本地运行，只有通过本地 127.0.0.1 或局域网访问，所以更推荐方法 1。

```bash
docker run -d --name a2a-chat -p 3000:3000 hivenexus/a2a-chat:latest
```

在浏览器中打开 http://localhost:3000 查看。

### 方法 3：Vercel 部署
>注意：因为目前几乎没有公开的基于 A2A 的服务，不建议使用 Vercel 或公网部署。Google 提供的官方示例基本只能本地运行，只有通过本地 127.0.0.1 或局域网访问，所以更推荐方法 1。

点击下面的按钮，即可开始部署。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/HiveNexus/A2A-Chat.git&project-name=a2a-chat)


### 附：
如果需要一个直接和大模型对话的 Chatbot，可以尝试我们的另一个项目：

HiveChat: https://github.com/HiveNexus/HiveChat