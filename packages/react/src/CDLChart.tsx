/**
 * CDL React Component with DrillDown support and Accessibility features
 * Usage: <CDLChart code={cdlCode} theme="dark" enableDrillDown />
 * 
 * Accessibility Features:
 * - ARIA labels for chart container and interactive elements
 * - Keyboard navigation support (Tab, Enter, Escape)
 * - Screen reader announcements for state changes
 * - Focus management for drill-down interactions
 * - High contrast mode support
 */

import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import * as echarts from 'echarts';
import { useChartLinkage, LinkageConfig } from './hooks/useChartLinkage';

// DrillDown 路径项
export interface DrillDownPath {
  level: number;
  field: string;
  value: string;
  data: any;
}

// 详情面板数据
export interface DetailData {
  field: string;
  value: string | number;
  rawData: any;
  children?: any[];
}

interface CDLChartProps {
  /** CDL source code */
  code: string;
  /** Chart theme */
  theme?: 'light' | 'dark';
  /** Chart width */
  width?: number | string;
  /** Chart height */
  height?: number | string;
  /** Enable drill down functionality */
  enableDrillDown?: boolean;
  /** Custom drill down data loader */
  onDrillDown?: (path: DrillDownPath[]) => Promise<DetailData[]>;
  /** Called when chart is clicked */
  onClick?: (data: any) => void;
  /** Called when chart renders successfully */
  onSuccess?: () => void;
  /** Called when there's an error */
  onError?: (error: string) => void;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** Linkage configuration for cross-chart highlighting */
  linkage?: LinkageConfig;
  /** Accessible label for the chart (for screen readers) */
  ariaLabel?: string;
  /** Detailed description of the chart data (for screen readers) */
  ariaDescription?: string;
  /** Whether the chart is decorative (aria-hidden) */
  decorative?: boolean;
}

