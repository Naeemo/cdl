/**
 * CDL 动态数据核心模块
 * 提供数据流管理、图表增量更新、轮询机制
 */

// ==================== 类型定义 ====================

export type DataStreamType = 'websocket' | 'sse' | 'polling' | 'push';

export interface DataSourceConfig {
  type: DataStreamType;
  url: string;
  /** WebSocket/SSE 重连间隔（毫秒） */
  reconnectInterval?: number;
  /** 最大重连次数 */
  maxReconnects?: number;
  /** 轮询间隔（毫秒） */
  interval?: number;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求方法（用于轮询） */
  method?: 'GET' | 'POST';
  /** 请求体（用于 POST 轮询） */
  body?: unknown;
  /** 鉴权 Token */
  authToken?: string;
}

export interface DataPoint {
  [key: string]: string | number | boolean | null;
}

export interface DataBatch {
  /** 数据点数组 */
  data: DataPoint[];
  /** 数据时间戳 */
  timestamp?: number;
  /** 序列号（用于保序） */
  sequence?: number;
  /** 是否全量更新 */
  full?: boolean;
}

export type DataHandler = (batch: DataBatch) => void;
export type ErrorHandler = (error: Error) => void;
export type ConnectHandler = () => void;
export type DisconnectHandler = (reason?: string) => void;

export interface DataStreamEvents {
  onData: DataHandler;
  onError?: ErrorHandler;
  onConnect?: ConnectHandler;
  onDisconnect?: DisconnectHandler;
}

export interface StreamStats {
  connected: boolean;
  receivedBatches: number;
  receivedRecords: number;
  lastReceivedAt: number | null;
  reconnectAttempts: number;
  errors: number;
}

export interface ChartUpdateStrategy {
  merge(existing: DataPoint[], incoming: DataPoint[]): DataPoint[];
  dedupKey?: string;
  maxPoints?: number;
}

export interface ChartDataState {
  data: DataPoint[];
  lastUpdate: number | null;
  updateCount: number;
}

// ==================== 数据流管理器 ====================

export class DataStreamManager {
  private config: DataSourceConfig;
  private events: DataStreamEvents;
  private ws: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stats: StreamStats;
  private isDestroyed = false;
  private sequenceCounter = 0;

