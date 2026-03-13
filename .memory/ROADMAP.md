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

---

## 进行中 🚧

### P5: 开发者体验优化（当前重点）

**P5-1: 错误提示增强**
- [ ] 编译器输出友好的错误信息（带行号、列号、建议修复）
- [ ] 常见错误模式识别（缺少括号、拼写错误等）
- [ ] 错误代码链接到文档

**P5-2: VS Code 智能提示**
- [ ] 自动补全 `@directive`
- [ ] Chart 属性提示（type/x/y/@style 等）
- [ ] 悬停文档（hover 显示说明）
- [ ] 语法检查实时反馈

**P5-3: Playground 保存与分享**
- [ ] URL 参数编码支持（`?code=base64`）
- [ ] 生成分享链接
- [ ] 本地存储自动保存
- [ ] 导出为可嵌入的 iframe 代码

**P5-4: CLI 体验改进**
- [ ] `cdl export` 直接输出 PNG（无头浏览器）
- [ ] `cdl init --template <name>` 从模板创建
- [ ] `cdl preview` 本地启动预览服务器
- [ ] `cdl validate --fix` 自动修复简单错误

**P5-5: 调试工具**
- [ ] `cdl compile --ast` 查看 AST 树
- [ ] `cdl compile --verbose` 详细日志
- [ ] Playground 显示编译步骤

---

### P6: 生态建设

**P6-1: NPM 包发布**
- [ ] `@cdl/compiler` 发布
- [ ] `@cdl/renderer-echarts` 发布
- [ ] `@cdl/renderer-d3` 发布
- [ ] GitHub Actions 自动发布

**P6-2: 框架集成**
- [ ] React 组件 `<CDLChart />`
- [ ] Vue 组件 `<CDLChart />`
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
**P5: 开发者体验优化** - 提升使用流畅度，降低学习成本
