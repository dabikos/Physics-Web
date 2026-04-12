import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Нужны VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── ДАННЫЕ ────────────────────────────────────────────────────────────────

const sections = [
    { id: 'mechanics', title: 'Механика', description: 'Движение, силы, энергия, импульс', icon_name: 'Gauge', color: 'from-blue-500 to-cyan-500', order_index: 1, total_topics: 43 },
    { id: 'thermodynamics', title: 'Термодинамика', description: 'Теплота, температура, энтропия', icon_name: 'Thermometer', color: 'from-orange-500 to-red-500', order_index: 2, total_topics: 17 },
    { id: 'electromagnetism', title: 'Электричество и Магнетизм', description: 'Заряды, электричество, магнетизм', icon_name: 'Zap', color: 'from-yellow-500 to-amber-500', order_index: 3, total_topics: 19 },
    { id: 'optics', title: 'Оптика', description: 'Свет, линзы, дифракция, фотоэффект', icon_name: 'Eye', color: 'from-purple-500 to-pink-500', order_index: 4, total_topics: 11 },
    { id: 'atomic', title: 'Атомная и Ядерная физика', description: 'Строение атома, ядро, реакции', icon_name: 'Atom', color: 'from-emerald-500 to-teal-500', order_index: 5, total_topics: 13 },
    { id: 'relativity', title: 'Специальная теория относительности', description: 'Постулаты Эйнштейна, парадоксы времени', icon_name: 'Rocket', color: 'from-indigo-500 to-blue-500', order_index: 6, total_topics: 9 },
    { id: 'astronomy', title: 'Астрономия', description: 'Звезды, планеты, галактики, космология', icon_name: 'Star', color: 'from-slate-700 to-violet-500', order_index: 7, total_topics: 16 },
]

const subsections = [
    // Механика
    { id: 'kinematics', title: 'Кинематика', section_id: 'mechanics', order_index: 1 },
    { id: 'dynamics', title: 'Динамика', section_id: 'mechanics', order_index: 2 },
    { id: 'statics', title: 'Статика', section_id: 'mechanics', order_index: 3 },
    { id: 'conservation-laws', title: 'Законы сохранения', section_id: 'mechanics', order_index: 4 },
    { id: 'oscillations-waves', title: 'Механические колебания и волны', section_id: 'mechanics', order_index: 5 },
    { id: 'gravitation', title: 'Гравитация', section_id: 'mechanics', order_index: 6 },
    { id: 'fluid-mechanics', title: 'Гидростатика и гидродинамика', section_id: 'mechanics', order_index: 7 },
    { id: 'acoustics', title: 'Акустика', section_id: 'mechanics', order_index: 8 },
    // Термодинамика
    { id: 'molecular-kinetic', title: 'Молекулярно-кинетическая теория', section_id: 'thermodynamics', order_index: 1 },
    { id: 'heat-processes', title: 'Тепловые процессы', section_id: 'thermodynamics', order_index: 2 },
    { id: 'ideal-gas', title: 'Идеальный газ', section_id: 'thermodynamics', order_index: 3 },
    { id: 'thermodynamics-laws', title: 'Законы термодинамики', section_id: 'thermodynamics', order_index: 4 },
    { id: 'phase-transitions', title: 'Фазовые переходы', section_id: 'thermodynamics', order_index: 5 },
    // Электричество и магнетизм
    { id: 'electrostatics', title: 'Электростатика', section_id: 'electromagnetism', order_index: 1 },
    { id: 'direct-current', title: 'Постоянный ток', section_id: 'electromagnetism', order_index: 2 },
    { id: 'magnetism', title: 'Магнетизм', section_id: 'electromagnetism', order_index: 3 },
    { id: 'electromagnetic-induction', title: 'Электромагнитная индукция', section_id: 'electromagnetism', order_index: 4 },
    { id: 'alternating-current', title: 'Переменный ток', section_id: 'electromagnetism', order_index: 5 },
    // Оптика
    { id: 'geometric-optics', title: 'Геометрическая оптика', section_id: 'optics', order_index: 1 },
    { id: 'wave-optics', title: 'Волновая оптика', section_id: 'optics', order_index: 2 },
    { id: 'quantum-optics', title: 'Квантовая оптика', section_id: 'optics', order_index: 3 },
    // Атомная и ядерная физика
    { id: 'atom-structure', title: 'Строение атома', section_id: 'atomic', order_index: 1 },
    { id: 'quantum-physics', title: 'Квантовая физика', section_id: 'atomic', order_index: 2 },
    { id: 'nuclear-physics', title: 'Ядерная физика', section_id: 'atomic', order_index: 3 },
    { id: 'radioactivity', title: 'Радиоактивность', section_id: 'atomic', order_index: 4 },
    { id: 'nuclear-reactions', title: 'Ядерные реакции', section_id: 'atomic', order_index: 5 },
    // СТО
    { id: 'special-relativity', title: 'СТО', section_id: 'relativity', order_index: 1 },
    // Астрономия
    { id: 'celestial-mechanics', title: 'Небесная механика', section_id: 'astronomy', order_index: 1 },
    { id: 'sun-stars', title: 'Солнце и звёзды', section_id: 'astronomy', order_index: 2 },
    { id: 'galaxies-cosmology', title: 'Галактики и космология', section_id: 'astronomy', order_index: 3 },
    { id: 'observational-astronomy', title: 'Наблюдательная астрономия', section_id: 'astronomy', order_index: 4 },
    { id: 'solar-system-bodies', title: 'Планеты, малые тела и жизнь', section_id: 'astronomy', order_index: 5 },
]

