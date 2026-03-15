import type { Card, PlayerHand, GameState, ActiveSet, ScoutPosition } from './types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function createDeck(): Card[] {
  const cards: Card[] = []
  for (let i = 1; i <= 9; i++) {
    for (let j = i + 1; j <= 10; j++) {
      if (i === 9 && j === 10) continue
      cards.push({ id: `${i}-${j}`, topValue: i, bottomValue: j, orientation: 'top' })
    }
  }
  return shuffle(cards)
}

export function getActiveValue(card: Card): number {
  return card.orientation === 'top' ? card.topValue : card.bottomValue
}

export function flipHand(cards: Card[]): Card[] {
  return [...cards].reverse().map(c => ({
    ...c,
    orientation: c.orientation === 'top' ? 'bottom' as const : 'top' as const,
  }))
}

export function isValidSet(cards: Card[]): boolean {
  if (cards.length === 0) return false
  if (cards.length === 1) return true
  const vals = cards.map(getActiveValue)
  if (vals.every(v => v === vals[0])) return true
  const asc = vals.every((v, i) => i === 0 || v === vals[i - 1] + 1)
  if (asc) return true
  const desc = vals.every((v, i) => i === 0 || v === vals[i - 1] - 1)
  return desc
}

export function getSetType(cards: Card[]): 'single' | 'pair' | 'run' {
  if (cards.length === 1) return 'single'
  const vals = cards.map(getActiveValue)
  return vals.every(v => v === vals[0]) ? 'pair' : 'run'
}

export function getSetValue(cards: Card[]): number {
  const vals = cards.map(getActiveValue)
  return getSetType(cards) === 'pair' ? vals[0] : Math.max(...vals)
}

export function compareSet(newCards: Card[], activeCards: Card[]): boolean {
  if (newCards.length > activeCards.length) return true
  if (newCards.length < activeCards.length) return false
  const nt = getSetType(newCards)
  const at = getSetType(activeCards)
  if (nt === 'pair' && at === 'run') return true
  if (nt === 'run' && at === 'pair') return false
  return getSetValue(newCards) > getSetValue(activeCards)
}

export function canShow(player: PlayerHand, activeSet: ActiveSet | null): boolean {
  const { cards } = player
  for (let s = 0; s < cards.length; s++) {
    for (let e = s + 1; e <= cards.length; e++) {
      const sub = cards.slice(s, e)
      if (!isValidSet(sub)) continue
      if (!activeSet || compareSet(sub, activeSet.cards)) return true
    }
  }
  return false
}

export function getPlayableRanges(player: PlayerHand, activeSet: ActiveSet | null): [number, number][] {
  const ranges: [number, number][] = []
  const { cards } = player
  for (let s = 0; s < cards.length; s++) {
    for (let e = s + 1; e <= cards.length; e++) {
      const sub = cards.slice(s, e)
      if (!isValidSet(sub)) continue
      if (!activeSet || compareSet(sub, activeSet.cards)) ranges.push([s, e - 1])
    }
  }
  return ranges
}

function calculateRoundScore(player: PlayerHand, activeSet: ActiveSet | null, isEnder: boolean): number {
  let score = player.scoredCards
  if (isEnder && activeSet && activeSet.playedBy === player.playerId) {
    score += activeSet.cards.length
  }
  score += player.scoutChips
  if (!isEnder) score -= player.cards.length
  return score
}

export function initializeGame(player1Id: string, player2Id: string): GameState {
  const deck = createDeck()
  return {
    gameId: crypto.randomUUID(),
    round: 1,
    currentTurn: player1Id,
    player1: { playerId: player1Id, cards: deck.slice(0, 11), scoutChips: 3, scoredCards: 0, hasFlippedHand: false },
    player2: { playerId: player2Id, cards: deck.slice(11, 22), scoutChips: 3, scoredCards: 0, hasFlippedHand: false },
    activeSet: null,
    deck: deck.slice(22),
    scores: { player1: 0, player2: 0 },
    phase: 'waiting',
    consecutiveTurns: 0,
    roundEnderId: null,
    roundScores: null,
    readyPlayers: [],
  }
}

export function applyFlipHand(state: GameState, playerId: string): GameState {
  const key = playerId === state.player1.playerId ? 'player1' : 'player2'
  const player = state[key]
  if (player.hasFlippedHand) return state
  return { ...state, [key]: { ...player, cards: flipHand(player.cards), hasFlippedHand: true } }
}

