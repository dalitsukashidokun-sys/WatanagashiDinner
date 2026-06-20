// src/components/VistaMusica.jsx
// ─── Página de música del Festival Watanagashi ────────────────────────────────
// Desktop: sidebar + grid de carátulas + barra de reproductor fija abajo (estilo Spotify)
// Móvil:   lista vertical + mini-player que se expande a pantalla completa (estilo YT Music)

import { useState } from 'react'
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  ChevronDown, ListMusic, Disc3,
} from 'lucide-react'
import { useMusica } from '../context/MusicaContext'

function formatearTiempo(segundos) {
  if (!segundos || Number.isNaN(segundos)) return '0:00'
  const m = Math.floor(segundos / 60)
  const s = Math.floor(segundos % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function VistaMusica({ onVolver }) {
  const {
    lista, pistaActual, reproduciendo, volumen, progreso, duracion,
    togglePlay, reproducirPista, siguientePista, anteriorPista,
    setVolumen, buscarEnPista,
  } = useMusica()

  const [reproductorAbierto, setReproductorAbierto] = useState(false) // solo móvil

  return (
    <div className="-mx-4 sm:-mx-6 -my-6 sm:-my-8 min-h-[calc(100vh-3.5rem)] animate-fade-in">

      {/* ════════════ DESKTOP: sidebar + grid + barra inferior ════════════ */}
      <div className="hidden md:flex h-[calc(100vh-3.5rem)]">

        {/* ── Sidebar ── */}
        <aside className="w-64 shrink-0 border-r border-stone-800/60 bg-stone-950/60 backdrop-blur-sm flex flex-col">
          <div className="p-5 border-b border-stone-800/60">
            <button
              onClick={onVolver}
              className="flex items-center gap-2 text-stone-400 hover:text-amber-400 transition-colors text-sm mb-4"
            >
              <ArrowLeft size={16} /> Volver
            </button>
            <h1 className="font-serif text-xl text-stone-100">Ambiente</h1>
            <p className="text-xs text-stone-500 mt-1">Festival Watanagashi</p>
          </div>

          <nav className="p-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-950/30 text-amber-300 text-sm font-medium">
              <ListMusic size={15} /> Todas las pistas
            </div>
          </nav>

          <div className="mt-auto p-5 border-t border-stone-800/60 text-xs text-stone-600 font-serif leading-relaxed">
            Cuando las cigarras lloran, la noche guarda su melodía.
          </div>
        </aside>

        {/* ── Grid de carátulas ── */}
        <div className="flex-1 overflow-y-auto p-8 pb-32">
          <div className="flex items-end gap-5 mb-8">
            <div className="w-32 h-32 rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-stone-800 shrink-0">
              <img src="/music/main.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">Lista de reproducción</p>
              <h2 className="font-serif text-3xl text-stone-100 mb-2">Música del Festival</h2>
              <p className="text-sm text-stone-500">{lista.length} pistas</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {lista.map((pista) => {
              const esActual = pista.id === pistaActual.id
              return (
                <button
                  key={pista.id}
                  onClick={() => reproducirPista(pista)}
                  className={`group text-left card-dark border p-4 transition-all hover:-translate-y-1
                    ${esActual ? 'border-amber-600/60 bg-amber-950/10' : 'border-stone-800/80 hover:border-stone-700'}`}
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 border border-stone-800 bg-stone-900">
                    <img src={pista.imagen} alt="" className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity
                      ${esActual ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <div className="w-11 h-11 rounded-full bg-amber-600 flex items-center justify-center shadow-lg">
                        {esActual && reproduciendo
                          ? <Pause size={18} className="text-stone-950" />
                          : <Play size={18} className="text-stone-950 ml-0.5" />}
                      </div>
                    </div>
                    {esActual && reproduciendo && (
                      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                  <h3 className={`text-sm font-medium truncate ${esActual ? 'text-amber-300' : 'text-stone-200'}`}>
                    {pista.titulo}
                  </h3>
                  <p className="text-xs text-stone-500 truncate mt-0.5">{pista.artista}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Barra de reproductor fija (desktop) ── */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 h-20 bg-stone-950/95 backdrop-blur-md border-t border-stone-800/80 items-center px-5 gap-5 z-40">
        <div className="flex items-center gap-3 w-64 min-w-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-800 shrink-0">
            <img src={pistaActual.imagen} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-stone-200 truncate font-medium">{pistaActual.titulo}</p>
            <p className="text-xs text-stone-500 truncate">{pistaActual.artista}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-1.5 max-w-xl mx-auto">
          <div className="flex items-center gap-5">
            <button onClick={anteriorPista} className="text-stone-400 hover:text-amber-400 transition-colors" aria-label="Anterior">
              <SkipBack size={18} />
            </button>
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-amber-600 hover:bg-amber-500 flex items-center justify-center transition-colors active:scale-95"
              aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
            >
              {reproduciendo ? <Pause size={16} className="text-stone-950" /> : <Play size={16} className="text-stone-950 ml-0.5" />}
            </button>
            <button onClick={siguientePista} className="text-stone-400 hover:text-amber-400 transition-colors" aria-label="Siguiente">
              <SkipForward size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-[10px] text-stone-500 w-8 text-right shrink-0">{formatearTiempo(progreso)}</span>
            <input
              type="range" min="0" max={duracion || 0} step="0.1"
              value={progreso}
              onChange={(e) => buscarEnPista(parseFloat(e.target.value))}
              className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-[10px] text-stone-500 w-8 shrink-0">{formatearTiempo(duracion)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-40 justify-end shrink-0">
          {volumen === 0 ? <VolumeX size={15} className="text-stone-500" /> : <Volume2 size={15} className="text-stone-500" />}
          <input
            type="range" min="0" max="1" step="0.05"
            value={volumen} onChange={(e) => setVolumen(parseFloat(e.target.value))}
            className="w-24 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      {/* ════════════ MÓVIL: lista vertical + mini-player ════════════ */}
      <div className="md:hidden px-4 pb-28">
        <div className="flex items-center gap-3 pt-1 pb-5">
          <button onClick={onVolver} className="text-stone-400 hover:text-amber-400 transition-colors p-1 -ml-1" aria-label="Volver">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Festival Watanagashi</p>
            <h1 className="font-serif text-xl text-stone-100">Ambiente</h1>
          </div>
        </div>

        <div className="space-y-1.5">
          {lista.map((pista) => {
            const esActual = pista.id === pistaActual.id
            return (
              <button
                key={pista.id}
                onClick={() => reproducirPista(pista)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all
                  ${esActual ? 'bg-amber-950/30 border border-amber-700/40' : 'border border-transparent active:bg-stone-900/60'}`}
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-stone-800 shrink-0 bg-stone-900">
                  <img src={pista.imagen} alt="" className="w-full h-full object-cover" />
                  {esActual && reproduciendo && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="flex gap-0.5 items-end h-3.5">
                        <span className="w-0.5 bg-amber-400 animate-pulse" style={{ height: '60%', animationDelay: '0ms' }} />
                        <span className="w-0.5 bg-amber-400 animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                        <span className="w-0.5 bg-amber-400 animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
                      </span>
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className={`text-sm truncate font-medium ${esActual ? 'text-amber-300' : 'text-stone-200'}`}>{pista.titulo}</p>
                  <p className="text-xs text-stone-500 truncate">{pista.artista}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Mini-player (móvil, siempre visible sobre el contenido) ── */}
      <button
        onClick={() => setReproductorAbierto(true)}
        className="md:hidden fixed bottom-3 left-3 right-3 z-40 card-dark border border-stone-800/80 bg-stone-950/95
          backdrop-blur-md shadow-2xl rounded-2xl flex items-center gap-3 p-2.5"
      >
        <div className="w-11 h-11 rounded-lg overflow-hidden border border-stone-800 shrink-0">
          <img src={pistaActual.imagen} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm text-stone-200 truncate font-medium">{pistaActual.titulo}</p>
          <p className="text-xs text-stone-500 truncate">{pistaActual.artista}</p>
        </div>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); togglePlay() }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); togglePlay() } }}
          className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
        >
          {reproduciendo ? <Pause size={16} className="text-stone-950" /> : <Play size={16} className="text-stone-950 ml-0.5" />}
        </span>
      </button>

      {/* ── Reproductor a pantalla completa (móvil, estilo Spotify/YT Music) ── */}
      {reproductorAbierto && (
        <div className="md:hidden fixed inset-0 z-[60] bg-stone-950 flex flex-col animate-fade-in">
          <div className="flex items-center justify-between p-4 pt-5">
            <button onClick={() => setReproductorAbierto(false)} className="text-stone-400 p-1" aria-label="Minimizar reproductor">
              <ChevronDown size={24} />
            </button>
            <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Festival Watanagashi</p>
            <div className="w-6" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
            <div className={`w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden border border-stone-800 shadow-2xl shadow-black/60 ${reproduciendo ? 'animate-spin-slow' : ''}`}>
              <img src={pistaActual.imagen} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="w-full max-w-[280px] text-center">
              <h2 className="font-serif text-2xl text-stone-100 truncate">{pistaActual.titulo}</h2>
              <p className="text-sm text-stone-500 mt-1">{pistaActual.artista}</p>
            </div>

            <div className="w-full max-w-[280px]">
              <input
                type="range" min="0" max={duracion || 0} step="0.1"
                value={progreso}
                onChange={(e) => buscarEnPista(parseFloat(e.target.value))}
                className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-stone-500">{formatearTiempo(progreso)}</span>
                <span className="text-[10px] text-stone-500">{formatearTiempo(duracion)}</span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <button onClick={anteriorPista} className="text-stone-300 hover:text-amber-400 transition-colors" aria-label="Anterior">
                <SkipBack size={26} />
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-amber-600 hover:bg-amber-500 flex items-center justify-center transition-colors active:scale-95 shadow-lg"
                aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
              >
                {reproduciendo ? <Pause size={26} className="text-stone-950" /> : <Play size={26} className="text-stone-950 ml-1" />}
              </button>
              <button onClick={siguientePista} className="text-stone-300 hover:text-amber-400 transition-colors" aria-label="Siguiente">
                <SkipForward size={26} />
              </button>
            </div>

            <div className="flex items-center gap-2 w-full max-w-[280px]">
              {volumen === 0 ? <VolumeX size={15} className="text-stone-500 shrink-0" /> : <Volume2 size={15} className="text-stone-500 shrink-0" />}
              <input
                type="range" min="0" max="1" step="0.05"
                value={volumen} onChange={(e) => setVolumen(parseFloat(e.target.value))}
                className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          <div className="px-4 pb-6">
            <p className="text-[10px] uppercase tracking-widest text-stone-600 font-bold mb-2 flex items-center gap-1.5">
              <Disc3 size={11} /> Siguiente en la lista
            </p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {lista.filter(p => p.id !== pistaActual.id).map((pista) => (
                <button
                  key={pista.id}
                  onClick={() => reproducirPista(pista)}
                  className="shrink-0 w-16 text-left"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-stone-800 mb-1">
                    <img src={pista.imagen} alt="" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] text-stone-400 truncate">{pista.titulo}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
