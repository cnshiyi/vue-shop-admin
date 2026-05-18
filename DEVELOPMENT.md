# Shop 管理前端开发说明与方向

## 项目定位

`vue-shop-admin` 是 `shop` 项目的管理后台前端，基于 `vue-vben-admin` 二次改造。

当前只把 `apps/web-antd` 当作活跃业务前端；其他示例、mock、playground 与官方 docs 包已移除，不作为主线开发入口。

## 技术栈

- Vue 3
- Vite
- TypeScript
- Ant Design Vue
- Vben Admin 组件体系
- pnpm workspace / turbo

## 本地开发

```bash
pnpm install
pnpm dev:antd
```

默认联调：

- 前端：`http://127.0.0.1:5666`
- 后端：`http://127.0.0.1:8000`

后端仓库：

```text
/Users/a399/Desktop/shop/shop
```

常用验证：

```bash
pnpm turbo run typecheck --filter=@vben/web-antd
```

提交前通常会触发 `lefthook`，commit message 使用常规格式，例如：

```text
fix: clarify TOTP binding hint
feat: add dashboard cloud management UI
```

## 关键目录

```text
apps/web-antd/src/api/admin.ts                         # 后台业务 API 类型与请求
apps/web-antd/src/api/core/auth.ts                     # 登录/刷新/退出 API
apps/web-antd/src/api/core/menu.ts                     # 菜单 API 适配
apps/web-antd/src/api/request.ts                       # 请求拦截、token、错误处理
apps/web-antd/src/router/routes/modules/admin.ts       # 后台主业务路由
apps/web-antd/src/router/routes/modules/dashboard.ts   # 旧路由重定向与 dashboard 路由
apps/web-antd/src/store/auth.ts                        # 登录态与用户信息
apps/web-antd/src/views/_core/authentication/login.vue # 登录页
apps/web-antd/src/views/dashboard/                     # 业务页面
```

## 后端接口约定

后端接口主要来自 `/api/admin/` 与 `/api/dashboard/`。

请求层已经按后端统一响应格式处理：

```json
{
  "code": 0,
  "data": {},
  "message": ""
}
```

新增页面时至少同步三处：

1. `apps/web-antd/src/api/admin.ts` 增加类型和 API
2. `apps/web-antd/src/router/routes/modules/admin.ts` 增加路由
3. `apps/web-antd/src/views/dashboard/...` 增加页面组件

如果后端菜单返回组件名，前端要使用稳定映射，不依赖构建后不稳定的懒加载函数字符串。

## 登录与认证

当前后台登录目标态：

- 账号密码
- Google Authenticator 6 位 TOTP
- 滑动验证
- 后端 Django session 2 小时有效期

注意事项：

- 不再保留 GitHub OAuth 登录入口
- 登录页必须先完成滑动验证，否则提示 `请先完成滑动验证`
- TOTP 不能手填普通配置保存，必须走系统设置里的二维码绑定流程
- 后端未绑定 TOTP 时允许账号密码登录，避免锁死后台
- 绑定后登录必须带 `otp_token` / `otpToken`

## 系统设置与敏感字段

系统设置页位于：

```text
apps/web-antd/src/views/dashboard/settings/components/site-config-group.vue
```

敏感字段规则：

- 后端只返回脱敏预览
- 输入框聚焦后清空才代表要输入新值
- 留空保存必须带 `preserve_existing=true`，不能覆盖旧密钥
- `dashboard_totp_secret` 不作为普通输入项展示，只显示绑定状态和二维码绑定卡片

## 云资产页面规则

云资产主页面：

```text
apps/web-antd/src/views/dashboard/cloud-assets/index.vue
apps/web-antd/src/views/dashboard/cloud-assets/detail.vue
```

当前业务语义：

- 代理资产以 `CloudAsset` 为主
- `CloudAsset.user` 是资产绑定用户，可人工修改
- `CloudAsset.actual_expires_at` 是资产到期时间，可人工修改
- 即使关联订单，也不能用订单用户/订单到期覆盖资产字段
- 后台列表过滤 `deleted/terminated` 等云上已不存在资产
- 空到期显示 `-`，不要显示“今天到期”
- 过期状态显示 `已过期 N 天`

删除操作：

- 删除接口应一次生效
- 如果前端路径传的是 `/servers/{id}/delete/`，后端兼容资产 ID，但前端新功能优先使用资产接口
- 删除后要刷新列表，避免旧行残留造成误解

## 路由规则

当前首页统一为：

```text
/admin/analytics
```

旧路由必须重定向：

```text
/workspace -> /admin/analytics
/analytics -> /admin/analytics
```

后端 `/user/info` 的 `homePath` 也应返回 `/admin/analytics`。

## 开发方向

### P0：后台操作可靠

- 删除、保存、同步、绑定用户、修改到期时间都要有清晰成功/失败反馈
- 表格刷新要跟操作结果一致，不依赖用户手动刷新
- 敏感配置不能因为空输入被误覆盖

### P1：云资产体验

- 代理列表继续强化筛选、排序和状态解释
- 到期、绑定用户、云账号、来源、区域、同步状态要展示清楚
- 手工修改资产字段后，页面要避免暗示这些字段来自订单

### P2：认证体验

- TOTP 绑定流程保持简单：生成二维码、扫码、输入动态码、完成绑定
- 登录页错误提示要明确区分：密码错误、动态码错误、滑块未通过、会话过期
- 2 小时过期后沿用现有 401 流程回登录页

### P3：联调与迁移

- 新页面优先对接后端当前真实 API，不再绑定旧兼容口径
- README 和本文件只描述业务仓库，不恢复官方模板项目说明
- 后续可补一个“后端健康检查”面板，显示 bot 是否在线、最近同步时间、私钥/公钥候选数量、云账号状态
