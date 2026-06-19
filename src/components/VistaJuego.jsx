// src/components/VistaJuego.jsx
// ─── Vista del Jugador: Motor de Juego Oculto ─────────────────────────────────
// Muestra la pantalla del juego según la fase actual: espera, día, votación,
// noche (acciones secretas), finalizado. Los muertos ven la pantalla de espectador.

import { useState, useEffect } from 'react'
import { Shield, Skull, Moon, Sun, Vote, Trophy, Eye, EyeOff } from 'lucide-react'
import { PERSONAJES, FASES } from '../constants'
import { useJuego } from '../hooks/useJuego'

/**
 * @param {Object} usuario - El usuario en sesión (con avatar, id, nombre)
 */
export default function VistaJuego({ usuario }) {
  const juego = useJuego()
  const { estadoJuego, usuarios, votos, acciones, registrarVoto, registrarAccion, recargar } = juego

  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [cargandoAccion, setCargandoAccion] = useState(false)
  const [bandoRevelado, setBandoRevelado] = useState(null) // Solo para Satoko tras revelación

  const miAvatar = usuario.avatar
  const misDatos = usuarios.find(u => u.avatar === miAvatar)
  const estoyVivo = misDatos?.vivo ?? true
  const heUsadoObjeto = misDatos?.objeto_usado ?? false
  const personaje = PERSONAJES.find(p => p.id === miAvatar)

  const fase = estadoJuego?.fase_actual ?? 'espera'
  const ronda = estadoJuego?.ronda_actual ?? 0

  const votosRonda = votos.filter(v => v.ronda === ronda)
  const miVoto = votosRonda.find(v => v.votante_id === miAvatar)
  const miAccion = acciones.find(a => a.ronda === ronda && a.actor_id === miAvatar)

  const vivosJugables = usuarios.filter(u => u.vivo && u.avatar !== miAvatar)
  const todosVivos = usuarios.filter(u => u.vivo)

  const hacerAccion = async (objetivoId, tipoAccion) => {
    setCargandoAccion(true)
    setFeedbackMsg('')
    const { error } = await registrarAccion(miAvatar, objetivoId, tipoAccion)
    setCargandoAccion(false)
    if (error) {
      setFeedbackMsg('Error al enviar tu acción. Inténtalo de nuevo.')
    } else {
      setFeedbackMsg('✓ Acción registrada. Espera al amanecer.')
    }
    setTimeout(() => setFeedbackMsg(''), 4000)
  }

  const hacerVoto = async (nominadoId) => {
    setCargandoAccion(true)
    setFeedbackMsg('')
    const { error } = await registrarVoto(miAvatar, nominadoId)
    setCargandoAccion(false)
    if (error) {
      setFeedbackMsg('Error al emitir tu voto.')
    } else {
      setFeedbackMsg(nominadoId === 'nadie'
        ? '✓ Has votado por no ejecutar a nadie.'
        : `✓ Has votado contra ${PERSONAJES.find(p => p.id === nominadoId)?.nombre || nominadoId}.`
      )
    }
    setTimeout(() => setFeedbackMsg(''), 5000)
  }

  // ── Si el juego no está habilitado ───────────────────────────────────────
  if (!estadoJuego?.juego_habilitado) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="text-6xl mb-6">🦗</div>
        <h2 className="font-serif text-2xl text-stone-300 mb-3">Las cigarras guardan silencio</h2>
        <p className="text-stone-500 text-sm max-w-sm">
          El juego aún no ha sido activado por el organizador. Espera pacientemente.
        </p>
      </div>
    )
  }

  // ── Pantalla de espectador para muertos ──────────────────────────────────
  if (!estoyVivo) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in space-y-5">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-red-900/60 opacity-50 grayscale">
          <img src={personaje?.avatar} alt={usuario.nombre} className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="font-serif text-3xl text-red-400 mb-2">☠ Has muerto</h2>
          <p className="text-stone-500 text-sm max-w-sm">
            Tu historia en Hinamizawa ha llegado a su fin. Observa el resto de la partida en silencio.
          </p>
        </div>
        <div className="card-dark p-5 w-full max-w-sm">
          <p className="text-stone-500 text-xs uppercase tracking-widest mb-3">Supervivientes</p>
          <div className="space-y-2">
            {todosVivos.map(u => {
              const p = PERSONAJES.find(x => x.id === u.avatar)
              return (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md overflow-hidden bg-stone-800">
                    <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-sm ${p?.textColor || 'text-stone-300'}`}>{u.nombre}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // RENDER POR FASE
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Mi personaje ── */}
      <div className={`card-dark p-5 bg-gradient-to-r ${personaje?.color || ''}`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-stone-600/60 shrink-0">
            <img src={personaje?.avatar} alt={usuario.nombre} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h2 className={`font-serif text-xl font-bold ${personaje?.textColor || 'text-stone-200'}`}>
              {usuario.nombre}
            </h2>
            <p className="text-stone-400 text-sm mt-0.5">{personaje?.descripcion}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs bg-stone-800/80 text-stone-400 px-2 py-0.5 rounded-full border border-stone-700/50">
                {personaje?.emoji} {personaje?.objeto}
              </span>
              {heUsadoObjeto && (
                <span className="text-xs bg-stone-900/60 text-stone-600 px-2 py-0.5 rounded-full">
                  objeto usado
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Indicador de fase ── */}
      <FaseIndicador fase={fase} ronda={ronda} />

      {/* ── Feedback ── */}
      {feedbackMsg && (
        <div className={`p-3 rounded-lg text-sm border text-center transition-all ${
          feedbackMsg.startsWith('Error')
            ? 'bg-red-950/40 border-red-800/50 text-red-300'
            : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
        }`}>
          {feedbackMsg}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {fase === FASES.ESPERA && <PantallaEspera />}

      {fase === FASES.DIA && <PantallaDia todosVivos={todosVivos} />}

      {/* ════════════════════════════════════════════════════════════════ */}
      {fase === FASES.VOTACION && (
        <PantallaVotacion
          miAvatar={miAvatar}
          vivosJugables={vivosJugables}
          todosVivos={todosVivos}
          miVoto={miVoto}
          cargandoAccion={cargandoAccion}
          onVotar={hacerVoto}
          esMion={miAvatar === 'mion'}
          heUsadoObjeto={heUsadoObjeto}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {fase === FASES.NOCHE && (
        <PantallaNoche
          personaje={personaje}
          miAvatar={miAvatar}
          misDatos={misDatos}
          vivosJugables={vivosJugables}
          todosVivos={todosVivos}
          miAccion={miAccion}
          heUsadoObjeto={heUsadoObjeto}
          cargandoAccion={cargandoAccion}
          onAccion={hacerAccion}
          bandoRevelado={bandoRevelado}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {fase === FASES.FINALIZADO && (
        <PantallaFinalizado
          ganador={estadoJuego?.ganador}
          misDatos={misDatos}
          usuarios={usuarios}
        />
      )}

      {/* ── Recuento de supervivientes (siempre visible) ── */}
      <div className="card-dark p-4">
        <p className="text-xs text-stone-500 uppercase tracking-widest mb-3">Supervivientes · Ronda {ronda}</p>
        <div className="flex flex-wrap gap-2">
          {usuarios.map(u => {
            const p = PERSONAJES.find(x => x.id === u.avatar)
            return (
              <div key={u.id} title={u.nombre}
                className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all ${
                  u.vivo
                    ? `${personaje?.borderColor || 'border-stone-600'} opacity-100`
                    : 'border-stone-900 opacity-30 grayscale'
                }`}
              >
                <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Sub-componentes de fase ───────────────────────────────────────────────────

function FaseIndicador({ fase, ronda }) {
  const config = {
    espera:     { label: 'Esperando inicio', icon: '🦗', color: 'text-stone-400 bg-stone-900/60 border-stone-800' },
    dia:        { label: `Día · Ronda ${ronda}`, icon: '☀️', color: 'text-amber-400 bg-amber-950/30 border-amber-900/40' },
    votacion:   { label: `Votación · Ronda ${ronda}`, icon: '🗳️', color: 'text-orange-400 bg-orange-950/30 border-orange-900/40' },
    noche:      { label: `Noche · Ronda ${ronda}`, icon: '🌙', color: 'text-indigo-400 bg-indigo-950/30 border-indigo-900/40' },
    finalizado: { label: 'Juego terminado', icon: '⚖️', color: 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40' },
  }
  const c = config[fase] || config.espera
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium w-fit ${c.color}`}>
      <span>{c.icon}</span> {c.label}
    </div>
  )
}

function PantallaEspera() {
  return (
    <div className="card-dark p-8 text-center">
      <div className="text-5xl mb-4 animate-pulse-slow">🦗</div>
      <h3 className="font-serif text-xl text-stone-300 mb-2">Hinamizawa espera</h3>
      <p className="text-stone-500 text-sm">El organizador iniciará el juego pronto. Prepárate.</p>
    </div>
  )
}

function PantallaDia({ todosVivos }) {
  return (
    <div className="card-dark p-6 text-center">
      <Sun size={36} className="text-amber-400 mx-auto mb-3 animate-pulse-slow" />
      <h3 className="font-serif text-xl text-amber-300 mb-2">El día avanza</h3>
      <p className="text-stone-400 text-sm mb-5">
        Habla con tus compañeros. Debate, acusa, defiéndete. El organizador decidirá cuándo votar.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {todosVivos.map(u => {
          const p = PERSONAJES.find(x => x.id === u.avatar)
          return (
            <div key={u.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-800/60 border border-stone-700/40`}>
              <div className="w-5 h-5 rounded-full overflow-hidden">
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

function PantallaVotacion({ miAvatar, vivosJugables, todosVivos, miVoto, cargandoAccion, onVotar, esMion, heUsadoObjeto }) {
  return (
    <div className="space-y-4">
      <div className="card-dark p-5">
        <div className="flex items-center gap-2 mb-1">
          <Vote size={18} className="text-orange-400" />
          <h3 className="font-serif text-lg text-orange-300">Votación popular</h3>
        </div>
        <p className="text-stone-400 text-sm mb-2">
          ¿A quién crees que debería ser ejecutado? Vota o abstente.
        </p>
        {esMion && !heUsadoObjeto && (
          <div className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2 mb-3">
            ✍️ Tu rotulador está activo. Tu voto contará por <strong>2</strong> esta ronda.
          </div>
        )}

        {miVoto ? (
          <div className="text-center py-4">
            <p className="text-emerald-400 text-sm mb-1">
              ✓ Has votado contra{' '}
              <strong>
                {miVoto.nominado_id === 'nadie'
                  ? 'nadie (abstención)'
                  : PERSONAJES.find(p => p.id === miVoto.nominado_id)?.nombre || miVoto.nominado_id}
              </strong>
            </p>
            <p className="text-stone-600 text-xs">Puedes cambiar tu voto hasta que el organizador cierre la votación.</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 mt-3">
          {vivosJugables.map(u => {
            const p = PERSONAJES.find(x => x.id === u.avatar)
            const esElegido = miVoto?.nominado_id === u.avatar
            return (
              <button
                key={u.id}
                disabled={cargandoAccion}
                onClick={() => onVotar(u.avatar)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left active:scale-95 ${
                  esElegido
                    ? 'border-red-600 bg-red-950/40 shadow-[0_0_15px_rgba(220,38,38,0.2)]'
                    : 'border-stone-700/50 bg-stone-900/40 hover:border-stone-600 hover:bg-stone-800/40'
                }`}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                  <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover" />
                </div>
                <span className={`text-sm font-medium ${esElegido ? 'text-red-300' : (p?.textColor || 'text-stone-300')}`}>
                  {u.nombre}
                </span>
                {esElegido && <span className="ml-auto text-red-400 text-xs">✓</span>}
              </button>
            )
          })}

          {/* Opción: nadie */}
          <button
            disabled={cargandoAccion}
            onClick={() => onVotar('nadie')}
            className={`col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all active:scale-95 ${
              miVoto?.nominado_id === 'nadie'
                ? 'border-stone-500 bg-stone-800/60 text-stone-300'
                : 'border-stone-800/50 text-stone-500 hover:border-stone-700 hover:text-stone-400'
            }`}
          >
            <Shield size={15} /> Abstención — Nadie debe morir
            {miVoto?.nominado_id === 'nadie' && <span className="text-xs">✓</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

function PantallaNoche({ personaje, miAvatar, misDatos, vivosJugables, todosVivos, miAccion, heUsadoObjeto, cargandoAccion, onAccion, bandoRevelado }) {
  const tipoAccion = personaje?.tipoAccion
  const esPasiva = tipoAccion === 'pasiva'
  const necesitaObjetivo = ['proteger', 'paralizar', 'revelar'].includes(tipoAccion)
  const esAsesino = misDatos?.bando === 'asesino'

  return (
    <div className="space-y-4">
      <div className="card-dark p-5 bg-gradient-to-b from-indigo-950/20 to-stone-950/20 border-indigo-900/30">
        <div className="flex items-center gap-2 mb-3">
          <Moon size={18} className="text-indigo-400" />
          <h3 className="font-serif text-lg text-indigo-300">La noche ha caído</h3>
        </div>
        <p className="text-stone-400 text-sm">
          {esAsesino
            ? '🗡️ Eres el Asesino. Elige a quién eliminar esta noche.'
            : `Tienes el ${personaje?.emoji} ${personaje?.objeto}. ${personaje?.descripcionObjeto}`}
        </p>
      </div>

      {/* ── Asesino: elegir víctima ── */}
      {esAsesino && !miAccion && (
        <div className="card-dark p-5">
          <p className="text-stone-400 text-sm mb-4">Elige tu víctima para esta noche:</p>
          <div className="grid grid-cols-2 gap-2">
            {vivosJugables.map(u => {
              const p = PERSONAJES.find(x => x.id === u.avatar)
              return (
                <button
                  key={u.id}
                  disabled={cargandoAccion}
                  onClick={() => onAccion(u.avatar, 'asesinar')}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-red-900/40 bg-red-950/20 hover:border-red-700 hover:bg-red-950/40 transition-all text-left active:scale-95"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                    <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-sm font-medium ${p?.textColor || 'text-stone-300'}`}>{u.nombre}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Aldeanos con objeto activo: elegir objetivo ── */}
      {!esAsesino && !esPasiva && !heUsadoObjeto && !miAccion && necesitaObjetivo && (
        <div className="card-dark p-5">
          <p className="text-stone-400 text-sm mb-4">¿A quién diriges tu {personaje?.objeto}?</p>
          <div className="grid grid-cols-2 gap-2">
            {todosVivos.filter(u => u.avatar !== miAvatar || tipoAccion === 'proteger').map(u => {
              const p = PERSONAJES.find(x => x.id === u.avatar)
              return (
                <button
                  key={u.id}
                  disabled={cargandoAccion}
                  onClick={() => onAccion(u.avatar, tipoAccion)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left active:scale-95
                    ${tipoAccion === 'paralizar'
                      ? 'border-violet-900/40 bg-violet-950/20 hover:border-violet-700'
                      : tipoAccion === 'revelar'
                      ? 'border-amber-900/40 bg-amber-950/20 hover:border-amber-700'
                      : 'border-blue-900/40 bg-blue-950/20 hover:border-blue-700'
                    }`}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                    <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-sm font-medium ${p?.textColor || 'text-stone-300'}`}>{u.nombre}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Pasivas: Rena y Rika ── */}
      {!esAsesino && esPasiva && (
        <div className="card-dark p-5 text-center">
          <div className="text-4xl mb-3">{personaje?.emoji}</div>
          <p className="text-stone-300 text-sm font-medium mb-1">Tu habilidad es pasiva</p>
          <p className="text-stone-500 text-xs">{personaje?.descripcionObjeto}</p>
          <p className="text-stone-600 text-xs mt-3">No necesitas hacer nada. Espera al amanecer.</p>
        </div>
      )}

      {/* ── Mion: voto doble ya usado en día, noche en espera ── */}
      {!esAsesino && tipoAccion === 'votar_doble' && !miAccion && (
        <div className="card-dark p-5 text-center">
          <div className="text-4xl mb-3">✍️</div>
          <p className="text-stone-300 text-sm font-medium mb-1">Tu Rotulador actúa de día</p>
          <p className="text-stone-500 text-xs">Durante la noche, solo puedes observar.</p>
        </div>
      )}

      {/* ── Confirmación de acción enviada ── */}
      {miAccion && (
        <div className="card-dark p-5 text-center border-emerald-900/40">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-emerald-300 text-sm font-medium">Acción registrada</p>
          <p className="text-stone-500 text-xs mt-1">Espera a que el organizador procese la noche.</p>
        </div>
      )}

      {/* ── Ya usó el objeto ── */}
      {!esAsesino && heUsadoObjeto && !esPasiva && (
        <div className="card-dark p-5 text-center opacity-60">
          <div className="text-4xl mb-3 grayscale">{personaje?.emoji}</div>
          <p className="text-stone-400 text-sm">Ya usaste tu {personaje?.objeto} en una ronda anterior.</p>
        </div>
      )}
    </div>
  )
}

function PantallaFinalizado({ ganador, misDatos, usuarios }) {
  const esMiVictoria =
    (ganador === 'aldeanos' && misDatos?.bando === 'aldeano') ||
    (ganador === 'asesino' && misDatos?.bando === 'asesino')

  const asesino = usuarios.find(u => u.bando === 'asesino')
  const pAsesino = PERSONAJES.find(p => p.id === asesino?.avatar)

  return (
    <div className="card-dark p-8 text-center space-y-5 animate-fade-in">
      {esMiVictoria ? (
        <>
          <div className="text-6xl animate-pulse-slow">🏆</div>
          <h2 className="font-serif text-3xl text-gradient-sunset">¡Victoria!</h2>
          <p className="text-stone-300 text-sm">
            {ganador === 'aldeanos'
              ? 'El pueblo de Hinamizawa ha triunfado. El asesino ha sido descubierto.'
              : 'La oscuridad ha ganado. Hinamizawa cae en el silencio.'}
          </p>
        </>
      ) : (
        <>
          <div className="text-6xl">💀</div>
          <h2 className="font-serif text-3xl text-red-400">Derrota</h2>
          <p className="text-stone-400 text-sm">
            {ganador === 'aldeanos'
              ? 'El asesino fue descubierto. Puedes descansar.'
              : 'El asesino ha ganado. La noche se impone.'}
          </p>
        </>
      )}

      {/* Revelar al asesino */}
      {asesino && (
        <div className="flex flex-col items-center gap-3 pt-3 border-t border-stone-800">
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
