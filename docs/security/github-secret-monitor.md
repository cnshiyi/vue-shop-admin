# GitHub 泄露监控脚本

脚本位置：`scripts/github-secret-monitor.mjs`

## 用途

在自己拥有或明确授权的 GitHub `repo` / `org` / `user` 范围内扫描疑似密钥泄露风险。

它不会输出完整密钥，只输出脱敏预览、文件位置、命中规则和 GitHub 链接。

## 使用

先准备一个只用于安全巡检的 GitHub token，建议只授予读取代码所需的最小权限。

```bash
export GITHUB_TOKEN=ghp_xxx
```

扫描单个仓库：

```bash
pnpm security:github -- --repo owner/name
```

扫描组织：

```bash
pnpm security:github -- --org my-org --since 2026-05-01
```

输出 JSON：

```bash
pnpm security:github -- --repo owner/name --json
```

追加自定义搜索词：

```bash
pnpm security:github -- --repo owner/name --query '"MY_SERVICE_TOKEN"'
```

## 安全边界

- 必须指定 `--repo`、`--org` 或 `--user`。
- 只用于授权资产巡检。
- 不收集、不验证、不使用他人的公开泄露密钥。
- 命中内容始终脱敏。

## 退出码

- `0`：未发现疑似泄露。
- `1`：发现疑似泄露。
- `2`：参数、鉴权或 GitHub API 错误。

