// src/components/PanelAdmin.jsx
// ─── Panel de Administrador (v2): Comanda + Motor de Juego ───────────────────
// Secciones: Interruptor Juego | Control de Fases | Credenciales | Tablero

import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Users, Utensils, Radio,
  Shield, Skull, Eye, EyeOff, RefreshCw, Lock, Unlock,
  Play, Sun, Moon, Vote, Trophy, AlertTriangle, Swords,
} from 'lucide-react'
import { PERSONAJES } from '../constants'
import { useJuego } from '../hooks/useJuego'

/**
 * @param {Array}    comandas    - Todas las comandas (comida) con joins
 * @param {boolean} cargando    - Estado de carga de comandas
 * @param {number}   totalPlatos - Recuento global de platos
 * @param {boolean} rtActivo    - Pulso Realtime de comandas
 */
export default function PanelAdmin({ comandas, cargando, totalPlatos, rtActivo }) {
  const [seccionActiva, setSeccionActiva] = useState('comanda') // 'comanda' | 'juego'
  const [desplegados, setDesplegados] = useState(new Set())

  const juego = useJuego()

  function toggleUsuario(uid) {
    setDesplegados(prev => {
      const s = new Set(prev)
      s.has(uid) ? s.delete(uid) : s.add(uid)
      return s
    })
  }

  return (
    <div className="animate-fade-in space-y-4">

      {/* ── Cabecera con tabs ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-xl text-white">Panel de Control</h2>
          <p className="text-stone-500 text-sm mt-0.5">Organizador del Festival Watanagashi</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300 ${
          rtActivo
            ? 'bg-emerald-950/50 border-emerald-800/50 text-emerald-400'
            : 'bg-stone-900 border-stone-800 text-stone-500'
        }`}>
          <Radio size={12} className={rtActivo ? 'animate-pulse' : ''} />
          {rtActivo ? 'Recibiendo cambios' : 'En directo'}
        </div>
      </div>

      {/* ── Tabs principales ── */}
      <div className="flex gap-2 border-b border-stone-800 pb-0">
        <button
          onClick={() => setSeccionActiva('comanda')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
            seccionActiva === 'comanda'
              ? 'border-amber-600 text-amber-400 bg-amber-950/20'
              : 'border-transparent text-stone-500 hover:text-stone-300'
          }`}
        >
          <Utensils size={15} /> Comanda
        </button>
        <button
          onClick={() => setSeccionActiva('juego')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
            seccionActiva === 'juego'
              ? 'border-red-700 text-red-400 bg-red-950/20'
              : 'border-transparent text-stone-500 hover:text-stone-300'
          }`}
        >
          <Swords size={15} /> Juego Oculto
          {juego.estadoJuego?.juego_habilitado && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN: COMANDA                                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {seccionActiva === 'comanda' && (
        <SeccionComanda
          comandas={comandas}
          cargando={cargando}
          totalPlatos={totalPlatos}
          desplegados={desplegados}
          toggleUsuario={toggleUsuario}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN: JUEGO OCULTO                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {seccionActiva === 'juego' && (
        <SeccionJuego juego={juego} />
      )}

    </div>
  )
}

function SeccionComanda({ comandas, cargando, totalPlatos, desplegados, toggleUsuario }) {
  const porUsuario = comandas.reduce((acc, item) => {
    const uid = item.usuarios?.id
    if (!uid) return acc
    if (!acc[uid]) acc[uid] = { usuario: item.usuarios, items: [], totalUnidades: 0 }
    acc[uid].items.push(item)
    acc[uid].totalUnidades += item.cantidad
    return acc
  }, {})

  const filas = Object.values(porUsuario)
  const totalComensales = filas.length

  const ranking = Object.entries(
    comandas.reduce((acc, c) => {
      const nombre = c.platos?.nombre || 'Desconocido'
      acc[nombre] = (acc[nombre] || 0) + c.cantidad
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxRanking = ranking[0]?.[1] || 1

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <MetricaCard icono={<Utensils size={20} />} label="Total platos pedidos" valor={totalPlatos}
          sufijo={totalPlatos === 1 ? 'plato' : 'platos'} color="text-red-400" bg="bg-red-950/30" border="border-red-900/50" />
        <MetricaCard icono={<Users size={20} />} label="Comensales con pedido" valor={totalComensales}
          sufijo={totalComensales === 1 ? 'comensal' : 'comensales'} color="text-blue-400" bg="bg-blue-950/30" border="border-blue-900/50" />
      </div>

      {ranking.length > 0 && (
        <div className="card-dark p-5">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-4">🏆 Platos más pedidos</h3>
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
                      style={{ width: `${(qty / maxRanking) * 100}%` }} />
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
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card-dark h-16 animate-pulse" />)}</div>
        ) : filas.length === 0 ? (
          <div className="card-dark p-10 text-center text-stone-500 text-sm">Aún no hay pedidos registrados.</div>
        ) : (
          <div className="space-y-2">
            {filas.map(({ usuario, items, totalUnidades }) => {
              const abierto = desplegados.has(usuario.id)
              const personaje = PERSONAJES.find(p => p.id === usuario.avatar)
              return (
                <div key={usuario.id} className="card-dark overflow-hidden">
                  <button
                    className={`w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r hover:brightness-110 transition-all duration-150 ${personaje?.color || 'from-stone-800/40 to-stone-800/20'}`}
                    onClick={() => toggleUsuario(usuario.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-stone-800 border border-stone-700/50 shrink-0">
                        <img src={personaje?.avatar} alt={usuario.nombre} className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none' }} />
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${personaje?.textColor || 'text-stone-300'}`}>{usuario.nombre}</p>
                        <p className="text-xs text-stone-500">{totalUnidades} platos · {items.length} tipos</p>
                      </div>
                    </div>
                    {abierto ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
                  </button>
                  {abierto && (
                    <div className="divide-y divide-stone-800/60 animate-slide-up">
                      {items.map(item => {
                        const plato = item.platos
                        if (!plato) return null
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                            {plato.imagen_url && (
                              <img src={plato.imagen_url} alt={plato.nombre}
                                className="w-9 h-9 rounded-md object-cover border border-stone-800 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-stone-200 truncate">{plato.nombre}</p>
                              {item.nota && <p className="text-xs text-amber-500/70 truncate">📝 {item.nota}</p>}
                            </div>
                            <span className="text-sm font-bold text-stone-300 tabular-nums shrink-0">×{item.cantidad}</span>
                          </div>
                        )
                      })}
                      <div className="px-4 py-2.5 flex justify-between items-center bg-stone-900/50">
                        <span className="text-xs text-stone-600 uppercase tracking-wider">Total</span>
                        <span className="text-sm font-bold text-emerald-400 tabular-nums">{totalUnidades} platos</span>
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

function SeccionJuego({ juego }) {
  const {
    estadoJuego, usuarios, votos, acciones, log, cargando,
    cambiarFase, toggleJuegoHabilitado, asignarRoles, resetearPassword,
    procesarVotacion, procesarNoche,
  } = juego

  const [mensaje, setMensaje]           = useState('')
  const [cargandoAccion, setCargandoAccion] = useState(false)
  const [resetTarget, setResetTarget]   = useState(null)
  const [nuevaPassInput, setNuevaPassInput] = useState('')
  const [mostrarBandos, setMostrarBandos] = useState(false)

  const fase = estadoJuego?.fase_actual ?? 'espera'
  const ronda = estadoJuego?.ronda_actual ?? 0
  const habilitado = estadoJuego?.juego_habilitado ?? false

  const ejecutar = async (fn, successMsg) => {
    setCargandoAccion(true); setMensaje('')
    const res = await fn()
    setCargandoAccion(false)
    setMensaje(res?.error ? `Error: ${res.error}` : (successMsg || 'Hecho.'))
    setTimeout(() => setMensaje(''), 4000)
  }

  const vivosCount  = usuarios.filter(u => u.vivo).length
  const muertosCount = usuarios.filter(u => !u.vivo).length
  const votosRonda  = votos.filter(v => v.ronda === ronda)
  const accionesRonda = acciones.filter(a => a.ronda === ronda && !a.procesada)

  const ETIQUETA_FASE = {
    espera: { label: 'En Espera', color: 'text-stone-400', bg: 'bg-stone-900', icon: <Shield size={14} /> },
    dia: { label: 'Fase de Día', color: 'text-amber-400', bg: 'bg-amber-950/30', icon: <Sun size={14} /> },
    votacion: { label: 'Votación', color: 'text-orange-400', bg: 'bg-orange-950/30', icon: <Vote size={14} /> },
    noche: { label: 'Fase de Noche', color: 'text-indigo-400', bg: 'bg-indigo-950/30', icon: <Moon size={14} /> },
    finalizado: { label: 'Finalizado', color: 'text-emerald-400', bg: 'bg-emerald-950/30', icon: <Trophy size={14} /> },
  }
  const etiqueta = ETIQUETA_FASE[fase] || ETIQUETA_FASE.espera

  return (
    <div className="space-y-5">

      {/* ── Mensaje de estado ── */}
      {mensaje && (
        <div className={`p-3 rounded-lg text-sm border ${
          mensaje.startsWith('Error')
            ? 'bg-red-950/40 border-red-800/50 text-red-300'
            : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
        }`}>
          {mensaje}
        </div>
      )}

      {/* ── Estado actual del juego ── */}
      <div className={`card-dark p-4 ${etiqueta.bg} border-stone-800/60`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={etiqueta.color}>{etiqueta.icon}</span>
            <span className={`font-semibold ${etiqueta.color}`}>{etiqueta.label}</span>
            {fase !== 'espera' && fase !== 'finalizado' && (
              <span className="text-stone-500 text-sm">· Ronda {ronda}</span>
            )}
          </div>
          {estadoJuego?.ganador && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              estadoJuego.ganador === 'aldeanos'
                ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/40'
                : 'bg-red-900/50 text-red-400 border border-red-700/40'
            }`}>
              {estadoJuego.ganador === 'aldeanos' ? '🕊️ Victoria Aldeanos' : '🗡️ Victoria Asesino'}
            </span>
          )}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <Shield size={11} className="text-emerald-500" /> {vivosCount} vivos
          </span>
          <span className="flex items-center gap-1">
            <Skull size={11} className="text-red-500" /> {muertosCount} muertos
          </span>
          <span className="flex items-center gap-1">
            <Vote size={11} className="text-amber-500" /> {votosRonda.length} votos esta ronda
          </span>
          <span className="flex items-center gap-1">
            <Moon size={11} className="text-indigo-400" /> {accionesRonda.length} acciones nocturnas
          </span>
        </div>
      </div>

      {/* ── 1. INTERRUPTOR MAESTRO ── */}
      <div className="card-dark p-5">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-4">
          ⚡ Interruptor Maestro
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-stone-200 text-sm font-medium">Pantalla del Juego para Usuarios</p>
            <p className="text-stone-500 text-xs mt-0.5">
              {habilitado
                ? 'Los usuarios ven el botón de juego (parpadea en rojo).'
                : 'El botón de juego está oculto para los usuarios.'}
            </p>
          </div>
          <button
            onClick={() => ejecutar(toggleJuegoHabilitado,
              habilitado ? 'Juego deshabilitado para usuarios.' : 'Juego habilitado — botón visible.'
            )}
            disabled={cargandoAccion}
            className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-300 border-2 ${
              habilitado ? 'bg-red-700 border-red-500' : 'bg-stone-800 border-stone-700'
            }`}
          >
            <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
              habilitado ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* ── 2. CONTROL DE FASES (CORREGIDO) ── */}
      <div className="card-dark p-5">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-4">
          🎮 Control de Fases
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {/* Preparar partida */}
          <BtnFase
            label="Asignar Roles (Reiniciar Partida)"
            descripcion="Sortea 1 Asesino entre los 6 personajes. Borra rondas anteriores."
            icon={<RefreshCw size={15} />}
            color="amber"
            disabled={cargandoAccion}
            onClick={() => ejecutar(asignarRoles, 'Roles asignados. El juego está listo.')}
          />

          {/* Iniciar Día → Habilitado en 'espera', 'noche' o 'votacion' como rescate manual */}
          <BtnFase
            label="Iniciar Día"
            descripcion="Los jugadores pueden hablar libremente. Avanza a Votación cuando lo decidas."
            icon={<Sun size={15} />}
            color="amber"
            disabled={cargandoAccion || (fase !== 'espera' && fase !== 'noche' && fase !== 'votacion')}
            onClick={() => ejecutar(() => cambiarFase('dia'), 'Fase de día iniciada.')}
          />

          {/* Iniciar Votación → Habilitado únicamente durante el Día */}
          <BtnFase
            label="Iniciar Votación Diurna"
            descripcion="Los usuarios vivos pueden votar. Aparece el botón de voto en su pantalla."
            icon={<Vote size={15} />}
            color="orange"
            disabled={cargandoAccion || fase !== 'dia'}
            onClick={() => ejecutar(() => cambiarFase('votacion'), 'Votación abierta.')}
          />

          {/* Procesar Votación → Habilitado únicamente durante la Votación */}
          <BtnFase
            label="Procesar Votos del Día"
            descripcion={`${votosRonda.length} votos recibidos. Calcula el más votado y aplica consecuencias.`}
            icon={<AlertTriangle size={15} />}
            color="red"
            disabled={cargandoAccion || fase !== 'votacion'}
            onClick={() => ejecutar(procesarVotacion, 'Votación procesada.')}
          />

          {/* Iniciar Noche → Rescate manual si se desea saltar votaciones */}
          <BtnFase
            label="Iniciar Noche"
            descripcion="Los jugadores eligen en secreto el objetivo de su objeto."
            icon={<Moon size={15} />}
            color="indigo"
            disabled={cargandoAccion || (fase !== 'dia' && fase !== 'votacion')}
            onClick={() => ejecutar(() => cambiarFase('noche'), 'Fase de noche iniciada.')}
          />

          {/* Procesar Noche → Habilitado únicamente durante la Noche */}
          <BtnFase
            label="Procesar Noche"
            descripcion={`${accionesRonda.length} acciones recibidas. Ejecuta cola: Táser → Protección → Asesinato → Pasivas.`}
            icon={<Skull size={15} />}
            color="violet"
            disabled={cargandoAccion || fase !== 'noche'}
            onClick={() => ejecutar(procesarNoche, 'Noche procesada. Nueva ronda.')}
          />
        </div>
      </div>

      {/* ── 3. TABLERO: JUGADORES ── */}
      <div className="card-dark p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
            👁️ Tablero de Jugadores
          </h3>
          <button
            onClick={() => setMostrarBandos(!mostrarBandos)}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition-colors"
          >
            {mostrarBandos ? <EyeOff size={13} /> : <Eye size={13} />}
            {mostrarBandos ? 'Ocultar bandos' : 'Revelar bandos'}
          </button>
        </div>

        {cargando ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-stone-800/50 rounded-lg animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {usuarios.map(u => {
              const p = PERSONAJES.find(x => x.id === u.avatar)
              const votosRecibidos = votosRonda.filter(v => v.nominado_id === u.avatar)
              const pesoRecibido = votosRecibidos.reduce((acc, v) => acc + (v.peso || 1), 0)
              const haVotado = votosRonda.some(v => v.votante_id === u.avatar)
              const haActuado = accionesRonda.some(a => a.actor_id === u.avatar)

              return (
                <div key={u.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  u.vivo
                    ? `border-stone-800/60 ${p?.color ? `bg-gradient-to-r ${p.color} bg-opacity-30` : 'bg-stone-900/40'}`
                    : 'border-stone-900/40 bg-stone-950/50 opacity-50'
                }`}>
                  <div className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 border ${u.vivo ? 'border-stone-700/50' : 'border-stone-800/30'}`}>
                    <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${u.vivo ? (p?.textColor || 'text-stone-300') : 'text-stone-600 line-through'}`}>
                        {u.nombre}
                      </span>
                      {!u.vivo && <span className="text-xs text-red-800">☠</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {mostrarBandos && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          u.bando === 'asesino'
                            ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                            : 'bg-emerald-950/40 text-emerald-500 border border-emerald-800/30'
                        }`}>
                          {u.bando === 'asesino' ? '🗡 Asesino' : '🕊 Aldeano'}
                        </span>
                      )}
                      {u.objeto_usado && <span className="text-xs text-stone-600">objeto usado</span>}
                      {haVotado && <span className="text-xs text-amber-600">✓ votó</span>}
                      {haActuado && <span className="text-xs text-indigo-500">✓ actuó</span>}
                    </div>
                  </div>

                  {pesoRecibido > 0 && (
                    <div className="text-center shrink-0">
                      <span className="text-lg font-bold text-red-400 tabular-nums">{pesoRecibido}</span>
                      <p className="text-xs text-stone-600">votos</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 4. GESTIÓN DE CREDENCIALES ── */}
      <div className="card-dark p-5">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-4">
          🔐 Gestión de Credenciales
        </h3>
        <p className="text-stone-500 text-xs mb-4">
          Restablece la contraseña de cualquier personaje si la olvidaron.
        </p>

        <div className="space-y-2">
          {PERSONAJES.map(p => {
            const usuarioDB = usuarios.find(u => u.avatar === p.id)
            const estaExpandido = resetTarget?.usuario?.id === usuarioDB?.id

            return (
              <div key={p.id} className={`rounded-xl border overflow-hidden transition-all ${
                estaExpandido ? 'border-amber-800/50' : 'border-stone-800/60'
              }`}>
                <div className="flex items-center justify-between px-3 py-2.5 bg-stone-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md overflow-hidden bg-stone-800 shrink-0">
                      <img src={p.avatar} alt={p.nombre} className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none' }} />
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${p.textColor}`}>{p.nombre}</span>
                      <p className="text-xs text-stone-600 mt-0.5">
                        {!usuarioDB ? 'Sin registrar' : !usuarioDB.password ? 'Sin contraseña' : 'Registrado ✓'}
                      </p>
                    </div>
                  </div>
                  {usuarioDB && (
                    <button
                      onClick={() => {
                        setResetTarget(estaExpandido ? null : { usuario: usuarioDB })
                        setNuevaPassInput('')
                      }}
                      className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition-colors px-2 py-1"
                    >
                      {estaExpandido ? <Lock size={13} /> : <Unlock size={13} />}
                      {estaExpandido ? 'Cancelar' : 'Restablecer'}
                    </button>
                  )}
                </div>

                {estaExpandido && (
                  <div className="px-3 pb-3 pt-2 bg-stone-950/50 animate-slide-up">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600 placeholder-stone-600 transition-colors"
                        placeholder="Nueva contraseña..."
                        value={nuevaPassInput}
                        onChange={e => setNuevaPassInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && nuevaPassInput.length >= 3 && ejecutar(
                          () => resetearPassword(resetTarget.usuario.id, nuevaPassInput),
                          `Contraseña de ${resetTarget.usuario.nombre} actualizada.`
                        ) && setResetTarget(null)}
                        autoFocus
                      />
                      <button
                        disabled={nuevaPassInput.length < 3 || cargandoAccion}
                        onClick={async () => {
                          await ejecutar(
                            () => resetearPassword(resetTarget.usuario.id, nuevaPassInput),
                            `Contraseña actualizada.`
                          )
                          setResetTarget(null)
                          setNuevaPassInput('')
                        }}
                        className="px-3 py-2 bg-amber-800 hover:bg-amber-700 text-stone-100 text-sm font-medium rounded-lg disabled:opacity-40 transition-colors"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Log de eventos ── */}
      {juego.log.length > 0 && (
        <div className="card-dark p-5">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-4">
            📜 Log de Eventos
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
            {juego.log.map(evento => (
              <div key={evento.id} className={`text-xs px-3 py-2 rounded-lg border ${
                evento.publica
                  ? 'bg-stone-900/60 border-stone-800/50 text-stone-300'
                  : 'bg-indigo-950/30 border-indigo-900/30 text-indigo-300'
              }`}>
                <span className="text-stone-600 mr-2">R{evento.ronda}</span>
                {evento.descripcion}
                {!evento.publica && <span className="text-indigo-600 ml-2">[secreto]</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BtnFase({ label, descripcion, icon, color, disabled, onClick }) {
  const colores = {
    amber:  'border-amber-900/40 hover:border-amber-700/60 text-amber-400 hover:bg-amber-950/30',
    orange: 'border-orange-900/40 hover:border-orange-700/60 text-orange-400 hover:bg-orange-950/30',
    red:    'border-red-900/40 hover:border-red-700/60 text-red-400 hover:bg-red-950/30',
    indigo: 'border-indigo-900/40 hover:border-indigo-700/60 text-indigo-400 hover:bg-indigo-950/30',
    violet: 'border-violet-900/40 hover:border-violet-700/60 text-violet-400 hover:bg-violet-950/30',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border bg-stone-950/40 transition-all text-left
        disabled:opacity-10 disabled:cursor-not-allowed active:scale-[0.99]
        ${colores[color] || colores.amber}`}
    >
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-stone-500 mt-0.5 leading-snug">{descripcion}</p>
      </div>
      <Play size={14} className="shrink-0 opacity-50" />
    </button>
  )
}

function MetricaCard({ icono, label, valor, sufijo, color, bg, border }) {
  return (
    <div className={`card-dark p-4 ${bg} border ${border}`}>
      <div className={`${color} mb-2`}>{icono}</div>
      <p className="text-stone-500 text-xs mb-1 leading-tight">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>
        {valor}
        <span className="text-xs font-normal text-stone-500 ml-1.5">{sufijo}</span>
      </p>
    </div>
  )
}