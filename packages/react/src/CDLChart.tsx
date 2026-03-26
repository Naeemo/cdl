/**
 * CDL React Component with DrillDown support
 * Usage: <CDLChart code={cdlCode} theme="dark" enableDrillDown />
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // DrillDown state
  const [drillDownPath, setDrillDownPath] = useState<DrillDownPath[]>([]);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [detailData, setDetailData] = useState<DetailData[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Linkage hook
  const { bindChart } = useChartLinkage(linkage);

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

    try {
      if (onDrillDown) {
        const details = await onDrillDown(newPath);
        setDetailData(details);
      } else {
        // 默认详情展示
        setDetailData([{
          field: newPathItem.field,
          value: newPathItem.value,
          rawData: params.data,
        }]);
      }
    } catch (err) {
      console.error('Drill down error:', err);
    } finally {
      setDetailLoading(false);
    }
  }, [drillDownPath, enableDrillDown, onDrillDown, onClick]);

  // Go back to previous level
  const handleGoBack = useCallback((targetLevel: number) => {
    const newPath = drillDownPath.slice(0, targetLevel + 1);
    setDrillDownPath(newPath);
    if (newPath.length === 0) {
      setShowDetailPanel(false);
    }
  }, [drillDownPath]);

  // Reset drill down
  const handleReset = useCallback(() => {
    setDrillDownPath([]);
    setShowDetailPanel(false);
    setDetailData([]);
  }, []);

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
        onSuccess?.();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        setLoading(false);
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
  }, [code, theme, handleDrillDown, onSuccess, onError]);

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
      >
        <div style={{ color: '#cf222e', fontSize: 14 }}>
          <strong>❌ CDL Error</strong>
          <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{error}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      {/* Breadcrumb */}
      {enableDrillDown && drillDownPath.length > 0 && (
        <div
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
          >
            🏠
          </button>
          {drillDownPath.map((item, index) => (
            <React.Fragment key={index}>
              <span style={{ color: theme === 'dark' ? '#666' : '#999' }}>/</span>
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
              >
                {item.value}
              </button>
            </React.Fragment>
          ))}
        </div>
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
      />

      {/* Detail Panel */}
      {enableDrillDown && showDetailPanel && (
        <div style={detailPanelStyle}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 16,
            borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}`,
            paddingBottom: 8,
          }}>
            <h3 style={{ margin: 0, color: theme === 'dark' ? '#fff' : '#333' }}>
              详情
            </h3>
            <button
              onClick={() => setShowDetailPanel(false)}
              style={{
                background: 'none',
                border: 'none',
                color: theme === 'dark' ? '#999' : '#666',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              ✕
            </button>
          </div>

          {detailLoading ? (
            <div style={{ color: theme === 'dark' ? '#999' : '#666', textAlign: 'center', padding: 20 }}>
              加载中...
            </div>
          ) : detailData.length > 0 ? (
            <div>
              {detailData.map((detail, index) => (
                <div
                  key={index}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    background: theme === 'dark' ? '#2a2a3e' : '#f5f5f5',
                    borderRadius: 4,
                  }}
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
