// src/components/VistaJuego.jsx
// ─── Vista del Jugador: Interfaz Calibrada Completa (v3.2) ───────────────────
// Paleta: Marrón Crema, Blanco y Textos de Alta Visibilidad.
// Preserva la estructura modular de sub-componentes original.

import { useState } from 'react'
import { Shield, Skull, Moon, Sun, Vote } from 'lucide-react'
import { PERSONAJES, FASES } from '../constants'
import { useJuego } from '../hooks/useJuego'

/**
 * @param {Object} usuario - El usuario en sesión (con avatar, id, nombre)
 */
export default function VistaJuego({ usuario }) {
  const juego = useJuego()
  const { estadoJuego, usuarios, votos, acciones, log, registrarVoto, registrarAccion } = juego

  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [cargandoAccion, setCargandoAccion] = useState(false)

  const miAvatar = usuario.avatar
  const misDatos = usuarios.find(u => u.avatar === miAvatar)
  const estoyVivo = misDatos?.vivo ?? true
  const cargasUsadas = misDatos?.objeto_usado ?? 0
  const personaje = PERSONAJES.find(p => p.id === miAvatar)

  const fase = estadoJuego?.fase_actual ?? 'espera'
  const ronda = estadoJuego?.ronda_actual ?? 0

  const votosRonda = votos.filter(v => v.ronda === ronda)
  const miVoto = votosRonda.find(v => v.votante_id === miAvatar)
  const miAccion = acciones.find(a => a.ronda === ronda && a.actor_id === miAvatar)

  const vivosJugables = usuarios.filter(u => u.vivo && u.avatar !== miAvatar)
  const todosVivos = usuarios.filter(u => u.vivo)

  // Buscar reporte secreto de la ronda anterior (si estamos en el día) o actual
  const miAccionDeLaNoche = acciones.find(
    a => a.actor_id === miAvatar && 
    a.ronda === (fase === 'dia' || fase === 'votacion' ? ronda - 1 : ronda)
  )

  // Recopilar sucesos públicos de la noche anterior para feedback diurno
  const sucesosDeLaNoche = log?.filter(
    l => l.ronda === (fase === 'dia' || fase === 'votacion' ? ronda - 1 : ronda) && l.publica
  ) || []

  const hacerAccion = async (objetivoId, tipoAccion) => {
    setCargandoAccion(true)
    setFeedbackMsg('')
    const { error } = await registrarAccion(miAvatar, objetivoId, tipoAccion)
    setCargandoAccion(false)
    if (error) {
      setFeedbackMsg('Error al enviar tu acción. Inténtalo de nuevo.')
    } else {
      setFeedbackMsg(
        miAvatar === 'satoko' 
          ? '✓ Alambre rastreador instalado. Revisarás el informe al amanecer.' 
          : '✓ Acción registrada en absoluto secreto.'
      )
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
        : `✓ Voto registrado confidencialmente.`
      )
    }
    setTimeout(() => setFeedbackMsg(''), 5000)
  }

  // ── Si el juego no está habilitado ───────────────────────────────────────
  if (!estadoJuego?.juego_habilitado) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed flex flex-col items-center justify-center bg-[url('/fondos/fondojuego_movil.png')] md:bg-[url('/fondos/fondojuego_pc.png')] p-4">
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in bg-[#fdfbf7] p-8 rounded-2xl border border-[#decfa8]/50 shadow-2xl max-w-sm">
          <div className="text-6xl mb-6">🦗</div>
          <h2 className="font-serif text-2xl text-stone-800 mb-3 font-bold">Las cigarras guardan silencio</h2>
          <p className="text-stone-600 text-sm">
            El juego aún no ha sido activado por el organizador. Espera pacientemente.
          </p>
        </div>
      </div>
    )
  }

  // ── Pantalla de espectador para muertos (No se activa si el juego terminó) ──
  if (!estoyVivo && fase !== FASES.FINALIZADO) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed flex flex-col items-center justify-center bg-[url('/fondos/fondojuego_movil.png')] md:bg-[url('/fondos/fondojuego_pc.png')] p-4">
        <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in space-y-5 bg-[#fdfbf7] p-8 rounded-2xl border border-red-900/30 shadow-2xl w-full max-w-sm">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-red-900/40 opacity-40 grayscale shadow-inner">
            <img src={personaje?.avatar} alt={usuario.nombre} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-serif text-3xl text-red-700 font-bold mb-2">☠ Has muerto</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              Tu historia en Hinamizawa ha llegado a su fin. Observa el resto de la partida en silencio.
            </p>
          </div>
          <div className="bg-white p-4 w-full rounded-xl border border-stone-200 shadow-sm text-left">
            <p className="text-[#5c4033] text-xs font-bold uppercase tracking-widest mb-3 text-center">Supervivientes en pie</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {todosVivos.map(u => {
                const p = PERSONAJES.find(x => x.id === u.avatar)
                return (
                  <div key={u.id} className="flex items-center gap-3 p-1.5 hover:bg-stone-5/30 rounded-lg">
                    <div className="w-7 h-7 rounded-md overflow-hidden bg-stone-100 border border-stone-200">
                      <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-medium text-stone-800">{u.nombre}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed flex flex-col justify-center bg-[url('/fondos/fondojuego_movil.png')] md:bg-[url('/fondos/fondojuego_pc.png')] p-4">
      <div className="animate-fade-in space-y-5 w-full max-w-3xl mx-auto py-4">

        {/* ── Tarjeta Maestra: Mi Personaje ── */}
        <div className="bg-[#fdfbf7] p-5 rounded-2xl border border-[#decfa8]/60 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-stone-300 shrink-0 shadow-md">
              <img src={personaje?.avatar} alt={usuario.nombre} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-xl font-bold text-stone-900">
                {usuario.nombre}
              </h2>
              <p className="text-stone-600 text-sm mt-0.5 font-medium">
                {miAvatar === 'satoko' ? 'Coloca hilos espía invisibles para saber quién sale de su casa.' : personaje?.descripcion}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                  {personaje?.emoji} {miAvatar === 'rika' ? 'Fragmento Temporal' : miAvatar === 'satoko' ? 'Kit de Alambres' : personaje?.objeto}
                </span>
                <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200 font-mono">
                  Usos: {cargasUsadas}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Reporte Secreto Nocturno (Personal e Invisible para el resto) ── */}
        {(fase === 'dia' || fase === 'votacion') && miAccionDeLaNoche?.resultado_secreto && (
          <div className="bg-[#fffdf9] border-l-4 border-indigo-600 p-4 rounded-r-xl shadow-md animate-fade-in">
            <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
              <span>🕵️</span> Reporte de Inteligencia Confidencial
            </p>
            <p className="text-stone-800 text-sm mt-1 font-medium leading-relaxed">
              {miAccionDeLaNoche.resultado_secreto}
            </p>
          </div>
        )}

        {/* ── Indicador de Fase Global ── */}
        <FaseIndicador fase={fase} ronda={ronda} />

        {/* ── Feedback de Operaciones ── */}
        {feedbackMsg && (
          <div className={`p-3 rounded-lg text-sm border text-center font-medium shadow-md transition-all ${
            feedbackMsg.startsWith('Error')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            {feedbackMsg}
          </div>
        )}

        {/* ── Feedback del Amanecer: Sucesos Crípticos Ambientales ── */}
        {(fase === 'dia' || fase === 'votacion') && sucesosDeLaNoche.length > 0 && (
          <div className="bg-[#fdfbf7] border-l-4 border-amber-700 p-4 rounded-r-xl shadow-md space-y-2">
            <p className="text-xs font-bold text-[#5c4033] uppercase tracking-widest flex items-center gap-1.5">
              <span>📢</span> Crónica del Consejo de Hinamizawa
            </p>
            <div className="divide-y divide-stone-100">
              {sucesosDeLaNoche.map(suceso => (
                <p key={suceso.id} className="text-stone-700 text-xs py-1.5 font-medium leading-relaxed">
                  • {suceso.descripcion}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ── Despliegue Dinámico de Pantallas Modulares ── */}
        {fase === FASES.ESPERA && <PantallaEspera />}

        {fase === FASES.DIA && <PantallaDia todosVivos={todosVivos} />}

        {fase === FASES.VOTACION && (
          <PantallaVotacion
            miAvatar={miAvatar}
            vivosJugables={vivosJugables}
            todosVivos={todosVivos}
            miVoto={miVoto}
            cargandoAccion={cargandoAccion}
            onVotar={hacerVoto}
            esMion={miAvatar === 'mion'}
            cargasUsadas={cargasUsadas}
          />
        )}

        {fase === FASES.NOCHE && (
          <PantallaNoche
            personaje={personaje}
            miAvatar={miAvatar}
            misDatos={misDatos}
            vivosJugables={vivosJugables}
            todosVivos={todosVivos}
            miAccion={miAccion}
            cargasUsadas={cargasUsadas}
            cargandoAccion={cargandoAccion}
            onAccion={hacerAccion}
          />
        )}

        {fase === FASES.FINALIZADO && (
          <PantallaFinalizado
            ganador={estadoJuego?.ganador}
            misDatos={misDatos}
            usuarios={usuarios}
          />
        )}

        {/* ── Tablero de Supervivientes Permanente ── */}
        <div className="bg-[#fdfbf7] p-4 rounded-xl border border-[#decfa8]/50 shadow-md">
          <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mb-3">Supervivientes en el festival · Ronda {ronda}</p>
          <div className="flex flex-wrap gap-2">
            {usuarios.map(u => {
              const p = PERSONAJES.find(x => x.id === u.avatar)
              return (
                <div key={u.id} title={u.nombre}
                  className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all shadow-sm ${
                    u.vivo
                      ? 'border-amber-700/40 opacity-100 scale-100'
                      : 'border-stone-300 opacity-20 grayscale scale-95'
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
    </div>
  )
}

// ── Sub-componentes Estilizados e Íntegros ───────────────────────────────────────

function FaseIndicador({ fase, ronda }) {
  const config = {
    espera:     { label: 'Fase de Preparación', icon: '🦗', color: 'text-stone-700 bg-stone-100 border-stone-200' },
    dia:        { label: `Consejo Abierto · R${ronda}`, icon: '☀️', color: 'text-amber-800 bg-amber-50 border-amber-200' },
    votacion:   { label: `Urnas Abiertas · R${ronda}`, icon: '🗳️', color: 'text-orange-800 bg-orange-50 border-orange-200' },
    noche:      { label: `Silencio de Noche · R${ronda}`, icon: '🌙', color: 'text-indigo-800 bg-indigo-50 border-indigo-200' },
    finalizado: { label: 'Fin de la Partida', icon: '⚖️', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  }
  const c = config[fase] || config.espera
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold shadow-sm w-fit bg-white ${c.color}`}>
      <span>{c.icon}</span>{c.label}
    </div>
  )
}

function PantallaEspera() {
  return (
    <div className="bg-[#fdfbf7] border border-[#decfa8]/60 p-8 text-center rounded-2xl shadow-xl">
      <div className="text-5xl mb-4 animate-bounce">🦗</div>
      <h3 className="font-serif text-xl text-stone-800 font-bold mb-2">Hinamizawa en calma</h3>
      <p className="text-stone-600 text-sm">El organizador iniciará el juego pronto. Revisa tu equipamiento.</p>
    </div>
  )
}

function PantallaDia({ todosVivos }) {
  return (
    <div className="bg-[#fdfbf7] border border-[#decfa8]/60 p-6 text-center rounded-2xl shadow-xl">
      <Sun size={36} className="text-amber-600 mx-auto mb-3" />
      <h3 className="font-serif text-xl text-amber-900 font-bold mb-2">Fase de Discusión Diurna</h3>
      <p className="text-stone-600 text-sm mb-5 leading-relaxed">
        Habla con tus compañeros de mesa. Intercambia sospechas, debate, defiéndete de las acusaciones. El organizador abrirá las urnas a su debido tiempo.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {todosVivos.map(u => {
          const p = PERSONAJES.find(x => x.id === u.avatar)
          return (
            <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-stone-200 shadow-sm">
              <div className="w-5 h-5 rounded-full overflow-hidden border border-stone-200">
                <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-bold text-stone-700">{u.nombre}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PantallaVotacion({ miAvatar, vivosJugables, miVoto, cargandoAccion, onVotar, esMion, cargasUsadas }) {
  const haQuemadoVotoDoble = cargasUsadas >= 1
  return (
    <div className="bg-[#fdfbf7] border border-[#decfa8]/60 p-5 rounded-2xl shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
        <Vote size={18} className="text-orange-600" />
        <h3 className="font-serif text-lg text-stone-900 font-bold">Votación Popular Obligatoria</h3>
      </div>
      <p className="text-stone-600 text-sm">
        ¿A quién consideras responsable de los incidentes? Elige a un sospechoso para su ejecución o abstente.
      </p>
      {esMion && !haQuemadoVotoDoble && (
        <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 shadow-inner font-medium">
          ✍️ Tu rotulador está activo. Tu voto contará por <strong>2</strong> esta ronda debido a tu influencia.
        </div>
      )}

      {miVoto ? (
        <div className="text-center py-3 bg-stone-50 rounded-xl border border-stone-200 shadow-inner">
          <p className="text-emerald-700 text-sm font-bold">
            ✓ Voto enviado contra:{' '}
            <span className="underline">
              {miVoto.nominado_id === 'nadie'
                ? 'nadie (abstención)'
                : PERSONAJES.find(p => p.id === miVoto.nominado_id)?.nombre || miVoto.nominado_id}
            </span>
          </p>
          <p className="text-stone-500 text-xs mt-0.5">Puedes modificar tu selección hasta el cierre del organizador.</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        {vivosJugables.map(u => {
          const p = PERSONAJES.find(x => x.id === u.avatar)
          const esElegido = miVoto?.nominado_id === u.avatar
          return (
            <button
              key={u.id}
              disabled={cargandoAccion}
              onClick={() => onVotar(u.avatar)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left active:scale-[0.98] shadow-sm ${
                esElegido
                  ? 'border-red-600 bg-red-50 text-red-900 font-bold'
                  : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800'
              }`}
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm truncate">{u.nombre}</span>
              {esElegido && <span className="ml-auto text-red-600 font-bold">✓</span>}
            </button>
          )
        })}

        <button
          disabled={cargandoAccion}
          onClick={() => onVotar('nadie')}
          className={`col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all active:scale-[0.98] shadow-sm font-medium ${
            miVoto?.nominado_id === 'nadie'
              ? 'border-stone-400 bg-stone-200 text-stone-800 font-bold'
              : 'border-stone-200 bg-white text-stone-500 hover:text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Shield size={15} /> Abstención — Nadie debe morir
          {miVoto?.nominado_id === 'nadie' && <span className="text-xs ml-1">✓</span>}
        </button>
      </div>
    </div>
  )
}

function PantallaNoche({ personaje, miAvatar, misDatos, vivosJugables, todosVivos, miAccion, cargasUsadas, cargandoAccion, onAccion }) {
  const tipoAccion = personaje?.tipoAccion
  const esPasiva = miAvatar === 'rena'
  
  // Satoko dispone de 2 cargas máximas; el resto de aldeanos activos de 1 carga
  const tieneCargasDisponibles = miAvatar === 'satoko' ? cargasUsadas < 2 : cargasUsadas < 1
  const esAsesino = misDatos?.bando === 'asesino'

  return (
    <div className="bg-[#fdfbf7] border border-[#decfa8]/60 p-5 rounded-2xl shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
        <Moon size={16} className="text-indigo-600" />
        <h3 className="font-serif text-lg text-stone-900 font-bold">Operaciones de Noche Secreta</h3>
      </div>
      <p className="text-stone-600 text-sm leading-relaxed">
        {esAsesino
          ? '🗡️ Eres el Asesino. Selecciona quirúrgicamente a tu objetivo estratégico de esta noche.'
          : miAvatar === 'satoko'
          ? `Posees tu ${personaje?.emoji} ${personaje?.objeto}. Coloca hilos tensores en las puertas para verificar al amanecer si alguien salió de su hogar.`
          : miAvatar === 'rika'
          ? `Posees tu ${personaje?.emoji} Fragmento Temporal. Elige a un habitante de la mesa para revelar con absoluta certeza su bando.`
          : `Posees el/la ${personaje?.emoji} ${personaje?.objeto}. ${personaje?.descripcionObjeto}`}
      </p>

      {/* Control Asesino */}
      {esAsesino && !miAccion && (
        <div className="grid grid-cols-2 gap-2 pt-2">
          {vivosJugables.map(u => {
            const p = PERSONAJES.find(x => x.id === u.avatar)
            return (
              <button
                key={u.id}
                disabled={cargandoAccion}
                onClick={() => onAccion(u.avatar, 'asesinar')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-red-200 bg-white hover:bg-red-50/50 text-stone-800 shadow-sm transition-all text-left active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                  <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover" />
                </div>
                <span className="text-sm truncate">{u.nombre}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Control Aldeanos Activos con cargas (Rika = revelar, Satoko = paralizar estructural, Shion = paralizar, Keiichi = proteger) */}
      {!esAsesino && !esPasiva && tieneCargasDisponibles && !miAccion && miAvatar !== 'mion' && (
        <div className="grid grid-cols-2 gap-2 pt-2">
          {todosVivos.filter(u => u.avatar !== miAvatar || miAvatar === 'keiichi').map(u => {
            const p = PERSONAJES.find(x => x.id === u.avatar)
            return (
              <button
                key={u.id}
                disabled={cargandoAccion}
                onClick={() => onAccion(u.avatar, miAvatar === 'satoko' ? 'paralizar' : miAvatar === 'rika' ? 'revelar' : miAvatar === 'shion' ? 'paralizar' : 'proteger')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 shadow-sm transition-all text-left active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                  <img src={p?.avatar} alt={u.nombre} className="w-full h-full object-cover" />
                </div>
                <span className="text-sm truncate">{u.nombre}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Pasivas */}
      {!esAsesino && esPasiva && (
        <p className="text-center text-xs text-stone-500 bg-stone-50 py-3 rounded-lg border border-stone-200">
          Tu habilidad con el machete es de naturaleza puramente reactiva. El sistema operará automáticamente en las votaciones si te ejecutan. Espera al amanecer.
        </p>
      )}

      {/* Mion */}
      {!esAsesino && miAvatar === 'mion' && (
        <p className="text-center text-xs text-stone-500 bg-stone-50 py-3 rounded-lg border border-stone-200">
          Tu Rotulador ejerce presión política durante el día. Durante la noche mantienes un perfil observador.
        </p>
      )}

      {/* Confirmación */}
      {miAccion && (
        <p className="text-center text-sm font-bold text-emerald-700 bg-emerald-50 py-2.5 rounded-xl border border-emerald-200 shadow-inner">
          ✓ Tu comando secreto ha sido registrado. Esperando procesamiento del organizador.
        </p>
      )}

      {/* Recursos Agotados */}
      {!esAsesino && !tieneCargasDisponibles && !esPasiva && miAvatar !== 'mion' && (
        <p className="text-center text-xs text-stone-400 bg-stone-50/50 py-3 rounded-lg border border-stone-200 border-dashed grayscale">
          Has agotado por completo tus objetos estratégicos y cargas tácticas para el resto de la partida.
        </p>
      )}
    </div>
  )
}

function PantallaFinalizado({ ganador, misDatos, usuarios }) {
  // Búsqueda dinámica y local en el cliente para determinar la victoria de forma hermética
  const miUsuarioReal = usuarios.find(u => u.id === misDatos?.id)
  const esAsesino = miUsuarioReal?.bando === 'asesino'
  const esMiVictoria = (ganador === 'aldeanos' && !esAsesino) || (ganador === 'asesino' && esAsesino)
  
  const elAsesino = usuarios.find(u => u.bando === 'asesino')
  const pAsesino = PERSONAJES.find(p => p.id === elAsesino?.avatar)

  return (
    <div className="bg-[#fdfbf7] border-2 border-stone-300 p-8 text-center space-y-5 rounded-2xl shadow-2xl animate-fade-in max-w-xl mx-auto">
      {esMiVictoria ? (
        <>
          <div className="text-6xl animate-bounce">🏆</div>
          <h2 className="font-serif text-3xl text-amber-600 font-bold tracking-wide">¡Victoria Confirmada!</h2>
          <p className="text-stone-700 text-sm leading-relaxed font-medium">
            {ganador === 'aldeanos'
              ? 'El pueblo de Hinamizawa ha neutralizado la amenaza. El asesino ha sido ejecutado.'
              : 'La maldición de Oyashiro-sama se impone. Hinamizawa cae en el silencio eterno.'}
          </p>
        </>
      ) : (
        <>
          <div className="text-6xl animate-pulse">💀</div>
          <h2 className="font-serif text-3xl text-red-700 font-bold tracking-wide">Operación Fallida: Derrota</h2>
          <p className="text-stone-600 text-sm leading-relaxed font-medium">
            {ganador === 'aldeanos'
              ? 'El complot ha sido desmantelado. Has caído en el veredicto.'
              : 'El asesino ha completado su purga táctica con éxito.'}
          </p>
        </>
      )}

      {/* Revelación Maestra del Asesino al Final de la Partida */}
      {elAsesino && (
        <div className="flex flex-col items-center gap-3 pt-5 border-t border-stone-200 bg-white p-4 rounded-xl shadow-sm">
          <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">Identidad del Asesino Oculto</p>
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-red-600/50 shadow-md">
            <img src={pAsesino?.avatar} alt={elAsesino.nombre} className="w-full h-full object-cover" />
          </div>
          <p className={`font-serif text-xl font-bold ${pAsesino?.textColor || 'text-red-700'}`}>
            {elAsesino.nombre} ({elAsesino.nombre === miUsuarioReal?.nombre ? 'Tú eras el traidor' : 'Infiltrado'})
          </p>
        </div>
      )}
    </div>
  )
}