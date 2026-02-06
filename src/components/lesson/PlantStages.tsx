import { motion } from 'framer-motion'

// 10 стадий роста растения от семени до полноценного дерева
export type PlantStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export const STAGE_NAMES: Record<PlantStage, string> = {
    0: 'Семя',
    1: 'Проросток',
    2: 'Росток',
    3: 'Двулистник',
    4: 'Молодой росток',
    5: 'Крепыш',
    6: 'Кустик',
    7: 'Деревце',
    8: 'Молодое дерево',
    9: 'Дерево'
}

interface PlantIconProps {
    stage: PlantStage
    size?: number
    animated?: boolean
}

// Семя - стадия 0
const Seed = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 60 60">
        <ellipse cx="30" cy="48" rx="20" ry="6" fill="#5D4037" opacity="0.5" />
        <motion.circle
            cx="30"
            cy="42"
            r="8"
            fill="#9C27B0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
        />
        <circle cx="27" cy="40" r="2" fill="#BA68C8" opacity="0.6" />
    </svg>
)

// Проросток - стадия 1
const Sprout1 = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 60 60">
        <ellipse cx="30" cy="52" rx="20" ry="6" fill="#5D4037" opacity="0.5" />
        <circle cx="30" cy="48" r="6" fill="#9C27B0" />
        <motion.path
            d="M 30 48 Q 30 42 30 38"
            stroke="#4CAF50"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4 }}
        />
        <motion.ellipse
            cx="33"
            cy="36"
            rx="4"
            ry="6"
            fill="#66BB6A"
            transform="rotate(20 33 36)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
        />
    </svg>
)

// Росток - стадия 2
const Sprout2 = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 60 60">
        <ellipse cx="30" cy="52" rx="20" ry="6" fill="#5D4037" opacity="0.5" />
        <motion.path
            d="M 30 52 Q 30 42 30 32"
            stroke="#4CAF50"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4 }}
        />
        <motion.ellipse
            cx="24"
            cy="36"
            rx="5"
            ry="8"
            fill="#66BB6A"
            transform="rotate(-25 24 36)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
        />
        <motion.ellipse
            cx="36"
            cy="32"
            rx="5"
            ry="8"
            fill="#4CAF50"
            transform="rotate(25 36 32)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
        />
    </svg>
)

// Двулистник - стадия 3
const Sprout3 = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 60 60">
        <ellipse cx="30" cy="52" rx="20" ry="6" fill="#5D4037" opacity="0.5" />
        <motion.path
            d="M 30 52 Q 30 40 30 28"
            stroke="#388E3C"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4 }}
        />
        <motion.ellipse
            cx="22"
            cy="38"
            rx="6"
            ry="10"
            fill="#66BB6A"
            transform="rotate(-30 22 38)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
        />
        <motion.ellipse
            cx="38"
            cy="38"
            rx="6"
            ry="10"
            fill="#4CAF50"
            transform="rotate(30 38 38)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25, type: "spring" }}
        />
        <motion.ellipse
            cx="30"
            cy="26"
            rx="5"
            ry="8"
            fill="#81C784"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
        />
    </svg>
)

// Молодой росток - стадия 4
const Sprout4 = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 60 60">
        <ellipse cx="30" cy="54" rx="20" ry="5" fill="#5D4037" opacity="0.5" />
        <motion.path
            d="M 30 54 Q 30 40 30 22"
            stroke="#2E7D32"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4 }}
        />
        <motion.ellipse cx="20" cy="42" rx="6" ry="10" fill="#66BB6A" transform="rotate(-35 20 42)"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring" }} />
        <motion.ellipse cx="40" cy="42" rx="6" ry="10" fill="#4CAF50" transform="rotate(35 40 42)"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} />
        <motion.ellipse cx="22" cy="30" rx="5" ry="9" fill="#81C784" transform="rotate(-25 22 30)"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25, type: "spring" }} />
        <motion.ellipse cx="38" cy="30" rx="5" ry="9" fill="#66BB6A" transform="rotate(25 38 30)"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
        <motion.ellipse cx="30" cy="20" rx="4" ry="7" fill="#A5D6A7"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35, type: "spring" }} />
    </svg>
)

