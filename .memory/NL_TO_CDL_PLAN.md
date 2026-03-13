# NL-to-CDL 开发计划

## 目标
实现自然语言到 CDL 的完整转换能力

## 阶段划分

### Phase 1: @cdl/nl-codegen 核心包 ✅ 已完成
- [x] 创建 packages/nl-codegen 目录结构
- [x] 实现 nlToCDL() API
- [x] 集成 Kimi API
- [x] CDL 语法验证
- [x] 单元测试框架

### Phase 2: Prompt 模板库 ✅ 已完成
- [x] 创建 prompts/ 目录
- [x] 编写基础 system prompt
- [x] 收集 few-shot 示例（4+ 场景）
- [x] Prompt 版本管理

### Phase 3: Function Schema ✅ 已完成
- [x] 定义 CDL JSON Schema
- [x] 实现 schemaToCDL() 转换器
- [x] LLM 结构化输出适配
- [x] 错误处理与重试

### Phase 4: CLI 工具 ✅ 已完成
- [x] 集成到 @cdl/cli
- [x] nl 子命令实现
- [x] 支持 --api-key, --output, --model 参数
- [x] 环境变量读取

### Phase 5: Playground 集成 🔄 进行中
- [ ] 前端输入组件
- [ ] 实时生成 CDL
- [ ] 一键渲染图表
- [ ] 历史记录

## 当前阶段
Phase 5 - Playground 集成

## 下次检查
等待 cron 触发
