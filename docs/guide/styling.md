# 样式与外观

CDL 提供多种方式自定义图表外观，从简单的颜色调整到复杂的样式组合。

---

## 样式指令

所有样式配置通过 `@` 开头的指令实现：

```cdl
# 月度销售

| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |

## line

@title "月度销售额"
@subtitle "2024年"
@color #5470c6
@style smooth
@theme dark
@grid true
```

---

## 标题与文本

### @title 和 @subtitle

```cdl
@title 2024 年销售趋势
@subtitle 单位：万元，数据截至 12 月
```

### 说明
- `title` 显示在图表顶部
- `subtitle` 显示在 title 下方，字体较小

---

## 颜色

### @color

设置图表主色调：

```cdl
@color #4fc3f7    # 蓝色
@color #ff9800    # 橙色
@color #4caf50    # 绿色
```

---

## 线型样式

### @style

| 值 | 说明 | 适用图表 |
|----|------|----------|
| `solid` | 实线 | line, area |
| `dashed` | 虚线 | line, area |
| `smooth` | 平滑曲线 | line |

```cdl
## line
@style smooth
```

---

## 主题

### @theme

```cdl
@theme light   # 浅色主题（默认）
@theme dark    # 深色主题
@theme auto    # 跟随系统
```

---

## 网格线

### @grid

```cdl
@grid true     # 显示网格线（默认）
@grid false    # 隐藏网格线
```

---

## 完整示例

```cdl
# 系统监控面板

| 时间 | CPU | 内存 | 网络 |
| --- | --- | --- | --- |
| 00:00 | 45 | 60 | 120 |
| 06:00 | 30 | 55 | 80 |
| 12:00 | 80 | 75 | 200 |

## area

## series
| field | as | color |
| --- | --- | --- |
| CPU | CPU使用率(%) | #ff9800 |
| 内存 | 内存使用率(%) | #4fc3f7 |
| 网络 | 网络流量(MB) | #e91e63 |

## axis y
min: 0
max: 100

@title 系统监控
@theme dark
@interaction "tooltip:shared zoom:slider"
```

---

*文档版本：v0.7*