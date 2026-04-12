import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import {
  BookOpen,
  ClipboardList,
  Sparkles,
  PlayCircle,
  Smartphone,
  Mail,
  Phone,
  MessageCircle,
  CheckCircle2,
  QrCode,
  BarChart3,
} from 'lucide-react'

const strings = {
  navFeatures: 'Возможности',
  navHow: 'Как работает',
  navApp: 'Приложение',
  navPricing: 'Тарифы',
  navFaq: 'FAQ',
  navContacts: 'Контакты',
  heroEyebrow: 'Платформа для уроков физики',
  heroTitle: 'Интерактивные уроки за 15 минут',
  heroSubtitle:
    'Готовые темы, задачи, симуляции, тесты и AI‑помощник. Учитель управляет уроком, ученики видят всё в приложении.',
  ctaPrimary: 'Попробовать бесплатно',
  ctaSecondary: 'Смотреть возможности',
  sectionFeatures: 'Что есть на сайте',
  sectionHow: 'Как проходит урок',
  sectionApp: 'Приложение для учеников',
  sectionPricing: 'Тарифы',
  sectionFaq: 'Частые вопросы',
  sectionContacts: 'Контакты',
  appTitle: 'Всё для ученика — в одном приложении',
  appDesc:
    'Ученики видят трансляцию, отвечают на тесты, решают задачи и получают объяснения по теме урока.',
  contactDesc: 'Остались вопросы? Напишите — поможем подключиться и провести первый урок.',
  footerNote: '© Physics AI. Все права защищены.',
}

const stats = [
  { label: 'Тем в библиотеке', value: '86+' },
  { label: 'Интерактивные задачи', value: '1000+' },
  { label: 'Симуляции', value: '24' },
  { label: 'AI‑подсказки', value: '24/7' },
]

const features = [
  {
    title: 'Библиотека тем',
    description: 'Готовые темы, теория, формулы и примеры для уроков.',
    icon: BookOpen,
  },
  {
    title: 'Интерактивные задачи',
    description: 'Пошаговые решения, латекс и автопроверка.',
    icon: ClipboardList,
  },
  {
    title: 'Симуляции',
    description: 'Наглядные демонстрации для формирования понятий.',
    icon: PlayCircle,
  },
  {
    title: 'AI‑помощник',
    description: 'Объясняет сложные темы простым языком.',
    icon: Sparkles,
  },
  {
    title: 'Подключение по QR',
    description: 'Быстрое подключение класса через QR или PIN‑код.',
    icon: QrCode,
  },
  {
    title: 'Тесты и аналитика',
    description: 'Автоматическая проверка и отчёты по результатам.',
    icon: BarChart3,
  },
]

const steps = [
  {
    title: 'Соберите урок',
    text: 'Выберите темы, добавьте теорию, формулы и задачи.',
  },
  {
    title: 'Подключите учеников',
    text: 'Сгенерируйте PIN или QR и пригласите класс.',
  },
  {
    title: 'Проведите урок',
    text: 'Транслируйте материал и управляйте шагами.',
  },
  {
    title: 'Получите результаты',
    text: 'Соберите ответы и аналитику по тестам.',
  },
]

const appBenefits = [
  'Просмотр трансляции и слайдов',
  'Ответы на тесты и задачи',
  'AI‑объяснения по темам урока',
  'Доступ к формулам и подсказкам',
]

const pricing = [
  {
    name: 'Старт',
    price: '0₸',
    period: 'для знакомства',
    features: ['Доступ к библиотеке тем', '3 симуляции', 'Базовые тесты'],
    cta: 'Начать',
    highlight: false,
  },
  {
    name: 'Профи',
    price: '29 900₸',
    period: 'в месяц',
    features: [
      'Все темы и симуляции',
      'AI‑объяснения и задачи',
      'Отчёты по классу',
      'Подключение по QR',
    ],
    cta: 'Выбрать',
    highlight: true,
  },
  {
    name: 'Школа',
    price: 'по запросу',
    period: 'для всей школы',
    features: ['Мульти‑классы', 'Админ‑панель', 'Обучение учителей', 'Приоритетная поддержка'],
    cta: 'Связаться',
    highlight: false,
  },
]

const reviews = [
  {
    name: 'Алина, учитель физики',
    text: 'Собрала урок за 10 минут. Дети в восторге от симуляций.',
  },
  {
    name: 'Данияр, методист',
    text: 'Отчёты по тестам экономят много времени на проверке.',
  },
  {
    name: 'Айгерим, классный руководитель',
    text: 'Понравилось, что ученики сразу видят материал в приложении.',
  },
]

