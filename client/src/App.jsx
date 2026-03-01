import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Game from './pages/Game'

function App() {
    return (
        <BrowserRouter>
            <div className="app">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/room/:roomId" element={<Lobby />} />
                    <Route path="/game/:roomId" element={<Game />} />
                </Routes>
            </div>
        </BrowserRouter>
    )
}

export default App
