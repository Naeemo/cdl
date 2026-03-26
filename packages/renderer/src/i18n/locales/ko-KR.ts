/**
 * 한국어 (ko-KR)
 */

export default {
  // 차트 유형
  'chart.line': '선형 차트',
  'chart.bar': '막대 차트',
  'chart.pie': '원형 차트',
  'chart.scatter': '분산형 차트',
  'chart.area': '영역 차트',
  'chart.radar': '레이더 차트',
  'chart.funnel': '퍼널 차트',
  'chart.treemap': '트리맵',
  'chart.sunburst': '선버스트 차트',
  'chart.sankey': '생키 다이어그램',
  'chart.gauge': '게이지',
  'chart.candlestick': '캔들스틱 차트',
  'chart.boxplot': '박스플롯',
  'chart.heatmap': '히트맵',
  'chart.map': '지도',
  'chart.graph': '그래프',
  'chart.wordcloud': '워드클리우드',
  'chart.liquid': '액체 채움',
  
  // 일반 레이블
  'label.total': '합계',
  'label.average': '평균',
  'label.count': '개수',
  'label.max': '최대',
  'label.min': '최소',
  'label.sum': '합계',
  'label.value': '값',
  'label.name': '이름',
  'label.category': '카테고리',
  'label.date': '날짜',
  'label.time': '시간',
  'label.percent': '백분율',
  'label.ratio': '비율',
  
  // 축
  'axis.x': 'X축',
  'axis.y': 'Y축',
  'axis.category': '카테고리 축',
  'axis.value': '값 축',
  'axis.time': '시간 축',
  
  // 툴팁
  'tooltip.noData': '데이터 없음',
  'tooltip.clickForDetails': '자세히 복려면 클릭',
  'tooltip.drillDown': '{name}(으)로 드릴다운',
  
  // 범례
  'legend.showAll': '모두 표시',
  'legend.hideAll': '모두 숨기기',
  'legend.selectAll': '모두 선택',
  'legend.inverse': '선택 반전',
  
  // 동작
  'action.download': '다운로드',
  'action.refresh': '새로고침',
  'action.zoom': '확대/축소',
  'action.reset': '초기화',
  'action.saveAsImage': '이미지로 저장',
  'action.dataView': '데이터 보기',
  
  // 데이터
  'data.empty': '데이터가 없습니다',
  'data.loading': '데이터 로딩 중...',
  'data.error': '데이터 로딩 실패',
  'data.noMore': '더 이상 데이터가 없습니다',
  
  // 시간
  'time.year': '년',
  'time.month': '월',
  'time.day': '일',
  'time.hour': '시',
  'time.minute': '분',
  'time.second': '초',
  'time.week': '주',
  'time.quarter': '분기',
  
  // 단위
  'unit.thousand': '천',
  'unit.million': '백만',
  'unit.billion': '십억',
  'unit.trillion': '조',
  'unit.percent': '%',
  'unit.degree': '°',
  
  // 집계
  'agg.sum': '합계',
  'agg.avg': '평균',
  'agg.count': '카운트',
  'agg.max': '최대값',
  'agg.min': '최소값',
  'agg.median': '중앙값',
  'agg.first': '첫 번째',
  'agg.last': '마지막',
  
  // 정렬
  'sort.asc': '오름차순',
  'sort.desc': '내림차순',
  'sort.default': '기본 정렬',
  
  // 필터
  'filter.all': '전체',
  'filter.custom': '사용자 정의',
  
  // 드릴다운
  'drilldown.back': '뒤로',
  'drilldown.root': '루트',
  'drilldown.level': '레벨 {level}',
  
  // 뷰
  'view.day': '일간 보기',
  'view.week': '주간 보기',
  'view.month': '월간 보기',
  'view.year': '연간 보기',
  
  // 낳ㄹ/
  'export.png': 'PNG 낳ㄹ/',
  'export.svg': 'SVG 낳ㄹ/',
  'export.pdf': 'PDF 낳ㄹ/',
  'export.csv': 'CSV 낳ㄹ/',
  'export.excel': 'Excel 낳ㄹ/',
  
  // 오류
  'error.render': '차트 렌더링 실패',
  'error.dataFormat': '잘못된 데이터 형식',
  'error.noData': '데이터를 찾을 수 없습니다',
  'error.invalidType': '지원되지 않는 차트 유형입니다',
} as const;
