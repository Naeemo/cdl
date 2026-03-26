/**
 * CDL Chart Linkage Example
 * 
 * 演示如何使用 ChartLinkageProvider 和 linkage 配置实现多图表联动高亮
 */

import React, { useState } from 'react';
import { CDLChart, ChartLinkageProvider, LinkageConfig } from '@naeemo/cdl-react';

// 示例 CDL 代码 - 销售数据
const salesByCategoryCDL = `
CHART Bar {
  title: "按类别销售额"
  data: [
    { category: "电子产品", sales: 120000, profit: 25000 },
    { category: "服装", sales: 85000, profit: 35000 },
    { category: "食品", sales: 65000, profit: 15000 },
    { category: "家居", sales: 95000, profit: 20000 },
    { category: "图书", sales: 45000, profit: 12000 }
  ]
  x: category
  y: sales
}
`;

const salesByRegionCDL = `
CHART Bar {
  title: "按地区销售额"
  data: [
    { region: "华东", sales: 150000, profit: 35000 },
    { region: "华北", sales: 110000, profit: 28000 },
    { region: "华南", sales: 130000, profit: 32000 },
    { region: "西南", sales: 80000, profit: 18000 },
    { region: "西北", sales: 50000, profit: 10000 }
  ]
  x: region
  y: sales
}
`;

// 按类别利润图表（与第一个图表联动）
const profitByCategoryCDL = `
CHART Pie {
  title: "按类别利润分布"
  data: [
    { category: "电子产品", profit: 25000 },
    { category: "服装", profit: 35000 },
    { category: "食品", profit: 15000 },
    { category: "家居", profit: 20000 },
    { category: "图书", profit: 12000 }
  ]
  label: category
  value: profit
}
`;

// 月度趋势图表
const monthlyTrendCDL = `
CHART Line {
  title: "月度销售趋势"
  data: [
    { month: "1月", sales: 80000, category: "电子产品" },
    { month: "2月", sales: 95000, category: "电子产品" },
    { month: "3月", sales: 110000, category: "电子产品" },
    { month: "1月", sales: 60000, category: "服装" },
    { month: "2月", sales: 75000, category: "服装" },
    { month: "3月", sales: 85000, category: "服装" }
  ]
  x: month
  y: sales
  series: category
}
`;

/**
 * 基础联动示例
 * 展示两个图表按 category 字段联动
 */
export const BasicLinkageExample: React.FC = () => {
  // 联动配置 - 按 category 字段联动
  const categoryLinkage: LinkageConfig = {
    groupId: 'sales-dashboard',
    linkField: 'category',
    enableHover: true,
    highlightStyle: {
      opacity: 1,
      borderWidth: 3,
      borderColor: '#fff',
    },
    unhighlightStyle: {
      opacity: 0.3,
    },
  };

  return (
    <ChartLinkageProvider>
      <div style={{ padding: 20 }}>
        <h2>基础联动示例</h2>
        <p>悬停在左侧柱状图的任意柱子上，右侧饼图会高亮显示相同类别的数据。</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <CDLChart
            code={salesByCategoryCDL}
            width="100%"
            height={350}
            linkage={categoryLinkage}
          />
          
          <CDLChart
            code={profitByCategoryCDL}
            width="100%"
            height={350}
            linkage={categoryLinkage}
          />
        </div>
      </div>
    </ChartLinkageProvider>
  );
};

/**
 * 多组联动示例
 * 展示多个联动组的独立工作
 */