const faqs = [
  {
    q: 'Нужна ли установка на компьютеры?',
    a: 'Нет, учитель работает в браузере, ученики подключаются через приложение.',
  },
  {
    q: 'Можно ли добавить свои темы?',
    a: 'Да, учитель может создавать свои уроки и шаблоны.',
  },
  {
    q: 'Как подключить класс?',
    a: 'Сгенерируйте PIN или QR — ученики подключатся за минуту.',
  },
  {
    q: 'Есть ли поддержка?',
    a: 'Да, мы помогаем с запуском и обучаем работе с платформой.',
  },
]

const contacts = [
  { label: 'support@physics.ai', icon: Mail },
  { label: '+7 (900) 000‑00‑00', icon: Phone },
  { label: '@physics_ai', icon: MessageCircle },
]

export function LandingPage() {
  const { theme } = useTheme()
  const { user } = useAuth()

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-600'
  const panelBg = theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-white/90 border border-slate-200'
  const panelStrong = theme === 'dark' ? 'bg-white/10 border border-white/15' : 'bg-white border border-slate-200'
  const accent = theme === 'dark' ? 'text-primary-300' : 'text-primary-700'

  return (
    <div className="min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 pb-20 pt-10 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-6 mb-14">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold">
              PH
            </div>
            <div>
              <div className={`text-lg font-semibold ${textColor}`}>Physics AI</div>
              <div className={`text-sm ${textMuted}`}>{strings.heroEyebrow}</div>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <a className={`hover:underline ${textMuted}`} href="#features">
              {strings.navFeatures}
            </a>
            <a className={`hover:underline ${textMuted}`} href="#how">
              {strings.navHow}
            </a>
            <a className={`hover:underline ${textMuted}`} href="#app">
              {strings.navApp}
            </a>
            <a className={`hover:underline ${textMuted}`} href="#pricing">
              {strings.navPricing}
            </a>
            <a className={`hover:underline ${textMuted}`} href="#faq">
              {strings.navFaq}
            </a>
            <a className={`hover:underline ${textMuted}`} href="#contacts">
              {strings.navContacts}
            </a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="primary" asChild>
                <a href="/lesson">Войти в кабинет</a>
              </Button>
            ) : (
              <>
                <Button variant="secondary" asChild>
                  <a href="/login">Войти</a>
                </Button>
                <Button variant="primary" asChild>
                  <a href="/register">Создать аккаунт</a>
                </Button>
              </>
            )}
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center mb-20">
          <div>
            <div className={`text-xs uppercase tracking-[0.3em] ${accent} mb-3`}>{strings.heroEyebrow}</div>
            <h1 className={`text-4xl lg:text-5xl font-bold ${textColor} mb-5`}>{strings.heroTitle}</h1>
            <p className={`text-lg leading-relaxed ${textMuted} mb-6`}>{strings.heroSubtitle}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" asChild>
                <a href="/register">{strings.ctaPrimary}</a>
              </Button>
              <Button variant="secondary" asChild>
                <a href="#features">{strings.ctaSecondary}</a>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              {stats.map((item) => (
                <div key={item.label} className={`rounded-2xl px-4 py-3 ${panelStrong}`}>
                  <div className={`text-xl font-semibold ${textColor}`}>{item.value}</div>
                  <div className={`text-xs ${textMuted}`}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className={`rounded-3xl p-6 ${panelBg}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary-500/20 via-primary-500/10 to-transparent p-4">
                <div className="text-xs uppercase tracking-widest text-primary-300">Уроки</div>
                <div className={`text-lg font-semibold ${textColor} mt-2`}>Сценарий урока</div>
                <div className={`text-sm ${textMuted} mt-2`}>Готовые темы и шаблоны</div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-400/20 via-emerald-400/10 to-transparent p-4">
                <div className="text-xs uppercase tracking-widest text-emerald-300">Тесты</div>
                <div className={`text-lg font-semibold ${textColor} mt-2`}>Отслеживание</div>
                <div className={`text-sm ${textMuted} mt-2`}>Результаты и аналитика</div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-sky-400/20 via-sky-400/10 to-transparent p-4">
                <div className="text-xs uppercase tracking-widest text-sky-300">Симуляции</div>
                <div className={`text-lg font-semibold ${textColor} mt-2`}>Наглядность</div>
                <div className={`text-sm ${textMuted} mt-2`}>Интерактив на уроке</div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-fuchsia-400/20 via-fuchsia-400/10 to-transparent p-4">
                <div className="text-xs uppercase tracking-widest text-fuchsia-300">AI</div>
                <div className={`text-lg font-semibold ${textColor} mt-2`}>Помощь</div>
                <div className={`text-sm ${textMuted} mt-2`}>Быстрые ответы и подсказки</div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mb-20">
          <h2 className={`text-3xl font-bold ${textColor} mb-8`}>{strings.sectionFeatures}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((item) => (
              <div key={item.title} className={`rounded-2xl p-6 ${panelBg}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-300">
                    <item.icon size={24} />
                  </div>
                  <h3 className={`text-xl font-semibold ${textColor}`}>{item.title}</h3>
                </div>
                <p className={`leading-relaxed ${textMuted}`}>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mb-20">
          <h2 className={`text-3xl font-bold ${textColor} mb-8`}>{strings.sectionHow}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={step.title} className={`rounded-2xl p-6 ${panelBg}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-300 font-semibold">
                    {index + 1}
                  </div>
                  <h3 className={`text-lg font-semibold ${textColor}`}>{step.title}</h3>
                </div>
                <p className={`leading-relaxed ${textMuted}`}>{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="app" className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center mb-20">
          <div>
            <div className={`text-xs uppercase tracking-[0.3em] ${accent} mb-3`}>{strings.sectionApp}</div>
            <h2 className={`text-3xl font-bold ${textColor} mb-4`}>{strings.appTitle}</h2>
            <p className={`leading-relaxed ${textMuted} mb-6`}>{strings.appDesc}</p>
            <ul className="space-y-3">
              {appBenefits.map((benefit) => (
                <li key={benefit} className={`flex items-start gap-3 ${textMuted}`}>
                  <CheckCircle2 className="text-primary-400" size={20} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={`rounded-3xl p-6 ${panelBg}`}>
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-white font-semibold">Physics AI</div>
                <Smartphone className="text-white/70" size={20} />
              </div>
              <div className="rounded-2xl bg-white/10 p-4 mb-4">
                <div className="text-white text-lg font-semibold mb-2">Урок сегодня</div>
                <div className="text-white/70 text-sm">Физика — наука о природе</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-white/80 text-sm mb-1">Тесты</div>
                <div className="text-white font-semibold">Пройдено 7/10</div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mb-20">
          <h2 className={`text-3xl font-bold ${textColor} mb-8`}>{strings.sectionPricing}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-6 ${panelBg} ${plan.highlight ? 'ring-2 ring-primary-400' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-semibold ${textColor}`}>{plan.name}</h3>
                  {plan.highlight && (
                    <span className="text-xs uppercase tracking-widest text-primary-300">Выбор школ</span>
                  )}
                </div>
                <div className={`text-3xl font-bold ${textColor}`}>{plan.price}</div>
                <div className={`text-sm ${textMuted} mb-4`}>{plan.period}</div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="text-primary-400" size={16} />
                      <span className={textMuted}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={plan.highlight ? 'primary' : 'secondary'} className="w-full">
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className={`text-3xl font-bold ${textColor} mb-8`}>Отзывы</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((item) => (
              <div key={item.name} className={`rounded-2xl p-6 ${panelBg}`}>
                <p className={`text-sm leading-relaxed ${textMuted} mb-4`}>“{item.text}”</p>
                <div className={`text-sm font-semibold ${textColor}`}>{item.name}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mb-20">
          <h2 className={`text-3xl font-bold ${textColor} mb-8`}>{strings.sectionFaq}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((item) => (
              <div key={item.q} className={`rounded-2xl p-6 ${panelBg}`}>
                <h3 className={`text-base font-semibold ${textColor} mb-2`}>{item.q}</h3>
                <p className={`text-sm ${textMuted}`}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contacts" className="mb-12">
          <div className={`rounded-3xl p-8 ${panelBg}`}>
            <h2 className={`text-3xl font-bold ${textColor} mb-4`}>{strings.sectionContacts}</h2>
            <p className={`mb-6 ${textMuted}`}>{strings.contactDesc}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contacts.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <item.icon className="text-primary-300" size={20} />
                  <span className={textMuted}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className={`text-xs ${textMuted} text-center`}>{strings.footerNote}</footer>
      </div>
    </div>
  )
}
