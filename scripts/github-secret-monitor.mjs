#!/usr/bin/env node

import { Buffer } from 'node:buffer';

const GITHUB_API = 'https://api.github.com';
const MAX_CONTENT_BYTES = 1_000_000;

const SEARCH_TERMS = [
  '"api_key"',
  '"secret_key"',
  '"access_token"',
  '"refresh_token"',
  '"private_key"',
  '"OPENAI_API_KEY"',
  '"ANTHROPIC_API_KEY"',
  '"GEMINI_API_KEY"',
  '"GOOGLE_API_KEY"',
  '"AWS_ACCESS_KEY_ID"',
  '"github_pat_"',
  '"ghp_"',
  '"sk-"',
  '"AIza"',
  '"xoxb-"',
];

const SECRET_RULES = [
  {
    name: 'OpenAI style API key',
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    name: 'GitHub token',
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
  },
  {
    name: 'AWS access key',
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    name: 'Google API key',
    pattern: /\bAIza[0-9A-Za-z_-]{20,}\b/g,
  },
  {
    name: 'Slack token',
    pattern: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g,
  },
  {
    name: 'Private key header',
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
  },
  {
    name: 'Generic secret assignment',
    pattern:
      /\b(?:api[_-]?key|secret|token|password)\b\s*[:=]\s*['"]?([A-Za-z0-9_./+=:@-]{16,})['"]?/gi,
  },
];

function parseArgs(argv) {
  const args = {
    json: false,
    maxPages: 1,
    orgs: [],
    queries: [],
    repos: [],
    users: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--') {
      continue;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--repo') {
      args.repos.push(requireValue(arg, next));
      index += 1;
    } else if (arg === '--org') {
      args.orgs.push(requireValue(arg, next));
      index += 1;
    } else if (arg === '--user') {
      args.users.push(requireValue(arg, next));
      index += 1;
    } else if (arg === '--query') {
      args.queries.push(requireValue(arg, next));
      index += 1;
    } else if (arg === '--since') {
      args.since = requireValue(arg, next);
      index += 1;
    } else if (arg === '--max-pages') {
      args.maxPages = Number.parseInt(requireValue(arg, next), 10);
      index += 1;
    } else {
      throw new Error(`未知参数：${arg}`);
    }
  }

  return args;
}

function requireValue(flag, value) {
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} 需要提供值`);
  }

  return value;
}

function validateArgs(args) {
  const hasScope =
    args.repos.length > 0 || args.orgs.length > 0 || args.users.length > 0;

  if (args.help) return;

  if (!process.env.GITHUB_TOKEN) {
    throw new Error('缺少 GITHUB_TOKEN，无法访问 GitHub Code Search API');
  }

  if (!hasScope) {
    throw new Error('必须指定至少一个授权扫描范围：--repo、--org 或 --user');
  }

  for (const repo of args.repos) {
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
      throw new Error(`无效 repo：${repo}，格式应为 owner/name`);
    }
  }

  for (const owner of [...args.orgs, ...args.users]) {
    if (!/^[A-Za-z0-9_.-]+$/.test(owner)) {
      throw new Error(`无效 owner 名称：${owner}`);
    }
  }

  if (args.since && !/^\d{4}-\d{2}-\d{2}$/.test(args.since)) {
    throw new Error('--since 格式应为 YYYY-MM-DD');
  }

  if (!Number.isInteger(args.maxPages) || args.maxPages < 1 || args.maxPages > 10) {
    throw new Error('--max-pages 必须是 1 到 10 之间的整数');
  }
}

function printHelp() {
  console.log(`GitHub 泄露监控脚本

用途：
  在授权的 GitHub repo/org/user 范围内扫描疑似密钥泄露，并只输出脱敏结果。

用法：
  GITHUB_TOKEN=ghp_xxx pnpm security:github -- --repo owner/name
  GITHUB_TOKEN=ghp_xxx pnpm security:github -- --org my-org --since 2026-05-01
  GITHUB_TOKEN=ghp_xxx pnpm security:github -- --user my-user --json

参数：
  --repo owner/name       扫描指定仓库，可重复
  --org org-name          扫描指定组织，可重复
  --user user-name        扫描指定用户，可重复
  --query "term"          追加自定义搜索词，可重复
  --since YYYY-MM-DD      仅搜索最近 push 过的仓库
  --max-pages 1           每个搜索词最多请求页数，范围 1-10
  --json                  输出 JSON
  --help                  查看帮助

退出码：
  0  未发现疑似泄露
  1  发现疑似泄露
  2  参数、鉴权或 GitHub API 错误
