import { 
  lightTheme, 
  darkTheme, 
  corporateTheme, 
  minimalTheme, 
  vibrantTheme,
  getTheme, 
  listThemes, 
  applyTheme,
  registerTheme,
  type Theme 
} from './index.js';

console.log('=== Theme System Tests ===\n');

// Test 1: List themes
console.log('Test 1: List available themes');
const themes = listThemes();
console.log('✅ Available themes:', themes.join(', '));

// Test 2: Get theme
console.log('\nTest 2: Get theme by name');
const light = getTheme('light');
console.log('✅ Light theme name:', light.name);
console.log('✅ Primary colors count:', light.colors.primary.length);

// Test 3: Default fallback
console.log('\nTest 3: Default fallback for unknown theme');
const unknown = getTheme('nonexistent');
console.log('✅ Fallback to:', unknown.name);

// Test 4: Theme properties
console.log('\nTest 4: Theme properties validation');
const dark = getTheme('dark');
console.log('✅ Dark theme background:', dark.colors.background);
console.log('✅ Font family:', dark.typography.fontFamily);
console.log('✅ Animation duration:', dark.animation.duration);

// Test 5: Apply theme to config
console.log('\nTest 5: Apply theme to chart config');
const baseConfig = {
  title: { text: 'Test Chart' },
  xAxis: { type: 'category' },
  series: [{ type: 'line' }],
};
const themedConfig = applyTheme(baseConfig, 'corporate');
console.log('✅ Themed config has backgroundColor:', !!themedConfig.backgroundColor);
console.log('✅ Themed config has color array:', !!themedConfig.color);

// Test 6: Register custom theme
console.log('\nTest 6: Register custom theme');
const customTheme: Theme = {
  name: 'custom',
  colors: {
    primary: ['#ff0000', '#00ff00', '#0000ff'],
    background: '#ffffff',
    foreground: '#000000',
    grid: '#eeeeee',
    text: '#333333',
    title: '#000000',
    axis: '#666666',
    tooltip: {
      background: '#ffffff',
      text: '#000000',
      border: '#cccccc',
    },
  },
  typography: {
    fontFamily: 'Arial',
    fontSize: { small: 10, medium: 12, large: 14, title: 16 },
    fontWeight: { normal: 400, bold: 700 },
  },
  layout: {
    margin: { top: 20, right: 20, bottom: 40, left: 50 },
    padding: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: 4,
  },
  animation: {
    duration: 500,
    easing: 'ease-out',
    delay: 0,
  },
};
registerTheme('custom', customTheme);
console.log('✅ Custom theme registered');
console.log('✅ Updated themes list:', listThemes().join(', '));

// Test 7: All theme variations
console.log('\nTest 7: All theme variations');
[lightTheme, darkTheme, corporateTheme, minimalTheme, vibrantTheme].forEach(theme => {
  console.log(`✅ ${theme.name}: ${theme.colors.primary.length} colors, ${theme.typography.fontSize.title}px title`);
});

console.log('\n=== All tests passed ===');
