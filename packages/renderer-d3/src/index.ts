/**
 * D3 渲染器 - 将 CDL 编译结果转换为 D3.js 配置
 */

export interface D3ChartConfig {
  type: string;
  data: any[];
  x: string;
  y: string;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  color?: string;
  title?: string;
}

export interface D3RenderResult {
  success: boolean;
  html?: string;
  error?: string;
}

/**
 * 渲染 CDL 为 D3.js HTML
 */
export function renderD3(config: D3ChartConfig): D3RenderResult {
  try {
    const html = generateD3HTML(config);
    return { success: true, html };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'D3 render failed'
    };
  }
}

function generateD3HTML(config: D3ChartConfig): string {
  const { type, data, x, y, width, height, margin, color, title } = config;
  
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  const dataJson = JSON.stringify(data);
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://d3js.org/d3.v7.min.js"><\/script>
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
    #chart { width: ${width}px; height: ${height}px; }
    .axis-label { font-size: 12px; fill: #666; }
    .title { font-size: 16px; font-weight: 600; fill: #333; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script>
    const data = ${dataJson};
    const width = ${innerWidth};
    const height = ${innerHeight};
    const margin = ${JSON.stringify(margin)};
    
    const svg = d3.select('#chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', \`translate(\${margin.left},\${margin.top})\`);
    
    ${generateD3Script(type, x, y, color, title)}
  <\/script>
</body>
</html>`;
}

function generateD3Script(type: string, x: string, y: string, color?: string, title?: string): string {
  const colorValue = color || '#4fc3f7';
  
  switch (type) {
    case 'bar':
      return generateBarChartScript(x, y, colorValue, title);
    case 'line':
      return generateLineChartScript(x, y, colorValue, title);
    case 'pie':
      return generatePieChartScript(x, y, colorValue, title);
    case 'scatter':
      return generateScatterChartScript(x, y, colorValue, title);
    default:
      return generateBarChartScript(x, y, colorValue, title);
  }
}

function generateBarChartScript(x: string, y: string, color: string, title?: string): string {
  return `
    const xScale = d3.scaleBand()
      .domain(data.map(d => d['${x}']))
      .range([0, width])
      .padding(0.2);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d['${y}'])])
      .range([height, 0]);
    
    svg.append('g')
      .attr('transform', \`translate(0,\${height})\`)
      .call(d3.axisBottom(xScale));
    
    svg.append('g')
      .call(d3.axisLeft(yScale));
    
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d['${x}']))
      .attr('y', d => yScale(d['${y}']))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - yScale(d['${y}']))
      .attr('fill', '${color}');
    
    ${title ? `svg.append('text')
      .attr('class', 'title')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .text('${title}');` : ''}
  `;
}

function generateLineChartScript(x: string, y: string, color: string, title?: string): string {
  return `
    const xScale = d3.scalePoint()
      .domain(data.map(d => d['${x}']))
      .range([0, width]);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d['${y}'])])
      .range([height, 0]);
    
    const line = d3.line()
      .x(d => xScale(d['${x}']))
      .y(d => yScale(d['${y}']))
      .curve(d3.curveMonotoneX);
    
    svg.append('g')
      .attr('transform', \`translate(0,\${height})\`)
      .call(d3.axisBottom(xScale));
    
    svg.append('g')
      .call(d3.axisLeft(yScale));
    
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '${color}')
      .attr('stroke-width', 2)
      .attr('d', line);
    
    svg.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d['${x}']))
      .attr('cy', d => yScale(d['${y}']))
      .attr('r', 4)
      .attr('fill', '${color}');
    
    ${title ? `svg.append('text')
      .attr('class', 'title')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .text('${title}');` : ''}
  `;
}

function generatePieChartScript(x: string, y: string, color: string, title?: string): string {
  return `
    const radius = Math.min(width, height) / 2;
    
    const colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d['${x}']))
      .range(d3.schemeCategory10);
    
    const pie = d3.pie()
      .value(d => d['${y}']);
    
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);
    
    const g = svg.append('g')
      .attr('transform', \`translate(\${width/2},\${height/2})\`);
    
    g.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => colorScale(d.data['${x}']));
    
    g.selectAll('text')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('transform', d => \`translate(\${arc.centroid(d)})\`)
      .attr('text-anchor', 'middle')
      .text(d => d.data['${x}']);
    
    ${title ? `svg.append('text')
      .attr('class', 'title')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .text('${title}');` : ''}
  `;
}

function generateScatterChartScript(x: string, y: string, color: string, title?: string): string {
  return `
    const xScale = d3.scaleLinear()
      .domain([d3.min(data, d => d['${x}']), d3.max(data, d => d['${x}'])])
      .range([0, width]);
    
    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d => d['${y}']), d3.max(data, d => d['${y}'])])
      .range([height, 0]);
    
    svg.append('g')
      .attr('transform', \`translate(0,\${height})\`)
      .call(d3.axisBottom(xScale));
    
    svg.append('g')
      .call(d3.axisLeft(yScale));
    
    svg.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d['${x}']))
      .attr('cy', d => yScale(d['${y}']))
      .attr('r', 6)
      .attr('fill', '${color}')
      .attr('opacity', 0.7);
    
    ${title ? `svg.append('text')
      .attr('class', 'title')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .text('${title}');` : ''}
  `;
}