export const MultiGroupLinkageExample: React.FC = () => {
  // 第一组：按类别联动
  const categoryLinkage: LinkageConfig = {
    groupId: 'category-group',
    linkField: 'category',
    enableHover: true,
  };

  // 第二组：按地区联动
  const regionLinkage: LinkageConfig = {
    groupId: 'region-group',
    linkField: 'region',
    enableHover: true,
  };

  return (
    <ChartLinkageProvider>
      <div style={{ padding: 20 }}>
        <h2>多组联动示例</h2>
        
        <p>上方两个图表按类别联动，下方两个图表按地区联动，两组互不影响。</p>
        
        <div style={{ marginBottom: 30 }}>
          <h3>类别分析组</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <CDLChart
              code={salesByCategoryCDL}
              width="100%"
              height={300}
              linkage={categoryLinkage}
            />
            <CDLChart
              code={profitByCategoryCDL}
              width="100%"
              height={300}
              linkage={categoryLinkage}
            />
          </div>
        </div>

        <div>
          <h3>地区分析组</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <CDLChart
              code={salesByRegionCDL}
              width="100%"
              height={300}
              linkage={regionLinkage}
            />
            <CDLChart
              code={salesByRegionCDL}
              width="100%"
              height={300}
              linkage={regionLinkage}
            />
          </div>
        </div>
      </div>
    </ChartLinkageProvider>
  );
};

/**
 * 点击联动示例
 * 展示点击触发的联动（持久化高亮）
 */
export const ClickLinkageExample: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoryLinkage: LinkageConfig = {
    groupId: 'click-group',
    linkField: 'category',
    enableHover: true,
    enableClick: true,
    highlightStyle: {
      opacity: 1,
      borderWidth: 3,
      borderColor: '#1890ff',
    },
    unhighlightStyle: {
      opacity: 0.2,
    },
  };

  const handleChartClick = (data: any) => {
    setSelectedCategory(data?.category || data?.name);
  };

  return (
    <ChartLinkageProvider>
      <div style={{ padding: 20 }}>
        <h2>点击联动示例</h2>
        
        <p>悬停预览高亮，点击图表元素锁定高亮状态。</p>
        
        {selectedCategory && (
          <div style={{ 
            marginBottom: 16, 
            padding: '8px 16px', 
            background: '#e6f7ff', 
            border: '1px solid #91d5ff',
            borderRadius: 4 
          }}>
            已选择类别: <strong>{selectedCategory}</strong>
          </div>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <CDLChart
            code={salesByCategoryCDL}
            width="100%"
            height={350}
            linkage={categoryLinkage}
            onClick={handleChartClick}
          />
          
          <CDLChart
            code={profitByCategoryCDL}
            width="100%"
            height={350}
            linkage={categoryLinkage}
            onClick={handleChartClick}
          />
        </div>
      </div>
    </ChartLinkageProvider>
  );
};

/**
 * 自定义样式联动示例
 */
export const CustomStyleLinkageExample: React.FC = () => {
  const customLinkage: LinkageConfig = {
    groupId: 'custom-style-group',
    linkField: 'category',
    enableHover: true,
    highlightStyle: {
      opacity: 1,
      borderWidth: 4,
      borderColor: '#ff6b6b',
    },
    unhighlightStyle: {
      opacity: 0.15,
    },
  };

  return (
    <ChartLinkageProvider>
      <div style={{ padding: 20 }}>
        <h2>自定义样式联动</h2>
        
        <p>使用自定义高亮样式（红色边框）。</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <CDLChart
            code={salesByCategoryCDL}
            width="100%"
            height={350}
            linkage={customLinkage}
          />
          
          <CDLChart
            code={profitByCategoryCDL}
            width="100%"
            height={350}
            linkage={customLinkage}
          />
        </div>
      </div>
    </ChartLinkageProvider>
  );
};

/**
 * 完整示例页面
 */
const LinkageExamplePage: React.FC = () => {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1>CDL 图表联动高亮示例</h1>
      
      <BasicLinkageExample />
      
      <hr style={{ margin: '40px 0' }} />
      
      <MultiGroupLinkageExample />
      
      <hr style={{ margin: '40px 0' }} />
      
      <ClickLinkageExample />
      
      <hr style={{ margin: '40px 0' }} />
      
      <CustomStyleLinkageExample />
    </div>
  );
};

export default LinkageExamplePage;
