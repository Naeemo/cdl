// CDL Core - Simplified ECharts Renderer

import { CDLFile, ChartDefinition, DataDefinition } from '../compiler/types';

export interface RenderOptions {
  theme?: 'light' | 'dark';
  width?: number;
  height?: number;
}

export interface RenderResult {
  success: boolean;
  option?: Record<string, unknown>;
  error?: string;
}

const THEMES = {
  light: {
    color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'],
    backgroundColor: '#ffffff',
    textStyle: { color: '#333333' }
  },
  dark: {
    color: ['#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9'],
    backgroundColor: '#1a1a2e',
    textStyle: { color: '#e0e0e0' }
  }
};

export function render(
  cdlFile: CDLFile,
  options: RenderOptions = {}
): RenderResult {
  try {
    if (!cdlFile.charts || cdlFile.charts.length === 0) {
      return { success: false, error: 'No charts found in CDL file' };
    }

    const chart = cdlFile.charts[0];
    const theme = THEMES[options.theme || 'light'];
    
    const option: Record<string, unknown> = {
      ...theme,
      title: {
        text: chart.name,
        left: 'center'
      },
      xAxis: {
        type: 'category',
        data: extractXData(chart, cdlFile.data)
      },
      yAxis: {
        type: 'value'
      },
      series: extractSeries(chart, cdlFile.data),
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        bottom: 0
      }
    };

    return { success: true, option };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

function extractXData(chart: ChartDefinition, data: DataDefinition[]): string[] {
  // Simplified: extract first column from inline data
  const dataDef = data[0];
  if (dataDef?.query) {
    const lines = dataDef.query.split('\n');
    if (lines.length > 1) {
      const headers = lines[0].split(',');
      return lines.slice(1).map(line => line.split(',')[0]).filter(Boolean);
    }
  }
  return [];
}

function extractSeries(chart: ChartDefinition, data: DataDefinition[]): unknown[] {
  const dataDef = data[0];
  if (!dataDef?.query) return [];

  const lines = dataDef.query.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  
  // If series config exists, use it
  if (chart.series && chart.series.length > 0) {
    return chart.series.map(s => ({
      name: s.as || s.field,
      type: s.type || chart.chartType || 'line',
      data: extractColumnData(lines, headers, s.field),
      yAxisIndex: s.axis === 'right' ? 1 : 0,
      smooth: s.style === 'smooth'
    }));
  }

  // Default: use second column as series
  return [{
    name: headers[1] || 'value',
    type: chart.chartType || 'line',
    data: extractColumnData(lines, headers, headers[1])
  }];
}

function extractColumnData(lines: string[], headers: string[], field: string): number[] {
  const colIndex = headers.indexOf(field);
  if (colIndex < 0) return [];
  
  return lines.slice(1)
    .map(line => {
      const values = line.split(',');
      const val = parseFloat(values[colIndex]);
      return isNaN(val) ? 0 : val;
    });
}