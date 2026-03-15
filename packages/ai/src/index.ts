import OpenAI from 'openai';
import { CDLFileSchema, schemaToCDL } from './schema';

export * from './schema';

export interface NLToCDLOptions {
  model?: string;
  apiKey: string;
  baseURL?: string;
  temperature?: number;
}

export interface NLToCDLResult {
  success: boolean;
  cdl?: string;
  ast?: any;
  error?: string;
}

const SYSTEM_PROMPT = `You are a CDL (Chart Definition Language) expert. Convert natural language descriptions into valid CDL code.

CDL Syntax Rules:
1. Data definition: Data <Name> { headers... \\n rows... }
2. Chart definition: Chart <Name> { use <DataName> type <chartType> x <field> y <field> }
3. Supported chart types: line, bar, pie, scatter, area, radar, combo, heatmap
4. Use @style, @color hints for styling
5. ALWAYS output valid CDL code that can be parsed

When user provides natural language:
- Infer appropriate chart type based on description
- Suggest reasonable data structure if not provided
- Use Chinese or English field names appropriately
- Add helpful styling hints

Output ONLY the CDL code, no explanations. If multiple charts needed, output them separated by newline.`;

export async function nlToCDL(
  description: string,
  options: NLToCDLOptions
): Promise<NLToCDLResult> {
  try {
    const client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL || 'https://api.moonshot.cn/v1',
    });

    const response = await client.chat.completions.create({
      model: options.model || 'kimi-k2p5',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: description }
      ],
      temperature: options.temperature ?? 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return { success: false, error: 'Empty response from LLM' };
    }

    // Try to parse as structured schema first
    try {
      const schema = JSON.parse(content) as CDLFileSchema;
      if (schema.data && schema.charts) {
        const cdl = schemaToCDL(schema);
        return { success: true, cdl, ast: schema };
      }
    } catch {
      // Not valid JSON schema, treat as raw CDL
    }

    // Basic validation - check if it looks like CDL
    const cdl = content.trim();
    if (!cdl.includes('Data') && !cdl.includes('Chart')) {
      return { success: false, error: 'Generated content does not appear to be valid CDL', cdl };
    }

    return { success: true, cdl };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Batch conversion for multiple descriptions
export async function nlToCDLBatch(
  descriptions: string[],
  options: NLToCDLOptions
): Promise<NLToCDLResult[]> {
  return Promise.all(descriptions.map(d => nlToCDL(d, options)));
}