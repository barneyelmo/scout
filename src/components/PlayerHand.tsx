import { useState, useCallback } from 'react'
import type { Card as CardType, ActiveSet } from '../lib/types'
import CardComponent from './Card'
import { isValidSet, compareSet, getPlayableRanges } from '../lib/gameEngine'

interface PlayerHandProps {
  cards: CardType[]
  activeSet: ActiveSet | null
  isMyTurn: boolean
  onShow: (startIdx: number, endIdx: number) => void
  canFlip: boolean
  onFlip: () => void
}

export default function PlayerHand({ cards, activeSet, isMyTurn, onShow, canFlip, onFlip }: PlayerHandProps) {
  const [selStart, setSelStart] = useState<number | null>(null)
  const [selEnd, setSelEnd] = useState<number | null>(null)

  const normalizeSelection = () => {
    if (selStart === null || selEnd === null) return null
    return { start: Math.min(selStart, selEnd), end: Math.max(selStart, selEnd) }
  }

  const sel = normalizeSelection()
  const selectedCards = sel ? cards.slice(sel.start, sel.end + 1) : []
  const isSelectionValid = selectedCards.length > 0 && isValidSet(selectedCards) && (!activeSet || compareSet(selectedCards, activeSet.cards))

  const playableRanges = getPlayableRanges({ playerId: '', cards, scoutChips: 0, scoredCards: 0, hasFlippedHand: false }, activeSet)
  const playableIndices = new Set(playableRanges.flatMap(([s, e]) => Array.from({ length: e - s + 1 }, (_, i) => s + i)))

  const handleCardClick = useCallback((idx: number) => {
    if (!isMyTurn) return
    if (selStart === null) {
      setSelStart(idx)
      setSelEnd(idx)
    } else if (idx === selStart && idx === selEnd) {
      setSelStart(null)
      setSelEnd(null)
    } else {
      setSelEnd(idx)
    }
  }, [selStart, selEnd, isMyTurn])

  const handleShow = () => {
    if (!sel || !isSelectionValid) return
    onShow(sel.start, sel.end)
    setSelStart(null)
    setSelEnd(null)
  }

  const isInSelection = (idx: number) => {
    if (!sel) return false
    return idx >= sel.start && idx <= sel.end
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-xs text-gray-400 italic">Cards cannot be rearranged</div>
      <div className="flex gap-1 flex-wrap justify-center">
        {cards.map((card, idx) => (
          <CardComponent
            key={`${card.id}-${idx}`}
            card={card}
            selected={isInSelection(idx)}
            selectable={isMyTurn && playableIndices.has(idx)}
            onClick={() => handleCardClick(idx)}
            size="md"
          />
        ))}
      </div>
      <div className="flex gap-2">
        {isSelectionValid && (
          <button
            onClick={handleShow}
            className="bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 shadow"
          >
            Show ({selectedCards.length} card{selectedCards.length > 1 ? 's' : ''})
          </button>
        )}
        {sel && !isSelectionValid && selectedCards.length > 0 && (
          <span className="text-red-400 text-sm self-center">Invalid or doesn't beat active set</span>
        )}
        {sel && (
          <button onClick={() => { setSelStart(null); setSelEnd(null) }} className="text-gray-400 text-sm underline">
            Clear
          </button>
        )}
        {canFlip && (
          <button onClick={onFlip} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm">
            Flip Hand
          </button>
        )}
      </div>
    </div>
  )
}
