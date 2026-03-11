# 更多图表

## 散点图

```cdl
@lang(data)
Data { x,y\n1,2\n2,4\n3,6\n4,8 }

Chart {
    use Data
    type scatter
    x x
    y y
}
```

## 面积图

```cdl
@lang(data)
Data { x,y\n1,10\n2,20\n3,15 }

Chart {
    use Data
    type area
    x x
    y y
    @style "渐变填充"
}
```

## 雷达图

```cdl
@lang(data)
Data { dim,value\nA,80\nB,90\nC,70\nD,85 }

Chart {
    use Data
    type radar
}
```
