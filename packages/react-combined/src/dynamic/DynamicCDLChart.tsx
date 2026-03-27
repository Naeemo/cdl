import React from 'react';
import { useDynamicChart, UseDynamicChartOptions } from './index';

export interface DynamicCDLChartProps extends Omit<UseDynamicChartOptions, 'onCompileError' | 'onDataUpdate' | 'onConnectionChange' | 'onError'> {
  className?: string;
  style?: React.CSSProperties;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.FC<{ error: string }>;
  showConnectionStatus?: boolean;
  showStats?: boolean;
  onCompileError?: (error: string) => void;
  onDataUpdate?: (state: { data: any[]; lastUpdate: number | null; updateCount: number }) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

const DefaultErrorComponent: React.FC<{ error: string }> = ({ error }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff2f0',
      border: '1px solid #ffccc7',
      borderRadius: 4,
      padding: 16,
      height: '100%',
    }}
  >
    <div style={{ color: '#cf222e', fontSize: 14 }}>
      <strong>Error</strong>
      <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{error}</pre>
    </div>
  </div>
);

export const DynamicCDLChart: React.FC<DynamicCDLChartProps> = ({
  className,
  style,
  loadingComponent,
  errorComponent: ErrorComponent = DefaultErrorComponent,
  showConnectionStatus = true,
  showStats = false,
  onCompileError,
  onDataUpdate,
  onConnectionChange,
  onError,
  ...chartOptions
}) => {
  const {
    chartRef,
    isLoading,
    isStreaming,
    isConnected,
    error,
    dataState,
    streamStats,
    refresh,
    startStreaming,
    stopStreaming,
    clearData,
  } = useDynamicChart({
    ...chartOptions,
    onCompileError,
    onDataUpdate,
    onConnectionChange,
    onError,
  });

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: 400,
    ...style,
  };

  const statusStyle: React.CSSProperties = {
    position: 'absolute',
    top: 8,
    right: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 12px',
    background: chartOptions.theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
    borderRadius: 4,
    fontSize: 12,
    zIndex: 10,
  };

  const dotStyle = (connected: boolean): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: connected ? '#52c41a' : '#ff4d4f',
    animation: connected ? 'pulse 2s infinite' : 'none',
  });

  return (
    <div className={className} style={containerStyle}>
      {showConnectionStatus && chartOptions.enableStreaming && (
        <div style={statusStyle}>
          <span style={dotStyle(isConnected)} />
          <span style={{ color: chartOptions.theme === 'dark' ? '#fff' : '#333' }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {isStreaming && (
            <span style={{ color: '#52c41a', marginLeft: 8 }}>Receiving...</span>
          )}
        </div>
      )}

      {showStats && streamStats && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            padding: '8px 12px',
            background: chartOptions.theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
            borderRadius: 4,
            fontSize: 11,
            color: chartOptions.theme === 'dark' ? '#ccc' : '#666',
            zIndex: 10,
          }}
        >
          <div>Batches: {streamStats.receivedBatches}</div>
          <div>Records: {streamStats.receivedRecords}</div>
          {streamStats.lastReceivedAt && (
            <div>Last: {new Date(streamStats.lastReceivedAt).toLocaleTimeString()}</div>
          )}
        </div>
      )}

      {error && <ErrorComponent error={error} />}

      {isLoading && loadingComponent}

      {!error && <div ref={chartRef} style={{ width: '100%', height: '100%' }} />}

      {chartOptions.enableStreaming && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            display: 'flex',
            gap: 8,
            zIndex: 10,
          }}
        >
          <button
            onClick={refresh}
            style={{
              padding: '4px 12px',
              background: chartOptions.theme === 'dark' ? '#333' : '#fff',
              border: `1px solid ${chartOptions.theme === 'dark' ? '#555' : '#d9d9d9'}`,
              borderRadius: 4,
              cursor: 'pointer',
              color: chartOptions.theme === 'dark' ? '#fff' : '#333',
            }}
          >
            Refresh
          </button>
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              style={{
                padding: '4px 12px',
                background: '#ff4d4f',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              Stop
            </button>
          ) : (
            <button
              onClick={startStreaming}
              style={{
                padding: '4px 12px',
                background: '#52c41a',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              Start
            </button>
          )}
          <button
            onClick={clearData}
            style={{
              padding: '4px 12px',
              background: chartOptions.theme === 'dark' ? '#333' : '#fff',
              border: `1px solid ${chartOptions.theme === 'dark' ? '#555' : '#d9d9d9'}`,
              borderRadius: 4,
              cursor: 'pointer',
              color: chartOptions.theme === 'dark' ? '#fff' : '#333',
            }}
          >
            Clear
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default DynamicCDLChart;
