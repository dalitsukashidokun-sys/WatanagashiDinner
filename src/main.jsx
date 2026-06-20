import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { MusicaProvider } from './context/MusicaContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MusicaProvider>
      <App />
    </MusicaProvider>
  </React.StrictMode>,
)