export function setReady(state: GameState, playerId: string): GameState {
  if (state.readyPlayers.includes(playerId)) return state
  const readyPlayers = [...state.readyPlayers, playerId]
  const bothReady = readyPlayers.includes(state.player1.playerId) && readyPlayers.includes(state.player2.playerId)
  return { ...state, readyPlayers, phase: bothReady ? 'playing' : state.phase }
}

export function showSet(state: GameState, playerId: string, startIdx: number, endIdx: number): GameState {
  const key = playerId === state.player1.playerId ? 'player1' : 'player2'
  const opponentKey = key === 'player1' ? 'player2' : 'player1'
  const player = state[key]
  const playedCards = player.cards.slice(startIdx, endIdx + 1)

  if (!isValidSet(playedCards)) throw new Error('Invalid set')
  if (state.activeSet && !compareSet(playedCards, state.activeSet.cards)) throw new Error('Does not beat active set')

  const newScoredCards = state.activeSet ? state.activeSet.cards.length : 0
  const newCards = [...player.cards.slice(0, startIdx), ...player.cards.slice(endIdx + 1)]

  const newActiveSet: ActiveSet = {
    cards: playedCards,
    playedBy: playerId,
    setType: getSetType(playedCards),
    setValue: getSetValue(playedCards),
  }

  const newState: GameState = {
    ...state,
    [key]: { ...player, cards: newCards, scoredCards: player.scoredCards + newScoredCards },
    activeSet: newActiveSet,
    currentTurn: state[opponentKey].playerId,
    consecutiveTurns: 0,
  }

  if (newCards.length === 0) return endRound(newState)
  return newState
}

export function scoutCard(state: GameState, playerId: string, takeFrom: ScoutPosition, insertAt: ScoutPosition): GameState {
  if (!state.activeSet) throw new Error('No active set')
  const key = playerId === state.player1.playerId ? 'player1' : 'player2'
  const player = state[key]
  if (player.scoutChips <= 0) throw new Error('No scout chips')

  const activeCards = [...state.activeSet.cards]
  const scoutedCard = takeFrom === 'left' ? activeCards.shift()! : activeCards.pop()!
  const newCards = insertAt === 'left' ? [scoutedCard, ...player.cards] : [...player.cards, scoutedCard]
  const newActiveSet = activeCards.length > 0 ? { ...state.activeSet, cards: activeCards } : null

  return {
    ...state,
    [key]: { ...player, cards: newCards, scoutChips: player.scoutChips - 1 },
    activeSet: newActiveSet,
    consecutiveTurns: state.consecutiveTurns + 1,
  }
}

export function endRound(state: GameState): GameState {
  const enderId = state.activeSet?.playedBy ?? null
  const score1 = calculateRoundScore(state.player1, state.activeSet, enderId === state.player1.playerId)
  const score2 = calculateRoundScore(state.player2, state.activeSet, enderId === state.player2.playerId)
  return {
    ...state,
    scores: { player1: state.scores.player1 + score1, player2: state.scores.player2 + score2 },
    phase: state.round === 1 ? 'round_end' : 'ended',
    roundEnderId: enderId,
    roundScores: { player1: score1, player2: score2 },
  }
}

export function startRound2(state: GameState): GameState {
  const deck = shuffle([...state.deck])
  return {
    ...state,
    round: 2,
    currentTurn: state.player2.playerId, // alternate first player
    player1: { ...state.player1, cards: deck.slice(0, 11), scoutChips: 3, scoredCards: 0, hasFlippedHand: false },
    player2: { ...state.player2, cards: deck.slice(11, 22), scoutChips: 3, scoredCards: 0, hasFlippedHand: false },
    activeSet: null,
    deck: [],
    phase: 'orientation',
    consecutiveTurns: 0,
    roundEnderId: null,
    roundScores: null,
    readyPlayers: [],
  }
}

export function checkAndEndRound(state: GameState): GameState {
  const key = state.currentTurn === state.player1.playerId ? 'player1' : 'player2'
  const player = state[key]
  if (!canShow(player, state.activeSet) && player.scoutChips === 0) {
    return endRound(state)
  }
  return state
}
