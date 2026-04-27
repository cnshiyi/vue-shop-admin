# Shop 管理前端

这是主人当前在用的 **Shop 管理后台前端仓库**，不是官方 `vue-vben-admin` 原仓库。

## 仓库定位

- 当前业务仓库：`origin`
- 官方上游仓库：`upstream`
- 当前代码基于 `vue-vben-admin` 二次改造，已经接入本地 `shop` Django 后端
- 这里优先服务当前业务，不再把 README、仓库元信息伪装成官方项目

## Git 约定

```bash
git remote -v
```

应看到两类远端：

- `origin` → 你的业务仓库：`https://github.com/cnshiyi/vue-shop-admin.git`
- `upstream` → 官方仓库：`https://github.com/vbenjs/vue-vben-admin.git`

### 日常操作

推送自己的改动：

```bash
git push origin main
```

查看官方更新：

```bash
git fetch upstream
```

按需合并官方更新时，先评估业务改动冲突，不要机械同步。

## 开发说明

- 详细开发说明与后续方向见 `DEVELOPMENT.md`

## 本地开发

### 环境要求

- Node.js：`^20.19.0 || ^22.18.0 || ^24.0.0`
- pnpm：`>=10`

### 安装依赖

```bash
pnpm install
```

### 启动前端

```bash
pnpm dev:antd
```

默认开发地址：

- 前端：`http://127.0.0.1:5666`
- 后端：`http://127.0.0.1:8000`

当前开发代理已经对接本地 Django，不走 mock。

当前活跃工作区只保留 `apps/web-antd`。其他演示前端、mock 与 playground 已归档到 `archive/frontend-extras/`，仅保留参考与备份，不再作为日常业务工作区包参与运行。

## 业务说明

这个仓库承接的是 `shop` 项目的管理后台，不是模板演示站。当前已包含并持续维护的业务改造主要有：

- 云套餐列表管理
- 配置同步（同步云厂商在售主规格到后端 `ServerPrice`）
- IP 生命周期日志页
- 云套餐新增/编辑分步选择交互
- 与 `shop` 后端接口的联调适配

### 重要语义

- `配置同步`：同步云厂商在售可售主规格/价格模板到后端价格表
- `套餐列表`：人工维护的业务套餐，不由同步直接覆盖

## 目录关注点

当前主要工作目录：

- `apps/web-antd/src/views/dashboard/`：后台业务页面
- `apps/web-antd/src/api/admin.ts`：后台接口定义
- `apps/web-antd/src/router/routes/modules/admin.ts`：后台路由配置
- `apps/web-antd/.env.development`：本地开发环境配置
- `apps/web-antd/vite.config.ts`：本地代理配置
- `archive/frontend-extras/`：归档保存的非主线前端与 playground

## 与后端联调

后端仓库位于：

- `/Users/aaaa/Desktop/shop`

常见联调检查：

1. 后端是否启动在 `8000`
2. 前端 `.env.development` 是否指向本地 Django
3. 新增后台页面后，是否同步更新 `admin.ts` 和路由配置
4. 如接口已迁移，优先对接新的领域 API 行为，不继续绑定旧兼容实现

## 文档原则

从现在开始：

- README 以当前业务项目为准
- 官方模板信息只作为“上游来源”说明
- 业务自定义改动、运行方式、联调方法优先写清楚

## 上游来源

本项目基于以下官方仓库演进：

- `https://github.com/vbenjs/vue-vben-admin`

感谢原项目提供的基础框架能力。当前仓库与官方仓库已经分离维护。
