// src/components/PanelAdmin.jsx
// ─── Panel de Administrador v2: Comanda + Control del Juego ──────────────────

import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Users, Utensils, Radio,
  Swords, Sun, Moon, Vote, Trophy, RefreshCw,
  Eye, EyeOff, Lock, Unlock, Skull, ScrollText,
} from 'lucide-react'
import { PERSONAJES } from '../constants'
import { useJuego } from '../hooks/useJuego'

export default function PanelAdmin({ comandas, cargando, totalPlatos, rtActivo }) {
  const [tab, setTab] = useState('comanda')

  return (
    /* MODIFICADO: Se añaden fondos responsivos, bg-cover, bg-center y un padding/p-4 opcional para que respire el fondo */
    <div className="animate-fade-in space-y-4 bg-[url('/bgj_movil.jpg')] md:bg-[url('/fondos/bgj_pc.png')] bg-cover bg-center p-4 rounded-2xl">

      {/* ── Cabecera ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-xl text-white">Panel de Control</h2>
          <p className="text-stone-500 text-sm mt-0.5">Organizador del Festival Watanagashi</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium
          transition-all duration-300 ${rtActivo
            ? 'bg-emerald-950/50 border-emerald-800/50 text-emerald-400'
            : 'bg-stone-900 border-stone-800 text-stone-500'}`}>
          <Radio size={12} className={rtActivo ? 'animate-pulse' : ''} />
          {rtActivo ? 'Recibiendo cambios' : 'En directo'}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-stone-800">
        <TabBtn id="comanda" activo={tab} label="Comanda" icono={<Utensils size={14} />} onClick={setTab} />
        <TabBtn id="juego"   activo={tab} label="Juego"   icono={<Swords size={14} />}  onClick={setTab} accentColor="red" />
      </div>

      {tab === 'comanda' && (
        <SeccionComanda comandas={comandas} cargando={cargando} totalPlatos={totalPlatos} />
      )}
      {tab === 'juego' && <SeccionJuego />}
    </div>
  )
}

function TabBtn({ id, activo, label, icono, onClick, accentColor = 'amber' }) {
  const isActivo = activo === id
  const clr = {
    amber: isActivo ? 'border-amber-600 text-amber-400 bg-amber-950/20' : '',
    red:   isActivo ? 'border-red-700 text-red-400 bg-red-950/20' : '',
  }
  return (
    <button onClick={() => onClick(id)}
      className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all
        ${isActivo ? clr[accentColor] : 'border-transparent text-stone-500 hover:text-stone-300'}`}>
      {icono} {label}
    </button>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// SECCIÓN COMANDA
// ──────────────────────────────────────────────────────────────────────────────
function SeccionComanda({ comandas, cargando, totalPlatos }) {
  const [desplegados, setDesplegados] = useState(new Set())

  const toggleUsuario = (uid) =>
    setDesplegados(prev => { const s = new Set(prev); s.has(uid) ? s.delete(uid) : s.add(uid); return s })

  const porUsuario = comandas.reduce((acc, item) => {
    const uid = item.usuarios?.id; if (!uid) return acc
    if (!acc[uid]) acc[uid] = { usuario: item.usuarios, items: [], totalUnidades: 0 }
    acc[uid].items.push(item); acc[uid].totalUnidades += item.cantidad
    return acc
  }, {})

  const filas = Object.values(porUsuario)
  const ranking = Object.entries(
    comandas.reduce((acc, c) => { const n = c.platos?.nombre || '?'; acc[n] = (acc[n] || 0) + c.cantidad; return acc }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxR = ranking[0]?.[1] || 1

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <MetricaCard icono={<Utensils size={20} />} label="Total platos" valor={totalPlatos}
          sufijo={totalPlatos === 1 ? 'plato' : 'platos'} color="text-red-400" bg="bg-red-950/30" border="border-red-900/50" />
        <MetricaCard icono={<Users size={20} />} label="Comensales" valor={filas.length}
          sufijo={filas.length === 1 ? 'comensal' : 'comensales'} color="text-blue-400" bg="bg-blue-950/30" border="border-blue-900/50" />
      </div>

      {ranking.length > 0 && (
        <div className="card-dark p-5">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-4">🏆 Más pedidos</h3>
          <div className="space-y-3">
            {ranking.map(([nombre, qty], i) => (
              <div key={nombre} className="flex items-center gap-3">
                <span className="text-xs text-stone-600 font-mono w-4 text-right shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-stone-300 truncate">{nombre}</span>
                    <span className="text-sm font-bold text-red-300 tabular-nums ml-2">×{qty}</span>
                  </div>
                  <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-900 to-red-600 rounded-full transition-all duration-500"
                      style={{ width: `${(qty / maxR) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">👥 Comanda por comensal</h3>
        {cargando ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="card-dark h-14 animate-pulse" />)}</div>
        ) : filas.length === 0 ? (
          <div className="card-dark p-10 text-center text-stone-500 text-sm">Sin pedidos aún.</div>
        ) : (
          <div className="space-y-2">
            {filas.map(({ usuario, items, totalUnidades }) => {
              const abierto = desplegados.has(usuario.id)
              const p = PERSONAJES.find(x => x.id === usuario.avatar)
              return (
                <div key={usuario.id} className="card-dark overflow-hidden">
                  <button
                    className={`w-full flex items-center justify-between px-4 py-3
                      bg-gradient-to-r hover:brightness-110 transition-all
                      ${p?.color || 'from-stone-800/40 to-stone-800/20'}`}
                    onClick={() => toggleUsuario(usuario.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-stone-800 border border-stone-700/50 shrink-0">
                        <img src={p?.avatar} alt={usuario.nombre} className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none' }} />
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${p?.textColor || 'text-stone-300'}`}>{usuario.nombre}</p>
                        <p className="text-xs text-stone-500">{totalUnidades} platos · {items.length} tipos</p>
                      </div>
                    </div>
                    {abierto ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                  </button>
                  {abierto && (
                    <div className="divide-y divide-stone-800/60 animate-slide-up">
                      {items.map(item => {
                        const plato = item.platos; if (!plato) return null
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                            {plato.imagen_url && (
                              <img src={plato.imagen_url} alt={plato.nombre}
                                className="w-8 h-8 rounded-md object-cover border border-stone-800 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-stone-200 truncate">{plato.nombre}</p>
                              {item.nota && <p className="text-xs text-amber-500/70 truncate">📝 {item.nota}</p>}
                            </div>
                            <span className="text-sm font-bold text-stone-300 tabular-nums shrink-0">×{item.cantidad}</span>
                          </div>
                        )
                      })}
                      <div className="px-4 py-2 flex justify-between items-center bg-stone-900/50">
                        <span className="text-xs text-stone-600 uppercase tracking-wider">Total</span>
                        <span className="text-sm font-bold text-emerald-400">{totalUnidades} platos</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// SECCIÓN JUEGO
// ──────────────────────────────────────────────────────────────────────────────
function SeccionJuego() {
  const juego = useJuego()
  const {
    estadoJuego, jugadores, votos, acciones, logEventos, cargando,
    asignarRoles, toggleJuegoHabilitado, cambiarFase,
    resetearPassword, procesarVotacion, procesarNoche,
  } = juego

  const [msg,         setMsg]         = useState({ text: '', tipo: 'ok' })
  const [busy,        setBusy]        = useState(false)
  const [verBandos,   setVerBandos]   = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [nuevaPass,   setNuevaPass]   = useState('')
  const [verLog,      setVerLog]      = useState(false)

  const fase      = estadoJuego?.fase_actual ?? 'espera'
  const ronda     = estadoJuego?.ronda_actual ?? 0
  const habilitado = estadoJuego?.juego_habilitado ?? false

  const votosRonda  = votos.filter(v => v.ronda === ronda)
  const accionesRonda = acciones.filter(a => a.ronda === ronda && !a.procesada)

  const feedback = (text, tipo = 'ok') => {
    setMsg({ text, tipo }); setTimeout(() => setMsg({ text: '', tipo: 'ok' }), 5000)
  }

  const exec = async (fn, successMsg) => {
    setBusy(true); setMsg({ text: '', tipo: 'ok' })
    const res = await fn()
    setBusy(false)
    if (res?.error) feedback(`Error: ${typeof res.error === 'string' ? res.error : res.error.message}`, 'error')
    else feedback(successMsg || 'Hecho.')
    return res
  }

  const FASES_CONFIG = {
    espera:     { label: 'En espera', color: 'text-stone-400', bg: 'bg-stone-900/50' },
    dia:        { label: 'Día',       color: 'text-amber-400', bg: 'bg-amber-950/20' },
    votacion:   { label: 'Votación',  color: 'text-orange-400', bg: 'bg-orange-950/20' },
    noche:      { label: 'Noche',     color: 'text-indigo-400', bg: 'bg-indigo-950/20' },
    finalizado: { label: 'Finalizado', color: 'text-emerald-400', bg: 'bg-emerald-950/20' },
  }
  const faseConf = FASES_CONFIG[fase] || FASES_CONFIG.espera

  return (
    <div className="space-y-4">

      {/* Feedback */}
      {msg.text && (
        <div className={`p-3 rounded-xl text-sm border animate-fade-in ${
          msg.tipo === 'error'
            ? 'bg-red-950/40 border-red-800/50 text-red-300'
            : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
        }`}>{msg.text}</div>
      )}

      {/* Estado actual */}
      <div className={`card-dark p-4 ${faseConf.bg}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className={`font-semibold text-lg ${faseConf.color}`}>{faseConf.label}</span>
            {fase !== 'espera' && fase !== 'finalizado' && (
              <span className="text-stone-500 text-sm ml-2">· Ronda {ronda}</span>
            )}
          </div>
          {estadoJuego?.ganador && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              estadoJuego.ganador === 'aldeanos'
                ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40'
                : 'bg-red-900/40 text-red-300 border-red-700/40'
            }`}>
              {estadoJuego.ganador === 'aldeanos' ? '🕊 Victoria Aldeanos' : '🗡 Victoria Asesino'}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-stone-500">
          <span>👥 {jugadores.filter(u => u.vivo).length} vivos / {jugadores.filter(u => !u.vivo).length} muertos</span>
          <span>🗳 {votosRonda.length} votos</span>
          <span>🌙 {accionesRonda.length} acciones nocturnas</span>
        </div>
      </div>

      {/* ── 1. Interruptor maestro ── */}
      <div className="card-dark p-5">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-4">⚡ Interruptor Maestro</h3>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-stone-200 text-sm font-medium">Pantalla del Juego</p>
            <p className="text-stone-500 text-xs mt-0.5">
              {habilitado
                ? 'El botón "Juego" parpadea en rojo para los usuarios.'
                : 'Los usuarios no ven la sección de juego.'}
            </p>
          </div>
          <button 
            onClick={() => exec(toggleJuegoHabilitado, habilitado ? 'Juego desactivado.' : 'Juego activado.')}
            disabled={busy}
            className={`relative flex items-center flex-shrink-0 h-8 w-14 rounded-full transition-colors duration-300 border-2 ${
              habilitado ? 'bg-red-700 border-red-500' : 'bg-stone-800 border-stone-700'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
              habilitado ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* ── 2. Control de fases ── */}
      <div className="card-dark p-5">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-4">🎮 Control de Fases</h3>
        <div className="space-y-2">
          <BtnAccion icon={<RefreshCw size={14} />} label="Asignar Roles (Nueva Partida)"
            desc="Sortea 1 Asesino entre los registrados. Borra rondas anteriores."
            color="amber" disabled={busy}
            onClick={() => exec(asignarRoles, 'Roles asignados. El juego está listo.')} />

          <BtnAccion 
            icon={<Sun size={14} />} 
            label="Iniciar Día"
            desc="Inicia la fase activa del festival."
            color="amber" 
            disabled={busy || fase === 'dia'} 
            onClick={() => exec(() => cambiarFase('dia'), 'Fase de día iniciada.')} 
          />
          <BtnAccion icon={<Vote size={14} />} label="Abrir Votación"
            desc="Aparece el panel de voto en las pantallas de los jugadores vivos."
            color="orange" disabled={busy || fase === 'espera'}
            onClick={() => exec(() => cambiarFase('votacion'), 'Votación abierta.')} />

          <BtnAccion icon={<Skull size={14} />} label={`Procesar Votos (${votosRonda.length} recibidos)`}
            desc="Calcula el más votado, aplica machete de Rena si corresponde."
            color="red" disabled={busy || fase !== 'votacion'}
            onClick={() => exec(procesarVotacion, 'Votación procesada.')} />

          <BtnAccion icon={<Moon size={14} />} label="Iniciar Noche"
            desc="Los jugadores usan sus objetos en secreto."
            color="indigo" disabled={busy || fase === 'espera'}
            onClick={() => exec(() => cambiarFase('noche'), 'Noche iniciada.')} />

          <BtnAccion icon={<Trophy size={14} />} label={`Procesar Noche (${accionesRonda.length} acciones)`}
            desc="Cola: Táser → Protección → Revelación → Rastreo → Asesinato."
            color="violet" disabled={busy || fase !== 'noche'}
            onClick={() => exec(procesarNoche, 'Noche procesada. Nueva ronda.')} />
        </div>
      </div>

      {/* ── 3. Tablero ── */}
      <div className="card-dark p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest">👁 Tablero de Jugadores</h3>
          <button onClick={() => setVerBandos(!verBandos)}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-amber-400 transition-colors">
            {verBandos ? <EyeOff size={12} /> : <Eye size={12} />}
            {verBandos ? 'Ocultar bandos' : 'Ver bandos'}
          </button>
        </div>
        {cargando ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-11 bg-stone-800/50 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {jugadores.map(u => {
              const p = PERSONAJES.find(x => x.id === u.avatar)
              const vRec = votosRonda.filter(v => v.nominado_id === u.avatar)
              const pesoRec = vRec.reduce((s, v) => s + (v.peso || 1), 0)
              const haVotado = votosRonda.some(v => v.votante_id === u.avatar)
              const haActuado = accionesRonda.some(a => a.actor_id === u.avatar)

              return (
                <div key={u.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  u.vivo
                    ? `border-stone-800/50 bg-gradient-to-r ${p?.color || 'from-stone-900/30 to-stone-900/20'}`
                    : 'border-stone-900/30 bg-stone-950/30 opacity-40'
                }`}>
                  <div className={`w-8 h-8 rounded-lg overflow-hidden border ${u.vivo ? 'border-stone-700/50' : 'border-stone-800/30'} shrink-0`}>
                    <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-sm font-medium ${u.vivo ? (p?.textColor || 'text-stone-200') : 'text-stone-600 line-through'}`}>
                        {u.nombre}
                      </span>
                      {!u.vivo && <span className="text-xs text-red-900">☠</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {verBandos && u.bando && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                          u.bando === 'asesino'
                            ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                            : 'bg-emerald-950/40 text-emerald-500 border border-emerald-800/30'
                        }`}>
                          {u.bando === 'asesino' ? '🗡 Asesino' : '🕊 Aldeano'}
                        </span>
                      )}
                      {u.objeto_usado && <span className="text-xs text-stone-600">obj. agotado</span>}
                      {haVotado && <span className="text-xs text-amber-600">✓ votó</span>}
                      {haActuado && <span className="text-xs text-indigo-500">✓ actuó</span>}
                    </div>
                  </div>
                  {pesoRec > 0 && (
                    <div className="text-center shrink-0">
                      <span className="text-xl font-bold text-red-400 tabular-nums">{pesoRec}</span>
                      <p className="text-xs text-stone-600 leading-none">votos</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 4. Gestión de contraseñas ── */}
      <div className="card-dark p-5">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-4">🔐 Credenciales</h3>
        <div className="space-y-2">
          {PERSONAJES.map(p => {
            const uDB = jugadores.find(u => u.avatar === p.id)
            const expandido = resetTarget?.id === uDB?.id

            return (
              <div key={p.id} className={`rounded-xl border overflow-hidden transition-all ${
                expandido ? 'border-amber-800/50' : 'border-stone-800/60'
              }`}>
                <div className="flex items-center justify-between px-3 py-2.5 bg-stone-900/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md overflow-hidden bg-stone-800 shrink-0">
                      <img src={p.avatar} alt={p.nombre} className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none' }} />
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${p.textColor}`}>{p.nombre}</span>
                      <p className="text-xs text-stone-600 mt-0.5">
                        {!uDB ? 'Sin registrar' : !uDB.password ? 'Sin contraseña' : '✓ Registrado'}
                      </p>
                    </div>
                  </div>
                  {uDB && (
                    <button
                      onClick={() => { setResetTarget(expandido ? null : uDB); setNuevaPass('') }}
                      className="flex items-center gap-1 text-xs text-stone-400 hover:text-amber-400 transition-colors px-2 py-1">
                      {expandido ? <Lock size={12} /> : <Unlock size={12} />}
                      {expandido ? 'Cancelar' : 'Restablecer'}
                    </button>
                  )}
                </div>

                {expandido && (
                  <div className="px-3 pb-3 pt-2 bg-stone-950/50 animate-slide-up flex gap-2">
                    <input type="text" autoFocus
                      className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-sm
                        text-white focus:outline-none focus:border-amber-600 placeholder-stone-600 transition-colors"
                      placeholder="Nueva contraseña..."
                      value={nuevaPass}
                      onChange={e => setNuevaPass(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === 'Enter' && nuevaPass.length >= 3) {
                          await exec(() => resetearPassword(resetTarget.id, nuevaPass), 'Contraseña actualizada.')
                          setResetTarget(null)
                        }
                      }}
                    />
                    <button
                      disabled={nuevaPass.length < 3 || busy}
                      onClick={async () => {
                        await exec(() => resetearPassword(resetTarget.id, nuevaPass), 'Contraseña actualizada.')
                        setResetTarget(null)
                      }}
                      className="px-3 py-2 bg-amber-800 hover:bg-amber-700 text-white text-sm
                        font-medium rounded-lg disabled:opacity-40 transition-colors">
                      Guardar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 5. Log completo (admin ve todo) ── */}
      {logEventos.length > 0 && (
        <div className="card-dark overflow-hidden">
          <button
            onClick={() => setVerLog(!verLog)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-800/30 transition-colors">
            <div className="flex items-center gap-2">
              <ScrollText size={14} className="text-stone-500" />
              <span className="text-sm text-stone-400 font-medium">Log completo</span>
              <span className="text-xs bg-stone-800 text-stone-500 px-1.5 py-0.5 rounded-full">
                {logEventos.length}
              </span>
            </div>
            {verLog ? <ChevronUp size={16} className="text-stone-500" /> : <ChevronDown size={16} className="text-stone-500" />}
          </button>
          {verLog && (
            <div className="border-t border-stone-800 divide-y divide-stone-800/60 max-h-72 overflow-y-auto no-scrollbar">
              {logEventos.map(e => (
                <div key={e.id} className={`flex items-start gap-2.5 px-4 py-2.5 ${
                  !e.publica ? 'bg-indigo-950/10' : ''
                }`}>
                  <span className="text-stone-700 text-xs tabular-nums mt-0.5 shrink-0">R{e.ronda}</span>
                  <p className={`text-sm leading-relaxed ${e.publica ? 'text-stone-300' : 'text-indigo-300'}`}>
                    {e.descripcion}
                    {!e.publica && <span className="text-indigo-700 text-xs ml-1">[secreto]</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Shared ──
function BtnAccion({ icon, label, desc, color, disabled, onClick }) {
  const clr = {
    amber:  'border-amber-900/40 hover:border-amber-700/50 text-amber-400 hover:bg-amber-950/20',
    orange: 'border-orange-900/40 hover:border-orange-700/50 text-orange-400 hover:bg-orange-950/20',
    red:    'border-red-900/40 hover:border-red-700/50 text-red-400 hover:bg-red-950/20',
    indigo: 'border-indigo-900/40 hover:border-indigo-700/50 text-indigo-400 hover:bg-indigo-950/20',
    violet: 'border-violet-900/40 hover:border-violet-700/50 text-violet-400 hover:bg-violet-950/20',
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-full max-w-full flex items-center gap-3 px-4 py-3 rounded-xl border bg-stone-950/30
        transition-all text-left disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.99]
        ${clr[color] || clr.amber}`}>
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-0 break-words">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-stone-500 mt-0.5 leading-snug">{desc}</p>
      </div>
    </button>
  )
}

function MetricaCard({ icono, label, valor, sufijo, color, bg, border }) {
  return (
    <div className={`card-dark p-4 ${bg} border ${border}`}>
      <div className={`${color} mb-2`}>{icono}</div>
      <p className="text-stone-500 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>
        {valor}<span className="text-xs font-normal text-stone-500 ml-1.5">{sufijo}</span>
      </p>
    </div>
  )
}