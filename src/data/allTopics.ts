import { LessonTopic, TopicSubsection } from '@/types'
import { mechanicsFullContent } from './mechanicsFullContent'

// Функция для объединения базовой информации с полным контентом
function getFullTopic(id: string, title: string, description: string): LessonTopic {
  const fullContent = mechanicsFullContent[id]
  return {
    id,
    title,
    description,
    theory: fullContent?.theory || '',
    formulas: fullContent?.formulas || [],
    examples: fullContent?.examples || [],
    problems: fullContent?.problems || []
  }
}

// МЕХАНИКА (22 темы)
export const mechanicsSubsections: TopicSubsection[] = [
  {
    id: 'kinematics',
    title: 'Кинематика',
    topics: [
      getFullTopic('m1', 'Прямолинейное движение', 'Движение тела по прямой линии'),
      getFullTopic('m2', 'Равномерное и равноускоренное движение', 'Движение с постоянной скоростью и ускорением'),
      getFullTopic('m3', 'Движение по окружности', 'Круговое движение, центростремительное ускорение'),
      getFullTopic('m4', 'Относительность движения', 'Движение относительно разных систем отсчета'),
      getFullTopic('m5', 'Графики движения', 'Графическое представление движения'),
    ]
  },
  {
    id: 'dynamics',
    title: 'Динамика',
    topics: [
      getFullTopic('m6', 'Законы Ньютона', 'Три основных закона классической механики'),
      getFullTopic('m7', 'Силы в механике', 'Различные виды сил: тяжести, трения, упругости'),
      getFullTopic('m8', 'Движение под действием нескольких сил', 'Равнодействующая сил, сложение векторов'),
      getFullTopic('m9', 'Наклонная плоскость', 'Движение по наклонной плоскости'),
      getFullTopic('m10', 'Импульс и закон сохранения импульса', 'Импульс тела, закон сохранения'),
    ]
  },
  {
    id: 'statics',
    title: 'Статика',
    topics: [
      getFullTopic('m11', 'Условия равновесия', 'Условия покоя и равновесия тел'),
      getFullTopic('m12', 'Момент силы', 'Вращательное действие силы'),
      getFullTopic('m13', 'Центр масс', 'Центр масс системы тел'),
      getFullTopic('m14', 'Простые механизмы', 'Рычаги, блоки, наклонная плоскость'),
    ]
  },
  {
    id: 'conservation',
    title: 'Законы сохранения',
    topics: [
      getFullTopic('m15', 'Работа', 'Механическая работа силы'),
      getFullTopic('m16', 'Кинетическая энергия', 'Энергия движения'),
      getFullTopic('m17', 'Потенциальная энергия', 'Энергия взаимодействия'),
      getFullTopic('m18', 'Закон сохранения энергии', 'Сохранение механической энергии'),
    ]
  },
  {
    id: 'oscillations',
    title: 'Механические колебания и волны',
    topics: [
      getFullTopic('m19', 'Гармонические колебания', 'Колебательное движение'),
      getFullTopic('m20', 'Маятники', 'Математический и физический маятники'),
      getFullTopic('m21', 'Механические волны', 'Распространение колебаний в среде'),
      getFullTopic('m22', 'Резонанс', 'Явление резонанса в механике'),
    ]
  },
]

