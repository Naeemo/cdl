/**
 * CDL Data Transformer - Usage Examples
 * 
 * 展示如何使用数据转换器进行 CSV/JSON/Excel 导入导出
 */

import {
  // 文件 I/O
  importFromFile,
  exportToFile,
  
  // 内存转换
  convertData,
  
  // 解析和序列化
  parseCSV,
  parseJSON,
  serializeCSV,
  serializeJSON,
  
  // 工具函数
  createEmptyTable,
  addRow,
  mergeTables,
  validateTable,
  
  // 类型
  DataTable,
} from './transformer';

import {
  // 指令解析
  parseImportDirective,
  parseExportDirective,
  
  // 数据管道
  executeDataPipeline,
  
  // 便捷函数
  csvToJson,
  jsonToCsv,
} from './transformer-integration';

// ============================================
// 示例 1: 基本 CSV 导入导出
// ============================================

async function example1_basicCsv() {
  console.log('\n=== Example 1: Basic CSV Import/Export ===\n');
  
  // CSV 字符串解析
  const csvText = `product,category,price,quantity
Laptop,Electronics,999.99,50
Mouse,Electronics,29.99,200
Keyboard,Electronics,79.99,150
Desk,Furniture,299.99,30`;
  
  const table = parseCSV(csvText);
  console.log('Parsed CSV:');
  console.log('Headers:', table.headers);
  console.log('Row count:', table.rows.length);
  console.log('First row:', table.rows[0]);
  
  // 导出回 CSV
  const outputCsv = serializeCSV(table, { bom: true });
  console.log('\nSerialized CSV (first 100 chars):');
  console.log(outputCsv.substring(0, 100) + '...');
}

// ============================================
// 示例 2: JSON 处理
// ============================================

async function example2_json() {
  console.log('\n=== Example 2: JSON Handling ===\n');
  
  // 对象数组格式
  const jsonArray = `[
    {"name": "Alice", "department": "Engineering", "salary": 120000},
    {"name": "Bob", "department": "Marketing", "salary": 80000},
    {"name": "Carol", "department": "Engineering", "salary": 135000}
  ]`;
  
  const table = parseJSON(jsonArray);
  console.log('Parsed JSON:');
  console.log('Headers:', table.headers);
  table.rows.forEach(row => {
    console.log(`  ${row.name} - ${row.department} - $${row.salary}`);
  });
  
  // 导出为格式化 JSON
  const outputJson = serializeJSON(table, { prettify: true });
  console.log('\nSerialized JSON (preview):');
  console.log(outputJson.split('\n').slice(0, 5).join('\n') + '\n  ...');
}

// ============================================
// 示例 3: Excel 导入导出
// ============================================

async function example3_excel() {
  console.log('\n=== Example 3: Excel Import/Export ===\n');
  
  try {
    // 检查 xlsx 是否安装
    require.resolve('xlsx');
    
    const table: DataTable = {
      headers: ['Date', 'Revenue', 'Expenses', 'Profit'],
      rows: [
        { Date: '2024-01', Revenue: 100000, Expenses: 80000, Profit: 20000 },
        { Date: '2024-02', Revenue: 120000, Expenses: 85000, Profit: 35000 },
        { Date: '2024-03', Revenue: 110000, Expenses: 82000, Profit: 28000 },
      ]
    };
    
    // 导出到 Excel
    await exportToFile(table, './example-output.xlsx', {
      format: 'excel',
      sheetName: 'Q1 Financials',
      columnWidths: { Date: 12, Revenue: 15, Expenses: 15, Profit: 15 }
    });
    
    console.log('✓ Exported to example-output.xlsx');
    
    // 重新导入
    const imported = await importFromFile('./example-output.xlsx', {
      format: 'excel',
      sheetName: 'Q1 Financials'
    });
    
    if (imported.success) {
      console.log('✓ Imported from Excel:');
      console.log(`  Rows: ${imported.data!.rows.length}`);
      console.log(`  Sheet: ${imported.data!.sheetName}`);
    }
    
    // 清理
    const fs = require('fs');
    if (fs.existsSync('./example-output.xlsx')) {
      fs.unlinkSync('./example-output.xlsx');
    }
    
  } catch (e) {
    console.log('⚠ xlsx package not installed, skipping Excel example');
    console.log('  Run: npm install xlsx');
  }
}

