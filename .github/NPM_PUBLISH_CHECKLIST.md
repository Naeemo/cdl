# CDL NPM 包发布清单

## 📦 核心包（必须发布）

### 1. @cdl/compiler (v0.1.0)
**作用**：CDL 编译器 - 将 CDL 源代码编译成 AST
**NPM**: https://www.npmjs.com/package/@cdl/compiler

**发布命令**:
```bash
cd packages/compiler
npm publish --access public
```

**使用**:
```bash
npm install @cdl/compiler
```

---

### 2. @cdl/renderer-echarts (v0.1.0)
**作用**：ECharts 渲染器 - 将 AST 转换为 ECharts 配置
**NPM**: https://www.npmjs.com/package/@cdl/renderer-echarts

**发布命令**:
```bash
cd packages/renderer
npm publish --access public
```

**使用**:
```bash
npm install @cdl/renderer-echarts
```

---

### 3. @cdl/cli (v0.1.0)
**作用**：命令行工具 - 提供 `cdl` 命令
**NPM**: https://www.npmjs.com/package/@cdl/cli

**发布命令**:
```bash
cd packages/cli
npm publish --access public
```

**使用**:
```bash
npm install -g @cdl/cli
cdl validate chart.cdl
```

---

## 🔧 可选包（建议发布）

### 4. @cdl/ai (v0.1.0)
**作用**：AI 自然语言转 CDL 代码生成器
**NPM**: 待发布

**发布命令**:
```bash
cd packages/ai
npm publish --access public
```

**使用**:
```bash
npm install @cdl/ai
```

---

### 5. @cdl/ssr (v0.1.0)
**作用**：服务端渲染服务 - 导出 PNG/SVG/PDF
**NPM**: 待发布

**发布命令**:
```bash
cd packages/ssr
npm publish --access public
```

**使用**:
```bash
npm install @cdl/ssr
```

---

## 🎨 框架集成包（P1 优先级）

### 6. @cdl/react (v0.2.0)
**作用**：React 组件封装
**状态**：需要先构建 TypeScript
**发布命令**:
```bash
cd packages/react
npm run build
npm publish --access public
```

---

## 📝 GitHub Actions 配置

已创建 `.github/workflows/publish.yml`，配置如下：

**触发条件**:
- 创建 GitHub Release 时自动触发
- 手动触发（workflow_dispatch）

**流程**:
1. Checkout 代码
2. Setup Node.js 22
3. 安装 pnpm
4. 依次构建并发布所有核心包
5. 在 Release 下添加评论

**所需 Secrets**:
- `NPM_TOKEN` - 已配置 ✅

**发布的包**:
- @cdl/compiler
- @cdl/renderer-echarts
- @cdl/cli

---

## 🚀 发布流程

### 自动发布（推荐）
1. 确保所有包版本号已更新
2. 创建 GitHub Release（tag 格式: `v0.6.0`）
3. GitHub Actions 自动构建并发布到 NPM
4. Actions 在 Release 下添加发布成功的评论

### 手动发布（备用）
```bash
# 逐个发布
for pkg in compiler renderer cli ai ssr; do
  cd packages/$pkg
  npm publish --access public
  cd ../..
done
```

---

## ✅ 发布前检查清单

- [x] 所有包 `package.json` 版本号正确
- [x] 构建脚本（`npm run build`）正常工作
- [x] `dist/` 目录已生成
- [x] `files` 字段包含必要文件
- [x] `README.md` 完整
- [x] `LICENSE` 文件存在
- [x] GitHub Actions 工作流已创建
- [x] NPM_TOKEN secret 已配置
- [ ] 测试发布（dry-run）: `npm publish --dry-run`

---

## 📊 包依赖关系

```
@cdl/cli
├── @cdl/compiler (^0.6.0)
├── @cdl/renderer-echarts (^0.6.0)
└── @cdl/ai (^0.1.0)

@cdl/ssr
├── @cdl/compiler (file:../compiler)
└── @cdl/renderer-echarts (file:../renderer)

@cdl/react
├── @cdl/compiler (^0.2.0)
└── @cdl/renderer-echarts (^0.2.0)
```

---

## 🎯 发布优先级

**P0 (立即)**:
1. @cdl/compiler ✅ v0.6.0
2. @cdl/renderer-echarts ✅ v0.6.0
3. @cdl/cli ✅ v0.6.0

**P1 (尽快)**:
4. @cdl/ai ✅ v0.1.0
5. @cdl/ssr ✅ v0.1.0

**P2 (后续)**:
6. @cdl/react (需要构建 TS)

---

## 🔗 相关链接

- NPM Organization: https://www.npmjs.com/settings/cdl
- GitHub Repository: https://github.com/naeemo/cdl
- GitHub Actions: `.github/workflows/publish.yml`

---

*最后更新: 2026-03-15*