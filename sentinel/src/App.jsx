import { useState } from 'react'
import MapView from './components/MapView.jsx'
import Header from './components/Header.jsx'
import SignIn from './components/SignIn.jsx'
import './App.css'

function App() {

  const [reports, setReports] = useState([])

  return (

    <div className="app-container">
      <Header />
      <SignIn />
    </div>


  )

}

export default App
