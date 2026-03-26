/**
 * i18n 功能测试
 */

import { 
  t, 
  setLocale, 
  getLocale, 
  formatNumber,
  BuiltInKeys 
} from './dist/i18n/index.js';
import {
  getChartTypeName,
  translateAxisName,
  translateSeriesName,
  translateTitle,
  createTooltipFormatter,
  createPieTooltipFormatter,
  applyI18nToOption,
} from './dist/i18n/chart-i18n.js';
import { detectBrowserLocale, getSupportedLocales } from './dist/i18n/locale-loader.js';

console.log('=== CDL Renderer i18n Test ===\n');

// 测试 1: 基本翻译
console.log('1. Basic Translation Tests');
console.log('   Current locale:', getLocale());
console.log('   Chart type (line):', t('chart.line'));
console.log('   Label total:', t('label.total'));

// 测试 2: 切换语言
console.log('\n2. Locale Switching Tests');
setLocale('en-US');
console.log('   Switched to en-US');
console.log('   Chart type (line):', t('chart.line'));
console.log('   Label total:', t('label.total'));

setLocale('ja-JP');
console.log('   Switched to ja-JP');
console.log('   Chart type (line):', t('chart.line'));
console.log('   Label total:', t('label.total'));

setLocale('de-DE');
console.log('   Switched to de-DE');
console.log('   Chart type (line):', t('chart.line'));
console.log('   Label total:', t('label.total'));

// 测试 3: 图表辅助函数
console.log('\n3. Chart Helper Functions');
setLocale('zh-CN');
console.log('   getChartTypeName("funnel"):', getChartTypeName('funnel'));
console.log('   getChartTypeName("heatmap"):', getChartTypeName('heatmap'));

setLocale('en-US');
console.log('   (en-US) getChartTypeName("funnel"):', getChartTypeName('funnel'));
console.log('   translateAxisName("x"):', translateAxisName('x'));
console.log('   translateTitle("Sales Data"):', translateTitle('Sales Data'));

// 测试 4: 插值
console.log('\n4. Interpolation Test');
setLocale('zh-CN');
console.log('   Drill down:', t('tooltip.drillDown', 'Drill down to: {name}', { name: '北京' }));
setLocale('en-US');
console.log('   Drill down:', t('tooltip.drillDown', 'Drill down to: {name}', { name: 'Beijing' }));

// 测试 5: 数字格式化
console.log('\n5. Number Formatting');
const testNumber = 1234567.89;
setLocale('zh-CN');
console.log('   zh-CN:', formatNumber(testNumber));
setLocale('en-US');
console.log('   en-US:', formatNumber(testNumber));
setLocale('de-DE');
console.log('   de-DE:', formatNumber(testNumber));

// 测试 6: 支持的语言列表
console.log('\n6. Supported Locales');
const locales = getSupportedLocales();
locales.forEach(loc => {
  console.log(`   ${loc.code}: ${loc.name} (${loc.nativeName})`);
});

// 测试 7: applyI18nToOption
console.log('\n7. Apply i18n to ECharts Option');
setLocale('zh-CN');
const testOption = {
  title: { text: 'chart.line' },
  xAxis: { name: 'axis.x', type: 'category' },
  yAxis: { name: 'label.value', type: 'value' },
  series: [{ name: 'label.total', type: 'line', data: [1, 2, 3] }],
  legend: { data: ['label.total', 'label.average'] },
};
const i18nOption = applyI18nToOption(testOption);
console.log('   Original title:', testOption.title.text);
console.log('   Translated title:', i18nOption.title.text);
console.log('   Original xAxis name:', testOption.xAxis.name);
console.log('   Translated xAxis name:', i18nOption.xAxis.name);
console.log('   Original series name:', testOption.series[0].name);
console.log('   Translated series name:', i18nOption.series[0].name);

// 测试 8: 提示框格式化器
console.log('\n8. Tooltip Formatter Test');
setLocale('en-US');
const formatter = createTooltipFormatter();
const mockParams = {
  seriesName: 'Sales',
  name: 'Jan',
  value: 1200,
  marker: '●',
};
console.log('   Tooltip output:', formatter(mockParams));

// 测试 9: 所有语言的基本翻译验证
console.log('\n9. All Locales Verification');
const testKeys = ['chart.line', 'chart.bar', 'label.total'];
locales.forEach(loc => {
  setLocale(loc.code);
  const translations = testKeys.map(k => t(k)).join(', ');
  console.log(`   ${loc.code}: ${translations}`);
});

console.log('\n=== All Tests Completed ===');
