# CDL 开发计划

## 已完成 ✅

### P0: 导出功能
- [x] Playground PNG/SVG 导出
- [x] CLI 导出命令
- [x] 服务端渲染 API

### P1: 更多数据源
- [x] REST API 支持
- [x] CSV 上传/粘贴

### P2: 服务端渲染增强
- [x] 定时任务生成报告
- [x] 批量导出

### P3: 实时数据
- [x] WebSocket 数据源
- [x] Playground 自动刷新

### P4: 其他功能
- [x] D3 渲染器
- [x] 主题系统
- [x] 模板市场

### P5: 开发者体验优化
- [x] 错误提示增强（友好提示、修复建议、源码上下文）
- [x] VS Code 智能提示（自动补全、悬停文档、实时诊断）
- [x] Playground 保存分享（URL 参数、分享链接、iframe 嵌入）
- [x] CLI 体验改进（直接导出 PNG、模板创建、preview 服务器）
- [x] 调试工具（--ast、--verbose、详细验证信息）

---

## 进行中 🚧

### P6: 生态建设（当前重点）

**P6-1: NPM 包发布**
- [ ] 配置 packages/*/package.json 的 publishConfig
- [ ] 添加 .npmignore 文件
- [ ] 配置 GitHub Actions 自动发布
- [ ] 发布 @cdl/compiler
- [ ] 发布 @cdl/renderer-echarts
- [ ] 发布 @cdl/renderer-d3
- [ ] 发布 @cdl/cli

**P6-2: 框架集成**
- [ ] React 组件 <CDLChart />
- [ ] Vue 组件 <CDLChart />
- [ ] 纯 JS 嵌入脚本

**P6-3: 模板系统增强**
- [ ] `cdl use-template <category>/<name>`
- [ ] 模板参数支持（`--theme dark`）
- [ ] 自定义模板注册

**P6-4: 高级功能**
- [ ] 数据转换管道 `@transform`
- [ ] 多语言错误提示
- [ ] 性能分析工具

---

## 当前阶段
**P6: 生态建设** - 等待 GitHub Actions Secret 配置完成
