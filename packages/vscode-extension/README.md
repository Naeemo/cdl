# CDL for VS Code

Chart Definition Language support for Visual Studio Code.

## Features

### 🎨 Syntax Highlighting
- Full syntax highlighting for `.cdl` files
- Support for keywords (Data, Chart), annotations (@style, @color), and comments

### ✨ Code Snippets
- `data` - Create a data definition block
- `datasql` - Create a SQL data source
- `chart` - Create a chart definition
- `chartstyled` - Create a styled chart with hints
- `example` - Complete data + chart example

### 🖼️ Chart Preview
- Press `Ctrl+Shift+V` (Mac: `Cmd+Shift+V`) to open preview
- Auto-refresh on file change (configurable)
- Side-by-side editing and preview

### 📦 Commands
- **CDL: Preview Chart** - Open chart preview
- **CDL: Compile to JSON** - Compile CDL to AST JSON
- **CDL: Export ECharts Config** - Export ECharts option

### ⚙️ Configuration
- `cdl.preview.autoRefresh` - Auto refresh preview on file change (default: true)
- `cdl.preview.theme` - Chart preview theme: light/dark (default: light)

## Example

```cdl
@lang(data)
SalesData {
    month,sales
    1月,100
    2月,150
    3月,200
}

Chart 月度销售 {
    use SalesData
    type line
    x month
    y sales
    
    @style "平滑曲线"
    @color "#4fc3f7"
    @title "月度销售趋势"
}
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

## License
MIT
