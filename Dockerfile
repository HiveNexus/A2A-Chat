# 使用构建参数来配置 npm 镜像
ARG NPM_REGISTRY=https://registry.npmjs.org/

# 依赖构建阶段
FROM node:22-alpine AS deps
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./

# 配置 npm 镜像并安装依赖
RUN if [ "$NPM_REGISTRY" != "https://registry.npmjs.org/" ]; then \
    npm config set registry $NPM_REGISTRY; \
    fi && \
    npm ci

# 构建阶段
FROM node:22-alpine AS builder
WORKDIR /app

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV IS_DOCKER=true

# 复制依赖和源代码
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
RUN npm run build

# 运行阶段（最终镜像）
FROM node:22-alpine AS runner
WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 设置环境变量
ENV NODE_ENV=production
ENV IS_DOCKER=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 安装必要的工具
RUN apk add --no-cache bash curl

# 设置目录权限
RUN chown -R nextjs:nodejs /app

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 入口命令
CMD ["node", "server.js"]