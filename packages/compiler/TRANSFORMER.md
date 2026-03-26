# CDL Data Transformer

CDL 数据转换器 - 支持 CSV/JSON/Excel 格式的导入导出

## 功能特性

- 📄 **CSV 支持**: 带引号处理、自动类型解析、BOM 支持
- 📋 **JSON 支持**: 对象数组格式、DataTable 格式、格式化输出
- 📊 **Excel 支持**: .xlsx/.xls 格式、多工作表、列宽配置
- 🔄 **格式转换**: 内存中任意格式互转
- 📁 **文件 I/O**: 完整的文件导入导出
- 🛠️ **工具函数**: 数据验证、合并、表操作

## 安装

```bash
npm install

# Excel 支持（可选）
npm install xlsx
```

## 快速开始

```typescript
import {
  importFromFile,
  exportToFile,
  convertData,
  parseCSV,
  serializeCSV
} from './transformer';

// 从文件导入
const data = await importFromFile('./data.csv');

// 导出到文件
await exportToFile(data.data!, './output.xlsx', { sheetName: 'Sheet1' });

// 内存中转换
const result = await convertData(csvText, 'csv', 'json');
```

## API 文档

### 导入函数

#### `importFromFile(filePath, options?)`

从文件导入数据，自动检测格式。

```typescript
const result = await importFromFile('./data.csv', {
  format: 'csv',           // 可选：csv | json | excel
  delimiter: ',',          // CSV: 分隔符
  sheetName: 'Sheet1',     // Excel: 工作表名
  headerRow: 0,            // 表头行索引
  parseNumbers: true,      // 自动解析数字
  parseDates: true         // 自动解析日期
});

if (result.success) {
  console.log(result.data?.headers);
  console.log(result.data?.rows);
}
```

#### `parseCSV(csvText, options?)`

解析 CSV 文本为 DataTable。

```typescript
const table = parseCSV(`name,age\nAlice,30`, {
  delimiter: ',',
  parseNumbers: true,
  headerRow: 0
});
```

#### `parseJSON(jsonText, options?)`

解析 JSON 文本为 DataTable。

```typescript
// 支持对象数组格式
const table = parseJSON('[{"name":"Alice"}]');

// 支持 DataTable 格式
const table = parseJSON('{"headers":["name"],"rows":[{"name":"Alice"}]}');
```

#### `parseExcel(buffer, options?)`

解析 Excel 文件 Buffer 为 DataTable。

```typescript
const buffer = fs.readFileSync('./data.xlsx');
const table = await parseExcel(buffer, {
  sheetName: 'Sheet1',
  sheetIndex: 0
});
```

### 导出函数

#### `exportToFile(table, filePath, options?)`

导出数据到文件。

```typescript
await exportToFile(table, './output.xlsx', {
  format: 'excel',
  sheetName: 'Employees',
  includeHeader: true,
  columnWidths: { name: 20, age: 10 }
});
```

#### `serializeCSV(table, options?)`

将 DataTable 序列化为 CSV 文本。

```typescript
const csv = serializeCSV(table, {
  delimiter: ',',
  includeHeader: true,
  bom: true  // 添加 UTF-8 BOM
});
```

#### `serializeJSON(table, options?)`

将 DataTable 序列化为 JSON 文本。

```typescript
const json = serializeJSON(table, {
  prettify: true  // 格式化输出
});
```

#### `serializeExcel(table, options?)`

将 DataTable 序列化为 Excel Buffer。

```typescript
const buffer = await serializeExcel(table, {
  sheetName: 'Data',
  columnWidths: { col1: 15, col2: 20 }
});
fs.writeFileSync('./output.xlsx', buffer);
```

### 内存转换

#### `convertData(input, fromFormat, toFormat, importOpts?, exportOpts?)`

在内存中转换数据格式。

```typescript
// CSV 字符串 -> Excel Buffer (base64)
const result = await convertData(
  'name,age\nAlice,30',
  'csv',
  'excel'
);

// JSON 字符串 -> CSV 字符串
const result = await convertData(
  '[{"name":"Alice"}]',
  'json',
  'csv'
);
```

### 工具函数

#### `validateTable(table)`

验证 DataTable 结构。

```typescript
const { valid, errors } = validateTable(table);
```

#### `createEmptyTable(headers?)`

创建空数据表。

```typescript
const table = createEmptyTable(['name', 'age']);
```

#### `addRow(table, row)`

添加行到数据表（自动扩展表头）。

```typescript
const newTable = addRow(table, { name: 'Bob', age: 25, city: 'NYC' });
```

#### `mergeTables(tables)`

合并多个数据表。

```typescript
const merged = mergeTables([table1, table2, table3]);
```

#### `detectFormat(filePath)`

从文件路径检测格式。

```typescript
const format = detectFormat('./data.csv'); // 'csv'
```

## 类型定义

```typescript
interface DataTable {
  headers: string[];
  rows: DataRow[];
  sheetName?: string;
}

interface DataRow {
  [key: string]: string | number | boolean | null | Date;
}

type DataFormat = 'csv' | 'json' | 'excel' | 'xlsx' | 'xls';
```

## CLI 用法

```bash
# 导入文件并输出 JSON
ts-node transformer.ts import data.csv

# 转换格式
ts-node transformer.ts convert input.csv output.xlsx
```

## 测试

```bash
npm run test:transformer
```

## 注意事项

1. **Excel 依赖**: Excel 功能需要安装 `xlsx` 包，作为可选依赖
2. **编码**: CSV 默认使用 UTF-8 编码并添加 BOM 以支持 Excel
3. **大文件**: 大文件建议使用流式处理（未来版本支持）
4. **日期解析**: 自动日期解析支持常见格式，复杂格式需要手动处理

## 许可证

MIT
