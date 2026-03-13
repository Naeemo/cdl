# VS Code 插件开发计划

## 目标
为 CDL 开发完整的 VS Code 插件，提供语法高亮、智能提示、实时预览

## 阶段划分

### Phase 1: 基础架构 ✅ 已完成
- [x] 创建 packages/vscode-extension/ 目录
- [x] 初始化 package.json
- [x] 配置 TypeScript 编译

### Phase 2: 语法高亮 ✅ 已完成
- [x] TextMate 语法定义 (cdl.tmLanguage.json)
- [x] 关键字、字符串、注释着色
- [x] 语言配置文件
- [x] 代码片段 (snippets)

### Phase 3: 扩展功能 ✅ 已完成
- [x] 扩展入口 (extension.ts)
- [x] Preview 命令
- [x] Compile 命令
- [x] Export ECharts 命令
- [x] 快捷键绑定 (Ctrl+Shift+V)

### Phase 4: 图标和文档 ✅ 已完成
- [x] 文件图标 (light/dark SVG)
- [x] README.md
- [x] CHANGELOG.md
- [x] .vscodeignore

### Phase 5: 集成真实编译器 ✅ 已完成
- [x] 集成 @cdl/compiler
- [x] 集成 @cdl/renderer-echarts
- [x] 真实预览渲染
- [x] 错误处理和主题支持

### Phase 6: 发布 ✅ 已完成
- [x] 添加 package/publish scripts
- [x] 添加 LICENSE
- [x] 更新 .vscodeignore
- [x] 所有文件提交到仓库

## 当前状态
✅ 所有阶段完成 (100%)

## 使用方法

### 开发调试
```bash
cd packages/vscode-extension
npm install
npm run compile
# 按 F5 启动调试
```

### 打包
```bash
cd packages/vscode-extension
npm run package
# 生成 cdl-vscode-0.1.0.vsix
```

### 安装
```bash
code --install-extension cdl-vscode-0.1.0.vsix
```

### 发布到 Marketplace
```bash
npm run publish
```

## 功能特性
- 🎨 语法高亮
- ✨ 代码片段
- 🖼️ 图表预览 (Ctrl+Shift+V)
- 📦 编译为 JSON
- 📊 导出 ECharts 配置
- 🌓 支持亮色/暗色主题
