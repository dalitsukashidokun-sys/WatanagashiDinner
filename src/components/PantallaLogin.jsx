// src/components/PantallaLogin.jsx
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { PERSONAJES, ADMIN_PASSWORD } from '../constants'

export default function PantallaLogin({ onLogin, onAdminAccess }) {
  // Fases: 'inicio' | 'codigo' | 'nombre' | 'avatar'
  const [fase, setFase] = useState('inicio')
  
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  // ── Lógica de Códigos Secretos ──
  const verificarCodigo = () => {
    if (codigo === ADMIN_PASSWORD) {
      localStorage.setItem('higurashi_admin', 'true')
      onAdminAccess()
    } else if (codigo === 'MUSICA') {
      // Aquí puedes añadir más adelante la lógica para reproducir audio
      setError('Módulo de música desbloqueado (En desarrollo).')
      setTimeout(() => setFase('inicio'), 2000)
    } else {
      setError('Código no reconocido por el sistema.')
    }
  }

  // ── Transición a Avatares ──
  const avanzarAAvatares = () => {
    if (!nombre.trim() || nombre.trim().length < 2) {
      setError('Debes introducir un nombre válido.')
      return
    }
    setError('')
    setFase('avatar')
  }

  // ── Inserción Final en Base de Datos ──
  const seleccionarPersonajeYEntrar = async (personajeId) => {
    setCargando(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('usuarios')
        .insert({ nombre: nombre.trim(), avatar: personajeId })
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

  // ── Clases CSS Reutilizables ──
  const btnVN = "w-72 bg-black/85 border-2 border-stone-200 text-stone-100 rounded-full py-3 font-bold hover:border-red-700 hover:text-red-500 hover:bg-black transition-all uppercase tracking-widest text-sm shadow-[0_4px_15px_rgba(0,0,0,0.6)]"

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed flex flex-col items-center justify-center relative transition-all duration-700"
      style={{ backgroundImage: "url('/fondos/fondo.png')" }}
    >
      {/* Capa de oscurecimiento dinámica */}
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${fase === 'avatar' ? 'bg-black/85' : 'bg-black/30'}`} />

      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center animate-fade-in">
        
        {/* ── LOGO PRINCIPAL (Siempre visible excepto en selección de avatar) ── */}
        {fase !== 'avatar' && (
          <div className="text-center mb-16 select-none">
            <h1 className="font-serif text-5xl md:text-7xl text-white font-bold tracking-wider drop-shadow-[0_5px_5px_rgba(0,0,0,1)]">
              Higurashi <span className="text-red-600">N</span>o <span className="text-red-600">N</span>aku Koro Ni
            </h1>
            <p className="text-white mt-2 font-serif text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              Watanagashi Festival
            </p>
          </div>
        )}

        {/* ── FASE 1: MENÚ PRINCIPAL TIPO VISUAL NOVEL ── */}
        {fase === 'inicio' && (
          <div className="flex flex-col gap-4 items-center animate-slide-up">
            <button className={btnVN} onClick={() => setFase('nombre')}>
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

        {/* ── FASE 3: INTRODUCIR NOMBRE ── */}
        {fase === 'nombre' && (
          <div className="flex flex-col items-center gap-6 animate-fade-in bg-black/70 p-10 rounded-2xl border border-stone-700/50 backdrop-blur-md shadow-2xl">
            <h2 className="text-stone-200 font-serif text-2xl tracking-wide">¿Cuál es tu nombre?</h2>
            <input
              type="text"
              className="w-80 bg-transparent border-b-2 border-stone-500 text-center text-2xl text-white py-2 focus:outline-none focus:border-red-500 transition-colors"
              placeholder="..."
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && avanzarAAvatares()}
              autoFocus
              maxLength={20}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-6 mt-4">
              <button className="text-stone-500 hover:text-stone-300 transition-colors uppercase tracking-widest text-sm" onClick={() => setFase('inicio')}>
                Cancelar
              </button>
              <button className="text-stone-100 hover:text-red-400 font-bold transition-colors uppercase tracking-widest text-sm" onClick={avanzarAAvatares}>
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* ── FASE 4: SELECCIÓN DE AVATAR (ENFOQUE TOTAL) ── */}
        {fase === 'avatar' && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-serif text-stone-100 mb-12 drop-shadow-[0_2px_10px_rgba(255,0,0,0.5)]">
              Elige tu apariencia, {nombre}
            </h2>
            
            {error && <p className="text-red-500 text-lg mb-6 bg-black/50 px-4 py-2 rounded">{error}</p>}

            {/* Grid gigante de avatares */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 w-full max-w-6xl">
              {PERSONAJES.map(p => (
                <button
                  key={p.id}
                  disabled={cargando}
                  onClick={() => seleccionarPersonajeYEntrar(p.id)}
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
                  {/* Fallback si no hay imagen */}
                  <div className="absolute inset-0 bg-stone-800 hidden items-center justify-center text-6xl text-stone-600 font-bold">
                    {p.nombre[0]}
                  </div>

                  {/* Nombre superpuesto que aparece al pasar el ratón */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-xl font-bold text-center">{p.nombre}</p>
                    <p className="text-stone-400 text-sm text-center mt-1">{p.descripcion}</p>
                  </div>
                </button>
              ))}
            </div>

            <button 
              className="mt-16 text-stone-500 hover:text-stone-300 uppercase tracking-widest text-sm transition-colors"
              onClick={() => setFase('nombre')}
              disabled={cargando}
            >
              ← Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}