const topics = [
    // Кинематика
    { id: 'linear-motion', title: 'Прямолинейное движение', section_id: 'mechanics', subsection_id: 'kinematics', order_index: 1 },
    { id: 'uniform-accelerated', title: 'Равномерное и равноускоренное движение', section_id: 'mechanics', subsection_id: 'kinematics', order_index: 2 },
    { id: 'circular-motion', title: 'Движение по окружности', section_id: 'mechanics', subsection_id: 'kinematics', order_index: 3 },
    { id: 'relative-motion', title: 'Относительность движения', section_id: 'mechanics', subsection_id: 'kinematics', order_index: 4 },
    { id: 'motion-graphs', title: 'Графики движения', section_id: 'mechanics', subsection_id: 'kinematics', order_index: 5 },
    // Динамика
    { id: 'newton-laws', title: 'Законы Ньютона', section_id: 'mechanics', subsection_id: 'dynamics', order_index: 1 },
    { id: 'forces', title: 'Силы в механике', section_id: 'mechanics', subsection_id: 'dynamics', order_index: 2 },
    { id: 'multiple-forces', title: 'Движение под действием нескольких сил', section_id: 'mechanics', subsection_id: 'dynamics', order_index: 3 },
    { id: 'inclined-plane', title: 'Наклонная плоскость', section_id: 'mechanics', subsection_id: 'dynamics', order_index: 4 },
    { id: 'momentum', title: 'Импульс и закон сохранения импульса', section_id: 'mechanics', subsection_id: 'dynamics', order_index: 5 },
    // Статика
    { id: 'equilibrium', title: 'Условия равновесия', section_id: 'mechanics', subsection_id: 'statics', order_index: 1 },
    { id: 'torque', title: 'Момент силы', section_id: 'mechanics', subsection_id: 'statics', order_index: 2 },
    { id: 'center-mass', title: 'Центр масс', section_id: 'mechanics', subsection_id: 'statics', order_index: 3 },
    { id: 'simple-machines', title: 'Простые механизмы', section_id: 'mechanics', subsection_id: 'statics', order_index: 4 },
    // Законы сохранения
    { id: 'work', title: 'Работа', section_id: 'mechanics', subsection_id: 'conservation-laws', order_index: 1 },
    { id: 'kinetic-energy', title: 'Кинетическая энергия', section_id: 'mechanics', subsection_id: 'conservation-laws', order_index: 2 },
    { id: 'potential-energy', title: 'Потенциальная энергия', section_id: 'mechanics', subsection_id: 'conservation-laws', order_index: 3 },
    { id: 'energy-conservation', title: 'Закон сохранения энергии', section_id: 'mechanics', subsection_id: 'conservation-laws', order_index: 4 },
    // Колебания и волны
    { id: 'harmonic-oscillations', title: 'Гармонические колебания', section_id: 'mechanics', subsection_id: 'oscillations-waves', order_index: 1 },
    { id: 'pendulums', title: 'Маятники', section_id: 'mechanics', subsection_id: 'oscillations-waves', order_index: 2 },
    { id: 'mechanical-waves', title: 'Механические волны', section_id: 'mechanics', subsection_id: 'oscillations-waves', order_index: 3 },
    { id: 'resonance', title: 'Резонанс', section_id: 'mechanics', subsection_id: 'oscillations-waves', order_index: 4 },
    // Гравитация
    { id: 'universal-gravitation', title: 'Закон всемирного тяготения', section_id: 'mechanics', subsection_id: 'gravitation', order_index: 1 },
    { id: 'gravitational-field', title: 'Гравитационное поле и напряжённость', section_id: 'mechanics', subsection_id: 'gravitation', order_index: 2 },
    { id: 'weight-weightlessness', title: 'Вес и невесомость', section_id: 'mechanics', subsection_id: 'gravitation', order_index: 3 },
    { id: 'satellites-orbits', title: 'Искусственные спутники и орбиты', section_id: 'mechanics', subsection_id: 'gravitation', order_index: 4 },
    { id: 'kepler-laws', title: 'Законы Кеплера', section_id: 'mechanics', subsection_id: 'gravitation', order_index: 5 },
    { id: 'cosmic-velocities', title: 'Первая, вторая и третья космические скорости', section_id: 'mechanics', subsection_id: 'gravitation', order_index: 6 },
    { id: 'gravitational-energy', title: 'Гравитационная потенциальная энергия', section_id: 'mechanics', subsection_id: 'gravitation', order_index: 7 },
    // Гидростатика
    { id: 'liquid-pressure', title: 'Давление в жидкостях', section_id: 'mechanics', subsection_id: 'fluid-mechanics', order_index: 1 },
    { id: 'pascal-law', title: 'Закон Паскаля', section_id: 'mechanics', subsection_id: 'fluid-mechanics', order_index: 2 },
    { id: 'archimedes-principle', title: 'Закон Архимеда', section_id: 'mechanics', subsection_id: 'fluid-mechanics', order_index: 3 },
    { id: 'floating-bodies', title: 'Плавание и погружение тел', section_id: 'mechanics', subsection_id: 'fluid-mechanics', order_index: 4 },
    { id: 'atmospheric-pressure', title: 'Атмосферное давление', section_id: 'mechanics', subsection_id: 'fluid-mechanics', order_index: 5 },
    { id: 'barometer-manometer', title: 'Барометр и манометр', section_id: 'mechanics', subsection_id: 'fluid-mechanics', order_index: 6 },
    { id: 'hydraulic-machines', title: 'Гидравлические машины', section_id: 'mechanics', subsection_id: 'fluid-mechanics', order_index: 7 },
    { id: 'continuity-equation', title: 'Уравнение неразрывности', section_id: 'mechanics', subsection_id: 'fluid-mechanics', order_index: 8 },
    { id: 'bernoulli-equation', title: 'Уравнение Бернулли', section_id: 'mechanics', subsection_id: 'fluid-mechanics', order_index: 9 },
    { id: 'fluid-viscosity', title: 'Вязкость жидкостей', section_id: 'mechanics', subsection_id: 'fluid-mechanics', order_index: 10 },
    { id: 'stokes-law', title: 'Закон Стокса (сила сопротивления)', section_id: 'mechanics', subsection_id: 'fluid-mechanics', order_index: 11 },
    // Акустика
    { id: 'sound-waves', title: 'Звуковые волны', section_id: 'mechanics', subsection_id: 'acoustics', order_index: 1 },
    { id: 'sound-speed-media', title: 'Скорость звука в разных средах', section_id: 'mechanics', subsection_id: 'acoustics', order_index: 2 },
    { id: 'loudness-intensity', title: 'Громкость и интенсивность звука', section_id: 'mechanics', subsection_id: 'acoustics', order_index: 3 },
    { id: 'decibel-scale', title: 'Децибелы (шкала громкости)', section_id: 'mechanics', subsection_id: 'acoustics', order_index: 4 },
    { id: 'doppler-sound', title: 'Эффект Доплера для звука', section_id: 'mechanics', subsection_id: 'acoustics', order_index: 5 },
    { id: 'acoustic-resonance', title: 'Резонанс в акустике', section_id: 'mechanics', subsection_id: 'acoustics', order_index: 6 },
    { id: 'ultrasound-infrasound', title: 'Ультразвук и инфразвук', section_id: 'mechanics', subsection_id: 'acoustics', order_index: 7 },
    { id: 'timbre-instruments', title: 'Тембр и музыкальные инструменты', section_id: 'mechanics', subsection_id: 'acoustics', order_index: 8 },
    { id: 'sound-reflection-absorption', title: 'Отражение и поглощение звука', section_id: 'mechanics', subsection_id: 'acoustics', order_index: 9 },

    // Молекулярно-кинетическая теория
    { id: 'matter-structure', title: 'Строение вещества', section_id: 'thermodynamics', subsection_id: 'molecular-kinetic', order_index: 1 },
    { id: 'temperature', title: 'Температура', section_id: 'thermodynamics', subsection_id: 'molecular-kinetic', order_index: 2 },
    { id: 'gas-pressure', title: 'Давление газа', section_id: 'thermodynamics', subsection_id: 'molecular-kinetic', order_index: 3 },
    // Тепловые процессы
    { id: 'thermal-conductivity', title: 'Теплопроводность', section_id: 'thermodynamics', subsection_id: 'heat-processes', order_index: 1 },
    { id: 'convection', title: 'Конвекция', section_id: 'thermodynamics', subsection_id: 'heat-processes', order_index: 2 },
    { id: 'radiation', title: 'Излучение', section_id: 'thermodynamics', subsection_id: 'heat-processes', order_index: 3 },
    { id: 'heat-quantity', title: 'Количество теплоты', section_id: 'thermodynamics', subsection_id: 'heat-processes', order_index: 4 },
    // Идеальный газ
    { id: 'state-equation', title: 'Уравнение состояния', section_id: 'thermodynamics', subsection_id: 'ideal-gas', order_index: 1 },
    { id: 'isoprocesses', title: 'Изопроцессы', section_id: 'thermodynamics', subsection_id: 'ideal-gas', order_index: 2 },
    { id: 'gas-laws', title: 'Газовые законы', section_id: 'thermodynamics', subsection_id: 'ideal-gas', order_index: 3 },
    // Законы термодинамики
    { id: 'first-law', title: 'Первый закон', section_id: 'thermodynamics', subsection_id: 'thermodynamics-laws', order_index: 1 },
    { id: 'second-law', title: 'Второй закон', section_id: 'thermodynamics', subsection_id: 'thermodynamics-laws', order_index: 2 },
    { id: 'heat-engines', title: 'Тепловые машины', section_id: 'thermodynamics', subsection_id: 'thermodynamics-laws', order_index: 3 },
    { id: 'efficiency', title: 'КПД', section_id: 'thermodynamics', subsection_id: 'thermodynamics-laws', order_index: 4 },
    // Фазовые переходы
    { id: 'melting', title: 'Плавление', section_id: 'thermodynamics', subsection_id: 'phase-transitions', order_index: 1 },
    { id: 'evaporation', title: 'Испарение', section_id: 'thermodynamics', subsection_id: 'phase-transitions', order_index: 2 },
    { id: 'boiling', title: 'Кипение', section_id: 'thermodynamics', subsection_id: 'phase-transitions', order_index: 3 },
    { id: 'phase-diagrams', title: 'Диаграммы состояния', section_id: 'thermodynamics', subsection_id: 'phase-transitions', order_index: 4 },

    // Электростатика
    { id: 'electric-charge', title: 'Электрический заряд', section_id: 'electromagnetism', subsection_id: 'electrostatics', order_index: 1 },
    { id: 'coulomb-law', title: 'Закон Кулона', section_id: 'electromagnetism', subsection_id: 'electrostatics', order_index: 2 },
    { id: 'electric-field', title: 'Электрическое поле', section_id: 'electromagnetism', subsection_id: 'electrostatics', order_index: 3 },
    { id: 'potential-voltage', title: 'Потенциал и напряжение', section_id: 'electromagnetism', subsection_id: 'electrostatics', order_index: 4 },
    { id: 'capacitors', title: 'Конденсаторы', section_id: 'electromagnetism', subsection_id: 'electrostatics', order_index: 5 },
    // Постоянный ток
    { id: 'current-strength', title: 'Сила тока', section_id: 'electromagnetism', subsection_id: 'direct-current', order_index: 1 },
    { id: 'ohm-law', title: 'Закон Ома', section_id: 'electromagnetism', subsection_id: 'direct-current', order_index: 2 },
    { id: 'work-power', title: 'Работа и мощность тока', section_id: 'electromagnetism', subsection_id: 'direct-current', order_index: 3 },
    { id: 'conductor-connections', title: 'Соединение проводников', section_id: 'electromagnetism', subsection_id: 'direct-current', order_index: 4 },
    // Магнетизм
    { id: 'magnetic-field', title: 'Магнитное поле', section_id: 'electromagnetism', subsection_id: 'magnetism', order_index: 1 },
    { id: 'ampere-force', title: 'Сила Ампера', section_id: 'electromagnetism', subsection_id: 'magnetism', order_index: 2 },
    { id: 'lorentz-force', title: 'Сила Лоренца', section_id: 'electromagnetism', subsection_id: 'magnetism', order_index: 3 },
    // Электромагнитная индукция
    { id: 'faraday-law', title: 'Закон Фарадея', section_id: 'electromagnetism', subsection_id: 'electromagnetic-induction', order_index: 1 },
    { id: 'lenz-rule', title: 'Правило Ленца', section_id: 'electromagnetism', subsection_id: 'electromagnetic-induction', order_index: 2 },
    { id: 'inductance', title: 'Индуктивность', section_id: 'electromagnetism', subsection_id: 'electromagnetic-induction', order_index: 3 },
    { id: 'eddy-currents', title: 'Вихревые токи', section_id: 'electromagnetism', subsection_id: 'electromagnetic-induction', order_index: 4 },
    // Переменный ток
    { id: 'sinusoidal-current', title: 'Синусоидальный ток', section_id: 'electromagnetism', subsection_id: 'alternating-current', order_index: 1 },
    { id: 'reactive-resistance', title: 'Реактивное сопротивление', section_id: 'electromagnetism', subsection_id: 'alternating-current', order_index: 2 },
    { id: 'transformers', title: 'Трансформаторы', section_id: 'electromagnetism', subsection_id: 'alternating-current', order_index: 3 },
    { id: 'power-transmission', title: 'Передача электроэнергии', section_id: 'electromagnetism', subsection_id: 'alternating-current', order_index: 4 },

    // Геометрическая оптика
    { id: 'light-propagation', title: 'Распространение света', section_id: 'optics', subsection_id: 'geometric-optics', order_index: 1 },
    { id: 'reflection', title: 'Отражение', section_id: 'optics', subsection_id: 'geometric-optics', order_index: 2 },
    { id: 'refraction', title: 'Преломление', section_id: 'optics', subsection_id: 'geometric-optics', order_index: 3 },
    { id: 'lenses-mirrors', title: 'Линзы и зеркала', section_id: 'optics', subsection_id: 'geometric-optics', order_index: 4 },
    { id: 'optical-devices', title: 'Оптические приборы', section_id: 'optics', subsection_id: 'geometric-optics', order_index: 5 },
    // Волновая оптика
    { id: 'interference', title: 'Интерференция', section_id: 'optics', subsection_id: 'wave-optics', order_index: 1 },
    { id: 'diffraction', title: 'Дифракция', section_id: 'optics', subsection_id: 'wave-optics', order_index: 2 },
    { id: 'polarization', title: 'Поляризация', section_id: 'optics', subsection_id: 'wave-optics', order_index: 3 },
    // Квантовая оптика
    { id: 'photoelectric-effect', title: 'Фотоэффект', section_id: 'optics', subsection_id: 'quantum-optics', order_index: 1 },
    { id: 'light-dualism', title: 'Дуализм света', section_id: 'optics', subsection_id: 'quantum-optics', order_index: 2 },
    { id: 'emission-spectra', title: 'Спектры излучения', section_id: 'optics', subsection_id: 'quantum-optics', order_index: 3 },
    { id: 'lasers', title: 'Лазеры', section_id: 'optics', subsection_id: 'quantum-optics', order_index: 4 },

    // Строение атома
    { id: 'atom-models', title: 'Модели атома', section_id: 'atomic', subsection_id: 'atom-structure', order_index: 1 },
    { id: 'energy-levels', title: 'Энергетические уровни', section_id: 'atomic', subsection_id: 'atom-structure', order_index: 2 },
    { id: 'electron-shells', title: 'Электронные оболочки', section_id: 'atomic', subsection_id: 'atom-structure', order_index: 3 },
    // Квантовая физика
    { id: 'de-broglie-waves', title: 'Волны де Бройля', section_id: 'atomic', subsection_id: 'quantum-physics', order_index: 1 },
    { id: 'heisenberg-uncertainty', title: 'Неопределённость Гейзенберга', section_id: 'atomic', subsection_id: 'quantum-physics', order_index: 2 },
    // Ядерная физика
    { id: 'nucleus-structure', title: 'Строение ядра', section_id: 'atomic', subsection_id: 'nuclear-physics', order_index: 1 },
    { id: 'nuclear-forces', title: 'Ядерные силы', section_id: 'atomic', subsection_id: 'nuclear-physics', order_index: 2 },
    { id: 'binding-energy', title: 'Энергия связи', section_id: 'atomic', subsection_id: 'nuclear-physics', order_index: 3 },
    // Радиоактивность
    { id: 'decay-types', title: 'Виды распада', section_id: 'atomic', subsection_id: 'radioactivity', order_index: 1 },
    { id: 'decay-law', title: 'Закон радиоактивного распада', section_id: 'atomic', subsection_id: 'radioactivity', order_index: 2 },
    { id: 'radiation-doses', title: 'Дозы излучения', section_id: 'atomic', subsection_id: 'radioactivity', order_index: 3 },
    // Ядерные реакции
    { id: 'fission', title: 'Деление ядер', section_id: 'atomic', subsection_id: 'nuclear-reactions', order_index: 1 },
    { id: 'fusion', title: 'Термоядерный синтез', section_id: 'atomic', subsection_id: 'nuclear-reactions', order_index: 2 },
    { id: 'nuclear-energy-use', title: 'Применение ядерной энергии', section_id: 'atomic', subsection_id: 'nuclear-reactions', order_index: 3 },

    // СТО
    { id: 'einstein-postulates', title: 'Постулаты Эйнштейна', section_id: 'relativity', subsection_id: 'special-relativity', order_index: 1 },
    { id: 'lorentz-transformations', title: 'Преобразования Лоренца', section_id: 'relativity', subsection_id: 'special-relativity', order_index: 2 },
    { id: 'time-dilation', title: 'Замедление времени', section_id: 'relativity', subsection_id: 'special-relativity', order_index: 3 },
    { id: 'length-contraction', title: 'Сокращение длины', section_id: 'relativity', subsection_id: 'special-relativity', order_index: 4 },
    { id: 'invariant-interval', title: 'Инвариантность интервала', section_id: 'relativity', subsection_id: 'special-relativity', order_index: 5 },
    { id: 'mass-energy-emc2', title: 'Связь массы и энергии E = mc²', section_id: 'relativity', subsection_id: 'special-relativity', order_index: 6 },
    { id: 'relativistic-momentum', title: 'Релятивистский импульс', section_id: 'relativity', subsection_id: 'special-relativity', order_index: 7 },
    { id: 'relativistic-energy', title: 'Релятивистская энергия', section_id: 'relativity', subsection_id: 'special-relativity', order_index: 8 },
    { id: 'lightspeed-limit', title: 'Недостижимость скорости света', section_id: 'relativity', subsection_id: 'special-relativity', order_index: 9 },

    // Небесная механика
    { id: 'solar-system-structure', title: 'Солнечная система', section_id: 'astronomy', subsection_id: 'celestial-mechanics', order_index: 1 },
    { id: 'orbits-satellites', title: 'Орбиты планет и спутников', section_id: 'astronomy', subsection_id: 'celestial-mechanics', order_index: 2 },
    { id: 'tides', title: 'Приливы и отливы', section_id: 'astronomy', subsection_id: 'celestial-mechanics', order_index: 3 },
    { id: 'eclipses', title: 'Затмения Солнца и Луны', section_id: 'astronomy', subsection_id: 'celestial-mechanics', order_index: 4 },
    // Солнце и звёзды
    { id: 'sun-structure-activity', title: 'Солнце: строение и активность', section_id: 'astronomy', subsection_id: 'sun-stars', order_index: 1 },
    { id: 'stellar-spectra-hr', title: 'Спектры звёзд и диаграмма Герцшпрунга–Рассела', section_id: 'astronomy', subsection_id: 'sun-stars', order_index: 2 },
    { id: 'stellar-evolution-types', title: 'Эволюция и типы звёзд', section_id: 'astronomy', subsection_id: 'sun-stars', order_index: 3 },
    { id: 'compact-stars', title: 'Нейтронные звёзды, пульсары и чёрные дыры', section_id: 'astronomy', subsection_id: 'sun-stars', order_index: 4 },
    // Галактики и космология
    { id: 'milky-way-galaxies', title: 'Млечный Путь и типы галактик', section_id: 'astronomy', subsection_id: 'galaxies-cosmology', order_index: 1 },
    { id: 'hubble-expansion', title: 'Расширение Вселенной и закон Хаббла', section_id: 'astronomy', subsection_id: 'galaxies-cosmology', order_index: 2 },
    { id: 'big-bang-cmb', title: 'Большой взрыв и реликтовое излучение', section_id: 'astronomy', subsection_id: 'galaxies-cosmology', order_index: 3 },
    { id: 'dark-cosmos-gr', title: 'Тёмная материя, тёмная энергия и ОТО (кратко)', section_id: 'astronomy', subsection_id: 'galaxies-cosmology', order_index: 4 },
    // Наблюдательная астрономия
    { id: 'telescopes-types', title: 'Телескопы и приборы', section_id: 'astronomy', subsection_id: 'observational-astronomy', order_index: 1 },
    { id: 'angular-resolution', title: 'Увеличение и разрешающая способность', section_id: 'astronomy', subsection_id: 'observational-astronomy', order_index: 2 },
    { id: 'spectroscopy-photometry', title: 'Спектроскопия и фотометрия', section_id: 'astronomy', subsection_id: 'observational-astronomy', order_index: 3 },
    { id: 'distance-ladder-radio', title: 'Расстояния до объектов и радиоастрономия', section_id: 'astronomy', subsection_id: 'observational-astronomy', order_index: 4 },
    // Планеты, малые тела и жизнь
    { id: 'terrestrial-gas-planets', title: 'Планеты земной группы и газовые гиганты', section_id: 'astronomy', subsection_id: 'solar-system-bodies', order_index: 1 },
    { id: 'moon-satellites', title: 'Луна и крупные спутники', section_id: 'astronomy', subsection_id: 'solar-system-bodies', order_index: 2 },
    { id: 'small-bodies-exoplanets', title: 'Астероиды, кометы, экзопланеты', section_id: 'astronomy', subsection_id: 'solar-system-bodies', order_index: 3 },
    { id: 'life-search', title: 'Обитаемая зона и поиск жизни', section_id: 'astronomy', subsection_id: 'solar-system-bodies', order_index: 4 },
].map(t => ({
    ...t,
    description: t.title,
    theory: null,
    formulas: [],
    examples: [],
    problems: [],
}))

// ─── UPLOAD ────────────────────────────────────────────────────────────────

async function upload() {
    console.log(`📦 Sections: ${sections.length}, Subsections: ${subsections.length}, Topics: ${topics.length}`)

    console.log('⬆️  Uploading sections...')
    const { error: e1 } = await supabase.from('sections').upsert(sections, { onConflict: 'id' })
    if (e1) { console.error('❌ sections:', e1); throw e1 }
    console.log('✅ Sections done')

    console.log('⬆️  Uploading subsections...')
    const { error: e2 } = await supabase.from('subsections').upsert(subsections, { onConflict: 'id' })
    if (e2) { console.error('❌ subsections:', e2); throw e2 }
    console.log('✅ Subsections done')

    console.log('⬆️  Uploading topics...')
    for (let i = 0; i < topics.length; i += 20) {
        const chunk = topics.slice(i, i + 20)
        const { error: e3 } = await supabase.from('topics').upsert(chunk, { onConflict: 'id' })
        if (e3) { console.error(`❌ topics chunk ${i}:`, e3); throw e3 }
        process.stdout.write('.')
    }

    console.log('\n✅ Upload complete!')
}

upload().catch(console.error)