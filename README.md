# 活动管理系统 Demo

一个面向活动组织场景的管理系统示例项目，覆盖活动创建、参与者管理、活动日程安排，以及基于 AI 的活动海报生成。项目采用前后端分离架构，适合作为活动类产品原型、课程作业、全栈项目演示或二次开发基础。

## 项目地址

- 代码仓库：https://github.com/am-david-jiang/activity-management-system-demo
- 在线演示：https://activity-management-system-eta.vercel.app/

## 项目描述

活动管理系统 Demo 旨在模拟一个中小型活动组织者在日常运营中的核心工作流：创建活动、维护参与者信息、为活动配置日程，并在活动宣传阶段快速生成海报素材。

从产品视角看，这不是单一的“后台管理页面集合”，而是一个围绕活动全生命周期搭建的基础管理工具：

- 在活动筹备阶段，运营人员可以创建活动并维护报名相关时间信息。
- 在执行阶段，可以统一管理参与者档案，并将参与者分配到具体活动中。
- 在落地阶段，可以为活动维护详细日程，支撑现场执行与协同。
- 在传播阶段，可以通过 AI 输入需求，生成活动宣传海报，并实时查看生成过程与结果。

该项目当前以 Demo 形式呈现，重点展示的是完整业务链路和可操作体验，而不是面向生产环境的复杂权限、审计或多组织能力。

## 项目功能

### 1. 用户认证

- 支持用户注册、登录、登出和令牌刷新
- 支持受保护页面访问控制

### 2. 活动管理

- 支持创建活动
- 支持编辑、结束、删除活动
- 支持查看活动开始时间、结束时间、报名截止时间和状态

### 3. 参与者管理

- 支持新增、编辑、删除参与者
- 支持分页查看参与者信息
- 支持维护邮箱、手机号、微信号、QQ 号等基础资料

### 4. 活动参与者管理

- 支持为活动添加参与者
- 支持查看某个活动下的参与者列表
- 支持管理参与者与活动之间的关联关系

### 5. 活动日程安排

- 支持按活动维度维护日程
- 支持新增、编辑、删除活动事件
- 支持配置时间、地点、标题、描述等信息

### 6. AI 活动海报生成

- 支持选择活动并输入海报需求
- 支持通过 WebSocket 实时查看生成进度
- 支持在生成结果基础上继续提出修改意见
- 支持将活动管理能力与 AI 内容生成能力结合，形成更完整的产品体验

## 典型使用流程

1. 用户注册并登录系统。
2. 在“活动管理”中创建新的活动，并填写关键日期信息。
3. 在“参与者管理”中录入或维护参与者资料。
4. 在“活动参与者管理”中将参与者关联到目标活动。
5. 在“活动日程安排”中补充执行层面的事件安排。
6. 在“创建活动海报”页面输入宣传需求，等待 AI 生成海报，并按需追加修改意见。

## 核心页面

- 登录 / 注册：完成用户身份认证
- 活动管理：维护活动基础信息与状态
- 参与者管理：统一维护参与者档案
- 活动参与者管理：完成活动与参与者之间的绑定
- 活动日程安排：管理活动执行过程中的具体事件
- AI 海报生成：输入创意需求并查看实时生成结果

## 项目截图

当前仓库暂未包含正式的产品界面截图，README 先保留截图版块作为占位。后续建议补充以下页面截图：

- 登录页
![login page](_images/login.png)
- 活动管理页
![activity management page](_images/activity_management.png)
- 参与者管理页
![participants management page](_images/participant_management.png)
- 活动日程安排页
![activity schedule page](_images/activity_schedule.png)
- AI 海报生成页
![poster generation page 1](_images/poster_generation_1.png)
![poster generation page 2](_images/poster_generation_2.png)

## 技术架构

### 前端

- Next.js 16
- React 19
- TanStack React Query
- TanStack Form
- TanStack Table
- shadcn/ui + Radix UI
- Socket.IO Client

### 后端

- NestJS 11
- TypeORM
- MySQL
- JWT + Passport
- LangChain / LangGraph
- Socket.IO

## 项目结构

```text
.
├── backend/   # NestJS API、鉴权、数据库访问、AI 海报生成工作流
└── frontend/  # Next.js 前端页面、业务交互、WebSocket 客户端
```

## 本地运行

### 1. 安装依赖

```bash
cd backend && pnpm install
cd ../frontend && pnpm install
```

### 2. 配置 MySQL 数据库

后端当前使用 MySQL 作为唯一数据库方案，TypeORM 配置默认字符集为 `utf8mb4`，并通过迁移维护表结构，不启用 `synchronize`。

可在 `backend/.env` 中使用连接串方式：

```env
PORT=3000
DATABASE_URL=mysql://root:password@127.0.0.1:3306/activity_management_system
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
GOOGLE_API_KEY=your_google_api_key
```

也可以使用分项配置：

```env
PORT=3000
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=activity_management_system
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
GOOGLE_API_KEY=your_google_api_key
```

### 3. 配置前端环境变量

前端当前通过 `frontend/next.config.ts` 注入公开环境变量，默认指向线上服务：

```ts
env: {
  NEXT_PUBLIC_API_BASE: "https://davidjiang.tech/ams-demo/api/",
  NEXT_PUBLIC_WS_URL: "wss://davidjiang.tech",
}
```

如果需要本地联调本地后端，可改为：

```env
NEXT_PUBLIC_API_BASE=http://localhost:3000/api/
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

### 4. 启动数据库迁移

```bash
cd backend
pnpm run migration:run
```

### 5. 启动后端服务

```bash
cd backend
pnpm run start:dev
```

默认地址：`http://localhost:3000`

### 6. 启动前端服务

```bash
cd frontend
pnpm dev
```

前端默认运行在 `http://localhost:3000`，如端口被占用会由 Next.js 自动分配可用端口。若本地前后端同时运行，通常需要根据实际端口同步调整前端环境变量。

## 常用命令

### 后端

```bash
pnpm run start:dev
pnpm run build
pnpm run test
pnpm run test:e2e
pnpm run migration:run
```

### 前端

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm storybook
```
