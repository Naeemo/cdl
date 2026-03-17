#!/usr/bin/env node

/**
 * CDL MCP Server - Model Context Protocol server for CDL
 * Exposes CDL tools to AI agents via stdio
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { nlToCDL, NLToCDLResult } from '@naeemo/cdl-ai';
import { compile, validate } from '@naeemo/cdl-compiler';
import { render } from '@naeemo/cdl-renderer-echarts';

const server = new Server(
  {
    name: 'cdl-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Define tools matching mcp-server.json
const tools: Tool[] = [
  {
    name: 'compile_cdl',
    description: 'Compile CDL code to AST or check syntax errors',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'CDL source code'
        }
      },
      required: ['code']
    }
  },
  {
    name: 'validate_cdl',
    description: 'Quick validation of CDL syntax (does not generate full AST)',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'CDL source code'
        }
      },
      required: ['code']
    }
  },
  {
    name: 'render_cdl',
    description: 'Compile and render CDL to ECharts configuration',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'CDL source code'
        },
        format: {
          type: 'string',
          enum: ['echarts', 'json'],
          default: 'echarts'
        }
      },
      required: ['code']
    }
  },
  {
    name: 'generate_cdl',
    description: 'Generate CDL code from natural language description',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Chart description, e.g. "Show sales trends for past 6 months"'
        },
        chartType: {
          type: 'string',
          enum: ['line', 'bar', 'pie', 'scatter', 'area', 'radar', 'auto'],
          default: 'auto'
        },
        data: {
          type: 'array',
          description: 'Optional example data',
          items: { type: 'object' }
        }
      },
      required: ['description']
    }
  }
];

// Handle tools/list
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tools/call
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const a = args || {};
    switch (name) {
      case 'compile_cdl': {
        const code = a.code as string;
        if (!code) {
          return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: 'Missing code parameter' }, null, 2) }] };
        }
        const result = compile(code);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: result.errors.length === 0,
                ast: result.file,
                errors: result.errors
              }, null, 2)
            }
          ]
        };
      }

      case 'validate_cdl': {
        const code = a.code as string;
        if (!code) {
          return { content: [{ type: 'text', text: JSON.stringify({ valid: false, errors: [{ message: 'Missing code parameter' }] }, null, 2) }] };
        }
        const result = validate(code);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                valid: result.valid,
                errors: result.errors
              }, null, 2)
            }
          ]
        };
      }

      case 'render_cdl': {
        const code = a.code as string;
        if (!code) {
          return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: 'Missing code parameter' }, null, 2) }] };
        }
        const compileResult = compile(code);
        if (compileResult.errors.length > 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Compilation failed',
                  errors: compileResult.errors
                }, null, 2)
              }
            ]
          };
        }
        const renderResult = render(compileResult.file);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: renderResult.success,
                option: renderResult.option
              }, null, 2)
            }
          ]
        };
      }

      case 'generate_cdl': {
        const description = a.description as string;
        if (!description) {
          return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: 'Missing description parameter' }, null, 2) }] };
        }
        const chartType = a.chartType as string || 'auto';
        const data = a.data as any[] || undefined;

        // Get API key from environment
        const apiKey = process.env.STEPFUN_API_KEY || process.env.KIMI_API_KEY;
        if (!apiKey) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Missing API key. Set STEPFUN_API_KEY or KIMI_API_KEY environment variable.'
                }, null, 2)
              }
            ]
          };
        }

        // Call NL-to-CDL
        const result: NLToCDLResult = await nlToCDL(description, {
          apiKey,
          baseURL: process.env.STEPFUN_API_BASE || 'https://chatapi.stepfun.com/chatapi/v1',
          model: 'step-3.5-flash'
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`
            }
          ]
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }
      ]
    };
  }
});

// Run server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('CDL MCP Server running on stdio');
}

main().catch(console.error);