`);
}

function buildScopes(args) {
  return [
    ...args.repos.map((repo) => `repo:${repo}`),
    ...args.orgs.map((org) => `org:${org}`),
    ...args.users.map((user) => `user:${user}`),
  ];
}

function buildQueries(args) {
  const terms = args.queries.length > 0 ? args.queries : SEARCH_TERMS;
  const since = args.since ? ` pushed:>=${args.since}` : '';
  const scopes = buildScopes(args);
  const queries = [];

  for (const scope of scopes) {
    for (const term of terms) {
      queries.push(`${term} ${scope} in:file${since}`);
    }
  }

  return queries;
}

async function githubFetch(url, accept = 'application/vnd.github+json') {
  const response = await fetch(url, {
    headers: {
      accept,
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'user-agent': 'vue-shop-admin-secret-monitor',
      'x-github-api-version': '2022-11-28',
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 300)}`);
  }

  return response;
}

async function searchCode(query, page) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: '100',
    q: query,
  });

  const response = await githubFetch(
    `${GITHUB_API}/search/code?${params.toString()}`,
    'application/vnd.github.text-match+json',
  );

  return response.json();
}

async function fetchFileText(item) {
  const response = await githubFetch(item.url, 'application/vnd.github.raw');
  const contentLength = Number.parseInt(
    response.headers.get('content-length') || '0',
    10,
  );

  if (contentLength > MAX_CONTENT_BYTES) {
    return '';
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (contentType.includes('application/json')) {
    try {
      const payload = JSON.parse(text);
      if (payload.encoding === 'base64' && payload.content) {
        return Buffer.from(payload.content, 'base64').toString('utf8');
      }
    } catch {
      return '';
    }
  }

  return text;
}

function findSecrets(text) {
  const findings = [];
  const seen = new Set();

  for (const rule of SECRET_RULES) {
    rule.pattern.lastIndex = 0;

    for (const match of text.matchAll(rule.pattern)) {
      const secret = match[1] || match[0];
      const lineNumber = lineNumberAt(text, match.index || 0);
      const snippet = lineSnippetAt(text, match.index || 0);
      const key = `${rule.name}:${lineNumber}:${secret}`;

      if (seen.has(key)) continue;
      seen.add(key);

      findings.push({
        line: lineNumber,
        preview: maskSecret(secret),
        rule: rule.name,
        snippet: maskSnippet(snippet),
      });
    }
  }

  return findings;
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function lineSnippetAt(text, index) {
  const start = text.lastIndexOf('\n', index) + 1;
  const end = text.indexOf('\n', index);
  return text.slice(start, end === -1 ? undefined : end).trim().slice(0, 240);
}

function maskSecret(secret) {
  if (!secret) return '<masked>';
  if (secret.length <= 8) return '<masked>';

  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

function maskSnippet(snippet) {
  let masked = snippet;

  for (const rule of SECRET_RULES) {
    rule.pattern.lastIndex = 0;
    masked = masked.replace(rule.pattern, (match, captured) =>
      captured ? match.replace(captured, maskSecret(captured)) : maskSecret(match),
    );
  }

  return masked;
}

async function run(args) {
  const queries = buildQueries(args);
  const files = new Map();

  for (const query of queries) {
    for (let page = 1; page <= args.maxPages; page += 1) {
      const result = await searchCode(query, page);
      const items = result.items || [];

      for (const item of items) {
        files.set(item.url, item);
      }

      if (items.length < 100) break;
    }
  }

  const findings = [];

  for (const item of files.values()) {
    const text = await fetchFileText(item);
    if (!text) continue;

    const fileFindings = findSecrets(text);

    for (const finding of fileFindings) {
      findings.push({
        ...finding,
        htmlUrl: item.html_url,
        path: item.path,
        repository: item.repository?.full_name,
      });
    }
  }

  return findings;
}

function printFindings(findings, json) {
  if (json) {
    console.log(JSON.stringify({ count: findings.length, findings }, null, 2));
    return;
  }

  if (findings.length === 0) {
    console.log('未发现疑似密钥泄露。');
    return;
  }

  console.log(`发现 ${findings.length} 个疑似泄露命中：`);

  for (const finding of findings) {
    console.log('');
    console.log(`- 规则：${finding.rule}`);
    console.log(`  仓库：${finding.repository}`);
    console.log(`  文件：${finding.path}:${finding.line}`);
    console.log(`  预览：${finding.preview}`);
    console.log(`  片段：${finding.snippet}`);
    console.log(`  链接：${finding.htmlUrl}`);
  }
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));

    if (args.help) {
      printHelp();
      return;
    }

    validateArgs(args);
    const findings = await run(args);
    printFindings(findings, args.json);
    process.exitCode = findings.length > 0 ? 1 : 0;
  } catch (error) {
    console.error(`错误：${error.message}`);
    process.exitCode = 2;
  }
}

await main();
