# 活动管理系统后端

基于 NestJS 11、TypeORM 和 MySQL 的活动管理系统后端服务，提供用户、认证、活动、事件、参与人以及 AI 海报生成能力。

## 项目简介

该项目是一个 REST API + WebSocket 混合后端，主要用于支撑活动管理场景，包括：

- 用户注册、登录、登出、刷新令牌
- 基于 JWT 的身份认证
- 基于角色的权限控制
- 活动、活动事件、参与人管理
- 健康检查接口
- 基于 LangChain / LangGraph 的活动海报生成与修改

服务启动后，统一使用 `/api` 作为全局接口前缀，例如：

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/activities`

## 技术栈

- NestJS 11
- TypeORM 0.3
- MySQL
- Passport JWT
- class-validator / class-transformer
- Socket.IO
- LangChain / LangGraph
- Google 图像模型接口

## 功能模块

### 1. 认证模块 `auth`

提供用户认证相关能力：

- `POST /api/auth/register` 用户注册
- `POST /api/auth/login` 用户登录
- `POST /api/auth/logout` 用户登出
- `POST /api/auth/refresh` 刷新访问令牌

认证基于 JWT 实现，项目中同时使用访问令牌和刷新令牌。

### 2. 用户模块 `user`

提供用户管理能力，主要由管理员角色使用：

- `GET /api/users` 查询用户列表
- `GET /api/users/:id` 查询单个用户
- `PATCH /api/users/:id` 更新用户
- `DELETE /api/users/:id` 删除用户

该模块启用了 `JwtAuthGuard` 和 `RolesGuard`，并通过 `@Roles()` 做角色限制。

### 3. 活动模块 `activity`

提供活动及其关联资源管理：

- `POST /api/activities` 创建活动
- `GET /api/activities` 查询全部活动
- `GET /api/activities/active` 查询进行中的活动
- `GET /api/activities/:id` 查询活动详情
- `PATCH /api/activities/:id` 更新活动
- `POST /api/activities/:id/finish` 结束活动
- `DELETE /api/activities/:id` 删除活动
- `GET /api/activities/:id/participants` 查询活动参与人
- `POST /api/activities/:id/participants/:userId` 将用户加入活动

#### 活动事件

- `POST /api/activities/:activityId/events`
- `GET /api/activities/:activityId/events`
- `GET /api/activities/:activityId/events/:eventId`
- `PATCH /api/activities/:activityId/events/:eventId`
- `DELETE /api/activities/:activityId/events/:eventId`

#### 参与人管理

- `POST /api/participants`
- `GET /api/participants`
- `GET /api/participants/search`
- `GET /api/participants/:user_id`
- `PATCH /api/participants/:user_id`
- `DELETE /api/participants/:user_id`

### 4. 健康检查模块 `health`

提供基础健康检查接口：

- `GET /api/health`
- `GET /api/health/live`
- `GET /api/health/ready`

### 5. 海报生成模块 `poster-gen`

该模块通过 WebSocket 提供 AI 海报生成与修改能力，命名空间为 `/poster-gen`。

支持事件：

- `generate`：根据活动信息和用户需求生成海报
- `revise`：基于已有结果进行二次修改

服务端会返回过程消息，例如：

- `tool_call`
- `generating`
- `success`
- `success_buffer`
- `error`

## 海报生成 Agent 架构

海报生成能力由三层协作完成：

- `PosterGenGateway` 负责 WebSocket 连接、事件接收和消息回传
- `PosterGenService` 负责会话管理、状态同步、日志落库和 Agent 调度
- `poster-gen/agents` 负责需求提取、创意规划、提示词构建和图片生成

生成链路与修改链路共享同一套编排状态，只是在起始步骤上不同：

- 首次生成：`requirements -> concept -> prompt -> image -> completed`
- 二次修改：`revision -> prompt -> image -> completed`

```mermaid
flowchart TD
    A[Frontend Poster Page] -->|WebSocket /poster-gen generate| B[PosterGenGateway]
    A -->|WebSocket /poster-gen revise| B
    B --> C[PosterGenService]
    C --> D[Session State Map]
    C --> E[LangGraph MemorySaver]
    C --> F[(PosterGenerationLog Repository)]
    C --> G[Orchestrator Agent]

    G --> H[requirement_extractor]
    H --> I[ActivityService]

    G --> J[concept_planner]
    G --> K[revision_planner]
    G --> L[prompt_builder]
    G --> M[generate_image_nano_banana]

    M --> N[Google Image Model]

    H --> G
    J --> G
    K --> G
    L --> G
    M --> G

    G --> C
    C -->|tool_call / generating / success / error| B
    B -->|WebSocket events| A
