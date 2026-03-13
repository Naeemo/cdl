/**
 * WebSocket 数据源支持
 * 用于从 WebSocket 连接实时获取数据
 */

export interface WebSocketOptions {
  url: string;           // wss://... 或 ws://...
  reconnect?: boolean;   // 是否自动重连
  reconnectInterval?: number; // 重连间隔(秒)
  maxReconnects?: number; // 最大重连次数
  heartbeatInterval?: number; // 心跳间隔(秒)
}

export interface WebSocketResult {
  success: boolean;
  data?: any[];
  headers?: string[];
  error?: string;
  connected?: boolean;
}

export interface WebSocketConnection {
  url: string;
  socket: WebSocket | null;
  connected: boolean;
  reconnectAttempts: number;
  heartbeatTimer: ReturnType<typeof setInterval> | null;
  onData: ((data: any[]) => void) | null;
  onError: ((error: string) => void) | null;
}

// 活跃连接池
const connections = new Map<string, WebSocketConnection>();

/**
 * 检查 URL 是否为 WebSocket
 */
export function isWebSocketUrl(url: string): boolean {
  return url.startsWith('wss://') || url.startsWith('ws://');
}

/**
 * 建立 WebSocket 连接并获取初始数据
 * Node.js 环境下需要 ws 库
 */
export async function fetchWebSocketData(
  options: WebSocketOptions,
  timeout: number = 10
): Promise<WebSocketResult> {
  return new Promise((resolve) => {
    const WebSocketImpl = getWebSocketImpl();
    if (!WebSocketImpl) {
      resolve({ success: false, error: 'WebSocket not available in this environment' });
      return;
    }

    const socket = new WebSocketImpl(options.url);
    const timer = setTimeout(() => {
      socket.close();
      resolve({ success: false, error: `WebSocket timeout after ${timeout}s` });
    }, timeout * 1000);

    socket.onopen = () => {
      // 连接成功，等待第一条消息作为数据样本
    };

    socket.onmessage = (event: { data: string }) => {
      clearTimeout(timer);
      try {
        const result = parseWebSocketData(event.data);
        socket.close();
        resolve(result);
      } catch (error) {
        socket.close();
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to parse WebSocket data',
        });
      }
    };

    socket.onerror = () => {
      clearTimeout(timer);
      resolve({ success: false, error: 'WebSocket connection error' });
    };

    socket.onclose = () => {
      clearTimeout(timer);
    };
  });
}

/**
 * 创建持久 WebSocket 连接（用于实时更新）
 */
export function createWebSocketConnection(
  options: WebSocketOptions
): WebSocketConnection {
  const existing = connections.get(options.url);
  if (existing) {
    return existing;
  }

  const conn: WebSocketConnection = {
    url: options.url,
    socket: null,
    connected: false,
    reconnectAttempts: 0,
    heartbeatTimer: null,
    onData: null,
    onError: null,
  };

  connections.set(options.url, conn);
  connect(conn, options);
  return conn;
}

/**
 * 关闭 WebSocket 连接
 */
export function closeWebSocketConnection(url: string): void {
  const conn = connections.get(url);
  if (conn) {
    if (conn.heartbeatTimer) {
      clearInterval(conn.heartbeatTimer);
    }
    if (conn.socket) {
      conn.socket.close();
    }
    connections.delete(url);
  }
}

// ===== 内部实现 =====

function getWebSocketImpl(): typeof WebSocket | null {
  // 浏览器环境
  if (typeof WebSocket !== 'undefined') {
    return WebSocket;
  }
  // Node.js 环境 - 尝试加载 ws 库
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require('ws');
    return ws.WebSocket || ws;
  } catch {
    return null;
  }
}

function parseWebSocketData(rawData: string): WebSocketResult {
  try {
    const parsed: unknown = JSON.parse(rawData);
    
    // 处理数组数据
    if (Array.isArray(parsed)) {
      if (parsed.length > 0) {
        const first = parsed[0] as Record<string, unknown>;
        const headers = Object.keys(first);
        return { success: true, data: parsed as unknown[], headers };
      }
      return { success: true, data: [], headers: [] };
    }
    
    // 处理对象包装的数据
    if (typeof parsed === 'object' && parsed !== null) {
      const obj = parsed as Record<string, unknown>;
      // 常见的数据字段名
      const dataFields = ['data', 'items', 'results', 'rows', 'records'];
      for (const field of dataFields) {
        if (Array.isArray(obj[field])) {
          const data = obj[field] as unknown[];
          if (data.length > 0) {
            const first = data[0] as Record<string, unknown>;
            const headers = Object.keys(first);
            return { success: true, data, headers };
          }
          return { success: true, data: [], headers: [] };
        }
      }
      // 如果没有数组字段，将整个对象作为单行数据
      return { success: true, data: [obj], headers: Object.keys(obj) };
    }
    
    return { success: false, error: 'Unsupported WebSocket data format' };
  } catch {
    // 尝试作为 CSV 解析
    return parseCSV(rawData);
  }
}

function parseCSV(csvText: string): WebSocketResult {
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

function connect(conn: WebSocketConnection, options: WebSocketOptions): void {
  const WebSocketImpl = getWebSocketImpl();
  if (!WebSocketImpl) return;

  try {
    conn.socket = new WebSocketImpl(options.url);

    conn.socket.onopen = () => {
      conn.connected = true;
      conn.reconnectAttempts = 0;
      
      // 启动心跳
      if (options.heartbeatInterval && options.heartbeatInterval > 0) {
        conn.heartbeatTimer = setInterval(() => {
          if (conn.socket?.readyState === 1) {
            conn.socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, options.heartbeatInterval * 1000);
      }
    };

    conn.socket.onmessage = (event: { data: string }) => {
      const result = parseWebSocketData(event.data);
      if (result.success && conn.onData) {
        conn.onData(result.data || []);
      }
    };

    conn.socket.onerror = () => {
      if (conn.onError) {
        conn.onError('WebSocket error');
      }
    };

    conn.socket.onclose = () => {
      conn.connected = false;
      if (conn.heartbeatTimer) {
        clearInterval(conn.heartbeatTimer);
        conn.heartbeatTimer = null;
      }

      // 自动重连
      if (options.reconnect !== false) {
        const maxAttempts = options.maxReconnects || 5;
        if (conn.reconnectAttempts < maxAttempts) {
          conn.reconnectAttempts++;
          const interval = options.reconnectInterval || 5;
          setTimeout(() => connect(conn, options), interval * 1000);
        }
      }
    };
  } catch (error) {
    conn.connected = false;
    if (conn.onError) {
      conn.onError(error instanceof Error ? error.message : 'Connection failed');
    }
  }
}
