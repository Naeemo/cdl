# 饼图示例

## 基础饼图

```cdl
@lang(data)
CategoryData {
    name,value
    食品,30
    服装,45
    电子,25
}

Chart {
    use CategoryData
    type pie
}
```

## 环形图

```cdl
@lang(data)
Data1 { name,value\nA,30\nB,70 }

Chart {
    use Data1
    type pie
    @style "环形"
}
```
