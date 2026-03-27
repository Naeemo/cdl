# CDL 语法规范 v0.7

## 概述

CDL（Chart Definition Language）是用于定义数据图表的领域特定语言（DSL）。设计目标：

- **像 Markdown 一样简单**：纯 Markdown 风格，无需学习新语法
- **AI 友好**：结构化、可验证，便于 LLM 生成和修改
- **渐进增强**：简单图表 3 行，复杂图表逐层添加配置

---

## 基本结构

```cdl
# 图表标题
| 列1 | 列2 |
| --- | --- |
| 值1 | 值2 |

## 图表类型
@指令
```

---

## 1. 标题与数据（必需）

### 1.1 标题
```cdl
# 月度销售趋势
```
一级标题 `#` 定义图表名称。

### 1.2 数据表格
```cdl
| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |
```
Markdown 表格格式，第一行为表头，后续为数据。

**自动映射**：
- 第一列 → x 轴
- 第二列 → y 轴
- 第三列及以后 → 可用于分组或多系列

---

## 2. 图表类型（必需）

```cdl
## line      # 折线图
## bar       # 柱状图
## pie       # 饼图
## scatter   # 散点图
## area      # 面积图
## radar     # 雷达图
## combo     # 组合图
## heatmap   # 热力图
## ...
```

---

## 3. 样式指令（可选）

```cdl
@color #4fc3f7           # 主色调
@style smooth            # 样式：smooth, solid, dashed
@title "主标题"          # 图表标题
@subtitle "副标题"       # 副标题
@theme dark             # 主题：light, dark, auto
@grid true              # 显示网格线
@responsive true        # 响应式
```

---

## 4. 多系列配置（可选）

```cdl
## series
| field | as | type | color | axis | style |
| --- | --- | --- | --- | --- | --- |
| 销售额 | 销售额(万元) | bar | #4fc3f7 | left | solid |
| 利润 | 利润(万元) | line | #ff9800 | right | smooth |
```

**字段说明**：
- `field`：数据列名（必需）
- `as`：显示名称
- `type`：图表类型（bar, line, area...）
- `color`：颜色
- `axis`：坐标轴（left, right）
- `style`：样式（solid, dashed, smooth, marker）

---

## 5. 坐标轴配置（可选）

```cdl
## axis y left
min: 0
max: 200
labelFormatter: "${value}万"
splitLine: true

## axis y right
min: 0
max: 50
labelFormatter: "${value}%"
```

**配置项**：
- `min` / `max`：数值范围
- `labelFormatter`：标签格式
- `labelRotate`：标签旋转角度
- `splitLine`：是否显示网格线
- `type`：轴类型（category, value, time, log）

---

## 6. 字段映射（可选）

当自动映射不满足需求时：

```cdl
## map
x: 月份
y: 销售额
group: 区域
```

---

## 7. 交互配置（可选）

```cdl
@interaction "tooltip:shared zoom:inside"
```

**选项**：
- `tooltip:shared`：共享提示框
- `tooltip:single`：单系列提示
- `zoom:inside`：鼠标滚轮缩放
- `zoom:slider`：底部滑块缩放
- `brush:true`：刷选

---

## 8. 外部数据源（可选）

```cdl
```sql SalesData
SELECT month, SUM(amount) as total
FROM sales
WHERE year = 2024
GROUP BY month
```

# 销售分析
## line
use SalesData
```

---

## 完整示例

### 基础图表
```cdl
# 月度销售
| 月份 | 销售额 |
| --- | --- |
| 1月 | 100 |
| 2月 | 150 |
| 3月 | 200 |

## line
@color #4fc3f7
```

### 组合图
```cdl
# 销售与利润
| 月份 | 销售额 | 利润 |
| --- | --- | --- |
| 1月 | 120 | 15 |
| 2月 | 150 | 20 |
| 3月 | 180 | 25 |

## combo

## series
| field | as | type | color | axis |
| --- | --- | --- | --- | --- |
| 销售额 | 销售额(万元) | bar | #4fc3f7 | left |
| 利润 | 利润(万元) | line | #ff9800 | right |

## axis y left
min: 0
max: 200

## axis y right
min: 0
max: 50

@interaction "tooltip:shared"
```

---

## 与 v0.6 的区别

| v0.6 (旧) | v0.7 (新) |
|-----------|-----------|
| `Chart 名称 { ... }` | `# 名称` + `## 类型` |
| `@lang(data) Name { ... }` | `` ` ``sql Name` 代码块 |
| `use DataName` | 直接引用或内联数据 |
| 三套语法 | 一套 Markdown 语法 |

---

*文档版本：v0.7*  
*更新日期：2026-03-27*