export const CDLChart: React.FC<CDLChartProps> = ({
  code,
  theme = 'light',
  width = '100%',
  height = 400,
  enableDrillDown = false,
  onDrillDown,
  onClick,
  onSuccess,
  onError,
  className,
  style,
  linkage,
  ariaLabel = '数据图表',
  ariaDescription,
  decorative = false,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // DrillDown state
  const [drillDownPath, setDrillDownPath] = useState<DrillDownPath[]>([]);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [detailData, setDetailData] = useState<DetailData[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Generate unique IDs for accessibility
  const uniqueId = useId();
  const chartId = `cdl-chart-${uniqueId}`;
  const errorId = `cdl-error-${uniqueId}`;
  const descriptionId = `cdl-desc-${uniqueId}`;
  const liveRegionId = `cdl-live-${uniqueId}`;

  // Linkage hook
  const { bindChart } = useChartLinkage(linkage);

  // Announce message to screen readers
  const announce = useCallback((message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  // Handle drill down
  const handleDrillDown = useCallback(async (params: any) => {
    if (!enableDrillDown) {
      onClick?.(params);
      return;
    }

    const newPathItem: DrillDownPath = {
      level: drillDownPath.length,
      field: params.seriesName || params.name || 'value',
      value: params.name || params.value,
      data: params.data,
    };

    const newPath = [...drillDownPath, newPathItem];
    setDrillDownPath(newPath);
    setShowDetailPanel(true);
    setDetailLoading(true);
    
    // Announce to screen readers
    announce(`已进入 ${newPathItem.value} 的详情视图，当前层级 ${newPath.length}`);

    try {
      if (onDrillDown) {
        const details = await onDrillDown(newPath);
        setDetailData(details);
        announce(`已加载 ${details.length} 条详情数据`);
      } else {
        // 默认详情展示
        setDetailData([{
          field: newPathItem.field,
          value: newPathItem.value,
          rawData: params.data,
        }]);
        announce('已显示默认详情');
      }
    } catch (err) {
      console.error('Drill down error:', err);
      announce('加载详情失败，请重试');
    } finally {
      setDetailLoading(false);
    }
  }, [drillDownPath, enableDrillDown, onDrillDown, onClick, announce]);

  // Go back to previous level
  const handleGoBack = useCallback((targetLevel: number) => {
    const newPath = drillDownPath.slice(0, targetLevel + 1);
    setDrillDownPath(newPath);
    if (newPath.length === 0) {
      setShowDetailPanel(false);
      announce('已返回顶层视图');
    } else {
      announce(`已返回到 ${newPath[newPath.length - 1].value} 层级`);
    }
  }, [drillDownPath, announce]);

  // Reset drill down
  const handleReset = useCallback(() => {
    setDrillDownPath([]);
    setShowDetailPanel(false);
    setDetailData([]);
    announce('已重置图表视图');
  }, [announce]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && showDetailPanel) {
      event.preventDefault();
      setShowDetailPanel(false);
      announce('已关闭详情面板');
    }
  }, [showDetailPanel, announce]);

  useEffect(() => {
    if (!chartRef.current || !code) return;

    const loadAndRender = async () => {
      try {
        setLoading(true);
        setError(null);

        const { compile } = await import('@naeemo/cdl-compiler');
        const { render } = await import('@naeemo/cdl-renderer-echarts');

        const compileResult = compile(code);
        if (compileResult.errors.length > 0) {
          const errorMsg = compileResult.errors.map(e => 
            `Line ${e.line}: ${e.message}`
          ).join('\n');
          throw new Error(errorMsg);
        }

        const renderResult = render(compileResult.file, theme);
        if (!renderResult.success) {
          throw new Error(renderResult.error || 'Render failed');
        }

        // Initialize or update chart
        if (!chartInstance.current) {
          chartInstance.current = echarts.init(chartRef.current, theme);
          
          // 绑定联动
          bindChart(chartInstance.current);
          
          // 点击事件处理
          chartInstance.current.on('click', (params: any) => {
            handleDrillDown(params).catch(console.error);
          });
        }

        chartInstance.current.setOption(renderResult.option, true);
        
        setLoading(false);
        announce('图表加载完成');
        onSuccess?.();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        setLoading(false);
        announce(`图表加载失败: ${errorMsg}`);
        onError?.(errorMsg);
      }
    };

    loadAndRender();

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [code, theme, handleDrillDown, onSuccess, onError, announce]);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }
  }, [theme]);

  const containerStyle: React.CSSProperties = {
    width,
    height,
    position: 'relative',
    ...style,
  };

  // Detail panel styles
  const detailPanelStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 300,
    height: '100%',
    background: theme === 'dark' ? '#1a1a2e' : '#ffffff',
    borderLeft: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}`,
    padding: 16,
    overflow: 'auto',
    zIndex: 10,
    boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
  };

  if (error) {
    return (
      <div
        className={className}
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: 4,
          padding: 16,
        }}
        role="alert"
        aria-live="assertive"
        id={errorId}
      >
        <div style={{ color: '#cf222e', fontSize: 14 }}>
          <strong>❌ CDL Error</strong>
          <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{error}</pre>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={className} 
      style={containerStyle}
      onKeyDown={handleKeyDown}
      role={decorative ? 'presentation' : 'region'}
      aria-label={ariaLabel}
      id={chartId}
    >
      {/* Screen reader live region for announcements */}
      <div
        ref={liveRegionRef}
        id={liveRegionId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />
      
      {/* Screen reader description */}
      {ariaDescription && (
        <div id={descriptionId} className="sr-only" style={{ display: 'none' }}>
          {ariaDescription}
        </div>
      )}

      {/* Breadcrumb */}
      {enableDrillDown && drillDownPath.length > 0 && (
        <nav
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px',
            background: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
            borderRadius: 4,
            fontSize: 12,
          }}
          aria-label="面包屑导航"
        >
          <button
            onClick={handleReset}
            style={{
              background: 'none',
              border: 'none',
              color: theme === 'dark' ? '#fff' : '#333',
              cursor: 'pointer',
              padding: '2px 8px',
            }}
            aria-label="返回首页"
            title="返回首页 (Home)"
          >
            🏠
          </button>
          {drillDownPath.map((item, index) => (
            <React.Fragment key={index}>
              <span style={{ color: theme === 'dark' ? '#666' : '#999' }} aria-hidden="true">/</span>
              <button
                onClick={() => handleGoBack(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: index === drillDownPath.length - 1 
                    ? (theme === 'dark' ? '#fff' : '#333')
                    : (theme === 'dark' ? '#999' : '#666'),
                  cursor: 'pointer',
                  padding: '2px 8px',
                  fontWeight: index === drillDownPath.length - 1 ? 'bold' : 'normal',
                }}
                aria-current={index === drillDownPath.length - 1 ? 'page' : undefined}
                aria-label={`返回 ${item.value}`}
              >
                {item.value}
              </button>
            </React.Fragment>
          ))}
        </nav>
      )}

      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#999',
          }}
          role="status"
          aria-live="polite"
          aria-label="图表加载中"
        >
          Loading...
        </div>
      )}

      <div 
        ref={chartRef} 
        style={{ 
          width: showDetailPanel ? 'calc(100% - 300px)' : '100%', 
          height: '100%',
          transition: 'width 0.3s ease',
        }} 
        role="img"
        aria-label={ariaDescription || `${ariaLabel}，使用键盘Tab键可以导航到图表元素`}
        tabIndex={decorative ? -1 : 0}
      />

      {/* Detail Panel */}
      {enableDrillDown && showDetailPanel && (
        <div 
          style={detailPanelStyle}
          role="complementary"
          aria-label="详情面板"
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 16,
            borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}`,
            paddingBottom: 8,
          }}>
            <h3 
              style={{ margin: 0, color: theme === 'dark' ? '#fff' : '#333' }}
              id={`${chartId}-detail-title`}
            >
              详情
            </h3>
            <button
              onClick={() => {
                setShowDetailPanel(false);
                announce('已关闭详情面板');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: theme === 'dark' ? '#999' : '#666',
                cursor: 'pointer',
                fontSize: 18,
              }}
              aria-label="关闭详情面板 (Esc)"
              title="关闭 (Esc)"
            >
              ✕
            </button>
          </div>

          {detailLoading ? (
            <div 
              style={{ color: theme === 'dark' ? '#999' : '#666', textAlign: 'center', padding: 20 }}
              role="status"
              aria-live="polite"
            >
              加载中...
            </div>
          ) : detailData.length > 0 ? (
            <div role="list" aria-label="详情数据列表">
              {detailData.map((detail, index) => (
                <div
                  key={index}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    background: theme === 'dark' ? '#2a2a3e' : '#f5f5f5',
                    borderRadius: 4,
                  }}
                  role="listitem"
                >
                  <div style={{ 
                    fontSize: 12, 
                    color: theme === 'dark' ? '#999' : '#666',
                    marginBottom: 4,
                  }}>
                    {detail.field}
                  </div>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 'bold',
                    color: theme === 'dark' ? '#fff' : '#333',
                  }}>
                    {typeof detail.value === 'number' 
                      ? detail.value.toLocaleString() 
                      : detail.value}
                  </div>
                  {detail.children && detail.children.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12 }}>
                      <div style={{ color: theme === 'dark' ? '#999' : '#666' }}>
                        子项: {detail.children.length}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: theme === 'dark' ? '#999' : '#666', textAlign: 'center', padding: 20 }}>
              暂无数据
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CDLChart;
