/**
 * CDL Data Transformer 测试
 */

import {
  parseCSV,
  serializeCSV,
  parseJSON,
  serializeJSON,
  importFromFile,
  exportToFile,
  convertData,
  createEmptyTable,
  addRow,
  mergeTables,
  validateTable,
  DataTable
} from './transformer';
import * as fs from 'fs';
import * as path from 'path';

// 测试数据
const sampleCSV = `name,age,city,salary
Alice,30,Beijing,15000
Bob,25,Shanghai,12000
Carol,35,Shenzhen,20000
David,28,Beijing,18000`;

const sampleJSON = `[
  { "name": "Alice", "age": 30, "city": "Beijing", "salary": 15000 },
  { "name": "Bob", "age": 25, "city": "Shanghai", "salary": 12000 },
  { "name": "Carol", "age": 35, "city": "Shenzhen", "salary": 20000 }
]`;

const sampleTable: DataTable = {
  headers: ['name', 'age', 'city', 'salary'],
  rows: [
    { name: 'Alice', age: 30, city: 'Beijing', salary: 15000 },
    { name: 'Bob', age: 25, city: 'Shanghai', salary: 12000 },
    { name: 'Carol', age: 35, city: 'Shenzhen', salary: 20000 }
  ]
};

// 测试套件
class TestRunner {
  private passed = 0;
  private failed = 0;
  
  test(name: string, fn: () => void | Promise<void>) {
    try {
      const result = fn();
      if (result instanceof Promise) {
        result
          .then(() => {
            this.passed++;
            console.log(`✓ ${name}`);
          })
          .catch(err => {
            this.failed++;
            console.error(`✗ ${name}: ${err.message}`);
          });
      } else {
        this.passed++;
        console.log(`✓ ${name}`);
      }
    } catch (err) {
      this.failed++;
      console.error(`✗ ${name}: ${err instanceof Error ? err.message : err}`);
    }
  }
  
  async testAsync(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      this.passed++;
      console.log(`✓ ${name}`);
    } catch (err) {
      this.failed++;
      console.error(`✗ ${name}: ${err instanceof Error ? err.message : err}`);
    }
  }
  
  summary() {
    console.log('');
    console.log('='.repeat(50));
    console.log(`Total: ${this.passed + this.failed}, Passed: ${this.passed}, Failed: ${this.failed}`);
    console.log('='.repeat(50));
    return this.failed === 0;
  }
}

const runner = new TestRunner();

console.log('CDL Data Transformer Tests\n');

// ===== CSV 测试 =====
console.log('--- CSV Tests ---');

runner.test('parseCSV: should parse basic CSV', () => {
  const table = parseCSV(sampleCSV);
  console.log('  Headers:', table.headers);
  console.log('  Rows count:', table.rows.length);
  if (table.headers.length !== 4) throw new Error('Expected 4 headers');
  if (table.rows.length !== 4) throw new Error('Expected 4 rows');
});

runner.test('parseCSV: should auto-parse numbers', () => {
  const table = parseCSV(sampleCSV);
  const firstRow = table.rows[0];
  if (typeof firstRow.age !== 'number') throw new Error('Age should be number');
  if (typeof firstRow.salary !== 'number') throw new Error('Salary should be number');
});

runner.test('parseCSV: should handle quoted fields', () => {
  const csvWithQuotes = `name,description
"Alice","Has, comma"
"Bob","Has ""quotes"""`;
  const table = parseCSV(csvWithQuotes);
  console.log('  Row 0 desc:', table.rows[0].description);
  console.log('  Row 1 desc:', table.rows[1].description);
  if (table.rows[0].description !== 'Has, comma') throw new Error('Comma in quotes failed');
  if (table.rows[1].description !== 'Has "quotes"') throw new Error('Quotes escape failed');
});

runner.test('serializeCSV: should serialize to CSV', () => {
  const csv = serializeCSV(sampleTable);
  console.log('  CSV output preview:');
  console.log('  ' + csv.split('\n')[0]);
  console.log('  ' + csv.split('\n')[1]);
  if (!csv.includes('name,age,city,salary')) throw new Error('Header not found');
  if (!csv.includes('Alice')) throw new Error('Data not found');
});