// ============================================
// 示例 4: 格式转换
// ============================================

async function example4_conversion() {
  console.log('\n=== Example 4: Format Conversion ===\n');
  
  const csvInput = `name,value
category1,100
category2,200
category3,150`;
  
  // CSV -> JSON
  const jsonResult = await convertData(csvInput, 'csv', 'json');
  if (jsonResult.success) {
    console.log('CSV to JSON:');
    console.log(jsonResult.filePath!.substring(0, 200) + '...');
  }
}

// ============================================
// 示例 5: 数据操作工具
// ============================================

async function example5_dataManipulation() {
  console.log('\n=== Example 5: Data Manipulation ===\n');
  
  // 创建空表
  let table = createEmptyTable(['name', 'score']);
  
  // 添加行
  table = addRow(table, { name: 'Player1', score: 100 });
  table = addRow(table, { name: 'Player2', score: 85 });
  table = addRow(table, { name: 'Player3', score: 92 });
  
  console.log('After adding rows:');
  console.log('  Headers:', table.headers);
  console.log('  Rows:', table.rows.length);
  
  // 验证表
  const validation = validateTable(table);
  console.log('\nValidation:', validation.valid ? '✓ Valid' : '✗ Invalid');
  
  // 合并表
  const table2: DataTable = {
    headers: ['name', 'level'],
    rows: [
      { name: 'Player4', level: 5 },
      { name: 'Player5', level: 3 }
    ]
  };
  
  const merged = mergeTables([table, table2]);
  console.log('\nMerged table:');
  console.log('  Headers:', merged.headers);
  console.log('  Rows:', merged.rows.length);
}

// ============================================
// 示例 6: CDL 指令解析
// ============================================

async function example6_cdlDirectives() {
  console.log('\n=== Example 6: CDL Directive Parsing ===\n');
  
  // 解析 @import 指令
  const import1 = parseImportDirective('@import "data.csv"');
  console.log('Import directive 1:', import1);
  
  const import2 = parseImportDirective('@import "sales.xlsx" { sheetName: "Q1", headerRow: 1 }');
  console.log('Import directive 2:', import2);
  
  // 解析 @export 指令
  const export1 = parseExportDirective('@export "output.json"');
  console.log('Export directive:', export1);
}

// ============================================
// 示例 7: 数据管道
// ============================================

async function example7_dataPipeline() {
  console.log('\n=== Example 7: Data Pipeline ===\n');
  
  // 创建临时文件
  const fs = require('fs');
  const inputFile = './temp-input.csv';
  fs.writeFileSync(inputFile, 'name,value\nA,10\nB,20\nC,30');
  
  const pipeline = {
    name: 'example-pipeline',
    steps: [
      {
        type: 'import' as const,
        config: {
          filePath: inputFile,
          options: { format: 'csv' }
        }
      },
      {
        type: 'export' as const,
        config: {
          filePath: './temp-output.json',
          options: { format: 'json' }
        }
      }
    ]
  };
  
  const result = await executeDataPipeline(pipeline);
  
  if (result.success) {
    console.log('✓ Pipeline executed successfully');
    console.log(`  Results: ${result.results?.length} data tables`);
    
    // 验证输出
    if (fs.existsSync('./temp-output.json')) {
      const output = JSON.parse(fs.readFileSync('./temp-output.json', 'utf-8'));
      console.log(`  Output rows: ${output.length}`);
      fs.unlinkSync('./temp-output.json');
    }
  } else {
    console.log('✗ Pipeline failed:', result.error);
  }
  
  // 清理
  fs.unlinkSync(inputFile);
}

// ============================================
// 运行所有示例
// ============================================

async function runAllExamples() {
  console.log('CDL Data Transformer - Usage Examples');
  console.log('=' .repeat(50));
  
  await example1_basicCsv();
  await example2_json();
  await example3_excel();
  await example4_conversion();
  await example5_dataManipulation();
  await example6_cdlDirectives();
  await example7_dataPipeline();
  
  console.log('\n' + '='.repeat(50));
  console.log('All examples completed!');
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export { runAllExamples };
