export type Card = {
  id: string
  topValue: number
  bottomValue: number
  orientation: 'top' | 'bottom'
}

export type PlayerHand = {
  playerId: string
  cards: Card[]
  scoutChips: number
  scoredCards: number
  hasFlippedHand: boolean
}

export type ActiveSet = {
  cards: Card[]
  playedBy: string
  setType: 'single' | 'pair' | 'run'
  setValue: number
}

export type GamePhase = 'waiting' | 'orientation' | 'playing' | 'round_end' | 'ended'

export type GameState = {
  gameId: string
  round: 1 | 2
  currentTurn: string
  player1: PlayerHand
  player2: PlayerHand
  activeSet: ActiveSet | null
  deck: Card[]
  scores: { player1: number; player2: number }
  phase: GamePhase
  consecutiveTurns: number
  roundEnderId: string | null
  roundScores: { player1: number; player2: number } | null
  readyPlayers: string[]
}

export type ScoutPosition = 'left' | 'right'
