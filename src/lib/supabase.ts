/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'
import type { GameState } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function getOrCreatePlayerId(): string {
  let id = sessionStorage.getItem('scout_player_id')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('scout_player_id', id)
  }
  return id
}

export async function createGame(roomCode: string, player1Id: string, gameState: GameState) {
  const { data, error } = await supabase
    .from('games')
    .insert({ room_code: roomCode, player1_id: player1Id, game_state: gameState })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function joinGame(roomCode: string, player2Id: string) {
  const { data, error } = await supabase
    .from('games')
    .update({ player2_id: player2Id })
    .eq('room_code', roomCode)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getGame(roomCode: string) {
  const { data, error } = await supabase
    .from('games')
    .select()
    .eq('room_code', roomCode)
    .single()
  if (error) throw error
  return data
}

export async function updateGameState(roomCode: string, newState: GameState) {
  const { error } = await supabase
    .from('games')
    .update({ game_state: newState, updated_at: new Date().toISOString() })
    .eq('room_code', roomCode)
  if (error) throw error
}

export function subscribeToGame(roomCode: string, callback: (state: GameState) => void) {
  return supabase
    .channel(`game:${roomCode}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `room_code=eq.${roomCode}` },
      (payload) => callback((payload.new as { game_state: GameState }).game_state))
    .subscribe()
}
