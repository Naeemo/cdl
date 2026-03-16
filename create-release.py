#!/usr/bin/env python3
import os
import requests
import re
import subprocess

# Get token from git remote
result = subprocess.run(['git', 'remote', 'get-url', 'origin'], capture_output=True, text=True)
url = result.stdout.strip()
match = re.search(r'github_pat_([^@]+)@github.com', url)
if not match:
    print("Error: Could not extract token from git remote")
    exit(1)
token = match.group(1)

# Create release
repo = "naeemo/cdl"
api_url = f"https://api.github.com/repos/{repo}/releases"
headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github.v3+json"
}
data = {
    "tag_name": "v0.1.0",
    "target_commitish": "main",
    "name": "CDL v0.1.0 - First Public Release",
    "body": "## 🎉 CDL v0.1.0 首次公开发布\n\n### 📦 发布的 NPM 包\n- `@naeemo/cdl-compiler` v0.1.0 - CDL 编译器\n- `@naeemo/cdl-renderer-echarts` v0.1.0 - ECharts 渲染器\n- `@naeemo/cdl-cli` v0.1.0 - 命令行工具\n- `@naeemo/cdl-ai` v0.1.0 - AI 自然语言生成\n- `@naeemo/cdl-ssr` v0.1.0 - 服务端渲染\n\n### ✨ 核心特性\n- 三种语法级别（快速/Markdown、标准、高级）\n- 支持 16+ 图表类型（line, bar, pie, combo, radar...）\n- AI 友好的结构化 DSL\n- 服务端渲染导出（PNG/SVG）\n- VS Code 插件支持\n- 完整文档与 Playground\n\n### 🚀 快速开始\n```bash\nnpm install @naeemo/cdl-compiler @naeemo/cdl-renderer-echarts @naeemo/cdl-cli\n```\n\n### 📚 文档\nhttps://naeemo.github.io/cdl/\n\n---\n\n*此 Release 由 GitHub Actions 自动发布*",
    "draft": False,
    "prerelease": False
}

response = requests.post(api_url, json=data, headers=headers)
if response.status_code == 201:
    release_url = response.json()['html_url']
    print(f"✅ Release created: {release_url}")
else:
    print(f"❌ Error ({response.status_code}): {response.text}")
    exit(1)
