// src/components/PantallaLogin.jsx
// ─── Pantalla de Login: Selección de Personaje ────────────────────────────────
// Fondo: /fondos/fondo.jpg (bg-cover bg-center bg-fixed) + capa oscura bg-black/60

import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { PERSONAJES, ADMIN_PASSWORD } from '../constants'

export default function PantallaLogin({ onLogin, onAdminAccess }) {
  const [nombre,     setNombre]     = useState('')
  const [personajeId,setPersonajeId]= useState('keiichi')
  const [cargando,   setCargando]   = useState(false)
  const [error,      setError]      = useState('')
  const [modoAdmin,  setModoAdmin]  = useState(false)
  const [claveAdmin, setClaveAdmin] = useState('')
  const [errorAdmin, setErrorAdmin] = useState('')

  // ── Crear usuario en Supabase y persistir sesión ──────────────────────────
  async function handleConfirmar() {
    if (!nombre.trim() || nombre.trim().length < 2) {
      setError('Escribe tu nombre (mínimo 2 caracteres)')
      return
    }
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
      setError('Error al conectar con Supabase. Verifica las credenciales en .env.local')
    } finally {
      setCargando(false)
    }
  }

  // ── Verificar contraseña admin ────────────────────────────────────────────
  function handleAdminLogin() {
    if (claveAdmin === ADMIN_PASSWORD) {
      localStorage.setItem('higurashi_admin', 'true')
      onAdminAccess()
    } else {
      setErrorAdmin('Contraseña incorrecta.')
      setClaveAdmin('')
    }
  }

  const personajeActual = PERSONAJES.find(p => p.id === personajeId)

  return (
    // ── Fondo estático desde /fondos/fondo.jpg ────────────────────────────
    <div
      className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center px-4 py-12"
      style={{ backgroundImage: "url('/fondos/fondo.jpg')" }}
    >
      {/* Capa oscura sobre el fondo para legibilidad */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      <div className="relative w-full max-w-lg animate-fade-in">
        {/* ── Encabezado temático ── */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 animate-pulse-slow">⛩️</div>
          <h1 className="font-serif text-3xl text-gradient-red mb-1 tracking-wide">
            Hinamizawa
          </h1>
          <p className="text-slate-400 text-sm">
            Cena Temática · Festival Watanagashi
          </p>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-red-900 to-transparent" />
        </div>

        {!modoAdmin ? (
          <div className="card-dark p-6 glow-sunset space-y-6">
            <p className="text-slate-400 text-sm text-center leading-relaxed">
              Elige tu personaje e introduce tu nombre.<br />
              <span className="text-red-400 text-xs">Oyashiro-sama te observa.</span>
            </p>

            {/* Input nombre */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                Tu nombre
              </label>
              <input
                type="text"
                className="input-dark"
                placeholder="¿Quién eres esta noche?"
                value={nombre}
                maxLength={30}
                onChange={e => { setNombre(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleConfirmar()}
              />
              {error && <p className="mt-1.5 text-rose-400 text-xs">{error}</p>}
            </div>

            {/* ── Grid de avatares con imágenes locales ── */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">
                Elige tu personaje
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PERSONAJES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPersonajeId(p.id)}
                    title={p.nombre}
                    className={`
                      flex flex-col items-center gap-1.5 p-2 rounded-xl border
                      bg-gradient-to-b transition-all duration-200 active:scale-95
                      ${personajeId === p.id
                        ? `${p.color} ${p.borderColor} ring-1 ring-offset-1 ring-offset-slate-900 ${p.borderColor.replace('border-','ring-')}`
                        : 'from-slate-900 to-slate-900 border-slate-800 hover:border-slate-600'
                      }
                    `}
                  >
                    {/* Imagen del personaje — fallback al inicial si no carga */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <img
                        src={p.avatar}
                        alt={p.nombre}
                        className="w-full h-full object-cover"
                        onError={e => {
                          // Si la imagen no existe, muestra la inicial del personaje
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                      {/* Fallback: inicial mientras no haya imagen */}
                      <span
                        className={`text-lg font-bold hidden ${p.textColor}`}
                        style={{ display: 'none' }}
                      >
                        {p.nombre[0]}
                      </span>
                    </div>
                    <span className={`text-[10px] font-medium leading-tight text-center
                      ${personajeId === p.id ? p.textColor : 'text-slate-500'}`}>
                      {p.nombre.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Descripción del personaje seleccionado */}
              {personajeActual && (
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500
                  bg-slate-800/50 rounded-lg p-2.5">
                  <div className="w-8 h-8 rounded overflow-hidden bg-slate-700 shrink-0">
                    <img
                      src={personajeActual.avatar}
                      alt={personajeActual.nombre}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display='none' }}
                    />
                  </div>
                  <div>
                    <span className={`font-medium ${personajeActual.textColor}`}>
                      {personajeActual.nombre}
                    </span>
                    <span className="text-slate-600 mx-1.5">·</span>
                    <span>{personajeActual.descripcion}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              className="btn-primary w-full text-base"
              onClick={handleConfirmar}
              disabled={cargando}
            >
              {cargando
                ? 'Entrando al pueblo...'
                : `Entrar como ${nombre || personajeActual?.nombre.split(' ')[0] || '...'}`
              }
            </button>

            <div className="text-center pt-1">
              <button
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                onClick={() => setModoAdmin(true)}
              >
                ¿Eres el organizador?
              </button>
            </div>
          </div>
        ) : (
          /* ── Acceso admin ── */
          <div className="card-dark p-6 space-y-4 animate-slide-up">
            <div className="text-center">
              <div className="text-3xl mb-2">🔐</div>
              <h2 className="font-serif text-lg text-slate-200">Panel de Control</h2>
              <p className="text-xs text-slate-500 mt-1">Acceso restringido a organizadores</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <input
                type="password"
                className="input-dark"
                placeholder="Contraseña de administrador"
                value={claveAdmin}
                onChange={e => { setClaveAdmin(e.target.value); setErrorAdmin('') }}
                onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                autoFocus
              />
              {errorAdmin && <p className="mt-1.5 text-rose-400 text-xs">{errorAdmin}</p>}
            </div>
            <button className="btn-primary w-full" onClick={handleAdminLogin}>
              Acceder
            </button>
            <button
              className="btn-ghost w-full text-sm"
              onClick={() => { setModoAdmin(false); setClaveAdmin(''); setErrorAdmin('') }}
            >
              ← Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
