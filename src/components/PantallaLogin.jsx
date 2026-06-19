// src/components/PantallaLogin.jsx
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { PERSONAJES, ADMIN_PASSWORD } from '../constants'

export default function PantallaLogin({ onLogin, onAdminAccess }) {
  // Fases: 'inicio' | 'codigo' | 'avatar'
  const [fase, setFase] = useState('inicio')
  
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  // ── Lógica de Códigos Secretos ──
  const verificarCodigo = () => {
    if (codigo === ADMIN_PASSWORD) {
      localStorage.setItem('higurashi_admin', 'true')
      onAdminAccess()
    } else if (codigo === 'MUSICA') {
      setError('Módulo de música desbloqueado (En desarrollo).')
      setTimeout(() => setFase('inicio'), 2000)
    } else {
      setError('Código no reconocido por el sistema.')
    }
  }

  // ── Inserción Final en Base de Datos Ligada al Personaje ──
  const seleccionarPersonajeYEntrar = async (personaje) => {
    setCargando(true)
    setError('')
    try {
      // El nombre del usuario será directamente el nombre del personaje elegido
      const { data, error: err } = await supabase
        .from('usuarios')
        .insert({ nombre: personaje.nombre, avatar: personaje.id })
        .select()
        .single()
      
      if (err) throw err
      localStorage.setItem('higurashi_sesion', JSON.stringify(data))
      onLogin(data)
    } catch (e) {
      setError('Error de conexión. El servidor de Hinamizawa no responde.')
      setCargando(false)
    }
  }

  const btnVN = "w-72 bg-black/85 border-2 border-stone-200 text-stone-100 rounded-full py-3 font-bold hover:border-red-700 hover:text-red-500 hover:bg-black transition-all uppercase tracking-widest text-sm shadow-[0_4px_15px_rgba(0,0,0,0.6)]"

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed flex flex-col items-center justify-center relative transition-all duration-700"
      style={{ backgroundImage: "url('/fondos/fondo.png')" }}
    >
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${fase === 'avatar' ? 'bg-black/85' : 'bg-black/30'}`} />

      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center animate-fade-in">
        
        {/* ── LOGO PRINCIPAL (Visible solo en móvil) ── */}
        {fase !== 'avatar' && (
          <div className="text-center mb-16 select-none block md:hidden">
            <h1 className="font-serif text-5xl md:text-7xl text-white font-bold tracking-wider drop-shadow-[0_5px_5px_rgba(0,0,0,1)]">
              Higurashi <span className="text-red-600">N</span>o <span className="text-red-600">N</span>aku Koro Ni
            </h1>
            <p className="text-white mt-2 font-serif text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              Watanagashi Festival
            </p>
          </div>
        )}

        {/* ── FASE 1: MENÚ PRINCIPAL ── */}
        {fase === 'inicio' && (
          <div className="flex flex-col gap-4 items-center animate-slide-up mt-20 md:mt-96">
            <button className={btnVN} onClick={() => setFase('avatar')}>
              Iniciar Pedido
            </button>
            <button className={btnVN} onClick={() => {}}>
              Música de Fondo
            </button>
            <button className={btnVN} onClick={() => { setFase('codigo'); setCodigo(''); setError(''); }}>
              Introducir Código
            </button>
          </div>
        )}

        {/* ── FASE 2: INTRODUCIR CÓDIGO ── */}
        {fase === 'codigo' && (
          <div className="flex flex-col items-center gap-4 animate-fade-in bg-black/60 p-8 rounded-xl border border-stone-700 backdrop-blur-sm">
            <h2 className="text-stone-200 font-serif text-xl">Acceso Restringido</h2>
            <input
              type="password"
              className="w-64 bg-stone-900 border border-stone-600 rounded px-4 py-2 text-center text-white focus:outline-none focus:border-red-500"
              placeholder="Introduce la clave"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verificarCodigo()}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-4 mt-2">
              <button className="text-stone-400 hover:text-white text-sm" onClick={() => setFase('inicio')}>Volver</button>
              <button className="text-red-400 hover:text-red-300 text-sm font-bold" onClick={verificarCodigo}>Confirmar</button>
            </div>
          </div>
        )}

        {/* ── FASE 3: SELECCIÓN DE AVATAR (ENFOQUE TOTAL) ── */}
        {fase === 'avatar' && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-serif text-stone-100 mb-12 drop-shadow-[0_2px_10px_rgba(255,0,0,0.5)]">
              Elige tu personaje
            </h2>
            
            {error && <p className="text-red-500 text-lg mb-6 bg-black/50 px-4 py-2 rounded">{error}</p>}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 w-full max-w-5xl">
              {PERSONAJES.map(p => (
                <button
                  key={p.id}
                  disabled={cargando}
                  onClick={() => seleccionarPersonajeYEntrar(p)}
                  className={`
                    relative group overflow-hidden rounded-2xl aspect-square border-2 border-transparent
                    hover:border-red-600 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]
                    ${cargando ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <img
                    src={p.avatar}
                    alt={p.nombre}
                    className="w-full h-full object-cover bg-stone-900"
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                  />
                  <div className="absolute inset-0 bg-stone-800 hidden items-center justify-center text-6xl text-stone-600 font-bold">
                    {p.nombre[0]}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-xl font-bold text-center">{p.nombre}</p>
                    <p className="text-stone-400 text-sm text-center mt-1">{p.descripcion}</p>
                  </div>
                </button>
              ))}
            </div>

            <button 
              className="mt-16 text-stone-500 hover:text-stone-300 uppercase tracking-widest text-sm transition-colors"
              onClick={() => setFase('inicio')}
              disabled={cargando}
            >
              ← Volver al menú
            </button>
          </div>
        )}
      </div>
    </div>
  )
}