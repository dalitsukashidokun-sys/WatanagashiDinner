// src/components/VistaJuego.jsx
// ─── Vista del Jugador: Motor de Juego Oculto ─────────────────────────────────
// Cambia de pantalla según la fase. Jugadores muertos ven pantalla de espectador.

import { useState } from 'react'
import { Shield, Moon, Sun, Vote, Trophy, Skull, ScrollText, ChevronDown, ChevronUp } from 'lucide-react'
import { PERSONAJES, FASES } from '../constants'
import { useJuego } from '../hooks/useJuego'

export default function VistaJuego({ usuario }) {
  const juego = useJuego()
  const {
    estadoJuego, jugadores, registrarVoto, registrarAccion,
    getPersonaje, getVotosMiRonda, getAccionMiRonda,
    getLogPublico, getLogSecreto,
  } = juego

  const [feedback, setFeedback] = useState({ msg: '', tipo: 'ok' })
  const [busy, setBusy] = useState(false)
  const [logAbierto, setLogAbierto] = useState(false)

  const miAvatar  = usuario.avatar
  const misDatos  = jugadores.find(u => u.avatar === miAvatar)
  const personaje = getPersonaje(miAvatar)
  const estoyVivo = misDatos?.vivo ?? true
  const heUsado   = misDatos?.objeto_usado ?? false
  const soyAsesino = misDatos?.bando === 'asesino'

  const fase   = estadoJuego?.fase_actual ?? 'espera'
  const ronda  = estadoJuego?.ronda_actual ?? 0
  const miVoto = getVotosMiRonda(miAvatar)
  const miAccion = getAccionMiRonda(miAvatar)

  const logPublico  = getLogPublico()
  const logSecreto  = getLogSecreto(miAvatar)

  const vivosJugables    = jugadores.filter(u => u.vivo && u.avatar !== miAvatar)
  const todosLosJugadores = jugadores

  const fb = (msg, tipo = 'ok') => {
    setFeedback({ msg, tipo })
    setTimeout(() => setFeedback({ msg: '', tipo: 'ok' }), 5000)
  }

  const hacerVoto = async (nominadoId) => {
    setBusy(true)
    const { error } = await registrarVoto(miAvatar, nominadoId)
    setBusy(false)
    if (error) return fb('Error al emitir el voto. Inténtalo de nuevo.', 'error')
    const nombre = nominadoId === 'nadie'
      ? 'nadie (abstención)'
      : (PERSONAJES.find(p => p.id === nominadoId)?.nombre ?? nominadoId)
    fb(`✓ Voto registrado contra ${nombre}. Puedes cambiarlo hasta que el organizador cierre la urna.`)
  }

  const hacerAccion = async (objetivoId, tipoAccion) => {
    setBusy(true)
    const { error } = await registrarAccion(miAvatar, objetivoId, tipoAccion)
    setBusy(false)
    if (error) return fb('Error al enviar la acción.', 'error')
    fb('✓ Acción registrada. Espera a que el organizador procese la noche.')
  }

  // ── Juego no habilitado (Con soporte de fondos duales y overlay) ─────────
  if (!estadoJuego?.juego_habilitado) {
    return (
      <div className="min-h-screen w-full bg-[url(/bgj_movil.jpg)] md:bg-[url(/bgj_pc.png)] bg-cover bg-center bg-fixed animate-fade-in">
        <div className="min-h-screen bg-black/60 flex flex-col items-center justify-center p-4 text-center space-y-4">
          <div className="text-7xl animate-pulse-slow">🦗</div>
          <h2 className="font-serif text-2xl text-stone-300">Las cigarras guardan silencio</h2>
          <p className="text-stone-500 text-sm max-w-xs">
            El organizador aún no ha activado el juego. Espera pacientemente.
          </p>
        </div>
      </div>
    )
  }

  // ── Muerto: pantalla de espectador (Con soporte de fondos duales y overlay) ──
  if (!estoyVivo) {
    return (
      <div className="min-h-screen w-full bg-[url(/bgj_movil.jpg)] md:bg-[url(/bgj_pc.png)] bg-cover bg-center bg-fixed animate-fade-in">
        <div className="min-h-screen bg-black/60 p-4 space-y-5">
          <div className="card-dark p-8 text-center space-y-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-red-900/40 mx-auto grayscale opacity-50">
              <img src={personaje?.avatar} alt={usuario.nombre} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-serif text-3xl text-red-400 mb-1">☠ Has muerto</h2>
              <p className="text-stone-500 text-sm">
                Tu historia en Hinamizawa ha llegado a su fin. Observa en silencio.
              </p>
            </div>
          </div>

          <TableroSupervivientes jugadores={todosLosJugadores} />
          <LogEventos logPublico={logPublico} logSecreto={[]} logAbierto={logAbierto} setLogAbierto={setLogAbierto} />
        </div>
      </div>
    )
  }

  // ── Pantalla de Jugador Activo (Con soporte de fondos duales y overlay) ──
  return (
    <div className="min-h-screen w-full bg-[url(/bgj_movil.jpg)] md:bg-[url(/bgj_pc.png)] bg-cover bg-center bg-fixed animate-fade-in">
      <div className="min-h-screen bg-black/60 p-4 space-y-4">

        {/* ── Mi identidad ── */}
        <div className={`card-dark p-5 bg-gradient-to-r ${personaje?.color || ''}`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${personaje?.borderColor || 'border-stone-600'} shrink-0`}>
              <img src={personaje?.avatar} alt={usuario.nombre} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`font-serif text-xl font-bold ${personaje?.textColor || 'text-stone-200'}`}>
                {usuario.nombre}
              </h2>
              <p className="text-stone-400 text-sm mt-0.5 truncate">{personaje?.descripcion}</p>
              <div className="flex items-center flex-wrap gap-2 mt-2">
                <span className="text-xs bg-stone-800/80 text-stone-300 px-2 py-0.5 rounded-full border border-stone-700/50">
                  {personaje?.emoji} {personaje?.objeto}
                </span>
                {heUsado && (
                  <span className="text-xs text-stone-600 px-2 py-0.5 rounded-full bg-stone-900/60 border border-stone-800/50">
                    objeto agotado
                  </span>
                )}
                {soyAsesino && (
                  <span className="text-xs bg-red-950/60 text-red-400 px-2 py-0.5 rounded-full border border-red-800/40 font-bold">
                    🗡 Asesino
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Descripción del objeto */}
          <p className="text-stone-500 text-xs mt-3 leading-relaxed border-t border-stone-800/50 pt-3">
            {personaje?.descripcionObjeto}
          </p>
        </div>

        {/* ── Feedback ── */}
        {feedback.msg && (
          <div className={`px-4 py-3 rounded-xl text-sm border text-center transition-all animate-fade-in ${
            feedback.tipo === 'error'
              ? 'bg-red-950/50 border-red-800/50 text-red-300'
              : 'bg-emerald-950/50 border-emerald-800/50 text-emerald-300'
          }`}>
            {feedback.msg}
          </div>
        )}

        {/* ── Mensajes secretos ── */}
        {logSecreto.length > 0 && (
          <div className="card-dark p-4 border-indigo-900/40 bg-indigo-950/20 space-y-2">
            <p className="text-xs text-indigo-400 uppercase tracking-widest font-semibold">📨 Informes secretos</p>
            {logSecreto.map(e => (
              <p key={e.id} className="text-indigo-200 text-sm leading-relaxed">{e.descripcion.replace(/^\[SECRETO[^\]]*\] /, '')}</p>
            ))}
          </div>
        )}

        {/* ── CONTENIDO POR FASE ── */}
        <FaseIndicador fase={fase} ronda={ronda} />

        {fase === FASES.ESPERA     && <PantallaEspera />}
        {fase === FASES.DIA        && <PantallaDia jugadores={jugadores} />}
        {fase === FASES.VOTACION   && (
          <PantallaVotacion
            miAvatar={miAvatar}
            miVoto={miVoto}
            vivosJugables={vivosJugables}
            esMion={miAvatar === 'mion'}
            heUsadoObjeto={heUsado}
            busy={busy}
            onVotar={hacerVoto}
          />
        )}
        {fase === FASES.NOCHE && (
          <PantallaNoche
            personaje={personaje}
            miAvatar={miAvatar}
            misDatos={misDatos}
            soyAsesino={soyAsesino}
            vivosJugables={vivosJugables}
            todosVivos={jugadores.filter(u => u.vivo)}
            miAccion={miAccion}
            heUsado={heUsado}
            busy={busy}
            onAccion={hacerAccion}
          />
        )}
        {fase === FASES.FINALIZADO && (
          <PantallaFinalizado
            ganador={estadoJuego?.ganador}
            misDatos={misDatos}
            jugadores={jugadores}
          />
        )}

        {/* ── Tablero de supervivientes ── */}
        <TableroSupervivientes jugadores={todosLosJugadores} miAvatar={miAvatar} />

        {/* ── Log público ── */}
        <LogEventos
          logPublico={logPublico}
          logSecreto={[]}
          logAbierto={logAbierto}
          setLogAbierto={setLogAbierto}
        />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ──────────────────────────────────────────────────────────────────────────────

function FaseIndicador({ fase, ronda }) {
  const cfg = {
    espera:     { label: 'Esperando inicio', icon: '🦗', cls: 'text-stone-400 bg-stone-900/60 border-stone-800' },
    dia:        { label: `Día · Ronda ${ronda}`, icon: '☀️', cls: 'text-amber-400 bg-amber-950/30 border-amber-900/40' },
    votacion:   { label: `Votación · Ronda ${ronda}`, icon: '🗳️', cls: 'text-orange-400 bg-orange-950/30 border-orange-900/40' },
    noche:      { label: `Noche · Ronda ${ronda}`, icon: '🌙', cls: 'text-indigo-400 bg-indigo-950/30 border-indigo-900/40' },
    finalizado: { label: 'Juego terminado', icon: '⚖️', cls: 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40' },
  }
  const c = cfg[fase] || cfg.espera
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${c.cls}`}>
      <span>{c.icon}</span> {c.label}
    </div>
  )
}