// ТЕРМОДИНАМИКА (18 тем)
export const thermodynamicsSubsections: TopicSubsection[] = [
  {
    id: 'mkt',
    title: 'Молекулярно-кинетическая теория',
    topics: [
      { id: 't1', title: 'Строение вещества', description: 'Молекулярное строение вещества' },
      { id: 't2', title: 'Температура', description: 'Температура и тепловое движение' },
      { id: 't3', title: 'Давление газа', description: 'Давление идеального газа' },
    ]
  },
  {
    id: 'heat',
    title: 'Тепловые процессы',
    topics: [
      { id: 't4', title: 'Теплопроводность', description: 'Передача тепла через вещество' },
      { id: 't5', title: 'Конвекция', description: 'Перенос тепла потоками вещества' },
      { id: 't6', title: 'Излучение', description: 'Тепловое излучение' },
      { id: 't7', title: 'Количество теплоты', description: 'Энергия, передаваемая при теплообмене' },
    ]
  },
  {
    id: 'ideal-gas',
    title: 'Идеальный газ',
    topics: [
      { id: 't8', title: 'Уравнение состояния', description: 'Уравнение Менделеева-Клапейрона' },
      { id: 't9', title: 'Изопроцессы', description: 'Изотермический, изобарный, изохорный процессы' },
      { id: 't10', title: 'Газовые законы', description: 'Законы Бойля-Мариотта, Гей-Люссака, Шарля' },
    ]
  },
  {
    id: 'thermodynamics-laws',
    title: 'Законы термодинамики',
    topics: [
      { id: 't11', title: 'Первый закон', description: 'Закон сохранения энергии в термодинамике' },
      { id: 't12', title: 'Второй закон', description: 'Направление тепловых процессов' },
      { id: 't13', title: 'Тепловые машины', description: 'Двигатели и холодильники' },
      { id: 't14', title: 'КПД', description: 'Коэффициент полезного действия' },
    ]
  },
  {
    id: 'phase',
    title: 'Фазовые переходы',
    topics: [
      { id: 't15', title: 'Плавление', description: 'Переход из твердого в жидкое состояние' },
      { id: 't16', title: 'Испарение', description: 'Переход из жидкого в газообразное состояние' },
      { id: 't17', title: 'Кипение', description: 'Процесс кипения жидкости' },
      { id: 't18', title: 'Диаграммы состояния', description: 'Фазовые диаграммы веществ' },
    ]
  },
]

// ЭЛЕКТРИЧЕСТВО И МАГНЕТИЗМ (20 тем)
export const electricitySubsections: TopicSubsection[] = [
  {
    id: 'electrostatics',
    title: 'Электростатика',
    topics: [
      { id: 'e1', title: 'Электрический заряд', description: 'Элементарный заряд, закон сохранения' },
      { id: 'e2', title: 'Закон Кулона', description: 'Взаимодействие точечных зарядов' },
      { id: 'e3', title: 'Электрическое поле', description: 'Поле точечного заряда, напряженность' },
      { id: 'e4', title: 'Потенциал и напряжение', description: 'Энергетические характеристики поля' },
      { id: 'e5', title: 'Конденсаторы', description: 'Электроемкость, соединение конденсаторов' },
    ]
  },
  {
    id: 'dc-current',
    title: 'Постоянный ток',
    topics: [
      { id: 'e6', title: 'Сила тока', description: 'Электрический ток, плотность тока' },
      { id: 'e7', title: 'Закон Ома', description: 'Связь тока, напряжения и сопротивления' },
      { id: 'e8', title: 'Работа и мощность тока', description: 'Энергия электрического тока' },
      { id: 'e9', title: 'Соединение проводников', description: 'Последовательное и параллельное соединение' },
    ]
  },
  {
    id: 'magnetism',
    title: 'Магнетизм',
    topics: [
      { id: 'e10', title: 'Магнитное поле', description: 'Магнитное поле тока, индукция' },
      { id: 'e11', title: 'Сила Ампера', description: 'Сила, действующая на проводник с током' },
      { id: 'e12', title: 'Сила Лоренца', description: 'Сила, действующая на движущийся заряд' },
    ]
  },
  {
    id: 'induction',
    title: 'Электромагнитная индукция',
    topics: [
      { id: 'e13', title: 'Закон Фарадея', description: 'Возникновение ЭДС при изменении магнитного потока' },
      { id: 'e14', title: 'Правило Ленца', description: 'Направление индукционного тока' },
      { id: 'e15', title: 'Индуктивность', description: 'Самоиндукция, энергия магнитного поля' },
      { id: 'e16', title: 'Вихревые токи', description: 'Токи Фуко' },
    ]
  },
  {
    id: 'ac-current',
    title: 'Переменный ток',
    topics: [
      { id: 'e17', title: 'Синусоидальный ток', description: 'Гармонические колебания в цепи' },
      { id: 'e18', title: 'Реактивное сопротивление', description: 'Индуктивное и емкостное сопротивление' },
      { id: 'e19', title: 'Трансформаторы', description: 'Устройство и принцип работы' },
      { id: 'e20', title: 'Передача электроэнергии', description: 'Передача энергии на расстояние' },
    ]
  },
]

