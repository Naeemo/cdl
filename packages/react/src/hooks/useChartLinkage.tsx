import React, { useCallback, useContext, useEffect, useRef, useState, createContext, useMemo } from 'react';
import * as echarts from 'echarts';

/**
 * 联动高亮配置
 */
export interface LinkageConfig {
  /** 联动组ID，相同组的图表互相联动 */
  groupId: string;
  /** 关联字段，用于匹配数据，如 'category', 'date', 'name' */
  linkField: string;
  /** 是否启用悬停联动 */
  enableHover?: boolean;
  /** 是否启用点击联动 */
  enableClick?: boolean;
  /** 高亮样式 */
  highlightStyle?: {
    /** 透明度 */
    opacity?: number;
    /** 边框宽度 */
    borderWidth?: number;
    /** 边框颜色 */
    borderColor?: string;
    /** 缩放比例（用于散点图等） */
    scale?: number;
  };
  /** 非高亮元素样式 */
  unhighlightStyle?: {
    /** 透明度 */
    opacity?: number;
  };
}

/**
 * 联动事件数据
 */
export interface LinkageEvent {
  /** 联动组ID */
  groupId: string;
  /** 触发源图表ID */
  sourceChartId: string;
  /** 关联字段值 */
  linkValue: string | number;
  /** 事件类型 */
  type: 'hover' | 'click' | 'clear';
  /** 原始数据 */
  rawData?: any;
  /** 原始事件参数 */
  params?: any;
}

/**
 * 图表实例信息
 */
interface ChartInstance {
  id: string;
  groupId: string;
  chart: echarts.ECharts;
  config: LinkageConfig;
}

/**
 * 联动上下文状态
 */
interface LinkageContextState {
  /** 注册图表到联动组 */
  registerChart: (instance: ChartInstance) => void;
  /** 从联动组注销图表 */
  unregisterChart: (chartId: string) => void;
  /** 发送联动事件 */
  emitLinkageEvent: (event: LinkageEvent) => void;
  /** 当前活跃的高亮值 */
  activeHighlight: Map<string, string | number>;
}

/**
 * 创建联动上下文
 */
const ChartLinkageContext = createContext<LinkageContextState | null>(null);

/**
 * 联动提供者 Props
 */
interface LinkageProviderProps {
  children: React.ReactNode;
}

/**
 * 生成唯一图表ID
 */
let chartIdCounter = 0;
export const generateChartId = (): string => `cdl-chart-${++chartIdCounter}`;

/**
 * 联动状态提供者组件
 * 管理所有图表实例和联动事件分发
 */
