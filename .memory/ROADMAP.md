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

## P2: 服务端渲染增强（待启动）
- [ ] 支持定时任务生成报告
- [ ] 批量导出功能

## P3: 实时数据（待启动）
- [ ] WebSocket 数据源
- [ ] 自动刷新机制

## P4: 其他（待启动）
- [ ] D3 渲染器
- [ ] 模板市场
- [ ] 主题系统

## 当前阶段
P1 ✅ 已完成 - 更多数据源已全面支持
