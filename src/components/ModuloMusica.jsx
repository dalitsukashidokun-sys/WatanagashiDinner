// src/components/ModuloMusica.jsx
// ─── Botón flotante: mini-estado + acceso a la vista de música completa ───────

import React from 'react'
import { Play, Pause, SkipForward } from 'lucide-react'
import { useMusica } from '../context/MusicaContext'

export default function ModuloMusica({ onAbrirMusica }) {
  const { pistaActual, reproduciendo, togglePlay, siguientePista } = useMusica()

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-32px)]">
      <div
        className="card-dark border border-stone-800/80 bg-stone-950/90 backdrop-blur-md shadow-2xl
          rounded-full flex items-center gap-2 pl-2 pr-3 py-2
          hover:border-amber-700/50 transition-colors"
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); togglePlay() }}
          className="relative w-9 h-9 rounded-full overflow-hidden border border-stone-700 bg-stone-900 shrink-0
            flex items-center justify-center active:scale-95 transition-transform"
          aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
        >
          <img
            src={pistaActual.imagen}
            alt=""
            className={`w-full h-full object-cover transition-transform ${reproduciendo ? 'animate-spin-slow' : 'brightness-50'}`}
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-stone-100">
            {reproduciendo ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
          </span>
        </button>

        <button
          type="button"
          onClick={onAbrirMusica}
          className="min-w-0 max-w-[110px] hidden sm:flex flex-col items-start text-left"
        >
          <p className="text-[9px] font-bold uppercase tracking-wider text-amber-500 leading-tight">Ambiente</p>
          <p className="text-stone-300 text-xs truncate font-medium leading-tight w-full">
            {pistaActual.titulo}
          </p>
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); siguientePista() }}
          className="text-stone-500 hover:text-amber-400 transition-colors p-1 shrink-0"
          aria-label="Siguiente pista"
        >
          <SkipForward size={14} />
        </button>

        <button
          type="button"
          onClick={onAbrirMusica}
          aria-label="Abrir reproductor de música"
          className="ml-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500 hover:text-amber-300
            transition-colors border-l border-stone-800 pl-2.5 py-0.5"
        >
          Abrir
        </button>
      </div>
    </div>
  )
}