export const ChartLinkageProvider: React.FC<LinkageProviderProps> = ({ children }) => {
  const chartsRef = useRef<Map<string, ChartInstance>>(new Map());
  const [activeHighlight, setActiveHighlight] = useState<Map<string, string | number>>(new Map());

  /**
   * 注册图表实例
   */
  const registerChart = useCallback((instance: ChartInstance) => {
    chartsRef.current.set(instance.id, instance);
  }, []);

  /**
   * 注销图表实例
   */
  const unregisterChart = useCallback((chartId: string) => {
    chartsRef.current.delete(chartId);
    setActiveHighlight(prev => {
      const next = new Map(prev);
      next.delete(chartId);
      return next;
    });
  }, []);

  /**
   * 应用高亮效果
   */
  const applyHighlight = useCallback((
    instance: ChartInstance,
    linkValue: string | number,
    highlightStyle: Required<LinkageConfig>['highlightStyle'],
    unhighlightStyle: Required<LinkageConfig>['unhighlightStyle']
  ) => {
    const { chart, config } = instance;
    const option = chart.getOption();

    if (!option || !option.series) return;

    // 构建高亮配置
    const highlightOption: any = {
      series: (option.series as any[]).map((series: any) => ({
        ...series,
        emphasis: {
          ...series.emphasis,
          focus: 'series',
          itemStyle: {
            ...series.emphasis?.itemStyle,
            opacity: highlightStyle.opacity ?? 1,
            borderWidth: highlightStyle.borderWidth ?? 2,
            borderColor: highlightStyle.borderColor ?? '#fff',
          },
        },
      })),
    };

    // 设置高亮状态
    chart.setOption(highlightOption);

    // 触发高亮动作
    chart.dispatchAction({
      type: 'highlight',
      seriesIndex: 'all',
    });

    // 对其他元素应用淡化效果
    const downplayOption: any = {
      series: (option.series as any[]).map((series: any, seriesIndex: number) => {
        const data = series.data || [];
        const newData = data.map((item: any) => {
          const itemValue = typeof item === 'object' ? item[config.linkField] || item.name : item;
          const isMatch = String(itemValue) === String(linkValue);
          
          return {
            ...((typeof item === 'object') ? item : { value: item }),
            itemStyle: {
              ...(typeof item === 'object' ? item.itemStyle : {}),
              opacity: isMatch 
                ? (highlightStyle.opacity ?? 1)
                : (unhighlightStyle.opacity ?? 0.2),
            },
          };
        });

        return {
          ...series,
          data: newData,
        };
      }),
    };

    chart.setOption(downplayOption);
  }, []);

  /**
   * 清除高亮效果
   */
  const clearHighlight = useCallback((instance: ChartInstance) => {
    const { chart } = instance;
    
    chart.dispatchAction({
      type: 'downplay',
      seriesIndex: 'all',
    });

    // 恢复原始数据样式
    const option = chart.getOption();
    if (!option || !option.series) return;

    const resetOption: any = {
      series: (option.series as any[]).map((series: any) => {
        const data = series.data || [];
        const newData = data.map((item: any) => {
          const baseItem = typeof item === 'object' ? item : { value: item };
          const { itemStyle, ...rest } = baseItem;
          
          // 移除我们添加的透明度设置
          if (itemStyle) {
            const { opacity, ...restItemStyle } = itemStyle;
            return {
              ...rest,
              ...(Object.keys(restItemStyle).length > 0 && { itemStyle: restItemStyle }),
            };
          }
          return rest;
        });

        return {
          ...series,
          data: newData,
        };
      }),
    };

    chart.setOption(resetOption);
  }, []);

  /**
   * 发送联动事件
   */
  const emitLinkageEvent = useCallback((event: LinkageEvent) => {
    const { groupId, sourceChartId, linkValue, type } = event;

    // 更新活跃高亮状态
    if (type === 'hover' || type === 'click') {
      setActiveHighlight(prev => {
        const next = new Map(prev);
        next.set(sourceChartId, linkValue);
        return next;
      });
    } else if (type === 'clear') {
      setActiveHighlight(prev => {
        const next = new Map(prev);
        next.delete(sourceChartId);
        return next;
      });
    }

    // 广播到同组的其他图表
    chartsRef.current.forEach((instance) => {
      if (instance.groupId === groupId && instance.id !== sourceChartId) {
        if (type === 'clear') {
          clearHighlight(instance);
        } else {
          const highlightStyle = instance.config.highlightStyle || {};
          const unhighlightStyle = instance.config.unhighlightStyle || {};
          applyHighlight(instance, linkValue, highlightStyle, unhighlightStyle);
        }
      }
    });
  }, [applyHighlight, clearHighlight]);

  const contextValue = useMemo(() => ({
    registerChart,
    unregisterChart,
    emitLinkageEvent,
    activeHighlight,
  }), [registerChart, unregisterChart, emitLinkageEvent, activeHighlight]);

  return (
    <ChartLinkageContext.Provider value={contextValue}>
      {children}
    </ChartLinkageContext.Provider>
  );
};

/**
 * 使用联动上下文的 Hook
 */
export const useChartLinkageContext = (): LinkageContextState => {
  const context = useContext(ChartLinkageContext);
  if (!context) {
    throw new Error('useChartLinkageContext must be used within a ChartLinkageProvider');
  }
  return context;
};

/**
 * 单个图表的联动 Hook
 * @param config - 联动配置
 * @returns 图表ID和事件处理器
 */
