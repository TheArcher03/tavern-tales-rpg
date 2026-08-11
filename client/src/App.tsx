import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage('Could not reach the server.'))
  }, [])

  return (
    <main className="app">
      <h1>Tavern Tales</h1>
      <p>{message}</p>
    </main>
  )
}

export default App
