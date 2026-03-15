import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrCreatePlayerId } from '../lib/supabase'
import { useGame } from '../hooks/useGame'
import GameHeader from '../components/GameHeader'
import ActiveSetComponent from '../components/ActiveSet'
import PlayerHand from '../components/PlayerHand'
import ActionButtons from '../components/ActionButtons'
import CardComponent from '../components/Card'
import type { ScoutPosition } from '../lib/types'

export default function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const playerId = getOrCreatePlayerId()
  const { gameState, loading, error, isMyTurn, myKey, handleShow, handleScout, handleFlipHand, handleReady, handleStartRound2, handleEndRound } = useGame(roomCode!, playerId)

  const opponentKey = myKey === 'player1' ? 'player2' : 'player1'

  // Handle orientation phase - redirect back to lobby
  useEffect(() => {
    if (gameState?.phase === 'orientation') navigate(`/lobby/${roomCode}`)
  }, [gameState?.phase, navigate, roomCode])

  if (loading) return <div className="min-h-screen bg-green-900 flex items-center justify-center text-white">Loading...</div>
  if (error) return <div className="min-h-screen bg-green-900 flex items-center justify-center text-red-300">{error}</div>
  if (!gameState) return null

  const myPlayer = gameState[myKey]
  const opponent = gameState[opponentKey]

  // Round end overlay
  if (gameState.phase === 'round_end') {
    const rs = gameState.roundScores
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">Round 1 Complete!</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="font-semibold text-green-800 mb-1">You</div>
              <div className="text-3xl font-bold text-green-700">{rs?.[myKey] ?? 0 > 0 ? '+' : ''}{rs?.[myKey]}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="font-semibold text-gray-600 mb-1">Opponent</div>
              <div className="text-3xl font-bold text-gray-700">{rs?.[opponentKey] ?? 0 > 0 ? '+' : ''}{rs?.[opponentKey]}</div>
            </div>
          </div>
          <div className="text-sm text-gray-500 mb-6">
            Total: You {gameState.scores[myKey]} — Them {gameState.scores[opponentKey]}
          </div>
          {isMyTurn && (
            <button onClick={handleStartRound2} className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold hover:bg-green-800">
              Start Round 2
            </button>
          )}
          {!isMyTurn && <p className="text-gray-400">Waiting for opponent to start Round 2...</p>}
        </div>
      </div>
    )
  }

  // Game ended overlay
  if (gameState.phase === 'ended') {
    const myScore = gameState.scores[myKey]
    const oppScore = gameState.scores[opponentKey]
    const won = myScore > oppScore
    const tied = myScore === oppScore
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl">
          <div className="text-5xl mb-3">{won ? '🏆' : tied ? '🤝' : '😅'}</div>
          <h2 className="text-3xl font-bold mb-2">{won ? 'You Win!' : tied ? 'Tied!' : 'You Lose'}</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-sm text-green-700 mb-1">You</div>
              <div className="text-4xl font-bold text-green-800">{myScore}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-500 mb-1">Opponent</div>
              <div className="text-4xl font-bold text-gray-700">{oppScore}</div>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold hover:bg-green-800">
            Play Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-900 flex flex-col p-3 gap-3 max-w-2xl mx-auto">
      <GameHeader gameState={gameState} myKey={myKey} />

      {/* Opponent area */}
      <div className="bg-white bg-opacity-10 rounded-xl p-3">
        <div className="text-white text-xs mb-2 opacity-70">Opponent's Hand ({opponent.cards.length} cards)</div>
        <div className="flex gap-1 flex-wrap">
          {opponent.cards.map((_, i) => (
            <CardComponent key={i} card={opponent.cards[i]} faceDown size="sm" />
          ))}
        </div>
      </div>

      {/* Active set */}
      <div className="bg-white rounded-xl p-4 flex-1 flex flex-col items-center justify-center min-h-32">
        <div className="text-xs text-gray-400 mb-2">Active Set</div>
        <ActiveSetComponent
          activeSet={gameState.activeSet}
          canScout={false} // scout handled via ActionButtons
          onScout={() => {}}
        />
      </div>

      {/* Action buttons */}
      <div className="bg-white rounded-xl p-3">
        <ActionButtons
          isMyTurn={isMyTurn}
          myPlayer={myPlayer}
          activeSet={gameState.activeSet}
          onScout={(takeFrom: ScoutPosition, insertAt: ScoutPosition) => handleScout(takeFrom, insertAt)}
          onEndRound={handleEndRound}
          consecutiveTurns={gameState.consecutiveTurns}
        />
      </div>

      {/* Player hand */}
      <div className="bg-white rounded-xl p-3">
        <div className="text-xs text-gray-400 mb-2">Your Hand ({myPlayer.cards.length} cards)</div>
        <PlayerHand
          cards={myPlayer.cards}
          activeSet={gameState.activeSet}
          isMyTurn={isMyTurn}
          onShow={handleShow}
          canFlip={!myPlayer.hasFlippedHand && gameState.phase === 'orientation'}
          onFlip={handleFlipHand}
        />
      </div>
    </div>
  )
}
