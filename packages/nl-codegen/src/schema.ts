/**
 * CDL JSON Schema for LLM structured output
 * This schema ensures LLM generates valid CDL AST directly
 */

export const CDL_JSON_SCHEMA = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['data'] },
          name: { type: 'string' },
          lang: { type: 'string', enum: ['sql', 'dax', 'data'] },
          config: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              timeout: { type: 'number' },
              cache: { type: 'number' }
            }
          },
          query: { type: 'string' }
        },
        required: ['type', 'name', 'lang', 'query']
      }
    },
    charts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['chart'] },
          name: { type: 'string' },
          chartType: { 
            type: 'string', 
            enum: ['line', 'bar', 'pie', 'scatter', 'area', 'combo', 'radar', 'heatmap'] 
          },
          dataSources: { type: 'array', items: { type: 'string' } },
          x: { type: 'string' },
          y: { type: 'string' },
          group: { type: 'string' },
          stack: { type: ['string', 'boolean'] },
          hints: {
            type: 'object',
            properties: {
              style: { type: 'string' },
              color: { type: 'string' },
              animation: { type: 'string' },
              title: { type: 'string' }
            }
          }
        },
        required: ['type', 'chartType', 'dataSources']
      }
    }
  },
  required: ['data', 'charts']
} as const;

// Type definitions matching the schema
export interface DataDefinitionSchema {
  type: 'data';
  name: string;
  lang: 'sql' | 'dax' | 'data';
  config?: {
    source?: string;
    timeout?: number;
    cache?: number;
  };
  query: string;
}

export interface ChartDefinitionSchema {
  type: 'chart';
  name?: string;
  chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'combo' | 'radar' | 'heatmap';
  dataSources: string[];
  x?: string;
  y?: string;
  group?: string;
  stack?: string | boolean;
  hints?: {
    style?: string;
    color?: string;
    animation?: string;
    title?: string;
  };
}

export interface CDLFileSchema {
  data: DataDefinitionSchema[];
  charts: ChartDefinitionSchema[];
}

/**
 * Convert schema-based output to CDL source code
 */
export function schemaToCDL(schema: CDLFileSchema): string {
  const lines: string[] = [];
  
  // Generate data definitions
  for (const data of schema.data) {
    if (data.lang === 'sql') {
      lines.push(`@lang(sql)`);
      if (data.config?.source) {
        lines.push(`@source('${data.config.source}')`);
      }
    } else if (data.lang === 'dax') {
      lines.push(`@lang(dax)`);
    } else {
      lines.push(`@lang(data)`);
    }
    
    lines.push(`Data ${data.name} {`);
    lines.push(`    ${data.query}`);
    lines.push(`}`);
    lines.push('');
  }
  
  // Generate chart definitions
  for (const chart of schema.charts) {
    const name = chart.name || '';
    lines.push(`Chart ${name} {`);
    
    if (chart.dataSources.length > 0) {
      lines.push(`    use ${chart.dataSources[0]}`);
    }
    lines.push(`    type ${chart.chartType}`);
    
    if (chart.x) lines.push(`    x ${chart.x}`);
    if (chart.y) lines.push(`    y ${chart.y}`);
    if (chart.group) lines.push(`    group ${chart.group}`);
    if (chart.stack) lines.push(`    stack ${chart.stack}`);
    
    if (chart.hints) {
      if (chart.hints.style) lines.push(`    @style "${chart.hints.style}"`);
      if (chart.hints.color) lines.push(`    @color "${chart.hints.color}"`);
      if (chart.hints.animation) lines.push(`    @animation "${chart.hints.animation}"`);
      if (chart.hints.title) lines.push(`    @title "${chart.hints.title}"`);
    }
    
    lines.push(`}`);
    lines.push('');
  }
  
  return lines.join('\n');
}