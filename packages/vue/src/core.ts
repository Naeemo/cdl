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

  /**
   * 启动数据流
   */
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
        // push 模式等待外部推送
        this.stats.connected = true;
        this.events.onConnect?.();
        break;
    }
  }

  /**
   * 停止数据流
   */
  stop(): void {
    this.cleanup();
    this.stats.connected = false;
    this.events.onDisconnect?.('manual');
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.isDestroyed = true;
    this.stop();
  }

  /**
   * 外部推送数据（用于 push 模式）
   */
  pushData(data: DataPoint[]): void {
    if (this.config.type !== 'push') {
      console.warn('[DataStreamManager] pushData only works in push mode');
      return;
    }
    this.handleData(data, true);
  }

  /**
   * 获取统计信息
   */
  getStats(): StreamStats {
    return { ...this.stats };
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.stats.connected;
  }

  // ==================== WebSocket ====================

  private connectWebSocket(): void {
    if (this.isDestroyed) return;

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        this.stats.connected = true;
        this.stats.reconnectAttempts = 0;
        this.events.onConnect?.();

        // 发送鉴权信息
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

      this.ws.onerror = (error) => {
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

  // ==================== Server-Sent Events ====================

  private connectSSE(): void {
    if (this.isDestroyed) return;

    try {
      const headers: Record<string, string> = {};
      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`;
      }

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

  // ==================== Polling ====================

  private startPolling(): void {
    if (this.isDestroyed) return;

    // 立即执行一次
    this.executePoll();

    // 设置定时器
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

  // ==================== 工具方法 ====================

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
    // 清理 WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // 清理 SSE
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // 清理轮询
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    // 清理重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// ==================== 图表数据更新器 ====================

export interface ChartUpdateStrategy {
  /**
   * 合并新数据到现有数据
   */
  merge(existing: DataPoint[], incoming: DataPoint[]): DataPoint[];
  /**
   * 数据去重键（用于识别重复数据）
   */
  dedupKey?: string;
  /**
   * 最大数据点数量（用于滑动窗口）
   */
  maxPoints?: number;
}

/**
 * 默认更新策略：追加新数据，保持滑动窗口
 */
export const defaultUpdateStrategy: ChartUpdateStrategy = {
  merge: (existing, incoming) => {
    const combined = [...existing, ...incoming];
    return combined.slice(-1000); // 默认最多保留 1000 条
  },
  maxPoints: 1000,
};

/**
 * 基于时间序列的更新策略
 */
export const timeSeriesUpdateStrategy = (timeField: string): ChartUpdateStrategy => ({
  merge: (existing, incoming) => {
    const combined = [...existing, ...incoming];
    // 按时间排序
    combined.sort((a, b) => {
      const ta = new Date(String(a[timeField])).getTime();
      const tb = new Date(String(b[timeField])).getTime();
      return ta - tb;
    });
    // 去重（基于时间字段）
    const seen = new Set<string | number | boolean | null>();
    return combined.filter(item => {
      const key = item[timeField];
      if (key === null) return true; // null值不去重
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(-1000);
  },
  dedupKey: timeField,
  maxPoints: 1000,
});

/**
 * 替换策略：新数据完全替换旧数据
 */
export const replaceUpdateStrategy: ChartUpdateStrategy = {
  merge: (_, incoming) => incoming,
};

export interface ChartDataState {
  data: DataPoint[];
  lastUpdate: number | null;
  updateCount: number;
}

/**
 * 图表数据管理器
 * 管理图表数据的增量更新
 */
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

  /**
   * 更新数据
   */
  update(batch: DataBatch): void {
    const merged = this.strategy.merge(this.state.data, batch.data);
    
    this.state = {
      data: merged,
      lastUpdate: batch.timestamp || Date.now(),
      updateCount: this.state.updateCount + 1,
    };

    this.notifyListeners();
  }

  /**
   * 设置数据（全量替换）
   */
  setData(data: DataPoint[]): void {
    this.state = {
      data,
      lastUpdate: Date.now(),
      updateCount: this.state.updateCount + 1,
    };
    this.notifyListeners();
  }

  /**
   * 清空数据
   */
  clear(): void {
    this.state = {
      data: [],
      lastUpdate: null,
      updateCount: 0,
    };
    this.notifyListeners();
  }

  /**
   * 获取当前状态
   */
  getState(): ChartDataState {
    return { ...this.state };
  }

  /**
   * 订阅数据变化
   */
  subscribe(listener: (state: ChartDataState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 更新策略
   */
  setStrategy(strategy: ChartUpdateStrategy): void {
    this.strategy = strategy;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}

// ==================== 自动轮询调度器 ====================

export interface PollTask {
  id: string;
  url: string;
  interval: number;
  handler: (data: DataPoint[]) => void;
  errorHandler?: (error: Error) => void;
}

/**
 * 轮询调度器
 * 管理多个轮询任务，避免请求风暴
 */
export class PollScheduler {
  private tasks: Map<string, PollTask> = new Map();
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private jitter: number = 100; // 抖动范围（毫秒）

  /**
   * 添加轮询任务
   */
  addTask(task: PollTask): void {
    this.removeTask(task.id); // 先移除同名任务
    this.tasks.set(task.id, task);
    this.startTask(task);
  }

  /**
   * 移除轮询任务
   */
  removeTask(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }
    this.tasks.delete(id);
  }

  /**
   * 更新任务间隔
   */
  updateInterval(id: string, interval: number): void {
    const task = this.tasks.get(id);
    if (task) {
      task.interval = interval;
      this.startTask(task);
    }
  }

  /**
   * 暂停任务
   */
  pause(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }

  /**
   * 恢复任务
   */
  resume(id: string): void {
    const task = this.tasks.get(id);
    if (task && !this.timers.has(id)) {
      this.startTask(task);
    }
  }

  /**
   * 销毁调度器
   */
  destroy(): void {
    this.timers.forEach(timer => clearInterval(timer));
    this.timers.clear();
    this.tasks.clear();
  }

  private startTask(task: PollTask): void {
    // 清除现有定时器
    const existingTimer = this.timers.get(task.id);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // 添加随机抖动，避免请求风暴
    const jitteredInterval = task.interval + Math.random() * this.jitter;

    // 立即执行一次
    this.executeTask(task);

    // 设置定时器
    const timer = setInterval(() => {
      this.executeTask(task);
    }, jitteredInterval);

    this.timers.set(task.id, timer);
  }

  private async executeTask(task: PollTask): Promise<void> {
    try {
      const response = await fetch(task.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const points = Array.isArray(data) ? data : data.data || [];
      task.handler(points);
    } catch (e) {
      task.errorHandler?.(e instanceof Error ? e : new Error(String(e)));
    }
  }
}

// ==================== 导出 ====================

export {
  DataStreamManager as default,
};
