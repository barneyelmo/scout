import type { GameState } from '../lib/types'

interface GameHeaderProps {
  gameState: GameState
  myKey: 'player1' | 'player2'
}

export default function GameHeader({ gameState, myKey }: GameHeaderProps) {
  const opponentKey = myKey === 'player1' ? 'player2' : 'player1'
  const me = gameState[myKey]
  const opp = gameState[opponentKey]

  return (
    <div className="flex items-center justify-between bg-green-800 text-white px-4 py-2 rounded-xl">
      <div className="text-center">
        <div className="text-xs opacity-70">You</div>
        <div className="text-2xl font-bold">{gameState.scores[myKey]}</div>
        <div className="text-xs">{'🔵'.repeat(me.scoutChips)}{'⚫'.repeat(3 - me.scoutChips)}</div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold">Round {gameState.round}/2</div>
        <div className="text-xs opacity-70">
          {gameState.currentTurn === me.playerId ? '⚡ Your Turn' : '⏳ Their Turn'}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs opacity-70">Opponent</div>
        <div className="text-2xl font-bold">{gameState.scores[opponentKey]}</div>
        <div className="text-xs">{'🔵'.repeat(opp.scoutChips)}{'⚫'.repeat(3 - opp.scoutChips)}</div>
      </div>
    </div>
  )
}
