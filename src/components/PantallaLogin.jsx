// src/components/PantallaLogin.jsx
// ─── Pantalla de Login: Selección de Personaje ────────────────────────────────

import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { PERSONAJES, ADMIN_PASSWORD, VISTAS } from '../constants'

/**
 * @param {Function} onLogin       - Callback cuando el usuario confirma su personaje
 * @param {Function} onAdminAccess - Callback cuando se accede como administrador
 */
export default function PantallaLogin({ onLogin, onAdminAccess }) {
  const [nombre,          setNombre]          = useState('')
  const [personajeId,     setPersonajeId]     = useState('keiichi')
  const [cargando,        setCargando]        = useState(false)
  const [error,           setError]           = useState('')
  const [modoAdmin,       setModoAdmin]       = useState(false)
  const [claveAdmin,      setClaveAdmin]      = useState('')
  const [errorAdmin,      setErrorAdmin]      = useState('')

  // ── Confirmar personaje y crear usuario en Supabase ──────────────────────
  async function handleConfirmar() {
    if (!nombre.trim()) {
      setError('Escribe tu nombre para continuar')
      return
    }
    if (nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }

    setCargando(true)
    setError('')

    try {
      // Insertar usuario en Supabase y devolver el registro creado
      const { data, error: err } = await supabase
        .from('usuarios')
        .insert({ nombre: nombre.trim(), avatar: personajeId })
        .select()
        .single()

      if (err) throw err

      // Guardar en localStorage para persistencia de sesión local
      localStorage.setItem('higurashi_sesion', JSON.stringify(data))
      onLogin(data)
    } catch (e) {
      setError('Error al conectar con Supabase. Verifica las credenciales en .env.local')
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  // ── Verificar contraseña de administrador ─────────────────────────────────
  function handleAdminLogin() {
    if (claveAdmin === ADMIN_PASSWORD) {
      localStorage.setItem('higurashi_admin', 'true')
      onAdminAccess()
    } else {
      setErrorAdmin('Contraseña incorrecta. Inténtalo de nuevo.')
      setClaveAdmin('')
    }
  }

  const personajeActual = PERSONAJES.find((p) => p.id === personajeId)

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 animate-fade-in">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-950/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-950/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Encabezado temático */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 animate-pulse-slow">⛩️</div>
          <h1 className="font-serif text-3xl text-gradient-red mb-1 tracking-wide">
            Hinamizawa
          </h1>
          <p className="text-slate-500 text-sm">
            Cena Temática · Festival Watanagashi
          </p>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-red-900 to-transparent" />
        </div>

        {/* ── Formulario principal ── */}
        {!modoAdmin ? (
          <div className="card-dark p-6 glow-red space-y-6">
            <div>
              <p className="text-slate-400 text-sm text-center leading-relaxed mb-6">
                Elige tu personaje e introduce tu nombre.<br />
                <span className="text-red-400 text-xs">Oyashiro-sama te observa.</span>
              </p>

              {/* Input nombre */}
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                Tu nombre
              </label>
              <input
                type="text"
                className="input-dark"
                placeholder="¿Quién eres esta noche?"
                value={nombre}
                maxLength={30}
                onChange={(e) => { setNombre(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmar()}
              />
              {error && (
                <p className="mt-1.5 text-rose-400 text-xs">{error}</p>
              )}
            </div>

            {/* Grid de personajes */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">
                Elige tu personaje
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PERSONAJES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPersonajeId(p.id)}
                    className={`
                      relative flex flex-col items-center gap-1 p-2.5 rounded-xl border
                      bg-gradient-to-b transition-all duration-200 active:scale-95
                      ${personajeId === p.id
                        ? `${p.color} ${p.borderColor} ring-1 ring-offset-1 ring-offset-slate-900 ${p.borderColor.replace('border-', 'ring-')}`
                        : 'from-slate-900 to-slate-900 border-slate-800 hover:border-slate-600'
                      }
                    `}
                    title={p.nombre}
                  >
                    <span className="text-2xl leading-none">{p.emoji}</span>
                    <span className={`text-[10px] font-medium leading-tight text-center
                      ${personajeId === p.id ? p.textColor : 'text-slate-500'}`}>
                      {p.nombre.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Descripción del personaje seleccionado */}
              {personajeActual && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg p-2.5">
                  <span className="text-base">{personajeActual.emoji}</span>
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

            {/* Botón confirmar */}
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

            {/* Acceso admin */}
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
          /* ── Panel de acceso admin ── */
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
                onChange={(e) => { setClaveAdmin(e.target.value); setErrorAdmin('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                autoFocus
              />
              {errorAdmin && (
                <p className="mt-1.5 text-rose-400 text-xs">{errorAdmin}</p>
              )}
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
