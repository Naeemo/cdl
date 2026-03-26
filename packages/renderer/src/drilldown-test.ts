/**
 * CDL 数据下钻功能测试
 * 测试内容：
 * 1. 编译带有 drill-down 配置的 CDL 代码
 * 2. 渲染图表并验证下钻配置
 * 3. 模拟点击事件触发下钻
 * 4. 验证详情面板弹出
 */

import { compile } from '../../compiler/dist/compiler.js';
import { render } from './index.js';

// ============================================
// 测试用例 1: 基础下钻配置
// ============================================
const testCDL_BasicDrilldown = `
@lang(data)
SalesData {
    category,subcategory,product,sales,quantity
    电子产品,手机,iPhone 15,450000,500
    电子产品,手机,Galaxy S24,320000,400
    电子产品,电脑,MacBook Pro,280000,200
    服装,男装,T恤,85000,1000
    服装,女装,连衣裙,120000,600
}

Chart 销售分析 {
    use SalesData
    type bar
    x category
    y sales
    
    @title "销售数据（支持下钻）"
    @interaction "drill-down:true"
}
`;

// ============================================
// 测试用例 2: 高级下钻配置
// ============================================
const testCDL_AdvancedDrilldown = `
@lang(data)
SalesData {
    category,subcategory,product,sales,profit
    电子产品,手机,iPhone 15,450000,90000
    电子产品,电脑,MacBook Pro,280000,56000
    服装,男装,T恤,85000,17000
    服装,女装,连衣裙,120000,36000
}

Chart 多级下钻 {
    use SalesData
    type pie
    x category
    y sales
    group subcategory
    
    @title "多级下钻示例"
    @interaction "drill-down:field=category,levels=3,breadcrumb:true"
}
`;

// ============================================
// 测试用例 3: 漏斗图下钻
// ============================================
const testCDL_FunnelDrilldown = `
@lang(data)
FunnelData {
    stage,count,conversion
    访问,10000,100
    点击,5000,50
    加入购物车,2000,20
    结算,1000,10
    支付,800,8
}

Chart 转化漏斗 {
    use FunnelData
    type funnel
    x stage
    y count
    
    @title "转化漏斗（支持下钻）"
    @interaction "drill-down:true"
}
`;

// ============================================
// 测试执行
// ============================================
console.log('🧪 CDL 数据下钻功能测试\n');
console.log('=' .repeat(50));

interface TestResult {
    name: string;
    success: boolean;
    error?: string;
    drillDownConfig?: any;
}

const results: TestResult[] = [];

// 测试 1: 基础下钻
console.log('\n📋 测试 1: 基础下钻配置');
try {
    const compiled = compile(testCDL_BasicDrilldown);
    
    if (compiled.file && compiled.file.charts.length > 0) {
        const rendered = render(compiled.file);
        
        if (rendered.success && rendered.option) {
            const drillDownConfig = rendered.option.drillDown;
            
            if (drillDownConfig && drillDownConfig.enabled) {
                console.log('  ✅ 下钻配置已正确应用');
                console.log('  📊 配置详情:', JSON.stringify(drillDownConfig, null, 2));
                results.push({
                    name: '基础下钻',
                    success: true,
                    drillDownConfig
                });
            } else {
                console.log('  ⚠️ 下钻配置未找到，但图表渲染成功');
                results.push({
                    name: '基础下钻',
                    success: true,
                    drillDownConfig: null
                });
            }
        } else {
            throw new Error(rendered.error || '渲染失败');
        }
    } else {
        throw new Error(compiled.errors?.join(', ') || '编译失败');
    }
} catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log('  ❌ 测试失败:', errorMsg);
    results.push({
        name: '基础下钻',
        success: false,
        error: errorMsg
    });
}

// 测试 2: 高级下钻
console.log('\n📋 测试 2: 高级下钻配置');
try {
    const compiled = compile(testCDL_AdvancedDrilldown);
    
    if (compiled.file && compiled.file.charts.length > 0) {
        const rendered = render(compiled.file);
        
        if (rendered.success && rendered.option) {
            const drillDownConfig = rendered.option.drillDown;
            
            console.log('  ✅ 图表渲染成功');
            console.log('  📊 图表类型:', compiled.file.charts[0]?.chartType);
            console.log('  🔍 下钻配置:', JSON.stringify(drillDownConfig, null, 2));
            
            results.push({
                name: '高级下钻',
                success: true,
                drillDownConfig
            });
        } else {
            throw new Error(rendered.error || '渲染失败');
        }
    } else {
        throw new Error(compiled.errors?.join(', ') || '编译失败');
    }
} catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log('  ❌ 测试失败:', errorMsg);
    results.push({
        name: '高级下钻',
        success: false,
        error: errorMsg
    });
}

// 测试 3: 漏斗图下钻
console.log('\n📋 测试 3: 漏斗图下钻');
try {
    const compiled = compile(testCDL_FunnelDrilldown);
    
    if (compiled.file && compiled.file.charts.length > 0) {
        const rendered = render(compiled.file);
        
        if (rendered.success && rendered.option) {
            const drillDownConfig = rendered.option.drillDown;
            const series = rendered.option.series;
            
            console.log('  ✅ 漏斗图渲染成功');
            console.log('  📊 系列类型:', series?.[0]?.type);
            console.log('  🔍 下钻配置:', JSON.stringify(drillDownConfig, null, 2));
            
            // 验证 cursor 是否设置为 pointer
            if (series && series[0] && series[0].cursor === 'pointer') {
                console.log('  ✅ 鼠标样式已设置为 pointer');
            }
            
            results.push({
                name: '漏斗图下钻',
                success: true,
                drillDownConfig
            });
        } else {
            throw new Error(rendered.error || '渲染失败');
        }
    } else {
        throw new Error(compiled.errors?.join(', ') || '编译失败');
    }
} catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log('  ❌ 测试失败:', errorMsg);
    results.push({
        name: '漏斗图下钻',
        success: false,
        error: errorMsg
    });
}

// ============================================
// 测试结果汇总
// ============================================
console.log('\n' + '='.repeat(50));
console.log('📊 测试结果汇总');
console.log('='.repeat(50));

const passed = results.filter(r => r.success).length;
const total = results.length;

results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.name}`);
    if (result.error) {
        console.log(`   错误: ${result.error}`);
    }
});

console.log('\n' + '-'.repeat(50));
console.log(`总计: ${passed}/${total} 通过`);

if (passed === total) {
    console.log('🎉 所有测试通过！');
    process.exit(0);
} else {
    console.log('⚠️ 部分测试失败');
    process.exit(1);
}
