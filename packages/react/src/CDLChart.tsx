/**
 * CDL React Component
 * Usage: <CDLChart code={cdlCode} theme="dark" />
 */

import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

interface CDLChartProps {
  /** CDL source code */
  code: string;
  /** Chart theme */
  theme?: 'light' | 'dark';
  /** Chart width */
  width?: number | string;
  /** Chart height */
  height?: number | string;
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
}

export const CDLChart: React.FC<CDLChartProps> = ({
  code,
  theme = 'light',
  width = '100%',
  height = 400,
  onClick,
  onSuccess,
  onError,
  className,
  style,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartRef.current || !code) return;

    // Dynamic import CDL compiler
    const loadAndRender = async () => {
      try {
        setLoading(true);
        setError(null);

        const { compile } = await import('@cdl/compiler');
        const { render } = await import('@cdl/renderer-echarts');

        const compileResult = compile(code);
        if (!compileResult.success) {
          const errorMsg = compileResult.errors.map(e => 
            `Line ${e.line}: ${e.message}`
          ).join('\n');
          throw new Error(errorMsg);
        }

        const renderResult = render(compileResult.result);
        if (!renderResult.success) {
          throw new Error(renderResult.error || 'Render failed');
        }

        // Initialize or update chart
        if (!chartInstance.current) {
          chartInstance.current = echarts.init(chartRef.current, theme);
          
          if (onClick) {
            chartInstance.current.on('click', onClick);
          }
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

    // Resize handler
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [code, theme, onClick, onSuccess, onError]);

  // Handle theme change
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
      <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default CDLChart;