export const useChartLinkage = (config?: LinkageConfig) => {
  const context = useContext(ChartLinkageContext);
  const chartIdRef = useRef<string>(generateChartId());
  const chartRef = useRef<echarts.ECharts | null>(null);
  const configRef = useRef(config);
  const mouseOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 更新配置引用
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  /**
   * 绑定图表实例
   */
  const bindChart = useCallback((chart: echarts.ECharts | null) => {
    if (!chart || !config) return;

    chartRef.current = chart;

    // 注册到联动上下文
    context?.registerChart({
      id: chartIdRef.current,
      groupId: config.groupId,
      chart,
      config,
    });

    // 设置事件监听
    if (config.enableHover !== false) {
      chart.on('mouseover', handleMouseOver);
      chart.on('mouseout', handleMouseOut);
    }
    if (config.enableClick) {
      chart.on('click', handleClick);
    }

    return () => {
      // 清理事件监听
      chart.off('mouseover', handleMouseOver);
      chart.off('mouseout', handleMouseOut);
      chart.off('click', handleClick);
      context?.unregisterChart(chartIdRef.current);
    };
  }, [config, context]);

  /**
   * 处理鼠标悬停
   */
  const handleMouseOver = useCallback((params: any) => {
    if (!configRef.current || !context) return;

    // 清除延迟清除定时器
    if (mouseOutTimerRef.current) {
      clearTimeout(mouseOutTimerRef.current);
      mouseOutTimerRef.current = null;
    }

    const linkValue = extractLinkValue(params, configRef.current.linkField);
    if (linkValue === undefined) return;

    context.emitLinkageEvent({
      groupId: configRef.current.groupId,
      sourceChartId: chartIdRef.current,
      linkValue,
      type: 'hover',
      rawData: params.data,
      params,
    });
  }, [context]);

  /**
   * 处理鼠标离开
   */
  const handleMouseOut = useCallback(() => {
    if (!configRef.current || !context) return;

    // 延迟清除，避免快速切换时的闪烁
    mouseOutTimerRef.current = setTimeout(() => {
      context.emitLinkageEvent({
        groupId: configRef.current!.groupId,
        sourceChartId: chartIdRef.current,
        linkValue: '',
        type: 'clear',
      });
    }, 100);
  }, [context]);

  /**
   * 处理点击
   */
  const handleClick = useCallback((params: any) => {
    if (!configRef.current || !context) return;

    const linkValue = extractLinkValue(params, configRef.current.linkField);
    if (linkValue === undefined) return;

    context.emitLinkageEvent({
      groupId: configRef.current.groupId,
      sourceChartId: chartIdRef.current,
      linkValue,
      type: 'click',
      rawData: params.data,
      params,
    });
  }, [context]);

  /**
   * 手动触发高亮
   */
  const highlight = useCallback((value: string | number) => {
    if (!configRef.current || !context) return;

    context.emitLinkageEvent({
      groupId: configRef.current.groupId,
      sourceChartId: chartIdRef.current,
      linkValue: value,
      type: 'hover',
    });
  }, [context]);

  /**
   * 手动清除高亮
   */
  const clear = useCallback(() => {
    if (!configRef.current || !context) return;

    context.emitLinkageEvent({
      groupId: configRef.current.groupId,
      sourceChartId: chartIdRef.current,
      linkValue: '',
      type: 'clear',
    });
  }, [context]);

  return {
    chartId: chartIdRef.current,
    bindChart,
    highlight,
    clear,
  };
};

/**
 * 提取关联字段值
 */
function extractLinkValue(params: any, linkField: string): string | number | undefined {
  if (!params) return undefined;

  // 优先从 data 中提取
  if (params.data) {
    if (typeof params.data === 'object') {
      const value = params.data[linkField];
      if (value !== undefined) return value;
    }
  }

  // 从 params 本身提取
  if (params[linkField] !== undefined) {
    return params[linkField];
  }

  // 使用 name 作为后备
  if (params.name !== undefined) {
    return params.name;
  }

  return undefined;
}

/**
 * 使用多图表联动的 Hook
 * 用于在组件中获取整个联动组的状态
 */
export const useLinkageGroup = (groupId: string) => {
  const context = useContext(ChartLinkageContext);
  
  const groupState = useMemo(() => {
    if (!context) return null;
    
    const entries = Array.from(context.activeHighlight.entries());
    const groupEntries = entries.filter(([id]) => {
      // 这里需要额外的映射来知道 chartId 属于哪个 group
      // 简化处理：返回所有状态
      return true;
    });

    return {
      activeHighlights: new Map(groupEntries),
      isActive: groupEntries.length > 0,
    };
  }, [context, groupId, context?.activeHighlight]);

  return groupState;
};

// 导出上下文供高级使用
export { ChartLinkageContext };
export type { LinkageContextState };
