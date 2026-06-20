// src/context/MusicaContext.jsx
// ─── Estado global del reproductor: compartido entre el botón flotante y la vista de música ───

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { LISTA_REPRODUCCION } from '../data/musica'

const MusicaContext = createContext(null)

export function MusicaProvider({ children }) {
  const [pistaActual, setPistaActual]     = useState(LISTA_REPRODUCCION[0])
  const [reproduciendo, setReproduciendo] = useState(false)
  const [volumen, setVolumen]             = useState(0.4)
  const [progreso, setProgreso]           = useState(0) // segundos
  const [duracion, setDuracion]           = useState(0) // segundos
  const audioRef = useRef(null)

  // Sincroniza volumen y play/pause con el elemento <audio>
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volumen
    if (reproduciendo) {
      audioRef.current.play().catch(() => setReproduciendo(false))
    } else {
      audioRef.current.pause()
    }
  }, [reproduciendo, pistaActual, volumen])

  const togglePlay = () => setReproduciendo(r => !r)

  const reproducirPista = (pista) => {
    setPistaActual(pista)
    setReproduciendo(true)
  }

  const siguientePista = () => {
    const i = LISTA_REPRODUCCION.findIndex(p => p.id === pistaActual.id)
    reproducirPista(LISTA_REPRODUCCION[(i + 1) % LISTA_REPRODUCCION.length])
  }

  const anteriorPista = () => {
    const i = LISTA_REPRODUCCION.findIndex(p => p.id === pistaActual.id)
    reproducirPista(LISTA_REPRODUCCION[(i - 1 + LISTA_REPRODUCCION.length) % LISTA_REPRODUCCION.length])
  }

  const buscarEnPista = (segundos) => {
    if (audioRef.current) audioRef.current.currentTime = segundos
    setProgreso(segundos)
  }

  const value = {
    lista: LISTA_REPRODUCCION,
    pistaActual, reproduciendo, volumen, progreso, duracion,
    audioRef,
    togglePlay, reproducirPista, siguientePista, anteriorPista,
    setVolumen, buscarEnPista,
  }

  return (
    <MusicaContext.Provider value={value}>
      <audio
        ref={audioRef}
        src={pistaActual.archivo}
        onEnded={siguientePista}
        onTimeUpdate={(e) => setProgreso(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuracion(e.currentTarget.duration)}
      />
      {children}
    </MusicaContext.Provider>
  )
}

export function useMusica() {
  const ctx = useContext(MusicaContext)
  if (!ctx) throw new Error('useMusica debe usarse dentro de <MusicaProvider>')
  return ctx
}