  constructor(config: DataSourceConfig, events: DataStreamEvents) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnects: 10,
      interval: 5000,
      method: 'GET',
      ...config,
    };
    this.events = events;
    this.stats = {
      connected: false,
      receivedBatches: 0,
      receivedRecords: 0,
      lastReceivedAt: null,
      reconnectAttempts: 0,
      errors: 0,
    };
  }

  start(): void {
    if (this.isDestroyed) return;
    switch (this.config.type) {
      case 'websocket':
        this.connectWebSocket();
        break;
      case 'sse':
        this.connectSSE();
        break;
      case 'polling':
        this.startPolling();
        break;
      case 'push':
        this.stats.connected = true;
        this.events.onConnect?.();
        break;
    }
  }

  stop(): void {
    this.cleanup();
    this.stats.connected = false;
    this.events.onDisconnect?.('manual');
  }

  destroy(): void {
    this.isDestroyed = true;
    this.stop();
  }

  getStats(): StreamStats {
    return { ...this.stats };
  }

  private connectWebSocket(): void {
    if (this.isDestroyed) return;
    try {
      this.ws = new WebSocket(this.config.url);
      this.ws.onopen = () => {
        this.stats.connected = true;
        this.stats.reconnectAttempts = 0;
        this.events.onConnect?.();
        if (this.config.authToken) {
          this.ws?.send(JSON.stringify({ type: 'auth', token: this.config.authToken }));
        }
      };
      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const data = Array.isArray(parsed) ? parsed : parsed.data || [parsed];
          const isFull = parsed.full === true;
          this.handleData(data, isFull);
        } catch (e) {
          this.handleError(new Error(`Failed to parse WebSocket message: ${e}`));
        }
      };
      this.ws.onerror = () => {
        this.handleError(new Error('WebSocket error'));
      };
      this.ws.onclose = () => {
        this.stats.connected = false;
        this.events.onDisconnect?.('websocket_closed');
        this.scheduleReconnect();
      };
    } catch (e) {
      this.handleError(e instanceof Error ? e : new Error(String(e)));
      this.scheduleReconnect();
    }
  }

  private connectSSE(): void {
    if (this.isDestroyed) return;
    try {
      this.eventSource = new EventSource(this.config.url);
      this.eventSource.onopen = () => {
        this.stats.connected = true;
        this.stats.reconnectAttempts = 0;
        this.events.onConnect?.();
      };
      this.eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const data = Array.isArray(parsed) ? parsed : parsed.data || [parsed];
          const isFull = parsed.full === true;
          this.handleData(data, isFull);
        } catch (e) {
          this.handleError(new Error(`Failed to parse SSE message: ${e}`));
        }
      };
      this.eventSource.onerror = () => {
        this.stats.connected = false;
        this.events.onDisconnect?.('sse_error');
        this.scheduleReconnect();
      };
    } catch (e) {
      this.handleError(e instanceof Error ? e : new Error(String(e)));
      this.scheduleReconnect();
    }
  }

  private startPolling(): void {
    if (this.isDestroyed) return;
    this.executePoll();
    this.pollingTimer = setInterval(() => {
      this.executePoll();
    }, this.config.interval);
    this.stats.connected = true;
    this.events.onConnect?.();
  }

  private async executePoll(): Promise<void> {
    if (this.isDestroyed) return;
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.config.headers,
      };
      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`;
      }
      const response = await fetch(this.config.url, {
        method: this.config.method,
        headers,
        body: this.config.body ? JSON.stringify(this.config.body) : undefined,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const parsed = await response.json();
      const data = Array.isArray(parsed) ? parsed : parsed.data || [parsed];
      const isFull = parsed.full === true;
      this.handleData(data, isFull);
    } catch (e) {
      this.handleError(e instanceof Error ? e : new Error(String(e)));
    }
  }

  private handleData(data: DataPoint[], full: boolean = false): void {
    this.sequenceCounter++;
    this.stats.receivedBatches++;
    this.stats.receivedRecords += data.length;
    this.stats.lastReceivedAt = Date.now();
    this.events.onData({
      data,
      timestamp: Date.now(),
      sequence: this.sequenceCounter,
      full,
    });
  }

  private handleError(error: Error): void {
    this.stats.errors++;
    this.events.onError?.(error);
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed) return;
    if (this.stats.reconnectAttempts >= (this.config.maxReconnects || 10)) {
      this.handleError(new Error('Max reconnection attempts reached'));
      return;
    }
    this.stats.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.start();
    }, this.config.reconnectInterval);
  }

  private cleanup(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// ==================== 图表数据更新器 ====================

export const defaultUpdateStrategy: ChartUpdateStrategy = {
  merge: (existing, incoming) => {
    const combined = [...existing, ...incoming];
    return combined.slice(-1000);
  },
  maxPoints: 1000,
};

export const timeSeriesUpdateStrategy = (timeField: string): ChartUpdateStrategy => ({
  merge: (existing, incoming) => {
    const combined = [...existing, ...incoming];
    combined.sort((a, b) => {
      const ta = new Date(String(a[timeField])).getTime();
      const tb = new Date(String(b[timeField])).getTime();
      return ta - tb;
    });
    const seen = new Set<string | number | boolean | null>();
    return combined.filter(item => {
      const key = item[timeField];
      if (key === null) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(-1000);
  },
  dedupKey: timeField,
  maxPoints: 1000,
});

export class ChartDataManager {
  private state: ChartDataState;
  private strategy: ChartUpdateStrategy;
  private listeners: Set<(state: ChartDataState) => void> = new Set();

  constructor(strategy: ChartUpdateStrategy = defaultUpdateStrategy) {
    this.strategy = strategy;
    this.state = {
      data: [],
      lastUpdate: null,
      updateCount: 0,
    };
  }

  update(batch: DataBatch): void {
    const merged = this.strategy.merge(this.state.data, batch.data);
    this.state = {
      data: merged,
      lastUpdate: batch.timestamp || Date.now(),
      updateCount: this.state.updateCount + 1,
    };
    this.notifyListeners();
  }

  setData(data: DataPoint[]): void {
    this.state = {
      data,
      lastUpdate: Date.now(),
      updateCount: this.state.updateCount + 1,
    };
    this.notifyListeners();
  }

  clear(): void {
    this.state = {
      data: [],
      lastUpdate: null,
      updateCount: 0,
    };
    this.notifyListeners();
  }

  getState(): ChartDataState {
    return { ...this.state };
  }

  subscribe(listener: (state: ChartDataState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setStrategy(strategy: ChartUpdateStrategy): void {
    this.strategy = strategy;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}

export default DataStreamManager;