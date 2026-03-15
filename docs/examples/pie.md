# 饼图与环形图示例

## 基础饼图

```cdl
# 市场份额占比

| 厂商 | 占比 |
| --- | --- |
| A | 45% |
| B | 30% |
| C | 25% |

## pie

@color "#4fc3f7"
```

---

## 标准语法（带样式）

```cdl
@lang(data)
MarketShare {
    vendor,percentage
    A,45
    B,30
    C,25
}

Chart 市场份额 {
    use MarketShare
    type pie
    x vendor
    y percentage
    
    @color "#4fc3f7"
    @title "2024年市场份额"
    @style "rose"  # 南丁格尔玫瑰图
}
```

---

## 环形图（donut）

```cdl
# 用户设备分布

| 设备 | 占比 |
| --- | --- |
| 手机 | 65% |
| 平板 | 20% |
| 电脑 | 15% |

## pie

@style "donut"  # 环形图
@color "#4fc3f7"
```

---

## 多层级饼图

```cdl
@lang(data)
HierarchicalData {
    category,subcategory,value
    电子,手机,200
    电子,电脑,150
    服装,上衣,100
    服装,裤子,80
}

# 销售层级（旭日图需 map 类型）

## pie  # 简化为单层饼图

## series
| field | as | type |
| --- | --- | --- |
| 电子 | 电子 | pie |
| 服装 | 服装 | pie |
```

---

## 关键配置说明

| 配置 | 说明 | 示例 |
|------|------|------|
| `## pie` | 图表类型 | 饼图 |
| `@style "donut"` | 环形图 | 中间空心 |
| `@style "rose"` | 南丁格尔玫瑰图 | 扇区半径随值变化 |
| `@color` | 调色板起始色 | `#4fc3f7` |
| `## series` | 多饼图 | 多个饼图并列（不常用） |

---

## 注意事项

- **数据要求**：饼图需要分类字段（x）和数值字段（y）
- **百分比**：建议数据总和为 100%，非 100% 会自动计算比例
- **扇区标签**：默认显示百分比，可通过 `@interaction` 控制提示框
- **颜色**：自动分配调色板，`@color` 指定起始色

---

*更新日期：2026-03-14*