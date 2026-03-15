# CDL for VS Code

Chart Definition Language support for Visual Studio Code.

## Features

### 🎨 Syntax Highlighting
- Full syntax highlighting for `.cdl` files
- Support for keywords (Data, Chart), annotations (@style, @color), and comments
- **v0.6** support: `## series`, `## axis`, `@interaction`

### ✨ Code Snippets
- `data` - Create a data definition block
- `datasql` - Create a SQL data source
- `chart` - Create a chart definition
- `chartstyled` - Create a styled chart with hints
- `example` - Complete data + chart example
- **v0.6 snippets**:
  - `combo` - Combo chart with multi-series and dual axis
  - `multiaxis` - Multi-axis configuration
  - `interaction` - Interaction hints (tooltip, zoom, brush)

### 🖼️ Chart Preview
- Press `Ctrl+Shift+V` (Mac: `Cmd+Shift+V`) to open preview
- Auto-refresh on file change (configurable)
- Side-by-side editing and preview
- **v0.6** syntax support in preview

### 📦 Commands
- **CDL: Preview Chart** - Open chart preview
- **CDL: Compile to JSON** - Compile CDL to AST JSON
- **CDL: Export ECharts Config** - Export ECharts option

### ⚙️ Configuration
- `cdl.preview.autoRefresh` - Auto refresh preview on file change (default: true)
- `cdl.preview.theme` - Chart preview theme: light/dark (default: light)

## Example (v0.6 Combo Chart)

```cdl
@lang(data)
SalesData {
    month,sales,profit
    1月,120,15
    2月,150,18
    3月,180,22
}

# 月度销售分析

## combo

## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| sales | 销售额(万元) | bar | #4fc3f7 | left | solid |
| profit | 利润(万元) | line | #ff9800 | right | smooth |

## axis y
min: 0
max: 200

## axis y2
min: 0
max: 50

@title "销售额 vs 利润"
@interaction "tooltip:shared zoom:inside"
```

## Installation

### From VS Code Marketplace
Search for "CDL - Chart Definition Language" in the Extensions view.

### From VSIX
```bash
code --install-extension cdl-vscode-0.1.0.vsix
```

## Requirements
- VS Code 1.74.0 or higher

## Changelog

### v0.6.0 (2026-03-15)
- ✅ Added `## series` multi-series table support
- ✅ Added `## axis` block configuration (x/y/y2/left/right)
- ✅ Added `@interaction` hints (tooltip, zoom, brush)
- ✅ Updated snippets with v0.6 templates
- ✅ Enhanced hover documentation
- ✅ Improved completion provider

## License
MIT
