import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronUp, Volume2, VolumeX, SkipForward } from 'lucide-react';

// Lista de reproducción oficial del Festival Watanagashi
const LISTA_REPRODUCCION = [
  {
    id: 1,
    titulo: "Higurashi Main Theme",
    archivo: "/music/Higurashi No Naku Koro Ni OST - Main Theme - seranastarflower (480p).mp4",
    imagen: "/music/Higurashi No Naku Koro Ni.png"
  },
  {
    id: 2,
    titulo: "You (M.Box Arrange)",
    archivo: "/music/You (M.Box Arrange) - dai - Topic (1080p).mp4",
    imagen: "/music/You.png"
  },
  {
    id: 3,
    titulo: "I Believe What You Said (AmaLee)",
    archivo: "/music/AmaLee - I Believe What You Said (From _Higurashi_ When They Cry - GOU_).mp4",
    imagen: "/music/I Believe What You Said.png"
  },
  {
    id: 4,
    titulo: "When They Cry (AmaLee)",
    archivo: "/music/When They Cry.mp4",
    imagen: "/music/Nostalgia_II.png"
  },
  {
    id: 5,
    titulo: "Irregular Entropy (Ayane)",
    archivo: "/music/Irregular Entropy.mp4",
    imagen: "/music/Irregular Entropy.png"
  }
];

export default function ModuloMusica() {
  const [abierto, setAbierto] = useState(false);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [pistaActual, setPistaActual] = useState(LISTA_REPRODUCCION[0]);
  const [volumen, setVolumen] = useState(0.4);
  const audioRef = useRef(null);
  const contenedorRef = useRef(null);

  // Sincronización del hardware de audio del sistema
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volumen;
      if (reproduciendo) {
        audioRef.current.play().catch(() => setReproduciendo(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [reproduciendo, pistaActual]);

  // Cierra el panel desplegable al tocar fuera de él (todo el widget, pastilla incluida)
  useEffect(() => {
    if (!abierto) return;
    const handleClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [abierto]);

  const togglePanel = () => setAbierto(a => !a);

  const togglePlay = (e) => {
    e.stopPropagation();
    setReproduciendo(r => !r);
  };

  const cambiarPista = (e, pista) => {
    e.stopPropagation();
    setPistaActual(pista);
    setReproduciendo(true);
  };

  const siguientePista = (e) => {
    e?.stopPropagation();
    const indexActual = LISTA_REPRODUCCION.findIndex(p => p.id === pistaActual.id);
    const siguienteIndex = (indexActual + 1) % LISTA_REPRODUCCION.length;
    setPistaActual(LISTA_REPRODUCCION[siguienteIndex]);
    setReproduciendo(true);
  };

  const ajustarVolumen = (e) => {
    e.stopPropagation();
    const nuevoVolumen = parseFloat(e.target.value);
    setVolumen(nuevoVolumen);
    if (audioRef.current) audioRef.current.volume = nuevoVolumen;
  };

  return (
    <div
      ref={contenedorRef}
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 max-w-[calc(100vw-32px)]"
    >
      <audio
        ref={audioRef}
        src={pistaActual.archivo}
        onEnded={siguientePista}
      />

      {/* ── Panel desplegable: lista de pistas + volumen ── */}
      {abierto && (
        <div
          className="card-dark border border-stone-800/80 bg-stone-950/95 backdrop-blur-md shadow-2xl rounded-2xl
            w-72 animate-fade-in"
        >
          <div className="p-3 border-b border-stone-800/80">
            <p className="text-[10px] uppercase font-bold tracking-widest text-amber-500">Festival Watanagashi · Ambiente</p>
          </div>

          <div className="max-h-[200px] overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
            {LISTA_REPRODUCCION.map((pista) => (
              <button
                key={pista.id}
                type="button"
                onClick={(e) => cambiarPista(e, pista)}
                className={`w-full text-left text-xs px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5
                  ${pistaActual.id === pista.id ? 'bg-amber-950/40 text-amber-300 font-medium' : 'text-stone-400 hover:bg-stone-900/60'}`}
              >
                <img src={pista.imagen} alt="" className="w-7 h-7 rounded-md object-cover shrink-0 border border-stone-800" />
                <span className="truncate flex-1">{pista.titulo}</span>
                {pistaActual.id === pista.id && reproduciendo && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-stone-800/80">
            {volumen === 0 ? (
              <VolumeX size={14} className="text-stone-500 shrink-0" />
            ) : (
              <Volume2 size={14} className="text-stone-500 shrink-0" />
            )}
            <input
              type="range" min="0" max="1" step="0.05"
              value={volumen} onChange={ajustarVolumen}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      )}

      {/* ── Pastilla flotante siempre visible ── */}
      <div
        className="card-dark border border-stone-800/80 bg-stone-950/90 backdrop-blur-md shadow-2xl
          rounded-full flex items-center gap-2 pl-2 pr-3 py-2
          hover:border-amber-700/50 transition-colors"
      >
        <button
          type="button"
          onClick={togglePlay}
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
          onClick={togglePanel}
          aria-expanded={abierto}
          className="min-w-0 max-w-[110px] hidden sm:flex flex-col items-start text-left"
        >
          <p className="text-[9px] font-bold uppercase tracking-wider text-amber-500 leading-tight">Ambiente</p>
          <p className="text-stone-300 text-xs truncate font-medium leading-tight w-full">
            {pistaActual.titulo}
          </p>
        </button>

        <button
          type="button"
          onClick={siguientePista}
          className="text-stone-500 hover:text-amber-400 transition-colors p-1 shrink-0"
          aria-label="Siguiente pista"
        >
          <SkipForward size={14} />
        </button>

        <button
          type="button"
          onClick={togglePanel}
          aria-expanded={abierto}
          aria-label={abierto ? 'Cerrar lista de canciones' : 'Abrir lista de canciones'}
          className="text-stone-500 hover:text-amber-400 transition-colors p-1 shrink-0"
        >
          <ChevronUp
            size={15}
            className={`transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
