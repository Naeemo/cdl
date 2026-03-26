/**
 * Русский (ru-RU)
 */

export default {
  // Типы диаграмм
  'chart.line': 'Линейный график',
  'chart.bar': 'Столбчатая диаграмма',
  'chart.pie': 'Круговая диаграмма',
  'chart.scatter': 'Точечная диаграмма',
  'chart.area': 'Диаграмма с областями',
  'chart.radar': 'Лепестковая диаграмма',
  'chart.funnel': 'Воронка',
  'chart.treemap': 'Древовидная карта',
  'chart.sunburst': 'Солнечная диаграмма',
  'chart.sankey': 'Диаграмма Санкей',
  'chart.gauge': 'Индикатор',
  'chart.candlestick': 'Свечной график',
  'chart.boxplot': 'Ящик с усами',
  'chart.heatmap': 'Тепловая карта',
  'chart.map': 'Карта',
  'chart.graph': 'Граф',
  'chart.wordcloud': 'Облако слов',
  'chart.liquid': 'Жидкое заполнение',
  
  // Общие метки
  'label.total': 'Итого',
  'label.average': 'Среднее',
  'label.count': 'Количество',
  'label.max': 'Максимум',
  'label.min': 'Минимум',
  'label.sum': 'Сумма',
  'label.value': 'Значение',
  'label.name': 'Название',
  'label.category': 'Категория',
  'label.date': 'Дата',
  'label.time': 'Время',
  'label.percent': 'Процент',
  'label.ratio': 'Соотношение',
  
  // Оси
  'axis.x': 'Ось X',
  'axis.y': 'Ось Y',
  'axis.category': 'Ось категорий',
  'axis.value': 'Ось значений',
  'axis.time': 'Ось времени',
  
  // Подсказка
  'tooltip.noData': 'Нет данных',
  'tooltip.clickForDetails': 'Нажмите для подробностей',
  'tooltip.drillDown': 'Детализация: {name}',
  
  // Легенда
  'legend.showAll': 'Показать все',
  'legend.hideAll': 'Скрыть все',
  'legend.selectAll': 'Выбрать все',
  'legend.inverse': 'Инвертировать выбор',
  
  // Действия
  'action.download': 'Скачать',
  'action.refresh': 'Обновить',
  'action.zoom': 'Масштаб',
  'action.reset': 'Сбросить',
  'action.saveAsImage': 'Сохранить как изображение',
  'action.dataView': 'Просмотр данных',
  
  // Данные
  'data.empty': 'Нет доступных данных',
  'data.loading': 'Загрузка данных...',
  'data.error': 'Ошибка загрузки данных',
  'data.noMore': 'Больше нет данных',
  
  // Время
  'time.year': 'Год',
  'time.month': 'Месяц',
  'time.day': 'День',
  'time.hour': 'Час',
  'time.minute': 'Минута',
  'time.second': 'Секунда',
  'time.week': 'Неделя',
  'time.quarter': 'Квартал',
  
  // Единицы
  'unit.thousand': 'тыс.',
  'unit.million': 'млн',
  'unit.billion': 'млрд',
  'unit.trillion': 'трлн',
  'unit.percent': '%',
  'unit.degree': '°',
  
  // Агрегация
  'agg.sum': 'Сумма',
  'agg.avg': 'Среднее',
  'agg.count': 'Подсчёт',
  'agg.max': 'Максимум',
  'agg.min': 'Минимум',
  'agg.median': 'Медиана',
  'agg.first': 'Первый',
  'agg.last': 'Последний',
  
  // Сортировка
  'sort.asc': 'По возрастанию',
  'sort.desc': 'По убыванию',
  'sort.default': 'По умолчанию',
  
  // Фильтр
  'filter.all': 'Все',
  'filter.custom': 'Пользовательский',
  
  // Детализация
  'drilldown.back': 'Назад',
  'drilldown.root': 'Корень',
  'drilldown.level': 'Уровень {level}',
  
  // Представления
  'view.day': 'Дневной вид',
  'view.week': 'Недельный вид',
  'view.month': 'Месячный вид',
  'view.year': 'Годовой вид',
  
  // Экспорт
  'export.png': 'Экспорт PNG',
  'export.svg': 'Экспорт SVG',
  'export.pdf': 'Экспорт PDF',
  'export.csv': 'Экспорт CSV',
  'export.excel': 'Экспорт Excel',
  
  // Ошибки
  'error.render': 'Ошибка отрисовки диаграммы',
  'error.dataFormat': 'Неверный формат данных',
  'error.noData': 'Данные не найдены',
  'error.invalidType': 'Неподдерживаемый тип диаграммы',
} as const;
