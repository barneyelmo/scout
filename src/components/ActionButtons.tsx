import { useState } from 'react'
import type { ActiveSet, PlayerHand, ScoutPosition } from '../lib/types'
import { canShow } from '../lib/gameEngine'

interface ActionButtonsProps {
  isMyTurn: boolean
  myPlayer: PlayerHand
  activeSet: ActiveSet | null
  onScout: (takeFrom: ScoutPosition, insertAt: ScoutPosition) => void
  onEndRound: () => void
  consecutiveTurns: number
}

export default function ActionButtons({ isMyTurn, myPlayer, activeSet, onScout, onEndRound, consecutiveTurns }: ActionButtonsProps) {
  const [scoutFrom, setScoutFrom] = useState<ScoutPosition | null>(null)

  const canScout = isMyTurn && activeSet !== null && activeSet.cards.length > 0 && myPlayer.scoutChips > 0
  const couldShow = canShow(myPlayer, activeSet)
  const mustEndRound = isMyTurn && !couldShow && myPlayer.scoutChips === 0

  if (!isMyTurn) {
    return (
      <div className="text-center text-gray-400 italic py-2">
        Waiting for opponent... {consecutiveTurns > 0 && `(scouted ${consecutiveTurns}x)`}
      </div>
    )
  }

  if (mustEndRound) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-red-500 text-sm">No chips left and can't beat the active set.</p>
        <button onClick={onEndRound} className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700">
          End Round
        </button>
      </div>
    )
  }

  if (scoutFrom) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-gray-600">Add the scouted card to which end of your hand?</p>
        <div className="flex gap-3">
          <button
            onClick={() => { onScout(scoutFrom, 'left'); setScoutFrom(null) }}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            ← Left of Hand
          </button>
          <button
            onClick={() => { onScout(scoutFrom, 'right'); setScoutFrom(null) }}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Right of Hand →
          </button>
        </div>
        <button onClick={() => setScoutFrom(null)} className="text-gray-400 text-sm underline">Cancel</button>
      </div>
    )
  }

  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {canScout && (
        <>
          <button
            onClick={() => setScoutFrom('left')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm"
          >
            Scout ← Left
          </button>
          <button
            onClick={() => setScoutFrom('right')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm"
          >
            Scout Right →
          </button>
        </>
      )}
      <div className="text-xs text-gray-400 self-center">
        {myPlayer.scoutChips} chip{myPlayer.scoutChips !== 1 ? 's' : ''} left
        {consecutiveTurns > 0 && ` • scouted ${consecutiveTurns}x`}
      </div>
    </div>
  )
}
