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

  // Watch for document changes
  const onChange = vscode.workspace.onDidChangeTextDocument((e) => {
    if (e.document.languageId === 'cdl' && previewPanel && isAutoRefreshEnabled()) {
      showPreview(context, e.document);
    }
  });

  context.subscriptions.push(previewCommand, compileCommand, exportCommand, onChange);
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