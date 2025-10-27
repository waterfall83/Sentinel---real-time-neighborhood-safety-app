import { useState } from 'react'
import MapView from './components/MapView.jsx'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {

  const [reports, setReports] = useState([])

  return (

    <div className="app-container">
      <header className="app-header">
        <h1>Sentinel</h1>
      </header>

      <main className="app-main">
        <MapView reports={reports} />
      </main>
    </div>


  )
  
}

export default App
