import * as vscode from 'vscode';
import * as path from 'path';

// Import CDL compiler and renderer
// Note: These are loaded from the local packages
let compile: (source: string) => { success: boolean; result?: any; errors: any[] };
let render: (cdlFile: any) => { success: boolean; option?: any; error?: string };

try {
  // Try to load the compiled modules
  const compilerModule = require('@cdl/compiler');
  const rendererModule = require('@cdl/renderer-echarts');
  compile = compilerModule.compile;
  render = rendererModule.render;
} catch (e) {
  // Fallback to mock implementations if modules aren't built
  console.log('CDL modules not found, using mock implementations');
  compile = mockCompile;
  render = mockRender;
}

let previewPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('CDL extension activated');

  // Register completion provider
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    'cdl',
    {
      provideCompletionItems(document, position) {
        const lineText = document.lineAt(position).text.substring(0, position.character);
        const completions: vscode.CompletionItem[] = [];

        // Directives
        if (lineText.includes('@') || lineText.trim() === '') {
          const directives = [
            { name: '@source', detail: '数据源 URL', example: "@source('https://api.example.com/data')" },
            { name: '@timeout', detail: '超时时间(秒)', example: '@timeout(30)' },
            { name: '@cache', detail: '缓存时间(秒)', example: '@cache(300)' },
            { name: '@params', detail: '请求参数', example: '@params({key: "value"})' },
            { name: '@lang', detail: '查询语言', example: '@lang(sql)' },
            { name: '@style', detail: '图表样式', example: '@style("平滑曲线")' },
            { name: '@color', detail: '主题颜色', example: '@color("#4fc3f7")' },
            { name: '@title', detail: '图表标题', example: '@title("月度销售")' },
            { name: '@animation', detail: '动画效果', example: '@animation("fade")' },
            { name: '@interaction', detail: '交互方式', example: '@interaction("zoom")' },
            { name: '@layout', detail: '布局方式', example: '@layout("horizontal")' }
          ];

          directives.forEach(d => {
            const item = new vscode.CompletionItem(d.name, vscode.CompletionItemKind.Keyword);
            item.detail = d.detail;
            item.insertText = d.example;
            item.documentation = new vscode.MarkdownString(`**${d.name}**\n\n${d.detail}\n\n示例:\n\`\`\`cdl\n${d.example}\n\`\`\``);
            completions.push(item);
          });
        }

        // Chart types
        if (lineText.match(/type\s*/)) {
          const types = ['line', 'bar', 'pie', 'scatter', 'area', 'radar', 'heatmap', 'gauge'];
          types.forEach(t => {
            const item = new vscode.CompletionItem(t, vscode.CompletionItemKind.Enum);
            item.detail = `${t} 图表`;
            completions.push(item);
          });
        }

        // Keywords
        const keywords = ['Data', 'Chart', 'use', 'type', 'x', 'y', 'group', 'stack'];
        keywords.forEach(kw => {
          const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
          completions.push(item);
        });

        return completions;
      }
    },
    '@', ' ', '
  );

  // Register hover provider
  const hoverProvider = vscode.languages.registerHoverProvider('cdl', {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position, /[\w@]+/);
      const word = document.getText(range);

      const docs: Record<string, string> = {
        '@source': '指定数据源 URL\n\n支持:\n- HTTP/HTTPS API\n- WebSocket (ws://, wss://)\n- 本地文件路径',
        '@timeout': '设置请求超时时间（秒）',
        '@cache': '设置数据缓存时间（秒）',
        '@style': '图表样式修饰\n\n常用:\n- "平滑曲线"\n- "渐变填充"\n- "环形"',
        '@color': '指定主题颜色（hex格式）',
        '@title': '设置图表标题',
        'Data': '定义数据块\n\n语法: `Data 名称 { ... }`',
        'Chart': '定义图表\n\n语法: `Chart 名称 { ... }`',
        'use': '引用数据源\n\n语法: `use DataName`',
        'type': '指定图表类型\n\n可选: line, bar, pie, scatter, area, radar',
        'x': 'X轴字段',
        'y': 'Y轴字段'
      };

      if (docs[word]) {
        return new vscode.Hover(new vscode.MarkdownString(docs[word]));
      }
    }
  });

  // Register diagnostic collection
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('cdl');
  
  const validateDocument = (document: vscode.TextDocument) => {
    if (document.languageId !== 'cdl') return;
    
    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];

    // Check for common errors
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      // Missing Data name
      if (line.match(/^Data\s*\{/)) {
        const range = new vscode.Range(i, 0, i, line.length);
        diagnostics.push(new vscode.Diagnostic(
          range,
          'Data 定义缺少名称，建议使用 "Data SalesData {"',
          vscode.DiagnosticSeverity.Error
        ));
      }

      // Unclosed quotes
      const quoteCount = (line.match(/["']/g) || []).length;
      if (quoteCount % 2 !== 0) {
        const range = new vscode.Range(i, line.lastIndexOf('"') || 0, i, line.length);
        diagnostics.push(new vscode.Diagnostic(
          range,
          '引号不匹配',
          vscode.DiagnosticSeverity.Error
        ));
      }

      // Unknown directives
      const directiveMatch = line.match(/@(\w+)/);
      if (directiveMatch) {
        const knownDirectives = ['source', 'timeout', 'cache', 'params', 'lang', 'style', 'color', 'title', 'animation', 'interaction', 'layout'];
        if (!knownDirectives.includes(directiveMatch[1])) {
          const range = new vscode.Range(i, line.indexOf('@'), i, line.indexOf('@') + directiveMatch[1].length + 1);
          diagnostics.push(new vscode.Diagnostic(
            range,
            `未知指令 "@${directiveMatch[1]}"`,
            vscode.DiagnosticSeverity.Warning
          ));
        }
      }
    });

    // Check brace balance
    let braceCount = 0;
    lines.forEach((line, i) => {
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
    });
    if (braceCount !== 0) {
      const lastLine = lines.length - 1;
      diagnostics.push(new vscode.Diagnostic(
        new vscode.Range(lastLine, 0, lastLine, lines[lastLine]?.length || 0),
        braceCount > 0 ? `缺少 ${braceCount} 个闭合括号 '}'` : `多余 ${-braceCount} 个闭合括号`,
        vscode.DiagnosticSeverity.Error
      ));
    }

    diagnosticCollection.set(document.uri, diagnostics);
  };

  // Watch for document changes
  const onOpen = vscode.workspace.onDidOpenTextDocument(validateDocument);
  const onChange = vscode.workspace.onDidChangeTextDocument((e) => {
    validateDocument(e.document);
    if (previewPanel && isAutoRefreshEnabled()) {
      showPreview(context, e.document);
    }
  });
  const onSave = vscode.workspace.onDidSaveTextDocument(validateDocument);

  context.subscriptions.push(completionProvider, hoverProvider, diagnosticCollection, onOpen, onChange, onSave);

  // Register commands
  const previewCommand = vscode.commands.registerCommand('cdl.preview', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active CDL file');
      return;
    }
    showPreview(context, editor.document);
  });

  const compileCommand = vscode.commands.registerCommand('cdl.compile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active CDL file');
      return;
    }
    await compileCDL(editor.document);
  });

  const exportCommand = vscode.commands.registerCommand('cdl.exportECharts', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active CDL file');
      return;
    }
    await exportECharts(editor.document);
  });

  context.subscriptions.push(previewCommand, compileCommand, exportCommand);

  // Validate all open documents
  vscode.workspace.textDocuments.forEach(validateDocument);
}

