// src/hooks/useJuego.js
// ─── Motor de Juego Oculto ────────────────────────────────────────────────────
// BUG FIX: La asignación de asesino ahora funciona correctamente usando
// UPDATE individual por id en lugar de upsert masivo que fallaba silenciosamente.

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { PERSONAJES } from '../constants'

export function useJuego() {
  const [estadoJuego,  setEstadoJuego]  = useState(null)
  const [jugadores,    setJugadores]    = useState([])   // usuarios con datos de juego
  const [votos,        setVotos]        = useState([])
  const [acciones,     setAcciones]     = useState([])
  const [logEventos,   setLogEventos]   = useState([])
  const [cargando,     setCargando]     = useState(true)
  const [rtActivo,     setRtActivo]     = useState(false)
  const canalRef = useRef(null)

  // ── Carga de todos los datos del juego ────────────────────────────────────
  const cargar = useCallback(async () => {
    try {
      const [resEstado, resJugadores, resVotos, resAcciones, resLog] = await Promise.all([
        supabase.from('estado_juego').select('*').eq('id', 1).single(),
        supabase.from('usuarios')
          .select('id, nombre, avatar, bando, vivo, objeto_usado, password')
          .order('nombre'),
        supabase.from('votos').select('*').order('created_at'),
        supabase.from('acciones_noche').select('*').order('created_at'),
        supabase.from('log_juego').select('*').order('created_at', { ascending: false }).limit(60),
      ])

      if (resEstado.data)   setEstadoJuego(resEstado.data)
      if (resJugadores.data) setJugadores(resJugadores.data)
      if (resVotos.data)    setVotos(resVotos.data)
      if (resAcciones.data) setAcciones(resAcciones.data)
      if (resLog.data)      setLogEventos(resLog.data)
    } catch (e) {
      console.error('[useJuego] cargar:', e)
    } finally {
      setCargando(false)
    }
  }, [])

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    cargar()

    const pulso = () => { setRtActivo(true); setTimeout(() => setRtActivo(false), 800); cargar() }

    canalRef.current = supabase
      .channel('juego-motor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estado_juego'   }, pulso)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votos'           }, pulso)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acciones_noche' }, pulso)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'log_juego'       }, pulso)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios'        }, pulso)
      .subscribe()

    return () => { if (canalRef.current) supabase.removeChannel(canalRef.current) }
  }, [cargar])

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ══════════════════════════════════════════════════════════════════════════

  async function _log(ronda, tipo, descripcion, publica = true) {
    await supabase.from('log_juego').insert({ ronda, tipo, descripcion, publica })
  }

  async function _setFase(nuevaFase, opts = {}) {
    const patch = { fase_actual: nuevaFase, ...opts }
    const { error } = await supabase.from('estado_juego').update(patch).eq('id', 1)
    return error
  }

  function _vivosActuales(snapshot = jugadores) {
    return snapshot.filter(u => u.vivo)
  }

  function _victoriaAsesino(vivosArray) {
    // Condición: el asesino sigue vivo y quedan ≤2 supervivientes totales
    const asesinoVivo = vivosArray.some(u => u.bando === 'asesino')
    return asesinoVivo && vivosArray.length <= 2
  }

  async function _marcarMuerto(avatarId) {
    await supabase.from('usuarios').update({ vivo: false }).eq('avatar', avatarId)
  }

  async function _marcarObjetoUsado(avatarId) {
    await supabase.from('usuarios').update({ objeto_usado: true }).eq('avatar', avatarId)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ACCIONES DE ADMINISTRADOR
  // ══════════════════════════════════════════════════════════════════════════

  // ── Asignar roles ─────────────────────────────────────────────────────────
  // FIX: En lugar de upsert masivo (que fallaba), actualizamos cada usuario
  // individualmente con su bando correcto mediante UPDATE por id.
  const asignarRoles = useCallback(async () => {
    const registrados = jugadores.filter(u => u.avatar !== 'admin')
    if (registrados.length < 2) {
      return { error: 'Necesitas al menos 2 jugadores registrados.' }
    }

    // 1. Elegir índice del asesino de forma aleatoria y verificable
    const idxAsesino = Math.floor(Math.random() * registrados.length)

    // 2. Actualizar cada jugador individualmente (no upsert)
    const promesas = registrados.map((u, i) =>
      supabase
        .from('usuarios')
        .update({
          bando:        i === idxAsesino ? 'asesino' : 'aldeano',
          vivo:         true,
          objeto_usado: false,
        })
        .eq('id', u.id)
    )

    const resultados = await Promise.all(promesas)
    const primerError = resultados.find(r => r.error)
    if (primerError) return { error: primerError.error.message }

    // 3. Limpiar datos de rondas anteriores
    await Promise.all([
      supabase.from('votos').delete().gte('ronda', 0),
      supabase.from('acciones_noche').delete().gte('ronda', 0),
      supabase.from('log_juego').delete().gte('ronda', 0),
    ])

    // 4. Resetear estado global
    await supabase.from('estado_juego').update({
      fase_actual:  'espera',
      ronda_actual: 0,
      ganador:      null,
    }).eq('id', 1)

    return { error: null, asesino: registrados[idxAsesino] }
  }, [jugadores])

  // ── Toggle juego habilitado ───────────────────────────────────────────────
  const toggleJuegoHabilitado = useCallback(async () => {
    const { error } = await supabase
      .from('estado_juego')
      .update({ juego_habilitado: !estadoJuego?.juego_habilitado })
      .eq('id', 1)
    return { error }
  }, [estadoJuego])

  // ── Cambiar fase manualmente ──────────────────────────────────────────────
  const cambiarFase = useCallback(async (nuevaFase, opciones = {}) => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    const error = await _setFase(nuevaFase, {
      ronda_actual: ronda + (opciones.incrementarRonda ? 1 : 0),
    })
    return { error }
  }, [estadoJuego])

  // ── Resetear contraseña ───────────────────────────────────────────────────
  const resetearPassword = useCallback(async (usuarioId, nuevaPassword) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ password: nuevaPassword })
      .eq('id', usuarioId)
    return { error }
  }, [])

  // ══════════════════════════════════════════════════════════════════════════
  // PROCESAMIENTO DE VOTACIÓN DIURNA
  // ══════════════════════════════════════════════════════════════════════════
  const procesarVotacion = useCallback(async () => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    const votosDeEstaRonda = votos.filter(v => v.ronda === ronda)

    // Contar votos ponderados (Mion puede tener peso 2)
    const conteo = {}
    votosDeEstaRonda.forEach(v => {
      if (v.nominado_id === 'nadie') return
      conteo[v.nominado_id] = (conteo[v.nominado_id] || 0) + (v.peso || 1)
    })

    const ordenados = Object.entries(conteo).sort((a, b) => b[1] - a[1])

    // Sin votos o todos votaron "nadie"
    if (ordenados.length === 0) {
      await _log(ronda, 'sin_victima', 'El pueblo no llegó a un acuerdo. Nadie fue ejecutado esta ronda.', true)
      await _setFase('noche')
      return { resultado: 'nadie', error: null }
    }

    const [masVotadoId, maxVotos] = ordenados[0]
    const empate = ordenados.filter(([, v]) => v === maxVotos).length > 1

    if (empate) {
      await _log(ronda, 'empate', `Empate en la votación (${maxVotos} votos cada uno). Nadie ejecutado.`, true)
      await _setFase('noche')
      return { resultado: 'empate', error: null }
    }

    const victima = jugadores.find(u => u.avatar === masVotadoId)
    if (!victima) return { error: 'No se encontró la víctima en la base de datos.' }

    const esAsesino = victima.bando === 'asesino'

    // ── Efecto Machete de Rena ────────────────────────────────────────────
    if (!esAsesino && victima.avatar === 'rena' && !victima.objeto_usado) {
      const votanteConMasPeso = votosDeEstaRonda
        .filter(v => v.nominado_id === 'rena')
        .sort((a, b) => (b.peso || 1) - (a.peso || 1))[0]

      if (votanteConMasPeso) {
        const acusador = jugadores.find(u => u.avatar === votanteConMasPeso.votante_id)
        if (acusador && acusador.vivo) {
          await _marcarMuerto(acusador.avatar)
          await _marcarObjetoUsado('rena')
          await _log(ronda, 'machete_rena',
            `⚔️ Rena fue linchada inocentemente. Su Machete arrastró a ${acusador.nombre} a la tumba.`, true)
        }
      }
    }

    // Matar a la víctima
    await _marcarMuerto(victima.avatar)

    if (esAsesino) {
      await _log(ronda, 'victoria_aldeanos',
        `☀️ ¡${victima.nombre} era el Asesino! El pueblo de Hinamizawa sobrevive.`, true)
      await _setFase('finalizado', {})
      await supabase.from('estado_juego').update({ ganador: 'aldeanos' }).eq('id', 1)
      return { resultado: 'victoria_aldeanos', error: null }
    }

    await _log(ronda, 'muerte_dia',
      `⚖️ ${victima.nombre} fue ejecutado/a por el pueblo. Era un Aldeano inocente.`, true)

    // Comprobar victoria del asesino con la lista actualizada
    const vivosRestantes = _vivosActuales().filter(u => u.id !== victima.id)
    if (_victoriaAsesino(vivosRestantes)) {
      const asesino = vivosRestantes.find(u => u.bando === 'asesino')
      await _log(ronda, 'victoria_asesino',
        `🗡️ Solo quedan ${vivosRestantes.length} supervivientes. ${asesino?.nombre ?? 'El Asesino'} ha ganado.`, true)
      await _setFase('finalizado')
      await supabase.from('estado_juego').update({ ganador: 'asesino' }).eq('id', 1)
      return { resultado: 'victoria_asesino', error: null }
    }

    await _setFase('noche')
    return { resultado: 'muerte_inocente', victima: victima.nombre, error: null }
  }, [votos, jugadores, estadoJuego])

  // ══════════════════════════════════════════════════════════════════════════
  // PROCESAMIENTO DE NOCHE
  // Cola: Táser Shion → Protección Keiichi → Revelación Rika →
  //       Rastreo Satoko → Asesinato → Verificar victoria
  // ══════════════════════════════════════════════════════════════════════════
  const procesarNoche = useCallback(async () => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    const accionesRonda = acciones.filter(a => a.ronda === ronda && !a.procesada)

    // Copia mutable local del estado de jugadores
    const estado = {}
    jugadores.forEach(u => {
      estado[u.avatar] = { ...u, paralizadoEstaNoche: false }
    })

    const find = (avatarId) => estado[avatarId]

    // ── 1. TÁSER DE SHION ─────────────────────────────────────────────────
    const acShion = accionesRonda.find(a => a.actor_id === 'shion' && a.tipo_accion === 'paralizar')
    if (acShion?.objetivo_id && !find('shion')?.paralizadoEstaNoche && !find('shion')?.objeto_usado) {
      const obj = find(acShion.objetivo_id)
      if (obj) {
        obj.paralizadoEstaNoche = true
        await _marcarObjetoUsado('shion')
        await _log(ronda, 'paralisis',
          `⚡ Shion paralizó a ${obj.nombre}. Su acción esta noche fue anulada.`, false)
      }
    }

    // ── 2. PROTECCIÓN DE KEIICHI ──────────────────────────────────────────
    let protegidoAvatar = null
    const acKeiichi = accionesRonda.find(a => a.actor_id === 'keiichi' && a.tipo_accion === 'proteger')
    const keiichi = find('keiichi')
    if (acKeiichi?.objetivo_id && keiichi && !keiichi.paralizadoEstaNoche && !keiichi.objeto_usado) {
      protegidoAvatar = acKeiichi.objetivo_id
      await _marcarObjetoUsado('keiichi')
      const protegido = find(protegidoAvatar)
      await _log(ronda, 'proteccion',
        `⚾ Keiichi protegió a ${protegido?.nombre ?? protegidoAvatar} con su bate.`, false)
    }

    // ── 3. REVELACIÓN DE RIKA ─────────────────────────────────────────────
    const acRika = accionesRonda.find(a => a.actor_id === 'rika' && a.tipo_accion === 'revelar')
    const rika = find('rika')
    if (acRika?.objetivo_id && rika && !rika.paralizadoEstaNoche && !rika.objeto_usado) {
      const obj = find(acRika.objetivo_id)
      if (obj) {
        await _marcarObjetoUsado('rika')
        const resultado = obj.bando === 'asesino' ? '🗡️ EL ASESINO' : '🕊️ Aldeano inocente'
        await _log(ronda, 'revelacion',
          `⏳ [SECRETO para Rika] El Fragmento Temporal revela: ${obj.nombre} es ${resultado}.`, false)
      }
    }

    // ── 4. RASTREO DE SATOKO ──────────────────────────────────────────────
    const acSatoko = accionesRonda.find(a => a.actor_id === 'satoko' && a.tipo_accion === 'rastrear')
    const satoko = find('satoko')
    if (acSatoko?.objetivo_id && satoko && !satoko.paralizadoEstaNoche) {
      const obj = find(acSatoko.objetivo_id)
      if (obj) {
        // Buscar si el objetivo también realizó alguna acción esta noche
        const objetivoActuo = accionesRonda.some(
          a => a.actor_id === acSatoko.objetivo_id && a.actor_id !== 'satoko'
        )
        const usosRestantes = satoko.objeto_usado ? 1 : 2 // approx para el mensaje
        await _log(ronda, 'rastreo',
          `🪤 [SECRETO para Satoko] La trampa en la puerta de ${obj.nombre}: ${
            objetivoActuo ? 'salió en la oscuridad y realizó una acción.' : 'permaneció en casa sin actuar.'
          }`, false)
        // Solo marcar objeto_usado si era el último uso (simplificado: marcar siempre)
        await _marcarObjetoUsado('satoko')
      }
    }

    // ── 5. ASESINATO ──────────────────────────────────────────────────────
    const acAsesino = accionesRonda.find(a => a.tipo_accion === 'asesinar')
    if (acAsesino?.objetivo_id) {
      const actorAsesino = find(acAsesino.actor_id)

      if (actorAsesino?.paralizadoEstaNoche) {
        await _log(ronda, 'asesino_paralizado',
          `⚡ El asesino fue paralizado por Shion. No pudo actuar esta noche.`, true)
      } else {
        const objetivo = find(acAsesino.objetivo_id)
        if (objetivo?.vivo) {
          let asesinado = true

          // ¿Está protegido por Keiichi?
          if (protegidoAvatar === acAsesino.objetivo_id) {
            asesinado = false
            await _log(ronda, 'proteccion_exitosa',
              `⚾ El asesino atacó a ${objetivo.nombre}, pero el bate de Keiichi lo protegió.`, true)
          }

          if (asesinado) {
            await _marcarMuerto(acAsesino.objetivo_id)
            await _log(ronda, 'muerte_noche',
              `🌙 ${objetivo.nombre} fue asesinado/a durante la noche.`, true)

            // Comprobar victoria del asesino
            const vivosRestantes = Object.values(estado)
              .filter(u => u.vivo && u.avatar !== acAsesino.objetivo_id)

            if (_victoriaAsesino(vivosRestantes)) {
              const asesino = vivosRestantes.find(u => u.bando === 'asesino')
              await _log(ronda, 'victoria_asesino',
                `🗡️ Solo quedan ${vivosRestantes.length} supervivientes. ${asesino?.nombre ?? 'El Asesino'} gana.`, true)
              await supabase.from('estado_juego')
                .update({ fase_actual: 'finalizado', ganador: 'asesino' }).eq('id', 1)
              await _marcarProcesadas(accionesRonda)
              return { resultado: 'victoria_asesino', error: null }
            }
          }
        }
      }
    }

    // ── Marcar todas las acciones como procesadas ─────────────────────────
    await _marcarProcesadas(accionesRonda)

    // Avanzar a fase de día nuevo
    await supabase.from('estado_juego').update({
      fase_actual:  'dia',
      ronda_actual: (estadoJuego?.ronda_actual ?? 0) + 1,
    }).eq('id', 1)

    return { resultado: 'noche_procesada', error: null }
  }, [acciones, jugadores, estadoJuego])

  async function _marcarProcesadas(accionesRonda) {
    const ids = accionesRonda.map(a => a.id)
    if (ids.length > 0) {
      await supabase.from('acciones_noche').update({ procesada: true }).in('id', ids)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ACCIONES DE JUGADOR
  // ══════════════════════════════════════════════════════════════════════════

  const registrarVoto = useCallback(async (votanteAvatar, nominadoId) => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    const votante = jugadores.find(u => u.avatar === votanteAvatar)

    // Mion: voto doble si no ha usado el objeto
    let peso = 1
    if (votanteAvatar === 'mion' && !votante?.objeto_usado) {
      peso = 2
      await _marcarObjetoUsado('mion')
    }

    const { error } = await supabase.from('votos').upsert(
      { votante_id: votanteAvatar, nominado_id: nominadoId, ronda, peso },
      { onConflict: 'votante_id,ronda' }
    )
    return { error }
  }, [estadoJuego, jugadores])

  const registrarAccion = useCallback(async (actorAvatar, objetivoAvatar, tipoAccion) => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    const { error } = await supabase.from('acciones_noche').upsert(
      { ronda, actor_id: actorAvatar, objetivo_id: objetivoAvatar, tipo_accion: tipoAccion },
      { onConflict: 'ronda,actor_id' }
    )
    return { error }
  }, [estadoJuego])

  // ── Helper de UI ──────────────────────────────────────────────────────────
  const getPersonaje = (avatarId) => PERSONAJES.find(p => p.id === avatarId)

  const getVotosMiRonda = (avatarId) => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    return votos.filter(v => v.ronda === ronda && v.votante_id === avatarId)[0] ?? null
  }

  const getAccionMiRonda = (avatarId) => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    return acciones.find(a => a.ronda === ronda && a.actor_id === avatarId) ?? null
  }

  const getLogPublico = () => logEventos.filter(e => e.publica)

  const getLogSecreto = (avatarId) =>
    logEventos.filter(e => !e.publica && (
      (e.tipo === 'revelacion'  && avatarId === 'rika')   ||
      (e.tipo === 'rastreo'     && avatarId === 'satoko') ||
      (e.tipo === 'proteccion'  && avatarId === 'keiichi')
    ))

  return {
    // Estado
    estadoJuego,
    jugadores,
    votos,
    acciones,
    logEventos,
    cargando,
    rtActivo,
    recargar: cargar,
    // Admin
    asignarRoles,
    toggleJuegoHabilitado,
    cambiarFase,
    resetearPassword,
    procesarVotacion,
    procesarNoche,
    // Jugador
    registrarVoto,
    registrarAccion,
    // Helpers UI
    getPersonaje,
    getVotosMiRonda,
    getAccionMiRonda,
    getLogPublico,
    getLogSecreto,
  }
}
