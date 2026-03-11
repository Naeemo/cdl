# 折线图示例

## 基础折线图

```cdl
@lang(data)
SalesData {
    month,sales
    1月,100
    2月,150
    3月,200
    4月,180
    5月,220
}

Chart {
    use SalesData
    type line
    x month
    y sales
}
```

## 平滑曲线

```cdl
@lang(data)
Data1 { x,y\nA,10\nB,20\nC,15 }

Chart {
    use Data1
    type line
    x x
    y y
    @style "平滑曲线"
}
```

## 多线对比

```cdl
@lang(data)
Data2 { month,a,b\n1月,100,80\n2月,150,120\n3月,200,160 }

Chart {
    use Data2
    type line
    x month
    group series
    @style "多线对比"
}
```
