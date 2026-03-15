import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { getGame, joinGame, updateGameState, subscribeToGame, getOrCreatePlayerId } from '../lib/supabase'
import { applyFlipHand, setReady } from '../lib/gameEngine'
import type { GameState } from '../lib/types'
import CardComponent from '../components/Card'

export default function LobbyPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isJoining = searchParams.get('join') === '1'
  const playerId = getOrCreatePlayerId()

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!roomCode) return
    let mounted = true

    const setup = async () => {
      try {
        if (isJoining) {
          const data = await joinGame(roomCode, playerId)
          const gs: GameState = {
            ...data.game_state,
            player2: { ...data.game_state.player2, playerId },
            phase: 'orientation',
          }
          await updateGameState(roomCode, gs)
          if (mounted) setGameState(gs)
        } else {
          const data = await getGame(roomCode)
          if (mounted) setGameState(data.game_state)
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    setup()

    const sub = subscribeToGame(roomCode, state => {
      if (!mounted) return
      setGameState(state)
      if (state.phase === 'playing') navigate(`/game/${roomCode}`)
    })

    return () => { mounted = false; sub.unsubscribe() }
  }, [roomCode, isJoining, playerId, navigate])

  const handleFlip = async () => {
    if (!gameState || !roomCode) return
    const next = applyFlipHand(gameState, playerId)
    setGameState(next)
    await updateGameState(roomCode, next)
  }

  const handleReady = async () => {
    if (!gameState || !roomCode) return
    const next = setReady(gameState, playerId)
    setGameState(next)
    await updateGameState(roomCode, next)
    if (next.phase === 'playing') navigate(`/game/${roomCode}`)
  }

  if (loading) return <div className="min-h-screen bg-green-900 flex items-center justify-center text-white text-xl">Loading...</div>
  if (error) return <div className="min-h-screen bg-green-900 flex items-center justify-center text-red-300 text-xl">{error}</div>

  const myKey = gameState?.player1.playerId === playerId ? 'player1' : 'player2'
  const myPlayer = gameState?.[myKey]
  const bothPresent = gameState?.player2.playerId && gameState.player2.playerId !== ''
  const iAmReady = gameState?.readyPlayers.includes(playerId)

  if (!bothPresent) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">Waiting for Player 2</h2>
          <p className="text-gray-400 mb-4 text-sm">Share this room code:</p>
          <div className="text-4xl font-mono font-bold text-green-700 tracking-widest bg-green-50 rounded-xl py-4 mb-4">{roomCode}</div>
          <p className="text-xs text-gray-400">Have your opponent go to scout and enter this code</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 text-center max-w-sm w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-1">Round {gameState?.round} — Choose Orientation</h2>
        <p className="text-gray-400 text-sm mb-4">You may flip your entire hand once. Cards cannot be rearranged later.</p>

        <div className="flex justify-center gap-1 mb-4 flex-wrap min-h-[4rem] items-center">
          {myPlayer?.cards.map((card, i) => (
            <CardComponent key={`${card.id}-${i}`} card={card} size="sm" />
          ))}
        </div>

        {!myPlayer?.hasFlippedHand && !iAmReady && (
          <button onClick={handleFlip} className="w-full bg-blue-500 text-white py-2 rounded-lg mb-3 hover:bg-blue-600 text-sm">
            Flip My Entire Hand
          </button>
        )}
        {myPlayer?.hasFlippedHand && <p className="text-green-600 text-xs mb-3">Hand flipped!</p>}

        <button
          onClick={handleReady}
          disabled={iAmReady}
          className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold hover:bg-green-800 disabled:opacity-50"
        >
          {iAmReady ? 'Waiting for opponent...' : 'Ready to Play!'}
        </button>

        {gameState && (
          <p className="text-xs text-gray-400 mt-3">
            {gameState.readyPlayers.length}/2 players ready
          </p>
        )}
      </div>
    </div>
  )
}
