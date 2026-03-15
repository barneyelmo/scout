import type { Card } from '../lib/types'
import { getActiveValue } from '../lib/gameEngine'

interface CardProps {
  card: Card
  selected?: boolean
  selectable?: boolean
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  faceDown?: boolean
}

export default function CardComponent({ card, selected, selectable, onClick, size = 'md', faceDown }: CardProps) {
  const activeVal = getActiveValue(card)
  const inactiveVal = card.orientation === 'top' ? card.bottomValue : card.topValue

  const sizes = {
    sm: 'w-8 h-12 text-xs',
    md: 'w-12 h-16 text-sm',
    lg: 'w-16 h-24 text-base',
  }

  if (faceDown) {
    return (
      <div className={`${sizes[size]} rounded-lg bg-green-700 border-2 border-green-500 shadow-md`} />
    )
  }

  return (
    <div
      onClick={selectable ? onClick : undefined}
      className={`
        ${sizes[size]} rounded-lg border-2 shadow-md flex flex-col items-center justify-between py-1 px-1 font-bold transition-all
        ${selectable ? 'cursor-pointer hover:scale-105' : ''}
        ${selected ? 'border-yellow-400 bg-yellow-50 scale-105 shadow-yellow-200 shadow-lg' : 'border-gray-300 bg-white'}
      `}
    >
      <span className="text-green-700 leading-none">{activeVal}</span>
      <div className="w-full border-t border-gray-200" />
      <span className="text-gray-400 leading-none text-xs">{inactiveVal}</span>
    </div>
  )
}
