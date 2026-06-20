import React, { useState, useEffect, useRef } from 'react';

// Lista de reproducción oficial del Festival Watanagashi
const LISTA_REPRODUCCION = [
    { 
      id: 1, 
      titulo: "Higurashi Main Theme", 
      archivo: "/music/Higurashi No Naku Koro Ni OST.mp4",
      imagen: "/music/MUSIC.png"
    },
    { 
      id: 2, 
      titulo: "You (M.Box Arrange)", 
      archivo: "/music/You (M.Box Arrange) - dai - Topic.mp4",
      imagen: "/music/MUSIC.png"
    },
    { 
      id: 3, 
      titulo: "I Believe What You Said (AmaLee)", 
      archivo: "/music/AmaLee - I Believe What You Said.mp4",
      imagen: "/music/MUSIC.png"
    },
    { 
      id: 4, 
      titulo: "When They Cry (AmaLee)", 
      archivo: "/music/When They Cry.mp4",
      imagen: "/music/MUSIC.png"
    },
    { 
      id: 5, 
      titulo: "Irregular Entropy (Ayane)", 
      archivo: "/music/Irregular Entropy.mp4",
      imagen: "/music/MUSIC.png"
    }
  ];

export default function ModuloMusica() {
  const [esPC, setEsPC] = useState(true);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [pistaActual, setPistaActual] = useState(LISTA_REPRODUCCION[0]);
  const [volumen, setVolumen] = useState(0.4);
  const audioRef = useRef(null);

  // Detector adaptativo de entorno visual
  useEffect(() => {
    const comprobarDispositivo = () => {
      setEsPC(window.innerWidth >= 768);
    };
    comprobarDispositivo();
    window.addEventListener('resize', comprobarDispositivo);
    return () => window.removeEventListener('resize', comprobarDispositivo);
  }, []);

  // Sincronización del hardware de audio del sistema
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volumen;
      if (reproduciendo) {
        audioRef.current.play().catch(() => {
          setReproduciendo(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [reproduciendo, pistaActual]);

  const togglePlay = () => setReproduciendo(!reproduciendo);

  const cambiarPista = (pista) => {
    setPistaActual(pista);
    setReproduciendo(true);
  };

  const ajustarVolumen = (e) => {
    const nuevoVolumen = parseFloat(e.target.value);
    setVolumen(nuevoVolumen);
    if (audioRef.current) audioRef.current.volume = nuevoVolumen;
  };

  return (
    <div className="w-full">
      <audio 
        ref={audioRef} 
        src={pistaActual.archivo} 
        onEnded={() => {
          const indexActual = LISTA_REPRODUCCION.findIndex(p => p.id === pistaActual.id);
          const siguienteIndex = (indexActual + 1) % LISTA_REPRODUCCION.length;
          cambiarPista(LISTA_REPRODUCCION[siguienteIndex]);
        }}
      />

      {esPC ? (
        /* 🖥️ INTERFAZ DE ESCRITORIO */
        <div className="card-dark border border-stone-800 p-4 bg-stone-950/60 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-3 gap-3">
            
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-stone-800 bg-stone-900">
                <img src={pistaActual.imagen} alt={pistaActual.titulo} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-widest text-amber-500">Ambiente</p>
                <h3 className="text-sm font-medium text-stone-200 truncate max-w-[160px]">
                  {reproduciendo ? pistaActual.titulo : "En Pausa"}
                </h3>
              </div>
            </div>

            <button 
              onClick={togglePlay}
              className={`p-2.5 rounded-full border transition-all shrink-0 ${reproduciendo ? 'bg-amber-600/20 border-amber-500 text-amber-300' : 'bg-stone-900 border-stone-700 text-stone-400'}`}
            >
              {reproduciendo ? '⏸️' : '▶️'}
            </button>
          </div>

          <div className="space-y-1 mb-3 max-h-[120px] overflow-y-auto pr-1">
            {LISTA_REPRODUCCION.map((pista) => (
              <button
                key={pista.id}
                onClick={() => cambiarPista(pista)}
                className={`w-full text-left text-xs px-2.5 py-2 rounded transition-all flex items-center gap-2.5 ${pistaActual.id === pista.id ? 'bg-amber-950/40 text-amber-300 font-medium' : 'text-stone-400 hover:bg-stone-900/60'}`}
              >
                <img src={pista.imagen} alt="" className="w-4 h-4 rounded-sm object-cover shrink-0" />
                <span className="truncate flex-1">{pista.titulo}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-stone-500">🔈</span>
            <input 
              type="range" min="0" max="1" step="0.05" 
              value={volumen} onChange={ajustarVolumen}
              className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-xs text-stone-500">🔊</span>
          </div>
        </div>
      ) : (
        /* 📱 INTERFAZ PORTÁTIL / MÓVIL */
        <div className="fixed bottom-4 right-4 z-50 card-dark border border-stone-800/80 p-2.5 bg-stone-950/90 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md max-w-[calc(100vw-32px)]">
          
          <button 
            onClick={togglePlay}
            className="relative w-10 h-10 rounded-full overflow-hidden border border-stone-700 bg-stone-900 shrink-0 flex items-center justify-center active:scale-95 transition-transform"
          >
            <img 
              src={pistaActual.imagen} 
              alt="" 
              className={`w-full h-full object-cover transition-transform ${reproduciendo ? 'animate-spin-slow' : 'brightness-50'}`} 
            />
            {!reproduciendo && <span className="absolute text-xs">▶️</span>}
          </button>

          <div className="pr-3 min-w-0 max-w-[130px]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-500">FESTIVAL</p>
            <p className="text-stone-300 text-xs truncate font-medium">
              {pistaActual.titulo}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}