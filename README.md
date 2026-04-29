# Shop Admin Frontend

This repository is the **custom frontend for the Shop admin project**, not the official `vue-vben-admin` repository.

## Repository Role

- Business repo: `origin`
- Official upstream: `upstream`
- Codebase started from `vue-vben-admin`, but is now maintained for the `shop` Django backend
- Project docs and metadata now describe this repo itself instead of pretending to be the upstream project

## Git Remotes

```bash
git remote -v
```

Expected remotes:

- `origin` → `https://github.com/cnshiyi/vue-shop-admin.git`
- `upstream` → `https://github.com/vbenjs/vue-vben-admin.git`

### Daily Workflow

Push your own work:

```bash
git push origin main
```

Fetch official updates when needed:

```bash
git fetch upstream
```

Do not blindly merge upstream changes without checking conflicts against business customizations.

## 开发说明

- 详细开发笔记和路线图在 `DEVELOPMENT.md`

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

默认本地地址：

- 前端：`http://127.0.0.1:5666`
- 后端：`http://127.0.0.1:8000`

开发代理已经指向本地 Django 后端，不再走 mock 服务。

## 构建与部署

### 实现关系

后台管理前端和 Django 后端是前后端分离部署：

- 前端仓库：`/Users/aaaa/Desktop/vue-shop-admin`
- 前端应用：`/Users/aaaa/Desktop/vue-shop-admin/apps/web-antd`
- 后端仓库：`/Users/aaaa/Desktop/shop`
- 前端构建产物：`/Users/aaaa/Desktop/vue-shop-admin/apps/web-antd/dist`
- 服务器前端目录：`/www/wwwroot/shop-admin`
- 服务器后端目录：`/www/wwwroot/shop`
- Django 后端只监听内网：`127.0.0.1:8000`
- Nginx 对外提供网站：`/` 访问前端静态文件，`/api/` 反代到 Django 后端

前端代码不直接写死生产服务器地址。生产环境使用同源 `/api`：

- 前端页面地址：`http://web.1213.cc/`
- 浏览器请求接口：`http://web.1213.cc/api/...`
- Nginx 转发后端：`http://127.0.0.1:8000/api/...`

对应配置文件：

- 开发环境：`apps/web-antd/.env.development`
- 生产环境：`apps/web-antd/.env.production`
- Vite 代理：`apps/web-antd/vite.config.ts`
- 接口封装：`apps/web-antd/src/api/request.ts`
- 后台业务接口定义：`apps/web-antd/src/api/admin.ts`

生产环境关键配置应保持：

```env
VITE_BASE=/
VITE_GLOB_API_URL=/api
VITE_ROUTER_HISTORY=hash
```

### 首次初始化

首次拉取或依赖损坏时执行：

```bash
cd /Users/aaaa/Desktop/vue-shop-admin
pnpm install
```

如果依赖出现异常，可以重新安装：

```bash
cd /Users/aaaa/Desktop/vue-shop-admin
pnpm install --force
```

### 本地开发启动

启动前端开发服务器：

```bash
cd /Users/aaaa/Desktop/vue-shop-admin
pnpm dev:antd
```

默认地址：

- 前端：`http://127.0.0.1:5666`
- 后端：`http://127.0.0.1:8000`

本地开发时，浏览器仍然请求 `/api/...`，由 Vite dev server 代理到本地 Django。后端需要另行启动：

```bash
cd /Users/aaaa/Desktop/shop
python run.py web
```

如果要同时启动 bot/scanner 等后台任务，使用后端项目自己的启动方式，不在前端仓库启动。

### 生产构建

每次修改前端页面、路由、接口封装、菜单、样式后，都需要重新构建：

```bash
cd /Users/aaaa/Desktop/vue-shop-admin
pnpm -F @vben/web-antd run build
```

构建成功后会生成：

- 目录：`/Users/aaaa/Desktop/vue-shop-admin/apps/web-antd/dist`
- 压缩包：`/Users/aaaa/Desktop/vue-shop-admin/apps/web-antd/dist.zip`

实际部署使用 `dist/` 目录内容，不直接部署源码。

### 部署到 AWS 生产服务器

当前生产目标：

- 域名：`web.1213.cc`
- 服务器：`51.44.61.44`
- SSH 用户：`admin`
- SSH 密钥：`/Users/aaaa/Desktop/shop/.shop-secrets/lightsail/LightsailDefaultKey-ap-southeast-1.pem`
- 前端目录：`/www/wwwroot/shop-admin`
- 后端目录：`/www/wwwroot/shop`
- 后端服务：`shop-web.service`
- Web 服务：系统 `nginx`

部署流程：先本地构建，再打包 `dist/`，上传到服务器，覆盖 `/www/wwwroot/shop-admin`，最后 reload Nginx。

```bash
cd /Users/aaaa/Desktop/vue-shop-admin
pnpm -F @vben/web-antd run build

cd /Users/aaaa/Desktop/vue-shop-admin/apps/web-antd/dist
tar -czf /tmp/shop-admin-dist.tgz .

scp -i /Users/aaaa/Desktop/shop/.shop-secrets/lightsail/LightsailDefaultKey-ap-southeast-1.pem \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/tmp/openclaw_known_hosts \
  /tmp/shop-admin-dist.tgz admin@51.44.61.44:/tmp/

ssh -i /Users/aaaa/Desktop/shop/.shop-secrets/lightsail/LightsailDefaultKey-ap-southeast-1.pem \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/tmp/openclaw_known_hosts \
  admin@51.44.61.44 \
  'sudo bash -lc "
    set -e
    rm -rf /www/wwwroot/shop-admin/*
    tar -xzf /tmp/shop-admin-dist.tgz -C /www/wwwroot/shop-admin
    chown -R www-data:www-data /www/wwwroot/shop-admin
    nginx -t
    systemctl reload nginx
  "'
```

