// src/components/PantallaLogin.jsx
// ─── Pantalla de Login con Sistema de Contraseña por Personaje ────────────────
// Flujo: inicio → avatar → (registro de contraseña | login) → menu_usuario
// Fondos responsivos: /fondos/fondo.png (PC) / /fondos/fondo2.png (móvil)

import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { PERSONAJES, ADMIN_PASSWORD } from '../constants'

export default function PantallaLogin({ onLogin, onAdminAccess }) {
  // Fases: 'inicio' | 'codigo' | 'avatar' | 'registro' | 'login_clave'
  const [fase, setFase] = useState('inicio')
  const [personajeSeleccionado, setPersonajeSeleccionado] = useState(null)

  const [codigo, setCodigo] = useState('')
  const [clave, setClave] = useState('')
  const [claveConfirm, setClaveConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [cargando, setCargando] = useState(false)

  const resetForm = () => { setClave(''); setClaveConfirm(''); setError(''); setInfo('') }

  // ── Verificar código de admin ─────────────────────────────────────────────
  const verificarCodigo = () => {
    if (codigo.trim() === ADMIN_PASSWORD) {
      localStorage.setItem('higurashi_admin', 'true')
      onAdminAccess()
    } else {
      setError('Código no reconocido por el sistema de Hinamizawa.')
    }
  }

  // ── Clic en un personaje: comprobar si ya tiene contraseña ───────────────
  const seleccionarPersonaje = async (personaje) => {
    setCargando(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('usuarios')
        .select('id, nombre, avatar, password')
        .eq('avatar', personaje.id)
        .maybeSingle()

      if (err) throw err

      setPersonajeSeleccionado({ ...personaje, dbData: data })

      if (!data) {
        // Nunca registrado → flujo de primer registro
        setFase('registro')
      } else if (!data.password) {
        // Existe pero sin contraseña (migración desde v1) → registro
        setFase('registro')
      } else {
        // Ya tiene contraseña → pedir login
        setFase('login_clave')
      }
    } catch (e) {
      setError('Error de conexión. El servidor de Hinamizawa no responde.')
    } finally {
      setCargando(false)
      resetForm()
    }
  }

  // ── Registro: crear personaje con contraseña ──────────────────────────────
  const registrar = async () => {
    if (clave.length < 3) { setError('La contraseña debe tener al menos 3 caracteres.'); return }
    if (clave !== claveConfirm) { setError('Las contraseñas no coinciden.'); return }
    setCargando(true); setError('')

    try {
      const p = personajeSeleccionado
      let usuarioData

      if (p.dbData) {
        // Ya existe en DB (migración), actualizar contraseña
        const { data, error: err } = await supabase
          .from('usuarios')
          .update({ password: clave })
          .eq('id', p.dbData.id)
          .select()
          .single()
        if (err) throw err
        usuarioData = data
      } else {
        // Insertar nuevo
        const { data, error: err } = await supabase
          .from('usuarios')
          .insert({ nombre: p.nombre, avatar: p.id, password: clave })
          .select()
          .single()
        if (err) throw err
        usuarioData = data
      }

      localStorage.setItem('higurashi_sesion', JSON.stringify(usuarioData))
      onLogin(usuarioData)
    } catch (e) {
      setError('Error al guardar. Inténtalo de nuevo.')
      setCargando(false)
    }
  }

  // ── Login: verificar contraseña ───────────────────────────────────────────
  const iniciarSesion = async () => {
    if (!clave) { setError('Introduce tu contraseña.'); return }
    setCargando(true); setError('')

    const dbData = personajeSeleccionado.dbData
    if (clave === dbData.password) {
      localStorage.setItem('higurashi_sesion', JSON.stringify(dbData))
      onLogin(dbData)
    } else {
      setError('Contraseña incorrecta. Las cigarras no te reconocen.')
      setCargando(false)
    }
  }

  const btnVN = "w-72 bg-black/85 border-2 border-stone-200 text-stone-100 rounded-full py-3 font-bold hover:border-red-700 hover:text-red-500 hover:bg-black transition-all uppercase tracking-widest text-sm shadow-[0_4px_15px_rgba(0,0,0,0.6)]"

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed flex flex-col items-center justify-center relative transition-all duration-700">
      {/* ── Fondos responsivos ── */}
      {/* Móvil */}
      <div
        className="absolute inset-0 block md:hidden bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/fondos/fondo2.png')" }}
      />
      {/* PC */}
      <div
        className="absolute inset-0 hidden md:block bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/fondos/fondo.png')" }}
      />

      {/* Overlay oscuro dinámico */}
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 z-0 ${
        fase === 'avatar' ? 'bg-black/85' : 'bg-black/35'
      }`} />

      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center animate-fade-in">

        {/* ── LOGO (solo móvil, fuera de la fase avatar) ── */}
        {fase !== 'avatar' && fase !== 'registro' && fase !== 'login_clave' && (
          <div className="text-center mb-16 select-none block md:hidden">
            <h1 className="font-serif text-5xl text-white font-bold tracking-wider drop-shadow-[0_5px_5px_rgba(0,0,0,1)]">
              Higurashi <span className="text-red-600">N</span>o{' '}
              <span className="text-red-600">N</span>aku Koro Ni
            </h1>
            <p className="text-white mt-2 font-serif text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
              Watanagashi Festival
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* FASE 1: MENÚ PRINCIPAL                                            */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {fase === 'inicio' && (
          <div className="flex flex-col gap-4 items-center animate-slide-up mt-20 md:mt-96">
            <button className={btnVN} onClick={() => setFase('avatar')}>
              Iniciar Pedido
            </button>
            <button className={btnVN} onClick={() => {}}>
              Música de Fondo
            </button>
            <button
              className={btnVN}
              onClick={() => { setFase('codigo'); setCodigo(''); setError('') }}
            >
              Introducir Código
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* FASE 2: CÓDIGO SECRETO                                            */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {fase === 'codigo' && (
          <div className="flex flex-col items-center gap-4 animate-fade-in bg-black/70 p-8 rounded-2xl border border-stone-700 backdrop-blur-sm w-full max-w-sm">
            <h2 className="text-stone-200 font-serif text-xl tracking-wide">Acceso Restringido</h2>
            <p className="text-stone-500 text-sm text-center">Solo el organizador conoce esta clave.</p>
            <input
              type="password"
              className="w-full bg-stone-900 border border-stone-600 rounded-lg px-4 py-2.5 text-center text-white focus:outline-none focus:border-red-500 transition-colors"
              placeholder="Introduce la clave"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verificarCodigo()}
              autoFocus
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <div className="flex gap-6 mt-1">
              <button className="text-stone-500 hover:text-stone-300 text-sm transition-colors" onClick={() => { setFase('inicio'); setError('') }}>
                ← Volver
              </button>
              <button
                className="text-red-400 hover:text-red-300 text-sm font-bold transition-colors"
                onClick={verificarCodigo}
              >
                Confirmar
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* FASE 3: SELECCIÓN DE AVATAR                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {fase === 'avatar' && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-serif text-stone-100 mb-3 drop-shadow-[0_2px_10px_rgba(255,0,0,0.5)] text-center">
              Elige tu personaje
            </h2>
            <p className="text-stone-400 text-sm mb-10 text-center">
              Si es tu primera vez, crearás una contraseña exclusiva para tu personaje.
            </p>

            {error && (
              <p className="text-red-400 text-base mb-6 bg-black/60 px-4 py-2 rounded-lg border border-red-900/40">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8 w-full max-w-4xl">
              {PERSONAJES.map((p) => (
                <button
                  key={p.id}
                  disabled={cargando}
                  onClick={() => seleccionarPersonaje(p)}
                  className={`
                    relative group overflow-hidden rounded-2xl aspect-square border-2 border-transparent
                    hover:border-red-600 transition-all duration-300 hover:scale-105
                    hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]
                    ${cargando ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <img
                    src={p.avatar}
                    alt={p.nombre}
                    className="w-full h-full object-cover bg-stone-900"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                  />
                  <div className="absolute inset-0 bg-stone-800 hidden items-center justify-center text-6xl text-stone-600 font-bold">
                    {p.nombre[0]}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-lg font-bold text-center leading-tight">{p.nombre}</p>
                    <p className="text-stone-400 text-xs text-center mt-0.5">{p.descripcion}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              className="mt-12 text-stone-500 hover:text-stone-300 uppercase tracking-widest text-sm transition-colors"
              onClick={() => setFase('inicio')}
              disabled={cargando}
            >
              ← Volver al menú
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* FASE 4: PRIMER REGISTRO — crear contraseña                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {fase === 'registro' && personajeSeleccionado && (
          <div className="flex flex-col items-center gap-5 animate-fade-in bg-black/80 p-8 rounded-2xl border border-stone-700 backdrop-blur-sm w-full max-w-sm">
            {/* Avatar + nombre */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-stone-600 bg-stone-800">
                <img
                  src={personajeSeleccionado.avatar}
                  alt={personajeSeleccionado.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
              <div className="text-center">
                <h2 className="text-stone-100 font-serif text-xl">{personajeSeleccionado.nombre}</h2>
                <p className="text-stone-500 text-xs mt-1">Primera vez en Hinamizawa</p>
              </div>
            </div>

            <div className="w-full border-t border-stone-800" />

            <p className="text-stone-400 text-sm text-center leading-relaxed">
              Crea una contraseña exclusiva para este personaje. Solo tú podrás acceder como{' '}
              <span className={`font-semibold ${personajeSeleccionado.textColor}`}>
                {personajeSeleccionado.nombre}
              </span>.
            </p>

            <div className="w-full space-y-3">
              <input
                type="password"
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-center text-white focus:outline-none focus:border-amber-600 transition-colors placeholder-stone-600"
                placeholder="Tu contraseña"
                value={clave}
                onChange={(e) => { setClave(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && registrar()}
                autoFocus
              />
              <input
                type="password"
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-center text-white focus:outline-none focus:border-amber-600 transition-colors placeholder-stone-600"
                placeholder="Confirmar contraseña"
                value={claveConfirm}
                onChange={(e) => { setClaveConfirm(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && registrar()}
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              className="w-full py-3 bg-gradient-to-r from-amber-900 to-orange-800 hover:from-amber-800 hover:to-orange-700 text-stone-100 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-amber-700/40"
              onClick={registrar}
              disabled={cargando}
            >
              {cargando ? 'Registrando...' : 'Unirme al Festival'}
            </button>

            <button
              className="text-stone-500 hover:text-stone-300 text-sm transition-colors"
              onClick={() => { setFase('avatar'); resetForm() }}
              disabled={cargando}
            >
              ← Elegir otro personaje
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* FASE 5: LOGIN CON CONTRASEÑA EXISTENTE                            */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {fase === 'login_clave' && personajeSeleccionado && (
          <div className="flex flex-col items-center gap-5 animate-fade-in bg-black/80 p-8 rounded-2xl border border-stone-700 backdrop-blur-sm w-full max-w-sm">
            {/* Avatar + nombre */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-red-900/60 bg-stone-800 ring-2 ring-red-800/30">
                <img
                  src={personajeSeleccionado.avatar}
                  alt={personajeSeleccionado.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
              <div className="text-center">
                <h2 className="text-stone-100 font-serif text-xl">{personajeSeleccionado.nombre}</h2>
                <p className="text-stone-500 text-xs mt-1">Personaje ya registrado</p>
              </div>
            </div>

            <div className="w-full border-t border-stone-800" />

            <p className="text-stone-400 text-sm text-center">
              Las cigarras te recuerdan. Introduce tu contraseña para continuar.
            </p>

            <input
              type="password"
              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-center text-white focus:outline-none focus:border-red-600 transition-colors placeholder-stone-600"
              placeholder="Tu contraseña"
              value={clave}
              onChange={(e) => { setClave(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && iniciarSesion()}
              autoFocus
            />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              className="w-full py-3 bg-gradient-to-r from-red-900 to-rose-800 hover:from-red-800 hover:to-rose-700 text-stone-100 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 border border-red-700/40"
              onClick={iniciarSesion}
              disabled={cargando}
            >
              {cargando ? 'Comprobando...' : 'Entrar al Festival'}
            </button>

            <button
              className="text-stone-500 hover:text-stone-300 text-sm transition-colors"
              onClick={() => { setFase('avatar'); resetForm() }}
              disabled={cargando}
            >
              ← Elegir otro personaje
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
