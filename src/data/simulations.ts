export type SimulationId = 'uniform-acceleration' | 'ohms-law' | 'energy-incline'

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
    id: 'ohms-law',
    title: 'Закон Ома',
    description: 'Связь напряжения, тока и сопротивления в простой цепи.',
    tags: ['U', 'I', 'R'],
  },
  {
    id: 'energy-incline',
    title: 'Энергия на наклонной плоскости',
    description: 'Изменение потенциальной и кинетической энергии на наклонной.',
    tags: ['Eₚ', 'Eₖ', 'α'],
  },
]

export const getSimulationById = (id?: string | null) =>
  simulationCatalog.find((item) => item.id === id)
