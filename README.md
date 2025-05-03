# A2A Chat

这是一个基于 A2A（Agent-to-Agent） 协议的聊天应用，有以下特点：

* 数据本地存储，可以通过链接添加 Agent， 应用通过读取 Agent Card 展示 Agent 信息
* 通过对话方式使用 Agent，当前版本暂只支持发送文本
* 流式显示 Agent 的响应，支持 Artifact 的显示

关于 A2A 的详细介绍见：https://google.github.io/A2A/

## 开始使用

首先，运行开发服务器：

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看。

## 部署

部署 Next.js 应用程序的最简单方法是使用 [Vercel 平台](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)，它由 Next.js 的创建者开发。

查看 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying) 了解更多详情。
