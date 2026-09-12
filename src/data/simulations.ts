export type SimulationId =
  | 'uniform-acceleration'
  | 'projectile-motion'
  | 'pendulum'
  | 'collisions'
  | 'energy-incline'
  | 'archimedes'
  | 'optics-lens'
  | 'gas-laws'
  | 'circuits'
  | 'ohms-law'

export interface SimulationMeta {
  id: SimulationId
  title: string
  description: string
  tags: string[]
}

export const simulationCatalog: SimulationMeta[] = [
  {
    id: 'uniform-acceleration',
    title: 'Равноускоренное движение',
    description: 'Наглядная траектория, скорость и ускорение во времени.',
    tags: ['s(t)', 'v(t)', 'a'],
  },
  {
    id: 'projectile-motion',
    title: 'Баллистика (Бросок под углом)',
    description: 'Движение тела в поле тяжести, парабола, векторы скоростей и планеты.',
    tags: ['α', 'v₀', 'Hₘₐₓ', 'L', '2D'],
  },
  {
    id: 'pendulum',
    title: 'Маятники и колебания',
    description: 'Нитяной и пружинный маятники, график волны x(t) и баланс энергий.',
    tags: ['T', 'ν', 'ω', 'Eₖ ↔ Eₚ'],
  },
  {
    id: 'collisions',
    title: 'Импульс и столкновения',
    description: 'Упругий и неупругий удар двух тележек на треке, тепловые потери.',
    tags: ['p = mv', 'P_общ', 'Q', 'e'],
  },
  {
    id: 'energy-incline',
    title: 'Энергия на наклонной плоскости',
    description: 'Изменение потенциальной и кинетической энергии на наклонной с трением.',
    tags: ['Eₚ', 'Eₖ', 'α', 'μ'],
  },
  {
    id: 'archimedes',
    title: 'Закон Архимеда и гидростатика',
    description: 'Плавание и погружение тел в разных жидкостях, динамометр и силы.',
    tags: ['F_a', 'ρ_ж', 'V_погр', 'P_вид'],
  },
  {
    id: 'optics-lens',
    title: 'Тонкая линза и геометрическая оптика',
    description: 'Ход 3 главных лучей, фокусы, построение действительных и мнимых изображений.',
    tags: ['1/F=1/d+1/f', 'F', 'd', 'Г', 'Оптика'],
  },
  {
    id: 'gas-laws',
    title: 'Идеальный газ и изопроцессы (МКТ)',
    description: 'Движение молекул под поршнем, P-V диаграмма, законы Бойля-Мариотта, Гей-Люссака, Шарля.',
    tags: ['P', 'V', 'T', 'PV=νRT', 'МКТ'],
  },
  {
    id: 'circuits',
    title: 'Схемотехника: цепи проводников',
    description: 'Последовательное и параллельное соединение резисторов, анимация тока, лампочка.',
    tags: ['R_общ', 'I_общ', 'Последовательно', 'Параллельно'],
  },
  {
    id: 'ohms-law',
    title: 'Закон Ома',
    description: 'Связь напряжения, тока и сопротивления в простой цепи.',
    tags: ['U', 'I', 'R'],
  },
]

export const getSimulationById = (id?: string | null) =>
  simulationCatalog.find((item) => item.id === id)
