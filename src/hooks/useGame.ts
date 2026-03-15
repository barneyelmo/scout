import { useState, useEffect, useCallback } from 'react'
import type { GameState, ScoutPosition } from '../lib/types'
import { showSet, scoutCard, endRound, applyFlipHand, setReady, startRound2, checkAndEndRound } from '../lib/gameEngine'
import { updateGameState, subscribeToGame, getGame } from '../lib/supabase'

export function useGame(roomCode: string, playerId: string) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getGame(roomCode)
      .then(data => { if (mounted) { setGameState(data.game_state); setLoading(false) } })
      .catch(err => { if (mounted) { setError(err.message); setLoading(false) } })

    const sub = subscribeToGame(roomCode, state => { if (mounted) setGameState(state) })
    return () => { mounted = false; sub.unsubscribe() }
  }, [roomCode])

  const dispatch = useCallback(async (newState: GameState) => {
    setGameState(newState)
    await updateGameState(roomCode, newState)
  }, [roomCode])

  const handleShow = useCallback(async (startIdx: number, endIdx: number) => {
    if (!gameState) return
    try {
      let next = showSet(gameState, playerId, startIdx, endIdx)
      next = checkAndEndRound(next)
      await dispatch(next)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
  }, [gameState, playerId, dispatch])

  const handleScout = useCallback(async (takeFrom: ScoutPosition, insertAt: ScoutPosition) => {
    if (!gameState) return
    try {
      let next = scoutCard(gameState, playerId, takeFrom, insertAt)
      next = checkAndEndRound(next)
      await dispatch(next)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
  }, [gameState, playerId, dispatch])

  const handleFlipHand = useCallback(async () => {
    if (!gameState) return
    await dispatch(applyFlipHand(gameState, playerId))
  }, [gameState, playerId, dispatch])

  const handleReady = useCallback(async () => {
    if (!gameState) return
    await dispatch(setReady(gameState, playerId))
  }, [gameState, playerId, dispatch])

  const handleStartRound2 = useCallback(async () => {
    if (!gameState) return
    await dispatch(startRound2(gameState))
  }, [gameState, dispatch])

  const handleEndRound = useCallback(async () => {
    if (!gameState) return
    await dispatch(endRound(gameState))
  }, [gameState, dispatch])

  const myKey: 'player1' | 'player2' = gameState?.player1.playerId === playerId ? 'player1' : 'player2'
  const isMyTurn = gameState?.currentTurn === playerId

  return { gameState, loading, error, isMyTurn, myKey, handleShow, handleScout, handleFlipHand, handleReady, handleStartRound2, handleEndRound }
}