// ОПТИКА (12 тем)
export const opticsSubsections: TopicSubsection[] = [
  {
    id: 'geometric',
    title: 'Геометрическая оптика',
    topics: [
      { id: 'o1', title: 'Распространение света', description: 'Прямолинейное распространение, скорость света' },
      { id: 'o2', title: 'Отражение', description: 'Закон отражения, зеркала' },
      { id: 'o3', title: 'Преломление', description: 'Закон преломления, показатель преломления' },
      { id: 'o4', title: 'Линзы и зеркала', description: 'Тонкие линзы, построение изображений' },
      { id: 'o5', title: 'Оптические приборы', description: 'Микроскопы, телескопы, фотоаппараты' },
    ]
  },
  {
    id: 'wave',
    title: 'Волновая оптика',
    topics: [
      { id: 'o6', title: 'Интерференция', description: 'Сложение волн, интерференционные картины' },
      { id: 'o7', title: 'Дифракция', description: 'Огибание препятствий волнами' },
      { id: 'o8', title: 'Поляризация', description: 'Поляризованный свет' },
    ]
  },
  {
    id: 'quantum-optics',
    title: 'Квантовая оптика',
    topics: [
      { id: 'o9', title: 'Фотоэффект', description: 'Выбивание электронов светом' },
      { id: 'o10', title: 'Дуализм света', description: 'Корпускулярно-волновой дуализм' },
      { id: 'o11', title: 'Спектры излучения', description: 'Спектральный анализ' },
      { id: 'o12', title: 'Лазеры', description: 'Квантовые генераторы света' },
    ]
  },
]

// АТОМНАЯ И ЯДЕРНАЯ ФИЗИКА (14 тем)
export const atomicSubsections: TopicSubsection[] = [
  {
    id: 'atom-structure',
    title: 'Строение атома',
    topics: [
      { id: 'a1', title: 'Модели атома', description: 'Модель Резерфорда, модель Бора' },
      { id: 'a2', title: 'Энергетические уровни', description: 'Дискретные уровни энергии электронов' },
      { id: 'a3', title: 'Электронные оболочки', description: 'Строение электронных оболочек' },
    ]
  },
  {
    id: 'quantum',
    title: 'Квантовая физика',
    topics: [
      { id: 'a4', title: 'Волны де Бройля', description: 'Волновые свойства частиц' },
      { id: 'a5', title: 'Неопределённость Гейзенберга', description: 'Принцип неопределенности' },
    ]
  },
  {
    id: 'nuclear',
    title: 'Ядерная физика',
    topics: [
      { id: 'a6', title: 'Строение ядра', description: 'Протоны, нейтроны, изотопы' },
      { id: 'a7', title: 'Ядерные силы', description: 'Сильное взаимодействие' },
      { id: 'a8', title: 'Энергия связи', description: 'Энергия связи ядра' },
    ]
  },
  {
    id: 'radioactivity',
    title: 'Радиоактивность',
    topics: [
      { id: 'a9', title: 'Виды распада', description: 'Альфа, бета, гамма распад' },
      { id: 'a10', title: 'Закон радиоактивного распада', description: 'Период полураспада' },
      { id: 'a11', title: 'Дозы излучения', description: 'Биологическое действие излучения' },
    ]
  },
  {
    id: 'nuclear-reactions',
    title: 'Ядерные реакции',
    topics: [
      { id: 'a12', title: 'Деление ядер', description: 'Ядерное деление, цепная реакция' },
      { id: 'a13', title: 'Термоядерный синтез', description: 'Синтез легких ядер' },
      { id: 'a14', title: 'Применение ядерной энергии', description: 'Атомные электростанции' },
    ]
  },
]

// Все темы для быстрого доступа
export const allTopics: Record<string, TopicSubsection[]> = {
  mechanics: mechanicsSubsections,
  thermodynamics: thermodynamicsSubsections,
  electricity: electricitySubsections,
  optics: opticsSubsections,
  atomic: atomicSubsections,
}

// Получить все темы раздела
export function getAllTopicsForSection(sectionId: string): LessonTopic[] {
  const subsections = allTopics[sectionId] || []
  return subsections.flatMap(subsection => subsection.topics)
}

