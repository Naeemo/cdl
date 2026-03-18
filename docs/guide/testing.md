# 测试指南

本文档介绍如何测试 CDL 项目，确保编译器和渲染器的质量。

## 测试类型

CDL 项目包含以下测试：

1. **单元测试** - 测试独立函数（计划添加）
2. **集成测试** - 端到端验证 v0.6 特性（`test-v06.js`）
3. **性能基准** - 编译和渲染速度（计划添加）
4. **兼容性测试** - 不同 Node.js 版本（CI 中）

## 运行测试

### 集成测试（当前可用）

```bash
node packages/integration-test/test-v06.js
```

输出示例：
```
=== CDL v0.6 End-to-End Test ===
1. Compiling CDL...
✓ Compilation succeeded
2. Rendering to ECharts option...
✓ Rendering succeeded
3. Validating v0.6 features...
  ✓ series table parsed (2 series)
  ✓ axis blocks parsed (3 axes)
  ✓ interaction configured
  ✓ ECharts option mapping correct

=== Test Result: 4/4 features passed ===
🎉 All v0.6 features working correctly!
```

## 添加新测试

### 1. 扩展集成测试

编辑 `packages/integration-test/test-v06.js`，在末尾添加测试：

```javascript
console.log('Testing new feature...');

const cdl = `...`; // 你的 CDL 代码
const { compile } = require('../compiler/dist/compiler.js');
const { render } = require('../renderer/dist/index.js');

const result = compile(cdl);
if (!result.success || result.errors.length > 0) {
  throw new Error('Compilation failed: ' + JSON.stringify(result.errors));
}

const renderResult = render(result.file);
if (!renderResult.success) {
  throw new Error('Rendering failed: ' + renderResult.error);
}

// 验证特定字段
if (!renderResult.option.title) {
  throw new Error('Title missing');
}

console.log('✓ new feature works');
```

### 2. 单元测试（计划）

未来将添加 Jest/Vitest 单元测试：

```bash
# 安装依赖
pnpm add -D jest @types/jest ts-jest

# 运行
pnpm test
```

## 测试覆盖

### 编译器测试用例

- ✅ 基本数据定义（data）
- ✅ 图表块解析（Chart { ... }）
- ✅ series 表格解析
- ✅ axis 块解析
- ✅ interaction 解析
- ✅ 错误处理（未闭合、字段缺失等）
- ✅ 类型推断（auto 推断 chart type）

### 渲染器测试用例

- ✅ 20+ 图表类型转换
- ✅ 主题应用
- ✅ 响应式标记
- ✅ 多轴配置
- ✅ 颜色映射
- ✅ 交互配置（tooltip, zoom, brush）

### 性能测试（计划）

添加基准测试：

```javascript
console.time('compile');
for (let i = 0; i < 100; i++) compile(cdlCode);
console.timeEnd('compile');

console.time('render');
for (let i = 0; i < 100; i++) render(file);
console.timeEnd('render');
```

目标：
- 平均编译时间 < 20ms
- 平均渲染时间 < 30ms

## 自动化 CI/CD

GitHub Actions 配置（`.github/workflows/ci.yml`）：

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm -r build
      - run: node packages/integration-test/test-v06.js
```

## 测试数据

测试数据应该：
- 简洁（3-5 行足够）
- 覆盖典型场景
- 包含边界情况（空数据、错误语法）

示例测试数据：

```cdl
@lang(data)
TestData {
    category,value
    A,100
    B,200
    C,150
}
```

## 调试失败测试

### 检查错误详情

```javascript
const { compile } = require('../compiler/dist/compiler.js');
const result = compile(cdlCode);

if (result.errors.length > 0) {
  result.errors.forEach(e => {
    console.log(`Line ${e.line}: ${e.message}`);
    if (e.suggestion) console.log(`  Suggestion: ${e.suggestion}`);
  });
}
```

### 查看 AST

```javascript
console.log(JSON.stringify(result.file, null, 2));
```

### 查看渲染选项

```javascript
const { render } = require('../renderer/dist/index.js');
const renderResult = render(result.file);
console.log(JSON.stringify(renderResult.option, null, 2));
```

## 测试最佳实践

1. **每次添加新功能都加测试** - 防止回归
2. **测试边界条件** - 空数据、超大文件、特殊字符
3. **测试错误情况** - 确保错误消息有帮助
4. **保持测试独立** - 每个测试用例自包含
5. **命名清晰** - 测试名描述场景：`test('combo chart with dual axis renders correctly')`

## 性能测试脚本

创建 `packages/benchmark/benchmark.js`：

```javascript
const { compile } = require('../compiler/dist/compiler.js');
const { render } = require('../renderer/dist/index.js');

const cdl = `...`; // 代表性 CDL

// 编译基准
console.time('compile (100x)');
for (let i = 0; i < 100; i++) {
  compile(cdl);
}
console.timeEnd('compile (100x)');

// 渲染基准
const { file } = compile(cdl);
console.time('render (100x)');
for (let i = 0; i < 100; i++) {
  render(file);
}
console.timeEnd('render (100x)');
```

运行：
```bash
node packages/benchmark/benchmark.js
```

## 测试清单

提交前检查：
- [ ] 编译测试通过
- [ ] 集成测试通过（4/4 v0.6 特性）
- [ ] 新增功能有对应测试
- [ ] 错误情况有覆盖
- [ ] 性能没有显著下降（< 20% 增长）

## 报告问题

如果测试失败，请提供：
1. 测试命令输出
2. 相关 CDL 代码
3. Node.js 版本
4. 操作系统

到 GitHub Issues。

## 未来改进

- [ ] 单元测试覆盖核心函数
- [ ] E2E 测试使用真实浏览器
- [ ] 可视化回归测试（截图对比）
- [ ] 模糊测试（fuzzing）以发现边缘 case
- [ ] 性能回归检测（CI 中）

---

保持测试健康，确保 CDL 稳定可靠！