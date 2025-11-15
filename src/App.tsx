import { GameCanvas } from './components/GameCanvas'
import { AgentSpawner } from './components/AgentSpawner'
import { Toaster } from 'sonner'

function App() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <GameCanvas />
      <AgentSpawner />
      <Toaster position="bottom-right" theme="dark" />
    </div>
  )
}

export default App