runner.test('serializeCSV: should add BOM by default', () => {
  const csv = serializeCSV(sampleTable);
  if (!csv.startsWith('\ufeff')) throw new Error('BOM not added');
});

// ===== JSON 测试 =====
console.log('\n--- JSON Tests ---');

runner.test('parseJSON: should parse array format', () => {
  const table = parseJSON(sampleJSON);
  console.log('  Headers:', table.headers);
  console.log('  Rows count:', table.rows.length);
  if (table.headers.length !== 4) throw new Error('Expected 4 headers');
  if (table.rows.length !== 3) throw new Error('Expected 3 rows');
});

runner.test('parseJSON: should parse DataTable format', () => {
  const dataTableFormat = JSON.stringify(sampleTable);
  const table = parseJSON(dataTableFormat);
  if (table.headers.length !== 4) throw new Error('Expected 4 headers');
});

runner.test('serializeJSON: should serialize to JSON', () => {
  const json = serializeJSON(sampleTable);
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error('Should be array');
  if (parsed.length !== 3) throw new Error('Expected 3 items');
});

// ===== 工具函数测试 =====
console.log('\n--- Utility Tests ---');

runner.test('validateTable: should validate correct table', () => {
  const result = validateTable(sampleTable);
  if (!result.valid) throw new Error('Should be valid');
  if (result.errors.length > 0) throw new Error('Should have no errors');
});

runner.test('validateTable: should detect missing fields', () => {
  const badTable: DataTable = {
    headers: ['a', 'b', 'c'],
    rows: [{ a: 1, b: 2 }] // missing c
  };
  const result = validateTable(badTable);
  console.log('  Errors:', result.errors);
  if (result.valid) throw new Error('Should be invalid');
});

runner.test('createEmptyTable: should create empty table', () => {
  const table = createEmptyTable(['a', 'b']);
  if (table.headers.length !== 2) throw new Error('Expected 2 headers');
  if (table.rows.length !== 0) throw new Error('Expected 0 rows');
});

runner.test('addRow: should add row and expand headers', () => {
  let table = createEmptyTable(['name']);
  table = addRow(table, { name: 'Alice', age: 30 });
  console.log('  Headers after add:', table.headers);
  if (!table.headers.includes('age')) throw new Error('Headers not expanded');
  if (table.rows.length !== 1) throw new Error('Row not added');
});

runner.test('mergeTables: should merge multiple tables', () => {
  const table1: DataTable = {
    headers: ['a', 'b'],
    rows: [{ a: 1, b: 2 }]
  };
  const table2: DataTable = {
    headers: ['b', 'c'],
    rows: [{ b: 3, c: 4 }]
  };
  const merged = mergeTables([table1, table2]);
  console.log('  Merged headers:', merged.headers);
  console.log('  Merged rows:', merged.rows.length);
  if (!merged.headers.includes('a')) throw new Error('Missing header a');
  if (!merged.headers.includes('c')) throw new Error('Missing header c');
  if (merged.rows.length !== 2) throw new Error('Expected 2 rows');
});

// ===== 文件 I/O 测试 =====
console.log('\n--- File I/O Tests ---');

const testDir = path.join(__dirname, '.test-output');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

runner.testAsync('exportToFile: CSV', async () => {
  const filePath = path.join(testDir, 'test.csv');
  const result = await exportToFile(sampleTable, filePath);
  if (!result.success) throw new Error(result.error);
  if (!fs.existsSync(filePath)) throw new Error('File not created');
  console.log('  Exported to:', filePath);
});

runner.testAsync('importFromFile: CSV', async () => {
  const filePath = path.join(testDir, 'test.csv');
  const result = await importFromFile(filePath);
  if (!result.success) throw new Error(result.error);
  if (result.data!.rows.length !== 3) throw new Error('Expected 3 rows');
  console.log('  Imported rows:', result.data!.rows.length);
});

