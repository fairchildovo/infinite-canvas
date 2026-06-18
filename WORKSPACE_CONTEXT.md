# project-004-infinite-canvas

## 项目概述

无限画布（infinite-canvas）是一款面向图片创作的开源工作台。把画布编排、AI 图片生成、参考图编辑、对话助手、提示词库和素材沉淀放在同一个界面里，适合用来探索视觉方案并连续迭代图片结果。

项目来源：`https://github.com/fairchildovo/infinite-canvas`（fork 自 `basketikun/infinite-canvas`）

## 技术栈

- **前端**：Next.js App Router、React、TypeScript、Tailwind CSS、Ant Design、Zustand、TanStack Query
- **后端**：Go 1.25、Gin、GORM
- **数据库**：SQLite（默认）/ MySQL / PostgreSQL
- **部署**：Docker、docker-compose
- **画布 Agent**：MCP 集成 + HTTP 服务器（`canvas-agent/`）

## 目录结构

```text
project-004-infinite-canvas/
├── canvas-agent/       # 本地 Canvas Agent（MCP + HTTP）
├── config/             # 后端配置
├── docs/               # Fumadocs 文档站
├── docs/               # 文档（Fumadocs 站点）
├── handler/            # Gin HTTP handler
├── middleware/          # 中间件（JWT 鉴权等）
├── model/              # 数据结构、枚举
├── repository/         # GORM 数据库访问
├── router/             # 路由定义
├── service/            # 业务逻辑
├── web/                # Next.js 前端
│   └── src/
│       ├── app/        # App Router 页面
│       ├── components/ # 全局组件
│       ├── hooks/      # 全局 hooks
│       ├── services/   # API 请求
│       ├── stores/     # Zustand 状态
│       └── types/      # TypeScript 类型
├── AGENTS.md           # 项目级开发规范（Go/Next.js/画布 UI）
├── .env.example        # 环境变量模板
├── docker-compose.yml  # 生产部署
├── docker-compose.local.yml  # 本地源码构建
├── Dockerfile
├── go.mod / go.sum
└── main.go             # 后端入口
```

## 关键架构决策

- 前后端分离：前端 Next.js 3000，后端 Go 8080，前端通过 `/api` 代理请求后端。
- 数据库默认 SQLite，支持切 MySQL/Postgres。
- AI API Key 存在浏览器本地，前端直接请求 OpenAI 兼容接口。
- 画布状态和素材主要保存在浏览器本地（localforage）。
- 本地 Agent 通过 MCP 协议连接 Codex / Claude Code 操作画布。

## 项目约定

- 详细开发规范见项目根目录 `AGENTS.md`（Go + Gin + GORM 后端、Next.js + Ant Design 前端、画布 UI 规范）。
- 版本号见根目录 `VERSION`，当前 v0.3.0。
- 文档站在 `docs/`，使用 Fumadocs 构建。
- 环境变量模板 `.env.example`，部署前需复制为 `.env` 并修改敏感配置。

## 踩坑记录

（待积累）

## 当前任务与进度

- 项目刚从 GitHub 克隆并注册到 workspace SOP。
- 尚未进行本地开发环境搭建或首次运行。

## 会话备忘

- 原始仓库地址：`https://github.com/fairchildovo/infinite-canvas`
- Git remote 指向 fairchildovo 的 fork。
- Docker 快速启动：`cp .env.example .env && docker-compose up -d`
- 本地源码构建：`docker compose -f docker-compose.local.yml up -d --build`
- 默认端口 3000，管理员 admin / infinite-canvas
