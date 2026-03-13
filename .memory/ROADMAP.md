# CDL 开发计划（按优先级）

## P0: 导出功能（已完成 ✅）
- [x] Playground 添加 PNG 导出按钮
- [x] Playground 添加 SVG 导出按钮
- [x] CLI 添加导出命令 `cdl export <file.cdl> --format png`
- [x] 服务端渲染 API (`/api/export`)

## P1: 更多数据源（已完成 ✅）
- [x] REST API 数据源支持（@source('https://...')）
- [x] CSV 文件上传支持
- [x] Playground 支持粘贴 CSV

## P2: 服务端渲染增强（已完成 ✅）
- [x] 支持定时任务生成报告 (scheduler.js)
- [x] 批量导出功能 (`cdl batch`)

## P3: 实时数据（已完成 ✅）
- [x] WebSocket 数据源 (@source('wss://...'))
- [x] Playground 自动刷新机制 (5秒间隔)

## P4: 其他（已完成 ✅）
- [x] D3 渲染器 (packages/renderer-d3)
- [x] 模板市场 (packages/templates)
- [x] 主题系统 (packages/themes)

---

## 🎉 全部完成

所有优先级任务已开发完成！

当前可用功能：
- 编译器：支持 SQL/DAX/Data/REST/WebSocket 数据源
- 渲染器：ECharts + D3 双引擎
- CLI：compile/render/export/batch/validate/nl 命令
- Playground：实时编辑、自动刷新、文件上传
- 模板：销售/用户/KPI/财务/库存 预置模板
- 主题：6 套内置主题
