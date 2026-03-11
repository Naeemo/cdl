# 柱状图示例

## 基础柱状图

```cdl
@lang(data)
RegionData {
    region,sales
    华北,120
    华南,200
    华东,180
    华西,150
}

Chart {
    use RegionData
    type bar
    x region
    y sales
}
```

## 堆叠柱状图

```cdl
@lang(data)
Data1 { month,a,b\n1月,30,70\n2月,40,60 }

Chart {
    use Data1
    type bar
    x month
    stack true
}
```
