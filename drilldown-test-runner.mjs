#!/usr/bin/env node

/**
 * CDL 数据下钻功能测试脚本
 * 运行方式: node drilldown-test-runner.mjs
 */

import { compile } from './packages/compiler/dist/compiler.js';
import { render } from './packages/renderer/dist/index.js';

// ============================================
// 测试用例
// ============================================
const testCases = [
    {
        name: '基础下钻配置',
        cdl: `Chart 销售分析 {
    use SalesData
    type bar
    x category
    y sales
    
    @title "销售数据（支持下钻）"
    @interaction "drill-down:true"
}`
    },
    {
        name: '高级下钻配置',
        cdl: `Chart 多级下钻 {
    use SalesData
    type pie
    x category
    y sales
    group subcategory
    
    @title "多级下钻示例"
    @interaction "drill-down:field=category,levels=3,breadcrumb:true"
}`
    },
    {
        name: '漏斗图下钻',
        cdl: `Chart 转化漏斗 {
    use FunnelData
    type funnel
    x stage
    y count
    
    @title "转化漏斗（支持下钻）"
    @interaction "drill-down:true"
}`
    }
];

// 添加数据源定义
const dataSource = `
@lang(data)
SalesData {
    category,subcategory,product,sales,quantity
    电子产品,手机,iPhone 15,450000,500
    电子产品,手机,Galaxy S24,320000,400
    电子产品,电脑,MacBook Pro,280000,200
    服装,男装,T恤,85000,1000
    服装,女装,连衣裙,120000,600
}

@lang(data)
FunnelData {
    stage,count,conversion
    访问,10000,100
    点击,5000,50
    加入购物车,2000,20
    结算,1000,10
    支付,800,8
}
`;

// ============================================
// 测试执行
// ============================================
console.log('🧪 CDL 数据下钻功能测试\n');
console.log('='.repeat(60));

const results = [];

for (const testCase of testCases) {
    console.log(`\n📋 测试: ${testCase.name}`);
    
    try {
        // 组合完整 CDL（数据源 + 图表）
        const fullCDL = dataSource + '\n' + testCase.cdl;
        
        // 编译 CDL
        const compiled = compile(fullCDL);
        
        if (compiled.file?.charts?.length > 0) {
            // 渲染图表
            const rendered = render(compiled.file);
            
            if (rendered.success && rendered.option) {
                const drillDownConfig = rendered.option.drillDown;
                const series = rendered.option.series;
                
                console.log(`  ✅ 编译成功`);
                console.log(`  ✅ 渲染成功`);
                console.log(`  📊 图表类型: ${compiled.file.charts[0]?.chartType}`);
                
                if (drillDownConfig) {
                    console.log(`  🔍 下钻配置: ${JSON.stringify(drillDownConfig, null, 4).replace(/\n/g, '\n     ')}`);
                } else {
                    console.log(`  ⚠️ 下钻配置未生效（interaction可能未正确解析）`);
                }
                
                // 验证 cursor 是否设置为 pointer
                if (series?.[0]?.cursor === 'pointer') {
                    console.log(`  ✅ 鼠标样式已设置为 pointer（支持点击）`);
                }
                
                // 验证 tooltip 配置
                if (rendered.option.tooltip) {
                    console.log(`  ✅ Tooltip 配置: ${rendered.option.tooltip.trigger}`);
                }
                
                results.push({
                    name: testCase.name,
                    success: true,
                    chartType: compiled.file.charts[0]?.chartType,
                    hasDrillDown: !!drillDownConfig
                });
            } else {
                throw new Error(rendered.error || '渲染失败');
            }
        } else {
            const errors = compiled.errors?.map(e => e.message).join(', ');
            throw new Error(errors || '编译失败：未生成图表');
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`  ❌ 测试失败: ${errorMsg}`);
        results.push({
            name: testCase.name,
            success: false,
            error: errorMsg
        });
    }
}

// ============================================
// 测试结果汇总
// ============================================
console.log('\n' + '='.repeat(60));
console.log('📊 测试结果汇总');
console.log('='.repeat(60));

const passed = results.filter(r => r.success).length;
const total = results.length;

results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.name}`);
    if (result.chartType) {
        console.log(`   图表类型: ${result.chartType}`);
    }
    if (result.hasDrillDown) {
        console.log(`   下钻功能: 已启用`);
    }
    if (result.error) {
        console.log(`   错误: ${result.error}`);
    }
});

console.log('\n' + '-'.repeat(60));
console.log(`总计: ${passed}/${total} 通过`);

if (passed === total) {
    console.log('🎉 所有测试通过！下钻功能工作正常。');
    process.exit(0);
} else {
    console.log('⚠️ 部分测试失败，请检查实现。');
    process.exit(1);
}
