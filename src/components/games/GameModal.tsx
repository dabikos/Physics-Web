import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { GuessFormula } from './GuessFormula'
import { TrueFalse } from './TrueFalse'
import { ConnectQuantities } from './ConnectQuantities'
import { FindError } from './FindError'

interface GameModalProps {
  isOpen: boolean
  onClose: () => void
  gameId: string
  gameTitle: string
}

export function GameModal({ isOpen, onClose, gameId, gameTitle }: GameModalProps) {
  const { theme } = useTheme()

  const bgOverlay = theme === 'dark' ? 'bg-black/80' : 'bg-black/60'
  const bgModal = theme === 'dark' 
    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
    : 'bg-gradient-to-br from-white via-slate-50 to-white'
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900'
  const borderColor = theme === 'dark' ? 'border-slate-700' : 'border-slate-200'

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const renderGame = () => {
    switch (gameId) {
      case 'guess-formula':
        return <GuessFormula />
      case 'true-false':
        return <TrueFalse />
      case 'connect':
        return <ConnectQuantities />
      case 'find-error':
        return <FindError />
      default:
        return <div className={textColor}>Игра не найдена</div>
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 ${bgOverlay} flex items-center justify-center p-4 z-50`}
        onClick={onClose}
        style={{ zIndex: 99999 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className={`${bgModal} ${borderColor} border-2 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
            <h2 className={`text-2xl font-bold ${textColor}`}>
              {gameTitle}
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} transition-colors`}
            >
              <X size={24} className={textColor} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderGame()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}





