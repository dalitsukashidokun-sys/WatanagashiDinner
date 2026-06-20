// src/components/PantallaLogin.jsx
// ─── Login con contraseña por personaje ───────────────────────────────────────
// Flujo: inicio → avatar → (primer registro | login) → app

import { useState } from 'react'
import { supabase }              from '../supabaseClient'
import { PERSONAJES, ADMIN_PASSWORD } from '../constants'
import { useMusica } from '../context/MusicaContext'

export default function PantallaLogin({ onLogin, onAdminAccess }) {
  const [fase,     setFase]     = useState('inicio')  // 'inicio'|'codigo'|'avatar'|'registro'|'clave'
  const [pjeSel,  setPjeSel]   = useState(null)        // personaje seleccionado
  const [codigo,  setCodigo]   = useState('')
  const [clave,   setClave]    = useState('')
  const [confirm, setConfirm]  = useState('')
  const [error,   setError]    = useState('')
  const [ok,      setOk]       = useState('')
  const [busy,    setBusy]     = useState(false)
  const { reproduciendo, togglePlay, pistaActual } = useMusica()

  const limpiar = () => { setClave(''); setConfirm(''); setError(''); setOk('') }

  // ── Código de admin ───────────────────────────────────────────────────────
  const verificarCodigo = () => {
    if (codigo.trim() === ADMIN_PASSWORD) {
      localStorage.setItem('higurashi_admin', 'true')
      onAdminAccess()
    } else {
      setError('El código no es correcto.')
    }
  }

  // ── Seleccionar personaje ─────────────────────────────────────────────────
  const seleccionarPersonaje = async (p) => {
    setBusy(true); setError('')
    const { data } = await supabase
      .from('usuarios').select('id,nombre,avatar,password').eq('avatar', p.id).maybeSingle()
    setBusy(false)
    setPjeSel({ ...p, dbData: data })

    if (!data || !data.password) {
      setFase('registro')
    } else {
      setFase('clave')
    }
    limpiar()
  }

  // ── Primer registro ───────────────────────────────────────────────────────
  const registrar = async () => {
    if (clave.length < 3)    return setError('La contraseña debe tener al menos 3 caracteres.')
    if (clave !== confirm)   return setError('Las contraseñas no coinciden.')
    setBusy(true); setError('')

    let usuarioData
    if (pjeSel.dbData) {
      const { data, error: e } = await supabase.from('usuarios')
        .update({ password: clave }).eq('id', pjeSel.dbData.id).select().single()
      if (e) { setBusy(false); return setError('Error al guardar.') }
      usuarioData = data
    } else {
      const { data, error: e } = await supabase.from('usuarios')
        .insert({ nombre: pjeSel.nombre, avatar: pjeSel.id, password: clave }).select().single()
      if (e) { setBusy(false); return setError('Error al guardar.') }
      usuarioData = data
    }

    localStorage.setItem('higurashi_sesion', JSON.stringify(usuarioData))
    onLogin(usuarioData)
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  const iniciarSesion = async () => {
    if (!clave) return setError('Introduce tu contraseña.')
    setBusy(true); setError('')

    if (clave === pjeSel.dbData.password) {
      localStorage.setItem('higurashi_sesion', JSON.stringify(pjeSel.dbData))
      onLogin(pjeSel.dbData)
    } else {
      setBusy(false)
      setError('Contraseña incorrecta. Las cigarras no te reconocen.')
    }
  }

  const btnVN = "w-72 bg-black/85 border-2 border-stone-200 text-stone-100 rounded-full py-3 font-bold hover:border-red-700 hover:text-red-500 hover:bg-black transition-all uppercase tracking-widest text-sm shadow-[0_4px_15px_rgba(0,0,0,0.6)]"

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed flex flex-col items-center justify-center relative">
      {/* Fondos responsivos */}
      <div className="absolute inset-0 block md:hidden bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/fondos/fondo2.png')" }} />
      <div className="absolute inset-0 hidden md:block bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/fondos/fondo.png')" }} />
      <div className={`absolute inset-0 transition-colors duration-700 pointer-events-none ${
        fase === 'avatar' || fase === 'registro' || fase === 'clave' ? 'bg-black/85' : 'bg-black/35'
      }`} />

      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center animate-fade-in">

        {/* Logo mobile */}
        {fase === 'inicio' && (
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

        {/* ── INICIO ── */}
        {fase === 'inicio' && (
          <div className="flex flex-col gap-4 items-center animate-slide-up mt-20 md:mt-96">
            <button className={btnVN} onClick={() => setFase('avatar')}>Iniciar Pedido</button>
            <button
              className={`${btnVN} flex items-center justify-center gap-2 ${reproduciendo ? '!border-red-700 !text-red-500' : ''}`}
              onClick={onAbrirMusica}
              title={pistaActual?.titulo}
            >
              <span className={reproduciendo ? 'animate-pulse' : ''}>{reproduciendo ? '⏸' : '▶'}</span>
              Música de Fondo
            </button>
            <button className={btnVN} onClick={() => { setFase('codigo'); setCodigo(''); setError('') }}>
              Introducir Código
            </button>
          </div>
     )}
        {/* ── CÓDIGO ADMIN ── */}
        {fase === 'codigo' && (
          <div className="card-dark p-8 flex flex-col items-center gap-4 w-full max-w-sm animate-fade-in">
            <h2 className="text-stone-200 font-serif text-xl">Acceso Restringido</h2>
            <p className="text-stone-500 text-sm text-center">Solo el organizador conoce esta clave.</p>
            <input type="password" autoFocus
              className="input-dark text-center"
              placeholder="Código secreto"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verificarCodigo()}
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-6 mt-1">
              <button className="btn-ghost text-sm" onClick={() => { setFase('inicio'); setError('') }}>← Volver</button>
              <button className="text-red-400 hover:text-red-300 text-sm font-bold transition-colors" onClick={verificarCodigo}>
                Confirmar
              </button>
            </div>
          </div>
        )}

        {/* ── SELECCIÓN DE AVATAR ── */}
        {fase === 'avatar' && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-serif text-stone-100 mb-3 drop-shadow-[0_2px_10px_rgba(255,0,0,0.5)] text-center">
              Elige tu personaje
            </h2>
            <p className="text-stone-400 text-sm mb-10 text-center">
              Si es tu primera vez, crearás una contraseña propia.
            </p>
            {error && (
              <div className="mb-6 px-4 py-2 bg-red-950/50 border border-red-800/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8 w-full max-w-4xl">
              {PERSONAJES.map(p => (
                <button key={p.id} disabled={busy}
                  onClick={() => seleccionarPersonaje(p)}
                  className={`relative group overflow-hidden rounded-2xl aspect-square border-2 border-transparent
                    hover:border-red-600 transition-all duration-300 hover:scale-105
                    hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]
                    ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <img src={p.avatar} alt={p.nombre}
                    className="w-full h-full object-cover bg-stone-900"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                  <div className="absolute inset-0 bg-stone-800 hidden items-center justify-center text-5xl font-bold text-stone-600">
                    {p.nombre[0]}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4
                    translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-lg font-bold text-center leading-tight">{p.nombre}</p>
                    <p className="text-stone-400 text-xs text-center mt-0.5">{p.descripcion}</p>
                  </div>
                </button>
              ))}
            </div>
            <button className="mt-12 text-stone-500 hover:text-stone-300 uppercase tracking-widest text-sm transition-colors"
              onClick={() => setFase('inicio')} disabled={busy}>
              ← Volver al menú
            </button>
          </div>
        )}

        {/* ── PRIMER REGISTRO ── */}
        {fase === 'registro' && pjeSel && (
          <div className="card-dark p-8 flex flex-col items-center gap-5 w-full max-w-sm animate-fade-in">
            <div className="flex flex-col items-center gap-3">
              <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${pjeSel.borderColor} bg-stone-800`}>
                <img src={pjeSel.avatar} alt={pjeSel.nombre} className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }} />
              </div>
              <div className="text-center">
                <h2 className={`font-serif text-xl ${pjeSel.textColor}`}>{pjeSel.nombre}</h2>
                <p className="text-stone-500 text-xs mt-0.5">Primera vez en Hinamizawa</p>
              </div>
            </div>
            <div className="w-full border-t border-stone-800" />
            <p className="text-stone-400 text-sm text-center leading-relaxed">
              Crea una contraseña exclusiva para tu personaje.
              Solo tú podrás acceder como{' '}
              <span className={`font-semibold ${pjeSel.textColor}`}>{pjeSel.nombre}</span>.
            </p>
            <div className="w-full space-y-3">
              <input type="password" autoFocus className="input-dark text-center"
                placeholder="Contraseña"
                value={clave} onChange={e => { setClave(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && registrar()} />
              <input type="password" className="input-dark text-center"
                placeholder="Confirmar contraseña"
                value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && registrar()} />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={registrar} disabled={busy}
              className={`w-full py-3 bg-gradient-to-r from-amber-900 to-orange-800 hover:from-amber-800
                hover:to-orange-700 text-stone-100 font-bold rounded-xl transition-all active:scale-95
                disabled:opacity-50 border border-amber-700/40`}>
              {busy ? 'Registrando...' : 'Unirme al Festival'}
            </button>
            <button className="text-stone-500 hover:text-stone-300 text-sm transition-colors"
              onClick={() => { setFase('avatar'); limpiar() }} disabled={busy}>
              ← Elegir otro personaje
            </button>
          </div>
        )}

        {/* ── LOGIN ── */}
        {fase === 'clave' && pjeSel && (
          <div className="card-dark p-8 flex flex-col items-center gap-5 w-full max-w-sm animate-fade-in">
            <div className="flex flex-col items-center gap-3">
              <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ring-2 ring-red-800/30
                ${pjeSel.borderColor} bg-stone-800`}>
                <img src={pjeSel.avatar} alt={pjeSel.nombre} className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }} />
              </div>
              <div className="text-center">
                <h2 className={`font-serif text-xl ${pjeSel.textColor}`}>{pjeSel.nombre}</h2>
                <p className="text-stone-500 text-xs mt-0.5">Las cigarras te recuerdan</p>
              </div>
            </div>
            <div className="w-full border-t border-stone-800" />
            <input type="password" autoFocus className="input-dark text-center"
              placeholder="Tu contraseña"
              value={clave} onChange={e => { setClave(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && iniciarSesion()} />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={iniciarSesion} disabled={busy}
              className="w-full py-3 bg-gradient-to-r from-red-900 to-rose-800 hover:from-red-800
                hover:to-rose-700 text-stone-100 font-bold rounded-xl transition-all active:scale-95
                disabled:opacity-50 border border-red-700/40">
              {busy ? 'Comprobando...' : 'Entrar al Festival'}
            </button>
            <button className="text-stone-500 hover:text-stone-300 text-sm transition-colors"
              onClick={() => { setFase('avatar'); limpiar() }} disabled={busy}>
              ← Elegir otro personaje
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
