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

- `origin` → `https://github.com/cnshiyi/vue-vben-admin-main.git`
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

## Local Development

### Requirements

- Node.js: `^20.19.0 || ^22.18.0 || ^24.0.0`
- pnpm: `>=10`

### Install

```bash
pnpm install
```

### Start frontend

```bash
pnpm dev:antd
```

Default local endpoints:

- Frontend: `http://127.0.0.1:5666`
- Backend: `http://127.0.0.1:8000`

The dev proxy is already wired to the local Django backend instead of mock services.

## Business Scope

This repo contains the admin frontend for the `shop` project. It currently includes business-specific work such as:

- cloud plan management
- pricing/config sync page
- cloud IP lifecycle logs page
- staged plan selection workflow
- backend integration changes for the `shop` APIs

### Important Semantics

- `Config Sync` syncs vendor sellable primary specs/pricing templates into backend pricing records
- `Plan List` is business-managed manually and must not be overwritten by sync

## Key Paths

- `apps/web-antd/src/views/dashboard/`
- `apps/web-antd/src/api/admin.ts`
- `apps/web-antd/src/router/routes/modules/admin.ts`
- `apps/web-antd/.env.development`
- `apps/web-antd/vite.config.ts`

## Backend Pairing

Backend repository:

- `/Users/aaaa/Desktop/shop`

Typical integration checks:

1. backend is running on `8000`
2. frontend env points to local Django
3. API additions update both route config and `admin.ts`
4. new pages follow current domain API behavior instead of depending on legacy compatibility paths

## Upstream Source

This project is based on:

- `https://github.com/vbenjs/vue-vben-admin`

Huge thanks to the upstream project. This repository is now maintained separately for project-specific work.