export function deactivate() {
  if (previewPanel) {
    previewPanel.dispose();
  }
}

function isAutoRefreshEnabled(): boolean {
  const config = vscode.workspace.getConfiguration('cdl.preview');
  return config.get('autoRefresh', true);
}

function showPreview(context: vscode.ExtensionContext, document: vscode.TextDocument) {
  const column = vscode.ViewColumn.Two;

  if (previewPanel) {
    previewPanel.reveal(column);
  } else {
    previewPanel = vscode.window.createWebviewPanel(
      'cdlPreview',
      'CDL Preview',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    previewPanel.onDidDispose(() => {
      previewPanel = undefined;
    });
  }

  const cdlContent = document.getText();
  
  // Compile and render
  const compileResult = compile(cdlContent);
  if (!compileResult.success) {
    previewPanel.webview.html = getErrorHtml(compileResult.errors);
    return;
  }

  const renderResult = render(compileResult.result);
  if (!renderResult.success) {
    previewPanel.webview.html = getErrorHtml([{ message: renderResult.error || 'Render failed' }]);
    return;
  }

  previewPanel.webview.html = getPreviewHtml(renderResult.option);
}

function getPreviewHtml(echartsOption: any): string {
  const config = vscode.workspace.getConfiguration('cdl.preview');
  const theme = config.get('theme', 'light');
  const bgColor = theme === 'dark' ? '#1e1e1e' : '#ffffff';
  const textColor = theme === 'dark' ? '#cccccc' : '#333333';

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CDL Preview</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: ${bgColor};
            color: ${textColor};
        }
        #chart {
            width: 100%;
            height: 500px;
            background: ${bgColor};
            border-radius: 8px;
        }
        .empty {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 500px;
            color: #999;
        }
    </style>
