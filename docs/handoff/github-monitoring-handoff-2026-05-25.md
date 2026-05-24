# GitHub 监控脚本改造交接

更新时间：2026-05-25

## 当前目标

为本项目补充一个合规的 GitHub 泄露监控脚本，用于扫描授权范围内的 GitHub 仓库、组织或用户空间，发现疑似密钥、令牌和凭证泄露风险。

重要边界：

- 只扫描自己拥有或明确授权的 `repo` / `org` / `user`。
- 不查找、收集、验证或使用他人公开泄露的密钥。
- 命中结果必须脱敏展示，不输出完整 secret。
- 脚本默认用于安全巡检、CI 或定时任务。

## 当前进度

已完成：

- 确认项目目录：`/Users/aaaa/Desktop/vue-shop-admin`
- 确认当前分支：`restore-2026-05-16`
- 确认跟踪远端：`origin/restore-2026-05-16`
- 确认远端地址：
  - `origin`: `https://github.com/cnshiyi/vue-shop-admin.git`
  - `upstream`: `https://github.com/vbenjs/vue-vben-admin.git`
- 初步检查工作区，开始写入交接上下文前工作区干净。
- 初步查看根目录 `package.json`，项目是 `type: module`，可放置无第三方依赖的 Node `.mjs` 脚本。

尚未完成：

- GitHub 监控脚本本体尚未落地。
- `package.json` 尚未添加运行命令。
- 尚未添加使用说明或示例配置。

## 计划实现

建议新增：

- `scripts/github-secret-monitor.mjs`
- `docs/handoff/github-monitoring-handoff-2026-05-25.md`
- 可选：`docs/security/github-secret-monitor.md`

建议新增 npm script：

```json
{
  "security:github": "node ./scripts/github-secret-monitor.mjs"
}
```

脚本能力：

- 支持参数：
  - `--repo owner/name`
  - `--org org-name`
  - `--user user-name`
  - `--query "custom search terms"`
  - `--since YYYY-MM-DD`
  - `--json`
  - `--max-pages 1`
- 读取 `GITHUB_TOKEN`，用于 GitHub Code Search API。
- 强制要求至少提供一个授权范围参数，避免无边界全网搜索。
- 使用 GitHub Search API 查询代码命中。
- 匹配常见风险模式：
  - OpenAI 风格 key：`sk-...`
  - GitHub token：`ghp_...` / `github_pat_...`
  - AWS access key：`AKIA...` / `ASIA...`
  - Google API key：`AIza...`
  - Slack token：`xoxb-...`
  - 私钥头：`-----BEGIN ... PRIVATE KEY-----`
  - 通用 `api_key` / `secret` / `token` 赋值模式
- 输出字段：
  - provider/rule
  - repository
  - path
  - html_url
  - masked secret preview
  - line snippet preview

安全输出要求：

- `maskSecret()` 只保留前 4 位和后 4 位，中间用 `...`。
- 对疑似完整密钥不打印原文。
- 退出码：
  - `0`: 未发现风险
  - `1`: 发现疑似泄露
  - `2`: 参数、鉴权或 API 错误

## 换电脑恢复步骤

在新电脑继续时：

```bash
git clone https://github.com/cnshiyi/vue-shop-admin.git
cd vue-shop-admin
git checkout restore-2026-05-16
git pull --ff-only origin restore-2026-05-16
pnpm install
```

查看交接上下文：

```bash
sed -n '1,240p' docs/handoff/github-monitoring-handoff-2026-05-25.md
```

继续实现时优先执行：

```bash
git status --short --branch
```

## 后续工作规则

从本交接开始，每次文件修改都按以下节奏执行：

1. 修改文件。
2. 运行必要检查。
3. `git status --short`
4. `git add <changed-files>`
5. `git commit -m "<message>"`
6. `git push origin restore-2026-05-16`

如遇到远端更新：

```bash
git pull --ff-only origin restore-2026-05-16
```

如果无法 fast-forward，不自动合并或强推，先停下来确认。

## 最近上下文摘要

用户先询问是否能在 GitHub 开源仓库寻找公开模型密钥。已明确拒绝帮助寻找或使用他人泄露密钥，并转向合法免费额度和防泄露扫描方向。

已介绍过合法免费或试用模型入口：

- Google AI Studio / Gemini API
- GroqCloud
- OpenRouter free models
- Hugging Face Inference Providers
- Mistral La Plateforme experiment/free 计划

随后用户询问是否可以构建 GitHub 监控/扫描脚本。当前方向已固定为合规防泄露监控。

## 首次自动化目标

创建一个当前线程的自动化跟进，用于定期提醒继续推进 GitHub 监控脚本，重点检查：

- 是否已实现 `scripts/github-secret-monitor.mjs`
- 是否已添加 `security:github` 命令
- 是否已提交并推送远端
- 是否保持输出脱敏和授权范围限制