// Крепыш - стадия 5
const Sprout5 = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 60 60">
        <ellipse cx="30" cy="55" rx="20" ry="5" fill="#5D4037" opacity="0.5" />
        <motion.rect x="27" y="35" width="6" height="20" rx="2" fill="#5D4037"
            initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }} transition={{ duration: 0.4 }} />
        <motion.path d="M 28 40 Q 18 38 14 32" stroke="#5D4037" strokeWidth="3" fill="none"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.3 }} />
        <motion.path d="M 32 40 Q 42 38 46 32" stroke="#5D4037" strokeWidth="3" fill="none"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.3 }} />
        <motion.ellipse cx="12" cy="28" rx="8" ry="10" fill="#4CAF50"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
        <motion.ellipse cx="48" cy="28" rx="8" ry="10" fill="#66BB6A"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35, type: "spring" }} />
        <motion.ellipse cx="30" cy="22" rx="12" ry="14" fill="#81C784"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />
    </svg>
)

// Кустик - стадия 6
const Bush = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 60 60">
        <ellipse cx="30" cy="56" rx="22" ry="4" fill="#5D4037" opacity="0.5" />
        <motion.rect x="26" y="38" width="8" height="18" rx="3" fill="#6D4C41"
            initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }} transition={{ duration: 0.4 }} />
        <motion.ellipse cx="18" cy="30" rx="10" ry="12" fill="#43A047"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} />
        <motion.ellipse cx="42" cy="30" rx="10" ry="12" fill="#66BB6A"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25, type: "spring" }} />
        <motion.ellipse cx="30" cy="24" rx="14" ry="16" fill="#4CAF50"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
        <motion.ellipse cx="30" cy="16" rx="10" ry="10" fill="#81C784"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35, type: "spring" }} />
    </svg>
)

// Деревце - стадия 7
const SmallTree = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 60 60">
        <ellipse cx="30" cy="57" rx="22" ry="3" fill="#5D4037" opacity="0.5" />
        <motion.rect x="25" y="35" width="10" height="22" rx="3" fill="#795548"
            initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }} transition={{ duration: 0.4 }} />
        <motion.path d="M 27 42 Q 15 38 10 30" stroke="#795548" strokeWidth="4" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.3 }} />
        <motion.path d="M 33 42 Q 45 38 50 30" stroke="#795548" strokeWidth="4" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.3 }} />
        <motion.ellipse cx="10" cy="26" rx="10" ry="12" fill="#388E3C"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
        <motion.ellipse cx="50" cy="26" rx="10" ry="12" fill="#43A047"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35, type: "spring" }} />
        <motion.ellipse cx="30" cy="20" rx="18" ry="18" fill="#4CAF50"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />
        <motion.ellipse cx="30" cy="10" rx="12" ry="10" fill="#66BB6A"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.45, type: "spring" }} />
    </svg>
)

// Молодое дерево - стадия 8
const YoungTree = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 60 60">
        <ellipse cx="30" cy="58" rx="24" ry="2" fill="#5D4037" opacity="0.5" />
        <motion.rect x="24" y="32" width="12" height="26" rx="4" fill="#6D4C41"
            initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }} transition={{ duration: 0.4 }} />
        <motion.path d="M 26 40 Q 12 36 6 26" stroke="#6D4C41" strokeWidth="5" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.3 }} />
        <motion.path d="M 34 40 Q 48 36 54 26" stroke="#6D4C41" strokeWidth="5" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.3 }} />
        <motion.ellipse cx="6" cy="22" rx="10" ry="14" fill="#2E7D32"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
        <motion.ellipse cx="54" cy="22" rx="10" ry="14" fill="#388E3C"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.32, type: "spring" }} />
        <motion.ellipse cx="18" cy="18" rx="12" ry="14" fill="#43A047"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35, type: "spring" }} />
        <motion.ellipse cx="42" cy="18" rx="12" ry="14" fill="#4CAF50"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.38, type: "spring" }} />
        <motion.ellipse cx="30" cy="14" rx="16" ry="16" fill="#66BB6A"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />
        <motion.ellipse cx="30" cy="6" rx="10" ry="8" fill="#81C784"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.45, type: "spring" }} />
    </svg>
)