```

读图说明：

- 前端通过 `/poster-gen` 命名空间发送 `generate` 或 `revise` 事件。
- `PosterGenGateway` 将请求交给 `PosterGenService`，后者初始化或复用会话状态，并驱动编排 Agent。
- `requirement_extractor` 会结合 `ActivityService` 拉取的活动信息与用户输入，生成结构化海报需求。
- `concept_planner` 与 `revision_planner` 分别负责首次生成和二次修改时的创意方向规划。
- `prompt_builder` 负责把结构化需求和创意方向转成最终出图提示词。
- `generate_image_nano_banana` 调用 Google 图像模型生成海报图片，并将结果回写到编排状态。
- 服务层会向客户端持续回传工具调用、生成进度、最终结果或错误信息，并记录海报生成日志。

### Agent 职责拆分

- `requirement_extractor`
  - 输入活动 ID 与用户需求
  - 读取最新活动信息
  - 输出结构化海报需求数据
- `concept_planner`
  - 基于结构化需求生成最佳海报创意方向
- `revision_planner`
  - 基于上一轮创意方向、上一轮图片和本轮修改意见生成新方向
- `prompt_builder`
  - 生成最终图像提示词
  - 修改场景下保留上一轮已确认的构图与视觉主体
- `generate_image_nano_banana`
  - 调用 Google 图像模型生成或编辑海报
  - 根据海报尺寸推断宽高比
  - 将生成文件落到本地临时目录并回传给上层

### 会话与状态管理

- 编排 Agent 使用 LangGraph `MemorySaver` 保存线程级状态。
- `PosterGenService` 维护 `sessionId -> OrchestratorState` 映射，支撑同一会话内的继续修改。
- 修改海报时会复用上一轮的：
  - `conceptDirection`
  - `imagePrompt`
  - `finalImage`
- 若会话不存在，服务端会直接返回“未找到对应会话，请先完成一次海报生成”。

## 返回格式

HTTP 接口统一通过全局响应拦截器包装为如下结构：

```json
{
  "code": 0,
  "success": true,
  "data": {},
  "message": "OK"
}
```

其中：

- `code`：业务状态码，成功时通常为 `0`
- `success`：是否成功
- `data`：实际响应数据
- `message`：响应消息

## 环境要求

- Node.js 18 及以上
- pnpm
- MySQL 8.0 及以上

如果启用 AI 海报生成，还需要可用的 Google API Key。

## 安装依赖

```bash
pnpm install
```

## 环境变量

项目通过环境变量加载配置，推荐在项目根目录创建 `.env` 文件。

### 服务端基础配置

```env
PORT=3000
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
```

### MySQL 配置

可使用连接串方式：

```env
DATABASE_URL=mysql://root:password@127.0.0.1:3306/activity_management_system
```

也可以使用分项配置：

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=activity_management_system
```

兼容变量：

```env
MYSQL_URL=mysql://root:password@127.0.0.1:3306/activity_management_system
```

说明：

- 代码会优先读取 `DATABASE_URL`，其次读取 `MYSQL_URL`。
- 未提供连接串时，会回退到 `MYSQL_HOST`、`MYSQL_PORT`、`MYSQL_USER`、`MYSQL_PASSWORD`、`MYSQL_DATABASE`。
- TypeORM 当前固定使用 MySQL 连接，字符集为 `utf8mb4`，并关闭 `synchronize`。

### AI 海报生成配置

```env
GOOGLE_API_KEY=your_google_api_key
GOOGLE_IMAGE_MODEL=gemini-2.5-flash-image
```

说明：

- `GOOGLE_API_KEY` 用于调用图像生成模型。
- `GOOGLE_IMAGE_MODEL` 可选；未配置时会使用默认候选模型。

## 启动项目

```bash
# 普通启动
pnpm run start

# 开发模式
pnpm run start:dev

# 调试模式
pnpm run start:debug

# 生产模式
pnpm run start:prod
```

默认监听端口为 `3000`。

## 常用脚本

```bash
pnpm run build            # 构建项目
pnpm run lint             # 运行 ESLint
pnpm run format           # 格式化源码
pnpm run test             # 单元测试
pnpm run test:watch       # 监听模式测试
pnpm run test:cov         # 测试覆盖率
pnpm run test:e2e         # 端到端测试
pnpm run migration:generate
pnpm run migration:run
pnpm run migration:revert
pnpm run migration:show
```

## 数据库迁移

项目已配置 TypeORM CLI，可使用以下命令管理迁移：

```bash
pnpm run migration:generate
pnpm run migration:run
pnpm run migration:revert
pnpm run migration:show
```

数据库规范说明：

- 迁移文件位于 `src/migrations/`
- 当前初始化迁移为 MySQL DDL，表、索引和外键均面向 MySQL
- 推荐本地开发数据库字符集保持为 `utf8mb4`
- 表结构变更应优先通过迁移管理，不依赖 `synchronize`

当前仓库中已包含初始化迁移文件：

- `src/migrations/1776968164041-InitialSchema.ts`

## 开发说明

### 全局行为

- 启用了全局参数校验 `ValidationPipe`
- 自动剔除未声明字段 `whitelist: true`
- 禁止额外未知字段 `forbidNonWhitelisted: true`
- 启用了全局 CORS
- 全局接口前缀为 `api`

### 实体概览

项目当前包含的主要实体：

- `User`
- `Credential`
- `Role`
- `Activity`
- `Event`
- `Participant`
- `PosterGenerationLog`

## 测试

测试文件与源码同目录放置，使用 `.spec.ts` 命名。例如：

- `src/app.controller.spec.ts`
- `src/poster-gen/agents/orchestrator.agent.spec.ts`
- `src/poster-gen/service/poster-gen.service.spec.ts`

执行测试：

```bash
pnpm run test
```

执行 E2E 测试：

```bash
pnpm run test:e2e
```

## 目录结构

```text
src/
├── activity/        # 活动、事件、参与人
├── auth/            # 登录、注册、JWT、权限控制
├── common/          # 通用拦截器与接口定义
├── database/        # TypeORM 配置
├── health/          # 健康检查
├── migrations/      # 数据库迁移
├── poster-gen/      # AI 海报生成
├── user/            # 用户管理
├── app.module.ts    # 根模块
└── main.ts          # 应用入口
```