function PantallaEspera() {
  return (
    <div className="card-dark p-8 text-center space-y-3">
      <div className="text-5xl animate-pulse-slow">🦗</div>
      <h3 className="font-serif text-xl text-stone-300">Hinamizawa espera</h3>
      <p className="text-stone-500 text-sm">El organizador iniciará la partida en breve.</p>
    </div>
  )
}

function PantallaDia({ jugadores }) {
  return (
    <div className="card-dark p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sun size={20} className="text-amber-400" />
        <h3 className="font-serif text-lg text-amber-300">El día avanza</h3>
      </div>
      <p className="text-stone-400 text-sm leading-relaxed">
        Habla con tus compañeros. Debate, acusa y defiéndete.
        El organizador abrirá las urnas cuando lo considere oportuno.
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {jugadores.filter(u => u.vivo).map(u => {
          const p = PERSONAJES.find(x => x.id === u.avatar)
          return (
            <div key={u.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-stone-800/60 border border-stone-700/40">
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-stone-700">
                <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover" />
              </div>
              <span className={`text-xs font-medium ${p?.textColor || 'text-stone-300'}`}>{u.nombre}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PantallaVotacion({ miAvatar, miVoto, vivosJugables, esMion, heUsadoObjeto, busy, onVotar }) {
  return (
    <div className="card-dark p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Vote size={18} className="text-orange-400" />
        <h3 className="font-serif text-lg text-orange-300">Urnas abiertas</h3>
      </div>

      {esMion && !heUsadoObjeto && (
        <div className="text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2">
          ✍️ Tu <strong>Rotulador</strong> está activo — tu voto contará por <strong>2</strong> esta ronda.
        </div>
      )}

      {miVoto && (
        <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">
          ✓ Votaste contra{' '}
          <strong>
            {miVoto.nominado_id === 'nadie'
              ? 'nadie (abstención)'
              : PERSONAJES.find(p => p.id === miVoto.nominado_id)?.nombre ?? miVoto.nominado_id}
          </strong>. Puedes cambiar tu voto.
        </div>
      )}

      <p className="text-stone-400 text-sm">¿A quién llevas al cadalso?</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {vivosJugables.map(u => {
          const p = PERSONAJES.find(x => x.id === u.avatar)
          const elegido = miVoto?.nominado_id === u.avatar
          return (
            <button key={u.id} disabled={busy}
              onClick={() => onVotar(u.avatar)}
              className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all text-left active:scale-95
                ${elegido
                  ? 'border-red-600 bg-red-950/40 shadow-[0_0_12px_rgba(220,38,38,0.25)]'
                  : 'border-stone-700/50 bg-stone-900/40 hover:border-stone-500 hover:bg-stone-800/40'
                } disabled:opacity-50`}
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-stone-800">
                <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${elegido ? 'text-red-300' : (p?.textColor || 'text-stone-300')}`}>
                  {u.nombre}
                </p>
                {elegido && <p className="text-xs text-red-500">tu voto</p>}
              </div>
            </button>
          )
        })}

        {/* Abstención */}
        <button disabled={busy}
          onClick={() => onVotar('nadie')}
          className={`col-span-1 sm:col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all active:scale-95
            disabled:opacity-50
            ${miVoto?.nominado_id === 'nadie'
              ? 'border-stone-500 bg-stone-800/60 text-stone-300'
              : 'border-stone-800/40 text-stone-500 hover:border-stone-700 hover:text-stone-400'
            }`}
        >
          <Shield size={15} />
          Abstención — Nadie debe morir
          {miVoto?.nominado_id === 'nadie' && <span className="text-amber-400 text-xs ml-1">✓</span>}
        </button>
      </div>
    </div>
  )
}

function PantallaNoche({ personaje, miAvatar, misDatos, soyAsesino, vivosJugables, todosVivos, miAccion, heUsado, busy, onAccion }) {
  const tipoAccion = personaje?.tipoAccion
  const esPasiva   = tipoAccion === 'pasiva_rena'
  const esMion     = tipoAccion === 'votar_doble'

  const objetivos = tipoAccion === 'proteger'
    ? todosVivos                                          // Keiichi puede protegerse a sí mismo
    : vivosJugables                                       // Resto no

  return (
    <div className="space-y-4">
      <div className="card-dark p-5 bg-gradient-to-b from-indigo-950/20 to-stone-950/20 border-indigo-900/30">
        <div className="flex items-center gap-2 mb-2">
          <Moon size={18} className="text-indigo-400" />
          <h3 className="font-serif text-lg text-indigo-300">La noche ha caído</h3>
        </div>
        <p className="text-stone-400 text-sm leading-relaxed">
          {soyAsesino
            ? '🗡️ Selecciona a tu víctima para esta noche.'
            : `${personaje?.emoji} ${personaje?.descripcionObjeto}`}
        </p>
      </div>

      {/* Confirmación ya enviada */}
      {miAccion && (
        <div className="card-dark p-5 text-center border-emerald-900/40 bg-emerald-950/10">
          <div className="text-4xl mb-2">✓</div>
          <p className="text-emerald-300 font-medium">Acción registrada</p>
          <p className="text-stone-500 text-sm mt-1">Espera a que el organizador procese la noche.</p>
        </div>
      )}

      {/* Asesino: elegir víctima (CORREGIDO: Grid fluido 1 col en móvil, 2 en PC) */}
      {!miAccion && soyAsesino && (
        <div className="card-dark p-5">
          <p className="text-stone-400 text-sm mb-4">Elige tu objetivo:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vivosJugables.map(u => {
              const p = PERSONAJES.find(x => x.id === u.avatar)
              return (
                <button key={u.id} disabled={busy}
                  onClick={() => onAccion(u.avatar, 'asesinar')}
                  className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl border border-red-900/40
                    bg-red-950/20 hover:border-red-700 hover:bg-red-950/40 transition-all text-left
                    active:scale-95 disabled:opacity-50">
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-stone-800">
                    <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-sm font-semibold ${p?.textColor || 'text-stone-300'}`}>{u.nombre}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Aldeanos con acción activa (CORREGIDO: Grid fluido 1 col en móvil, 2 en PC) */}
      {!miAccion && !soyAsesino && !esPasiva && !esMion && !heUsado && (
        <div className="card-dark p-5">
          <p className="text-stone-400 text-sm mb-4">¿A quién diriges tu <strong>{personaje?.objeto}</strong>?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {objetivos.map(u => {
              const p = PERSONAJES.find(x => x.id === u.avatar)
              const clrMap = {
                paralizar: 'border-violet-900/40 bg-violet-950/20 hover:border-violet-700',
                revelar:   'border-amber-900/40 bg-amber-950/20 hover:border-amber-700',
                rastrear:  'border-amber-900/40 bg-amber-950/20 hover:border-amber-700',
                proteger:  'border-blue-900/40 bg-blue-950/20 hover:border-blue-700',
              }
              return (
                <button key={u.id} disabled={busy}
                  onClick={() => onAccion(u.avatar, tipoAccion)}
                  className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all
                    text-left active:scale-95 disabled:opacity-50
                    ${clrMap[tipoAccion] || 'border-stone-700/50 bg-stone-900/40 hover:border-stone-500'}`}>
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-stone-800">
                    <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-sm font-semibold ${p?.textColor || 'text-stone-300'}`}>{u.nombre}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Pasiva Rena */}
      {!miAccion && esPasiva && (
        <div className="card-dark p-5 text-center space-y-2">
          <div className="text-4xl">🔪</div>
          <p className="text-stone-300 font-medium">Tu habilidad es pasiva</p>
          <p className="text-stone-500 text-sm">{personaje?.descripcionObjeto}</p>
          <p className="text-stone-600 text-xs mt-2">No necesitas hacer nada. Espera al amanecer.</p>
        </div>
      )}

      {/* Mion: objeto de día */}
      {!miAccion && esMion && (
        <div className="card-dark p-5 text-center space-y-2">
          <div className="text-4xl">✍️</div>
          <p className="text-stone-300 font-medium">El Rotulador actúa de día</p>
          <p className="text-stone-500 text-sm">Durante la noche, solo puedes observar.</p>
        </div>
      )}

      {/* Objeto ya agotado */}
      {!miAccion && !soyAsesino && heUsado && !esPasiva && !esMion && (
        <div className="card-dark p-5 text-center opacity-50 space-y-2">
          <div className="text-4xl grayscale">{personaje?.emoji}</div>
          <p className="text-stone-400 text-sm">Ya usaste tu {personaje?.objeto} anteriormente.</p>
        </div>
      )}
    </div>
  )
}

function PantallaFinalizado({ ganador, misDatos, jugadores }) {
  const soyAsesino = misDatos?.bando === 'asesino'
  const gane = (ganador === 'aldeanos' && !soyAsesino) || (ganador === 'asesino' && soyAsesino)
  const asesino = jugadores.find(u => u.bando === 'asesino')
  const pAsesino = PERSONAJES.find(p => p.id === asesino?.avatar)

  return (
    <div className="card-dark p-8 text-center space-y-6 animate-fade-in">
      {gane ? (
        <>
          <div className="text-6xl animate-pulse-slow">🏆</div>
          <h2 className="font-serif text-3xl text-gradient-sunset">¡Victoria!</h2>
          <p className="text-stone-300 text-sm">
            {ganador === 'aldeanos'
              ? 'El pueblo de Hinamizawa sobrevive. El asesino fue descubierto.'
              : 'La oscuridad gana. Hinamizawa cae en el silencio eterno.'}
          </p>
        </>
      ) : (
        <>
          <div className="text-6xl">💀</div>
          <h2 className="font-serif text-3xl text-red-400">Derrota</h2>
          <p className="text-stone-400 text-sm">
            {ganador === 'aldeanos'
              ? 'El asesino fue eliminado. Tú habías sido descubierto.'
              : 'El asesino ganó. No pudiste proteger al pueblo.'}
          </p>
        </>
      )}

      {asesino && (
        <div className="flex flex-col items-center gap-3 pt-4 border-t border-stone-800">
          <p className="text-stone-500 text-xs uppercase tracking-widest">El Asesino era</p>
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-red-700/60">
            <img src={pAsesino?.avatar} alt={asesino.nombre} className="w-full h-full object-cover" />
          </div>
          <p className={`font-serif text-xl font-bold ${pAsesino?.textColor || 'text-red-300'}`}>
            {asesino.nombre}
          </p>
        </div>
      )}
    </div>
  )
}

function TableroSupervivientes({ jugadores, miAvatar }) {
  return (
    <div className="card-dark p-4">
      <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Supervivientes</p>
      <div className="flex flex-wrap gap-2">
        {jugadores.map(u => {
          const p = PERSONAJES.find(x => x.id === u.avatar)
          const soyYo = u.avatar === miAvatar
          return (
            <div key={u.id}
              title={u.nombre}
              className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                u.vivo
                  ? `${p?.borderColor || 'border-stone-600'} ${soyYo ? 'ring-2 ring-white/30' : ''}`
                  : 'border-stone-900 opacity-25 grayscale'
              }`}
            >
              <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LogEventos({ logPublico, logAbierto, setLogAbierto }) {
  if (logPublico.length === 0) return null
  return (
    <div className="card-dark overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-800/30 transition-colors"
        onClick={() => setLogAbierto(!logAbierto)}
      >
        <div className="flex items-center gap-2">
          <ScrollText size={15} className="text-stone-500" />
          <span className="text-sm text-stone-400 font-medium">Crónica del Festival</span>
          <span className="text-xs bg-stone-800 text-stone-500 px-1.5 py-0.5 rounded-full">
            {logPublico.length}
          </span>
        </div>
        {logAbierto ? <ChevronUp size={16} className="text-stone-500" /> : <ChevronDown size={16} className="text-stone-500" />}
      </button>
      {logAbierto && (
        <div className="border-t border-stone-800 divide-y divide-stone-800/60 max-h-64 overflow-y-auto no-scrollbar animate-slide-up">
          {logPublico.map(e => (
            <div key={e.id} className="px-4 py-2.5 flex items-start gap-2.5">
              <span className="text-stone-700 text-xs tabular-nums mt-0.5 shrink-0">R{e.ronda}</span>
              <p className="text-stone-300 text-sm leading-relaxed">{e.descripcion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}