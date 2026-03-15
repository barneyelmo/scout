import type { ActiveSet as ActiveSetType, ScoutPosition } from '../lib/types'
import CardComponent from './Card'

interface ActiveSetProps {
  activeSet: ActiveSetType | null
  canScout: boolean
  onScout: (takeFrom: ScoutPosition) => void
}

export default function ActiveSetComponent({ activeSet, canScout, onScout }: ActiveSetProps) {
  if (!activeSet || activeSet.cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-gray-400 italic text-sm border-2 border-dashed border-gray-300 rounded-xl px-8">
        No active set — first player must show
      </div>
    )
  }

  const typeLabel = activeSet.setType === 'pair' && activeSet.cards.length > 2
    ? `${activeSet.cards.length}x ${activeSet.setValue}`
    : activeSet.setType === 'pair'
    ? `Pair of ${activeSet.setValue}s`
    : activeSet.setType === 'run'
    ? `Run of ${activeSet.cards.length}`
    : `Single ${activeSet.setValue}`

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-gray-500">{typeLabel}</div>
      <div className="flex items-center gap-2">
        {canScout && (
          <button
            onClick={() => onScout('left')}
            className="bg-orange-500 text-white text-xs px-2 py-1 rounded hover:bg-orange-600"
          >
            ← Scout
          </button>
        )}
        <div className="flex gap-1">
          {activeSet.cards.map((card, idx) => (
            <CardComponent key={`${card.id}-${idx}`} card={card} size="lg" />
          ))}
        </div>
        {canScout && (
          <button
            onClick={() => onScout('right')}
            className="bg-orange-500 text-white text-xs px-2 py-1 rounded hover:bg-orange-600"
          >
            Scout →
          </button>
        )}
      </div>
    </div>
  )
}
