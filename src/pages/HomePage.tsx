import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoomCode, getOrCreatePlayerId, createGame } from '../lib/supabase'
import { initializeGame } from '../lib/gameEngine'

export default function HomePage() {
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      const playerId = getOrCreatePlayerId()
      const roomCode = generateRoomCode()
      const state = initializeGame(playerId, '')
      await createGame(roomCode, playerId, state)
      navigate(`/lobby/${roomCode}`)
    } catch (e) {
      console.error('Create game error:', e)
      setError(e instanceof Error ? e.message : JSON.stringify(e))
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = () => {
    if (joinCode.trim().length < 6) return
    navigate(`/lobby/${joinCode.trim().toUpperCase()}?join=1`)
  }

  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h1 className="text-5xl font-bold text-center text-green-800 mb-1">Scout</h1>
        <p className="text-center text-gray-400 mb-8 text-sm">2-Player Card Game</p>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold text-lg hover:bg-green-800 disabled:opacity-50 mb-6 shadow"
        >
          {loading ? 'Creating...' : 'Create Game'}
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center"><span className="px-2 bg-white text-gray-400 text-sm">or join with code</span></div>
        </div>

        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="XXXXXX"
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-lg font-mono tracking-widest text-center uppercase focus:outline-none focus:border-green-500"
          />
          <button
            onClick={handleJoin}
            disabled={joinCode.length < 6}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40"
          >
            Join
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
      </div>
    </div>
  )
}