// Полноценное дерево - стадия 9
const FullTree = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 60 60">
        <ellipse cx="30" cy="58" rx="26" ry="2" fill="#5D4037" opacity="0.5" />
        <motion.rect x="23" y="30" width="14" height="28" rx="4" fill="#5D4037"
            initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }} transition={{ duration: 0.4 }} />
        <motion.path d="M 25 38 Q 8 32 4 20" stroke="#5D4037" strokeWidth="5" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.3 }} />
        <motion.path d="M 35 38 Q 52 32 56 20" stroke="#5D4037" strokeWidth="5" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.22, duration: 0.3 }} />
        <motion.ellipse cx="4" cy="16" rx="10" ry="14" fill="#1B5E20"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.28, type: "spring" }} />
        <motion.ellipse cx="56" cy="16" rx="10" ry="14" fill="#2E7D32"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} />
        <motion.ellipse cx="16" cy="14" rx="14" ry="16" fill="#388E3C"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.32, type: "spring" }} />
        <motion.ellipse cx="44" cy="14" rx="14" ry="16" fill="#43A047"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.34, type: "spring" }} />
        <motion.ellipse cx="30" cy="12" rx="18" ry="18" fill="#4CAF50"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.36, type: "spring" }} />
        <motion.ellipse cx="30" cy="4" rx="12" ry="10" fill="#66BB6A"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }} />
        {/* Плоды/яблоки */}
        <motion.circle cx="20" cy="12" r="3" fill="#F44336"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} />
        <motion.circle cx="40" cy="10" r="3" fill="#FF5722"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.55, type: "spring" }} />
        <motion.circle cx="30" cy="6" r="3" fill="#F44336"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }} />
        <motion.circle cx="14" cy="18" r="2.5" fill="#FF9800"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.65, type: "spring" }} />
        <motion.circle cx="46" cy="16" r="2.5" fill="#FF9800"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: "spring" }} />
    </svg>
)

export function PlantIcon({ stage, size = 60, animated = true }: PlantIconProps) {
    const props = { size }

    if (!animated) {
        // Статичная версия без анимаций для превью
        return (
            <div style={{ width: size, height: size }}>
                {stage === 0 && <Seed {...props} />}
                {stage === 1 && <Sprout1 {...props} />}
                {stage === 2 && <Sprout2 {...props} />}
                {stage === 3 && <Sprout3 {...props} />}
                {stage === 4 && <Sprout4 {...props} />}
                {stage === 5 && <Sprout5 {...props} />}
                {stage === 6 && <Bush {...props} />}
                {stage === 7 && <SmallTree {...props} />}
                {stage === 8 && <YoungTree {...props} />}
                {stage === 9 && <FullTree {...props} />}
            </div>
        )
    }

    return (
        <motion.div
            key={stage}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: size, height: size }}
        >
            {stage === 0 && <Seed {...props} />}
            {stage === 1 && <Sprout1 {...props} />}
            {stage === 2 && <Sprout2 {...props} />}
            {stage === 3 && <Sprout3 {...props} />}
            {stage === 4 && <Sprout4 {...props} />}
            {stage === 5 && <Sprout5 {...props} />}
            {stage === 6 && <Bush {...props} />}
            {stage === 7 && <SmallTree {...props} />}
            {stage === 8 && <YoungTree {...props} />}
            {stage === 9 && <FullTree {...props} />}
        </motion.div>
    )
}