</head>
<body>
    <div id="chart"></div>
    <script>
        try {
            const chartDom = document.getElementById('chart');
            const myChart = echarts.init(chartDom, '${theme === 'dark' ? 'dark' : ''}');
            const option = ${JSON.stringify(echartsOption)};
            myChart.setOption(option);
            window.addEventListener('resize', () => myChart.resize());
        } catch (e) {
            document.getElementById('chart').innerHTML = '<div class="empty">Error: ' + e.message + '</div>';
        }
    </script>
</body>
</html>`;
}

function getErrorHtml(errors: any[]): string {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fff2f0;
            color: #ff4d4f;
        }
        .error-container {
            padding: 16px;
            background: #fff;
            border: 1px solid #ffccc7;
            border-radius: 4px;
        }
        h3 {
            margin-top: 0;
        }
        pre {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h3>❌ Compilation Error</h3>
        ${errors.map(e => `<pre>Line ${e.line || '?'}: ${e.message}</pre>`).join('')}
    </div>
</body>
</html>`;
}

async function compileCDL(document: vscode.TextDocument) {
  try {
    const content = document.getText();
    const result = compile(content);

    if (!result.success) {
      vscode.window.showErrorMessage(`Compile failed: ${result.errors.map(e => e.message).join(', ')}`);
      return;
    }

    const output = JSON.stringify(result.result, null, 2);

    const doc = await vscode.workspace.openTextDocument({
      content: output,
      language: 'json'
    });

    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Two);
    vscode.window.showInformationMessage('CDL compiled to JSON');
  } catch (error) {
    vscode.window.showErrorMessage(`Compile failed: ${error}`);
  }
}

async function exportECharts(document: vscode.TextDocument) {
  try {
    const content = document.getText();
    const compileResult = compile(content);

    if (!compileResult.success) {
      vscode.window.showErrorMessage(`Compile failed: ${compileResult.errors.map(e => e.message).join(', ')}`);
      return;
    }

    const renderResult = render(compileResult.result);

    if (!renderResult.success) {
      vscode.window.showErrorMessage(`Render failed: ${renderResult.error}`);
      return;
    }

    const output = JSON.stringify(renderResult.option, null, 2);

    const doc = await vscode.workspace.openTextDocument({
      content: output,
      language: 'json'
    });

    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Two);
    vscode.window.showInformationMessage('ECharts config exported');
  } catch (error) {
    vscode.window.showErrorMessage(`Export failed: ${error}`);
  }
}

// Mock implementations for fallback
function mockCompile(source: string) {
  return {
    success: false,
    errors: [{ message: 'CDL compiler not built. Run "npm run build" in packages/compiler' }]
  };
}

function mockRender(cdlFile: any) {
  return {
    success: false,
    error: 'CDL renderer not built. Run "npm run build" in packages/renderer'
  };
}