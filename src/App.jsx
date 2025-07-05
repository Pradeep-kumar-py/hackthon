import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import OutbreakOraclePage from './components/GemeniAnalyser'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  const [count, setCount] = useState(0)

  return (
    <ThemeProvider>
      <OutbreakOraclePage />
    </ThemeProvider>
  )
}

export default App
