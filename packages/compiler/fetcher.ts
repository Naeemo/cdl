/**
 * REST API 数据获取器
 * 用于从 HTTP/HTTPS API 获取数据
 */

export interface FetchOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
}

export interface FetchResult {
  success: boolean;
  data?: any[];
  headers?: string[];
  error?: string;
}

/**
 * 从 REST API 获取数据
 * 在 Node.js 环境中使用原生 fetch (v18+) 或动态导入 node-fetch
 */
export async function fetchRestData(options: FetchOptions): Promise<FetchResult> {
  try {
    const controller = new AbortController();
    const timeoutId = options.timeout 
      ? setTimeout(() => controller.abort(), options.timeout * 1000)
      : null;

    const response = await fetch(options.url, {
      method: options.method || 'GET',
      headers: options.headers || { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const contentType = response.headers.get('content-type') || '';
    
    // JSON 响应
    if (contentType.includes('application/json')) {
      const json: unknown = await response.json();
      // 处理常见的 API 响应格式
      let data: unknown = json;
      if (Array.isArray(json)) {
        data = json;
      } else if (typeof json === 'object' && json !== null) {
        const obj = json as Record<string, unknown>;
        if (Array.isArray(obj.data)) {
          data = obj.data;
        } else if (Array.isArray(obj.results)) {
          data = obj.results;
        } else if (Array.isArray(obj.items)) {
          data = obj.items;
        }
      }
      
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0] as Record<string, unknown>;
        const headers = Object.keys(first);
        return { success: true, data: data as unknown[], headers };
      }
      return { success: true, data: Array.isArray(data) ? (data as unknown[]) : [], headers: [] };
    }

    // CSV 响应
    if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
      const text = await response.text();
      return parseCSV(text);
    }

    return {
      success: false,
      error: `Unsupported content type: ${contentType}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 解析 CSV 文本为数据
 */
function parseCSV(csvText: string): FetchResult {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return { success: false, error: 'CSV must have header and at least one data row' };
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, string | number> = {};
    headers.forEach((h, i) => {
      const val = values[i] || '';
      row[h] = isNaN(Number(val)) ? val : Number(val);
    });
    return row;
  });

  return { success: true, data, headers };
}

/**
 * 根据 DataDefinition 获取数据
 */
export async function fetchDataFromDefinition(def: {
  config: { source?: string; timeout?: number };
  query: string;
}): Promise<FetchResult> {
  if (!def.config.source) {
    return { success: false, error: 'No source URL provided' };
  }

  // 解析 query 中的 JSON 参数（如果有）
  let body: string | undefined;
  let method: 'GET' | 'POST' = 'GET';
  let headers: Record<string, string> = { 'Accept': 'application/json' };

  if (def.query.trim()) {
    try {
      const queryData = JSON.parse(def.query);
      if (queryData.method) method = queryData.method;
      if (queryData.headers) headers = { ...headers, ...queryData.headers };
      if (queryData.body) {
        body = JSON.stringify(queryData.body);
        headers['Content-Type'] = 'application/json';
      }
    } catch {
      // 如果不是 JSON，当作 URL 参数或保持原样
    }
  }

  return fetchRestData({
    url: def.config.source,
    method,
    headers,
    timeout: def.config.timeout,
  });
}