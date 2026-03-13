/**
 * CDL 数据转换管道
 * 支持数据过滤、聚合、转换
 */

export interface TransformConfig {
  type: 'filter' | 'map' | 'aggregate' | 'sort' | 'limit';
  config: Record<string, any>;
}

export interface TransformPipeline {
  transforms: TransformConfig[];
}

/**
 * 执行数据转换管道
 */
export function applyTransforms(data: any[], pipeline: TransformPipeline): any[] {
  return pipeline.transforms.reduce((result, transform) => {
    switch (transform.type) {
      case 'filter':
        return applyFilter(result, transform.config);
      case 'map':
        return applyMap(result, transform.config);
      case 'aggregate':
        return applyAggregate(result, transform.config);
      case 'sort':
        return applySort(result, transform.config);
      case 'limit':
        return applyLimit(result, transform.config);
      default:
        return result;
    }
  }, data);
}

function applyFilter(data: any[], config: { condition: string; field?: string }): any[] {
  // 支持简单条件表达式: field > 100, field == 'value', field contains 'text'
  const { condition } = config;
  
  return data.filter(row => {
    // 替换字段引用为实际值
    const expr = condition.replace(/(\w+)/g, (match) => {
      if (row.hasOwnProperty(match)) {
        const val = row[match];
        return typeof val === 'string' ? `"${val}"` : String(val);
      }
      return match;
    });
    
    try {
      // 安全执行
      return new Function('return ' + expr)();
    } catch {
      return true;
    }
  });
}

function applyMap(data: any[], config: { fields: Record<string, string> }): any[] {
  const { fields } = config;
  return data.map(row => {
    const newRow: Record<string, any> = {};
    for (const [newKey, expr] of Object.entries(fields)) {
      // 表达式可以是: field * 2, field1 + field2, UPPER(field)
      let value = expr;
      for (const [key, val] of Object.entries(row)) {
        value = value.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val));
      }
      try {
        newRow[newKey] = new Function('return ' + value)();
      } catch {
        newRow[newKey] = value;
      }
    }
    return newRow;
  });
}

function applyAggregate(data: any[], config: { groupBy: string; aggregations: Record<string, { field: string; op: 'sum' | 'avg' | 'count' | 'min' | 'max' }> }): any[] {
  const { groupBy, aggregations } = config;
  
  // 分组
  const groups = new Map<string, any[]>();
  data.forEach(row => {
    const key = String(row[groupBy]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  });
  
  // 聚合
  return Array.from(groups.entries()).map(([key, rows]) => {
    const result: Record<string, any> = { [groupBy]: key };
    
    for (const [name, agg] of Object.entries(aggregations)) {
      const values = rows.map(r => Number(r[agg.field])).filter(v => !isNaN(v));
      
      switch (agg.op) {
        case 'sum':
          result[name] = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          result[name] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          break;
        case 'count':
          result[name] = rows.length;
          break;
        case 'min':
          result[name] = Math.min(...values);
          break;
        case 'max':
          result[name] = Math.max(...values);
          break;
      }
    }
    
    return result;
  });
}

function applySort(data: any[], config: { field: string; order?: 'asc' | 'desc' }): any[] {
  const { field, order = 'asc' } = config;
  return [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (order === 'desc') {
      return bVal > aVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });
}

function applyLimit(data: any[], config: { count: number; offset?: number }): any[] {
  const { count, offset = 0 } = config;
  return data.slice(offset, offset + count);
}

/**
 * 解析 @transform 指令
 * @transform "filter: amount > 100"
 * @transform "sort: date desc"
 * @transform "limit: 10"
 */
export function parseTransformDirective(directive: string): TransformConfig | null {
  const match = directive.match(/(\w+)\s*:\s*(.+)/);
  if (!match) return null;
  
  const [_, type, expr] = match;
  
  switch (type) {
    case 'filter':
      return { type: 'filter', config: { condition: expr.trim() } };
    case 'sort': {
      const parts = expr.trim().split(/\s+/);
      return { type: 'sort', config: { field: parts[0], order: parts[1] as 'asc' | 'desc' } };
    }
    case 'limit': {
      const [count, offset] = expr.trim().split(/\s*,\s*/).map(Number);
      return { type: 'limit', config: { count, offset: offset || 0 } };
    }
    default:
      return null;
  }
}