如果本次同时修改了 Django 后端代码，前端部署完成后还需要单独同步后端代码、跑迁移并重启：

```bash
ssh -i /Users/aaaa/Desktop/shop/.shop-secrets/lightsail/LightsailDefaultKey-ap-southeast-1.pem \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/tmp/openclaw_known_hosts \
  admin@51.44.61.44 \
  'sudo systemctl restart shop-web.service && sudo systemctl is-active shop-web.service'
```

### AWS 生产 Nginx 实现

生产服务器上的 Nginx 核心逻辑应保持如下结构：

```nginx
server {
    listen 80;
    server_name web.1213.cc 51.44.61.44;
    root /www/wwwroot/shop-admin;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /www/wwwroot/shop/static/;
    }

    location /media/ {
        alias /www/wwwroot/shop/media/;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

实际配置文件位置：

- AWS：`/etc/nginx/sites-available/web.1213.cc`
- AWS 启用链接：`/etc/nginx/sites-enabled/web.1213.cc`

### 部署到本地 OrbStack 宝塔服务器

当前本地目标：

- VM：`shop-bt`
- 地址：`http://192.168.139.235/`
- 前端目录：`/www/wwwroot/shop-admin`
- 后端目录：`/www/wwwroot/shop`
- 后端服务：`shop-web.service`

部署流程同样是先构建，再把 `dist/` 内容解压到宝塔站点目录：

```bash
cd /Users/aaaa/Desktop/vue-shop-admin
pnpm -F @vben/web-antd run build

cd /Users/aaaa/Desktop/vue-shop-admin/apps/web-antd/dist
tar -czf /tmp/shop-admin-dist.tgz .

orbctl -m shop-bt sudo bash -lc 'rm -rf /www/wwwroot/shop-admin/*'
cat /tmp/shop-admin-dist.tgz | orbctl -m shop-bt sudo tar -xzf - -C /www/wwwroot/shop-admin
orbctl -m shop-bt sudo chown -R www:www /www/wwwroot/shop-admin
orbctl -m shop-bt sudo nginx -t
orbctl -m shop-bt sudo systemctl reload nginx
```

本地宝塔 Nginx 也是同样的前后端分离结构：

- `/`：读取 `/www/wwwroot/shop-admin/index.html`
- `/api/`：反代到 `127.0.0.1:8000/api/`
- `/static/`：读取后端静态文件
- `/media/`：读取后端媒体文件

### 验证部署

生产验证：

```bash
curl -I http://web.1213.cc/
curl -sS http://web.1213.cc/ | grep -o '<title>[^<]*' | head -1
curl -sS http://web.1213.cc/api/csrf/
```

期望结果：

- 首页 HTTP 状态是 `200`
- 标题包含 `Vben Admin Antd`
- `/api/csrf/` 返回 `{"code":0,...}`

本地验证：

```bash
curl -I http://192.168.139.235/
curl -sS http://192.168.139.235/ | grep -o '<title>[^<]*' | head -1
curl -sS http://192.168.139.235/api/csrf/
```

### 常见改动对应操作

- 只改 Vue 页面、样式、路由、前端 API 封装：重新 build 并部署 `dist/`
- 只改 Django 后端接口：同步后端代码，必要时 migrate，重启 `shop-web.service`
- 同时改前后端接口：先部署后端并确认 API 正常，再 build/deploy 前端
- 修改 `.env.production`：必须重新 build 前端才会生效
- 修改 Nginx：执行 `nginx -t` 通过后再 `systemctl reload nginx`

当前活跃工作区只保留 `apps/web-antd`。其它演示前端、mock、playground 项目保存在 `archive/frontend-extras/`，不再作为当前业务应用维护。

## 业务范围

这个仓库是 `shop` 项目的后台管理前端，当前包含这些业务定制：

- 云套餐管理
- 价格/配置同步页面
- 云 IP 生命周期日志页面
- 分阶段套餐选择流程
- 对接 `shop` 后端 API 的业务改造

### 重要语义

- “配置同步”只把云厂商可售主规格/价格模板同步到后端价格记录
- “套餐列表”是业务侧人工维护的数据，不能被同步任务覆盖

## 关键路径

- `apps/web-antd/src/views/dashboard/`
- `apps/web-antd/src/api/admin.ts`
- `apps/web-antd/src/router/routes/modules/admin.ts`
- `apps/web-antd/.env.development`
- `apps/web-antd/vite.config.ts`
- `archive/frontend-extras/`：仅保留归档的非主应用作参考

## 后端配套

后端仓库：

- `/Users/aaaa/Desktop/shop`

常规联调检查：

1. 后端运行在 `8000`
2. 前端环境指向本地 Django
3. 新增 API 时同步更新路由配置和 `admin.ts`
4. 新页面按当前业务 API 行为实现，不依赖旧兼容路径

## 上游来源

本项目基于：

- `https://github.com/vbenjs/vue-vben-admin`

感谢上游项目；当前仓库已经作为 `shop` 业务前端独立维护。
