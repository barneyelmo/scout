import { HashRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby/:roomCode" element={<LobbyPage />} />
        <Route path="/game/:roomCode" element={<GamePage />} />
      </Routes>
    </HashRouter>
  )
}