runner.testAsync('exportToFile: JSON', async () => {
  const filePath = path.join(testDir, 'test.json');
  const result = await exportToFile(sampleTable, filePath, { format: 'json' });
  if (!result.success) throw new Error(result.error);
  if (!fs.existsSync(filePath)) throw new Error('File not created');
  console.log('  Exported to:', filePath);
});

runner.testAsync('importFromFile: JSON', async () => {
  const filePath = path.join(testDir, 'test.json');
  const result = await importFromFile(filePath, { format: 'json' });
  if (!result.success) throw new Error(result.error);
  console.log('  Imported rows:', result.data!.rows.length);
});

runner.testAsync('round-trip: CSV -> JSON', async () => {
  const csvPath = path.join(testDir, 'roundtrip.csv');
  const jsonPath = path.join(testDir, 'roundtrip.json');
  
  // CSV -> Table
  await exportToFile(sampleTable, csvPath, { format: 'csv' });
  const importResult = await importFromFile(csvPath, { format: 'csv' });
  
  // Table -> JSON
  await exportToFile(importResult.data!, jsonPath, { format: 'json' });
  const jsonResult = await importFromFile(jsonPath, { format: 'json' });
  
  if (jsonResult.data!.rows.length !== sampleTable.rows.length) {
    throw new Error('Row count mismatch');
  }
  console.log('  Round-trip successful');
});

// ===== Excel 测试（如果安装了 xlsx）=====
console.log('\n--- Excel Tests ---');

try {
  require.resolve('xlsx');
  
  runner.testAsync('exportToFile: Excel', async () => {
    const filePath = path.join(testDir, 'test.xlsx');
    const result = await exportToFile(sampleTable, filePath, { 
      format: 'excel',
      sheetName: 'Employees'
    });
    if (!result.success) throw new Error(result.error);
    if (!fs.existsSync(filePath)) throw new Error('File not created');
    console.log('  Exported to:', filePath);
  });
  
  runner.testAsync('importFromFile: Excel', async () => {
    // 先确保文件存在
    const filePath = path.join(testDir, 'test-import.xlsx');
    await exportToFile(sampleTable, filePath, { format: 'excel' });
    
    const result = await importFromFile(filePath, { format: 'excel' });
    if (!result.success) throw new Error(result.error);
    console.log('  Imported rows:', result.data!.rows.length);
    console.log('  Sheet name:', result.data!.sheetName);
  });
  
  runner.testAsync('convertData: CSV -> Excel', async () => {
    const result = await convertData(sampleCSV, 'csv', 'excel');
    if (!result.success) throw new Error(result.error);
    console.log('  Converted successfully');
  });
  
} catch (e) {
  console.log('  (Skipped - xlsx package not installed)');
}

// ===== 高级功能测试 =====
console.log('\n--- Advanced Tests ---');

runner.test('parseCSV: custom delimiter', () => {
  const tsv = `name\tage\tcity
Alice\t30\tBeijing
Bob\t25\tShanghai`;
  const table = parseCSV(tsv, { delimiter: '\t' });
  if (table.headers.length !== 3) throw new Error('Expected 3 headers');
  console.log('  TSV parsed successfully');
});

runner.test('parseCSV: custom header row', () => {
  const csv = `This is a title
name,age,city
Alice,30,Beijing`;
  const table = parseCSV(csv, { headerRow: 1, dataStartRow: 2 });
  if (table.headers[0] !== 'name') throw new Error('Header row not respected');
  console.log('  Headers:', table.headers);
});

runner.test('serializeCSV: without header', () => {
  const csv = serializeCSV(sampleTable, { includeHeader: false });
  if (csv.includes('name,age')) throw new Error('Header should not be included');
  console.log('  No header, rows only');
});

runner.test('serializeJSON: compact format', () => {
  const json = serializeJSON(sampleTable, { prettify: false });
  if (json.includes('\n')) throw new Error('Should be compact');
  console.log('  Compact JSON length:', json.length);
});

// 清理测试文件
process.on('exit', () => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
    console.log('\n  Cleaned up test files');
  }
});

// 等待所有异步测试完成
setTimeout(() => {
  const success = runner.summary();
  process.exit(success ? 0 : 1);
}, 2000);
