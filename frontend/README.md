# 活动管理系统前端

基于 `Next.js 16.2.2` 和 `React 19` 的活动管理系统前端项目，用于提供活动管理、参与者管理、日程安排和海报生成等功能界面。

前端通过 HTTP API 与后端服务通信，并通过 WebSocket 支持海报生成场景下的实时消息与结果回传。

## 功能概览

- 用户注册与登录
- 活动创建、编辑、结束与查询
- 参与者新增、编辑、删除与分页搜索
- 活动与参与者关联管理
- 活动日程管理
- 基于 WebSocket 的活动海报生成与修改

## 技术栈

- `Next.js 16.2.2`
- `React 19`
- `TypeScript`（严格模式）
- `TanStack Query`：服务端状态管理
- `TanStack Form`：表单状态与校验
- `TanStack Table`：表格展示
- `Zod`：数据结构校验
- `shadcn/ui`：基础 UI 组件
- `ky`：API 请求封装
- `date-fns`：日期处理
- `socket.io-client`：WebSocket 通信

## 项目结构

```text
.
├── app/                    # App Router 页面与布局
│   ├── (dashboard)/        # 后台页面组
│   ├── login/              # 登录页
│   └── register/           # 注册页
├── components/             # 通用组件、表单组件、业务组件
├── lib/
│   ├── api/                # API 客户端与业务接口封装
│   ├── context/            # 认证等上下文
│   ├── providers.tsx       # 全局 Provider 注入
│   └── services/           # WebSocket 等服务层能力
├── public/                 # 静态资源
└── README.md
```

当前主要页面包括：

- `/login`：登录
- `/register`：注册
- `/`：后台首页
- `/create-activity`：活动管理
- `/participants`：参与者管理
- `/activity-participants`：活动参与者关联
- `/scheduler`：活动日程安排
- `/poster-gen`：海报生成

## 环境变量

项目启动前需要配置以下环境变量：

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

说明：

- `NEXT_PUBLIC_API_BASE`：后端 API 基地址。当前前端 API 层会直接基于该地址发起请求，未配置时应用会在初始化时抛错。
- `NEXT_PUBLIC_WS_URL`：海报生成功能使用的 WebSocket 服务地址，未配置时相关模块会在加载时抛错。

建议在项目根目录创建 `.env.local`：

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

## 本地开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动开发环境

```bash
pnpm dev
```

默认访问地址：

```text
http://localhost:3000
```

### 3. 常用命令

```bash
pnpm dev               # 启动开发服务器
pnpm build             # 构建生产版本
pnpm start             # 启动生产服务
pnpm lint              # 执行 ESLint
pnpm storybook         # 启动 Storybook
pnpm build-storybook   # 构建 Storybook 静态产物
```

## 后端联调说明

该项目依赖后端服务提供认证、活动、参与者和日程相关接口。

API 层位于 `lib/api/`，当前接口封装包括：

- `auth-api.ts`：注册、登录、登出、刷新令牌
- `activity-api.ts`：活动管理与活动参与者关联
- `participant-api.ts`：参与者管理与搜索
- `event-api.ts`：活动日程管理

接口响应使用统一结构：

```ts
type ApiResponse<T> = {
  code: number;
  success: boolean;
  data: T | null;
  message: string;
};
```

认证相关行为：

- Access Token 保存在 `sessionStorage`
- Refresh Token 保存在 `localStorage`
- 部分请求在鉴权失败后会尝试刷新令牌

海报生成功能依赖独立的 WebSocket 服务端点，前端会连接到：

```text
${NEXT_PUBLIC_WS_URL}/poster-gen
```

## 开发约定

- 使用 App Router 组织页面与布局
- 使用 `@/*` 作为根路径别名
- 表单主要基于 `TanStack Form` 和 `Zod`
- 列表与表格能力基于 `TanStack Table`
- 通用 UI 组件集中在 `components/ui/`
- 业务请求统一放在 `lib/api/`，避免在页面组件中直接拼接请求

## 补充说明

- 本仓库是前端项目，不包含后端实现。
- 如果后端地址、认证方式或 WebSocket 协议发生变化，需要同步调整环境变量与 `lib/api/`、`lib/services/` 中的客户端实现。
- `Next.js 16` 存在与旧版本不同的行为和约束，修改框架相关能力前应先确认版本兼容性。
