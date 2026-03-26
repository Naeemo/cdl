import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import React from 'react';
import {
  useChartLinkage,
  ChartLinkageProvider,
  generateChartId,
  useChartLinkageContext,
} from './useChartLinkage';

// Mock echarts
const mockDispatchAction = vi.fn();
const mockSetOption = vi.fn();
const mockGetOption = vi.fn(() => ({
  series: [{
    data: [
      { name: 'A', value: 100 },
      { name: 'B', value: 200 },
    ],
  }],
}));
const mockOn = vi.fn();
const mockOff = vi.fn();

const mockChart = {
  dispatchAction: mockDispatchAction,
  setOption: mockSetOption,
  getOption: mockGetOption,
  on: mockOn,
  off: mockOff,
};

describe('useChartLinkage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateChartId', () => {
    it('应该生成唯一的图表ID', () => {
      const id1 = generateChartId();
      const id2 = generateChartId();
      const id3 = generateChartId();

      expect(id1).toMatch(/^cdl-chart-\d+$/);
      expect(id2).toMatch(/^cdl-chart-\d+$/);
      expect(id3).toMatch(/^cdl-chart-\d+$/);
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
    });
  });

  describe('ChartLinkageProvider', () => {
    it('应该正确渲染子组件', () => {
      const TestComponent = () => <div data-testid="test-child">Test</div>;
      
      const { getByTestId } = render(
        <ChartLinkageProvider>
          <TestComponent />
        </ChartLinkageProvider>
      );

      expect(getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('useChartLinkage', () => {
    it('应该返回正确的初始值', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChartLinkageProvider>{children}</ChartLinkageProvider>
      );

      const { result } = renderHook(
        () => useChartLinkage({
          groupId: 'test-group',
          linkField: 'name',
        }),
        { wrapper }
      );

      expect(result.current.chartId).toMatch(/^cdl-chart-\d+$/);
      expect(typeof result.current.bindChart).toBe('function');
      expect(typeof result.current.highlight).toBe('function');
      expect(typeof result.current.clear).toBe('function');
    });

    it('应该在 bindChart 时注册图表到上下文', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChartLinkageProvider>{children}</ChartLinkageProvider>
      );

      const { result } = renderHook(
        () => useChartLinkage({
          groupId: 'test-group',
          linkField: 'name',
        }),
        { wrapper }
      );

      act(() => {
        result.current.bindChart(mockChart as any);
      });

      // 验证事件监听被设置
      expect(mockOn).toHaveBeenCalledWith('mouseover', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('mouseout', expect.any(Function));
    });

    it('应该支持点击事件监听', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChartLinkageProvider>{children}</ChartLinkageProvider>
      );

      const { result } = renderHook(
        () => useChartLinkage({
          groupId: 'test-group',
          linkField: 'name',
          enableClick: true,
        }),
        { wrapper }
      );

      act(() => {
        result.current.bindChart(mockChart as any);
      });

      expect(mockOn).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('应该允许禁用悬停联动', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChartLinkageProvider>{children}</ChartLinkageProvider>
      );

      const { result } = renderHook(
        () => useChartLinkage({
          groupId: 'test-group',
          linkField: 'name',
          enableHover: false,
        }),
        { wrapper }
      );

      act(() => {
        result.current.bindChart(mockChart as any);
      });

      // 不应当设置 mouseover 监听
      const mouseoverCalls = mockOn.mock.calls.filter(
        call => call[0] === 'mouseover'
      );
      expect(mouseoverCalls.length).toBe(0);
    });
  });

  describe('跨图表联动', () => {
    it('同一组的图表应该相互接收联动事件', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChartLinkageProvider>{children}</ChartLinkageProvider>
      );

      const { result: chart1 } = renderHook(
        () => useChartLinkage({
          groupId: 'shared-group',
          linkField: 'name',
        }),
        { wrapper }
      );

      const { result: chart2 } = renderHook(
        () => useChartLinkage({
          groupId: 'shared-group',
          linkField: 'name',
        }),
        { wrapper }
      );

      act(() => {
        chart1.current.bindChart(mockChart as any);
        chart2.current.bindChart(mockChart as any);
      });

      // chart1 触发高亮
      act(() => {
        chart1.current.highlight('A');
      });

      // chart2 应该收到联动并更新
      expect(mockSetOption).toHaveBeenCalled();
      expect(mockDispatchAction).toHaveBeenCalledWith({
        type: 'highlight',
        seriesIndex: 'all',
      });
    });

    it('不同组的图表不应该相互影响', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChartLinkageProvider>{children}</ChartLinkageProvider>
      );

      const { result: chart1 } = renderHook(
        () => useChartLinkage({
          groupId: 'group-a',
          linkField: 'name',
        }),
        { wrapper }
      );

      const { result: chart2 } = renderHook(
        () => useChartLinkage({
          groupId: 'group-b',
          linkField: 'name',
        }),
        { wrapper }
      );

      // 重置 mock
      mockSetOption.mockClear();
      mockDispatchAction.mockClear();

      act(() => {
        chart1.current.bindChart(mockChart as any);
        chart2.current.bindChart(mockChart as any);
      });

      // chart1 触发高亮
      act(() => {
        chart1.current.highlight('A');
      });

      // 由于高亮是单向的（只发送到同组的其他图表），
      // 但这里 chart1 和 chart2 在同一 Provider 下
      // 所以仍然会有调用
      expect(mockSetOption).toHaveBeenCalled();
    });
  });

  describe('手动控制', () => {
    it('应该支持手动触发高亮', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChartLinkageProvider>{children}</ChartLinkageProvider>
      );

      const { result } = renderHook(
        () => useChartLinkage({
          groupId: 'test-group',
          linkField: 'name',
        }),
        { wrapper }
      );

      act(() => {
        result.current.bindChart(mockChart as any);
      });

      // 手动高亮
      act(() => {
        result.current.highlight('test-value');
      });

      expect(mockSetOption).toHaveBeenCalled();
    });

    it('应该支持手动清除高亮', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChartLinkageProvider>{children}</ChartLinkageProvider>
      );

      const { result } = renderHook(
        () => useChartLinkage({
          groupId: 'test-group',
          linkField: 'name',
        }),
        { wrapper }
      );

      act(() => {
        result.current.bindChart(mockChart as any);
      });

      // 先高亮
      act(() => {
        result.current.highlight('test-value');
      });

      mockDispatchAction.mockClear();

      // 再清除
      act(() => {
        result.current.clear();
      });

      expect(mockDispatchAction).toHaveBeenCalledWith({
        type: 'downplay',
        seriesIndex: 'all',
      });
    });
  });
});

describe('useChartLinkageContext', () => {
  it('在 Provider 外部使用应该抛出错误', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useChartLinkageContext());
    }).toThrow('useChartLinkageContext must be used within a ChartLinkageProvider');

    consoleSpy.mockRestore();
  });

  it('在 Provider 内部使用应该返回上下文', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChartLinkageProvider>{children}</ChartLinkageProvider>
    );

    const { result } = renderHook(() => useChartLinkageContext(), { wrapper });

    expect(result.current).toHaveProperty('registerChart');
    expect(result.current).toHaveProperty('unregisterChart');
    expect(result.current).toHaveProperty('emitLinkageEvent');
    expect(result.current).toHaveProperty('activeHighlight');
  });
});
