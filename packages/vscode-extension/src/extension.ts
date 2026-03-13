import * as vscode from 'vscode';
import * as path from 'path';

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
    previewPanel.webview.html = getPreviewHtml(cdlContent);
}

function getPreviewHtml(cdlContent: string): string {
    // Simple mock preview - in real implementation would use the compiler/renderer
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
            background: #f5f5f5;
        }
        #chart {
            width: 100%;
            height: 500px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .info {
            margin-top: 20px;
            padding: 15px;
            background: white;
            border-radius: 8px;
            font-size: 13px;
            color: #666;
        }
        .info h3 {
            margin-top: 0;
            color: #333;
        }
        pre {
            background: #f8f8f8;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div id="chart"></div>
    <div class="info">
        <h3>CDL Source</h3>
        <pre>${escapeHtml(cdlContent)}</pre>
    </div>
    <script>
        // Mock chart rendering - would use actual CDL compiler in production
        const chartDom = document.getElementById('chart');
        const myChart = echarts.init(chartDom);
        
        const option = {
            title: { text: 'CDL Preview (Mock)', left: 'center' },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
            yAxis: { type: 'value' },
            series: [{
                data: [120, 200, 150, 80, 70, 110],
                type: 'line',
                smooth: true,
                areaStyle: {}
            }]
        };
        
        myChart.setOption(option);
        window.addEventListener('resize', () => myChart.resize());
    </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function compileCDL(document: vscode.TextDocument) {
    try {
        // Mock compilation - would use actual compiler
        const content = document.getText();
        const mockAst = {
            data: [],
            charts: [],
            _source: content.slice(0, 100) + '...'
        };

        const output = JSON.stringify(mockAst, null, 2);
        
        const doc = await vscode.workspace.openTextDocument({
            content: output,
            language: 'json'
        });
        
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Two);
        vscode.window.showInformationMessage('CDL compiled to JSON (Mock)');
    } catch (error) {
        vscode.window.showErrorMessage(`Compile failed: ${error}`);
    }
}

async function exportECharts(document: vscode.TextDocument) {
    try {
        // Mock export - would use actual renderer
        const mockEChartsOption = {
            title: { text: 'Exported Chart' },
            xAxis: { type: 'category', data: ['A', 'B', 'C'] },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: [1, 2, 3] }]
        };

        const output = JSON.stringify(mockEChartsOption, null, 2);
        
        const doc = await vscode.workspace.openTextDocument({
            content: output,
            language: 'json'
        });
        
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Two);
        vscode.window.showInformationMessage('ECharts config exported (Mock)');
    } catch (error) {
        vscode.window.showErrorMessage(`Export failed: ${error}`);
    }
}