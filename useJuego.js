// src/hooks/useJuego.js
// ─── Hook: Motor de Estado del Juego Oculto ──────────────────────────────────
// Gestiona estado_juego, votos, acciones_noche con Realtime.
// El procesamiento de noches y victorias ocurre aquí (llamado desde el admin).

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { PERSONAJES } from '../constants'

export function useJuego() {
  const [estadoJuego, setEstadoJuego] = useState(null)
  const [usuarios,    setUsuarios]    = useState([])
  const [votos,       setVotos]       = useState([])
  const [acciones,    setAcciones]    = useState([])
  const [log,         setLog]         = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [rtActivo,    setRtActivo]    = useState(false)

  // ── Carga completa ────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [resEstado, resUsuarios, resVotos, resAcciones, resLog] = await Promise.all([
        supabase.from('estado_juego').select('*').single(),
        supabase.from('usuarios').select('id,nombre,avatar,bando,vivo,objeto_usado').order('nombre'),
        supabase.from('votos').select('*').order('created_at'),
        supabase.from('acciones_noche').select('*').order('created_at'),
        supabase.from('log_juego').select('*').order('created_at', { ascending: false }).limit(50),
      ])
      if (resEstado.data)  setEstadoJuego(resEstado.data)
      if (resUsuarios.data) setUsuarios(resUsuarios.data)
      if (resVotos.data)   setVotos(resVotos.data)
      if (resAcciones.data) setAcciones(resAcciones.data)
      if (resLog.data)     setLog(resLog.data)
    } catch (e) {
      console.error('useJuego cargar:', e)
    } finally {
      setCargando(false)
    }
  }, [])

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    cargar()

    const canal = supabase
      .channel('juego-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estado_juego' }, () => {
        setRtActivo(true); setTimeout(() => setRtActivo(false), 800); cargar()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votos' }, () => {
        setRtActivo(true); setTimeout(() => setRtActivo(false), 800); cargar()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acciones_noche' }, () => {
        setRtActivo(true); setTimeout(() => setRtActivo(false), 800); cargar()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, () => {
        cargar()
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [cargar])

  // ══════════════════════════════════════════════════════════════════════════
  // ACCIONES DEL ADMINISTRADOR
  // ══════════════════════════════════════════════════════════════════════════

  // ── Cambiar fase ─────────────────────────────────────────────────────────
  const cambiarFase = useCallback(async (nuevaFase, rondaDelta = 0) => {
    const rondaActual = estadoJuego?.ronda_actual ?? 0
    const { error } = await supabase
      .from('estado_juego')
      .update({
        fase_actual: nuevaFase,
        ronda_actual: rondaActual + rondaDelta,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
    if (error) console.error('cambiarFase:', error)
    return { error }
  }, [estadoJuego])

  // ── Habilitar / deshabilitar juego ────────────────────────────────────────
  const toggleJuegoHabilitado = useCallback(async () => {
    const { error } = await supabase
      .from('estado_juego')
      .update({ juego_habilitado: !estadoJuego?.juego_habilitado })
      .eq('id', 1)
    return { error }
  }, [estadoJuego])

  // ── Asignar roles aleatoriamente (1 asesino, 5 aldeanos) ─────────────────
  const asignarRoles = useCallback(async () => {
    const vivos = usuarios.filter(u => u.avatar !== 'admin')
    if (vivos.length === 0) return { error: 'No hay usuarios registrados.' }

    // Elegir asesino aleatorio
    const idxAsesino = Math.floor(Math.random() * vivos.length)
    const updates = vivos.map((u, i) => ({
      id: u.id,
      bando: i === idxAsesino ? 'asesino' : 'aldeano',
      vivo: true,
      objeto_usado: false,
    }))

    const { error } = await supabase.from('usuarios').upsert(updates)
    if (error) return { error: error.message }

    // Limpiar votos y acciones previas
    const ronda = estadoJuego?.ronda_actual ?? 0
    await supabase.from('votos').delete().gte('ronda', 0)
    await supabase.from('acciones_noche').delete().gte('ronda', 0)
    await supabase.from('log_juego').delete().gte('ronda', 0)

    await supabase.from('estado_juego').update({
      fase_actual: 'espera',
      ronda_actual: 0,
      ganador: null,
    }).eq('id', 1)

    return { error: null }
  }, [usuarios, estadoJuego])

  // ── Restablecer contraseña de usuario ─────────────────────────────────────
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
    const votosRonda = votos.filter(v => v.ronda === ronda)

    // Contar votos con pesos
    const conteo = {}
    votosRonda.forEach(v => {
      if (v.nominado_id === 'nadie') return
      conteo[v.nominado_id] = (conteo[v.nominado_id] || 0) + (v.peso || 1)
    })

    const entries = Object.entries(conteo).sort((a, b) => b[1] - a[1])

    if (entries.length === 0) {
      // Nadie fue votado
      await _logEvento(ronda, 'sin_victima_dia', 'El pueblo no llegó a un acuerdo. Nadie fue ejecutado.', true)
      await cambiarFase('noche')
      return { resultado: 'nadie', error: null }
    }

    const [masVotadoId, maxVotos] = entries[0]
    // Empate entre los primeros → nadie ejecutado
    const empate = entries.filter(([, v]) => v === maxVotos).length > 1

    if (empate) {
      await _logEvento(ronda, 'empate_dia', 'Empate en la votación. Nadie fue ejecutado.', true)
      await cambiarFase('noche')
      return { resultado: 'empate', error: null }
    }

    const victima = usuarios.find(u => u.avatar === masVotadoId)
    if (!victima) return { error: 'Víctima no encontrada' }

    const esAsesino = victima.bando === 'asesino'

    // Efecto Machete de Rena: si Rena es la víctima inocente, ejecuta al mayor votante suyo
    let victoriaAsesino = false
    if (!esAsesino && victima.avatar === 'rena') {
      const renaObj = usuarios.find(u => u.avatar === 'rena' && !u.objeto_usado)
      if (renaObj) {
        // Buscar quién la votó más (o simplemente el primer votante)
        const votanteRena = votosRonda
          .filter(v => v.nominado_id === 'rena')
          .sort((a, b) => (b.peso || 1) - (a.peso || 1))[0]

        if (votanteRena) {
          const acusador = usuarios.find(u => u.avatar === votanteRena.votante_id)
          if (acusador) {
            await supabase.from('usuarios').update({ vivo: false }).eq('id', acusador.id)
            await supabase.from('usuarios').update({ objeto_usado: true }).eq('id', renaObj.id)
            await _logEvento(ronda, 'machete_rena',
              `Rena fue linchada inocentemente. Su Machete ejecutó a ${acusador.nombre}.`, true)
          }
        }
      }
    }

    // Marcar víctima como muerta
    await supabase.from('usuarios').update({ vivo: false }).eq('id', victima.id)

    if (esAsesino) {
      await _logEvento(ronda, 'victoria_aldeanos',
        `¡${victima.nombre} era el Asesino! El pueblo de Hinamizawa está a salvo.`, true)
      await supabase.from('estado_juego').update({ fase_actual: 'finalizado', ganador: 'aldeanos' }).eq('id', 1)
      return { resultado: 'victoria_aldeanos', error: null }
    } else {
      await _logEvento(ronda, 'muerte_dia',
        `${victima.nombre} fue ejecutado/a por el pueblo. Era un Aldeano inocente.`, true)
    }

    // Comprobar condición de victoria del asesino tras la muerte
    const vivosDespues = usuarios.filter(u => u.vivo && u.id !== victima.id)
    victoriaAsesino = _comprobarVictoriaAsesino(vivosDespues)

    if (victoriaAsesino) {
      const asesino = usuarios.find(u => u.bando === 'asesino' && u.id !== victima.id)
      await _logEvento(ronda, 'victoria_asesino',
        `Solo quedan 2 supervivientes. ${asesino?.nombre || 'El Asesino'} ha ganado.`, true)
      await supabase.from('estado_juego').update({ fase_actual: 'finalizado', ganador: 'asesino' }).eq('id', 1)
      return { resultado: 'victoria_asesino', error: null }
    }

    await cambiarFase('noche')
    return { resultado: 'muerte_inocente', victima: victima.nombre, error: null }
  }, [votos, usuarios, estadoJuego, cambiarFase])

  // ══════════════════════════════════════════════════════════════════════════
  // PROCESAMIENTO DE NOCHE
  // Cola: Táser Shion → Protección Keiichi → Asesinato → Pasiva Rika
  // ══════════════════════════════════════════════════════════════════════════
  const procesarNoche = useCallback(async () => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    const accionesRonda = acciones.filter(a => a.ronda === ronda && !a.procesada)

    // Estado de jugadores en copia local mutable
    const estadoLocal = usuarios.reduce((acc, u) => {
      acc[u.avatar] = { ...u, paralizadoEstaNoche: false }
      return acc
    }, {})

    // ── 1. TÁSER DE SHION (paralizar) ─────────────────────────────────────
    const accionShion = accionesRonda.find(a => a.actor_id === 'shion' && a.tipo_accion === 'paralizar')
    if (accionShion?.objetivo_id && estadoLocal['shion'] && !estadoLocal['shion'].paralizadoEstaNoche) {
      const objetivo = accionShion.objetivo_id
      if (estadoLocal[objetivo]) {
        estadoLocal[objetivo].paralizadoEstaNoche = true
        await _logEvento(ronda, 'paralisis',
          `Shion ha paralizado a ${estadoLocal[objetivo]?.nombre}. Su acción esta noche ha sido anulada.`, false)
      }
    }

    // ── 2. PROTECCIÓN DE KEIICHI ──────────────────────────────────────────
    let protegidoId = null
    const accionKeiichi = accionesRonda.find(a => a.actor_id === 'keiichi' && a.tipo_accion === 'proteger')
    const keiichi = estadoLocal['keiichi']
    if (accionKeiichi?.objetivo_id && keiichi && !keiichi.paralizadoEstaNoche && !keiichi.objeto_usado) {
      protegidoId = accionKeiichi.objetivo_id
      await supabase.from('usuarios').update({ objeto_usado: true }).eq('avatar', 'keiichi')
      await _logEvento(ronda, 'proteccion',
        `Keiichi protegió con su bate a ${estadoLocal[protegidoId]?.nombre}.`, false)
    }

    // ── 3. REVELACIÓN DE SATOKO ───────────────────────────────────────────
    const accionSatoko = accionesRonda.find(a => a.actor_id === 'satoko' && a.tipo_accion === 'revelar')
    const satoko = estadoLocal['satoko']
    if (accionSatoko?.objetivo_id && satoko && !satoko.paralizadoEstaNoche && !satoko.objeto_usado) {
      const obj = estadoLocal[accionSatoko.objetivo_id]
      if (obj) {
        await supabase.from('usuarios').update({ objeto_usado: true }).eq('avatar', 'satoko')
        await _logEvento(ronda, 'revelacion',
          `Satoko reveló que ${obj.nombre} es ${obj.bando === 'asesino' ? 'EL ASESINO' : 'un Aldeano'}.`,
          false // Solo el admin lo ve; en la UI del jugador se le puede notificar aparte
        )
      }
    }

    // ── 4. ASESINATO DEL ASESINO ──────────────────────────────────────────
    const accionAsesino = accionesRonda.find(a => a.tipo_accion === 'asesinar')
    const actorAsesino = accionAsesino ? estadoLocal[accionAsesino.actor_id] : null

    if (accionAsesino?.objetivo_id && actorAsesino && !actorAsesino.paralizadoEstaNoche) {
      const objetivoId = accionAsesino.objetivo_id
      const objetivo = estadoLocal[objetivoId]

      if (objetivo && objetivo.vivo) {
        let asesinado = true

        // ¿Está protegido?
        if (protegidoId === objetivoId) {
          asesinado = false
          await _logEvento(ronda, 'proteccion_exitosa',
            `El asesino intentó matar a ${objetivo.nombre}, pero Keiichi lo protegió.`, true)
        }

        // ¿Pasiva de Rika (primer intento)?
        if (asesinado && objetivoId === 'rika') {
          const rika = usuarios.find(u => u.avatar === 'rika')
          if (rika && !rika.objeto_usado) {
            asesinado = false
            await supabase.from('usuarios').update({ objeto_usado: true }).eq('avatar', 'rika')
            await _logEvento(ronda, 'pasiva_rika',
              'El Fragmento de Tiempo de Rika absorbió el ataque. Ha sobrevivido esta noche.', true)
          }
        }

        if (asesinado) {
          await supabase.from('usuarios').update({ vivo: false }).eq('avatar', objetivoId)
          await _logEvento(ronda, 'muerte_noche',
            `${objetivo.nombre} fue asesinado/a durante la noche.`, true)

          // Comprobar victoria del asesino
          const vivosDespues = Object.values(estadoLocal)
            .filter(u => u.vivo && u.avatar !== objetivoId)
          if (_comprobarVictoriaAsesino(vivosDespues)) {
            const asesino = vivosDespues.find(u => u.bando === 'asesino')
            await _logEvento(ronda, 'victoria_asesino',
              `Solo quedan 2 supervivientes. ${asesino?.nombre || 'El Asesino'} ha ganado.`, true)
            await supabase.from('estado_juego').update({
              fase_actual: 'finalizado',
              ganador: 'asesino',
            }).eq('id', 1)
            // Marcar acciones como procesadas
            await _marcarAccionesProcesadas(accionesRonda)
            return { resultado: 'victoria_asesino', error: null }
          }
        }
      }
    } else if (accionAsesino && actorAsesino?.paralizadoEstaNoche) {
      await _logEvento(ronda, 'asesino_paralizado',
        'El asesino fue paralizado por Shion. No pudo actuar esta noche.', true)
    }

    // ── Marcar todas las acciones de esta ronda como procesadas ──────────
    await _marcarAccionesProcesadas(accionesRonda)

    // Avanzar a fase de votación / nuevo día
    await cambiarFase('votacion', 1)
    return { resultado: 'noche_procesada', error: null }
  }, [acciones, usuarios, estadoJuego, cambiarFase])

  // ── Registrar voto ────────────────────────────────────────────────────────
  const registrarVoto = useCallback(async (votanteId, nominadoId) => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    const votante = usuarios.find(u => u.avatar === votanteId)

    // Mion vota con peso 2
    const peso = votanteId === 'mion' && !votante?.objeto_usado ? 2 : 1
    if (votanteId === 'mion' && !votante?.objeto_usado) {
      await supabase.from('usuarios').update({ objeto_usado: true }).eq('avatar', 'mion')
    }

    const { error } = await supabase.from('votos').upsert(
      { votante_id: votanteId, nominado_id: nominadoId, ronda, peso },
      { onConflict: 'votante_id,ronda' }
    )
    return { error }
  }, [estadoJuego, usuarios])

  // ── Registrar acción nocturna ─────────────────────────────────────────────
  const registrarAccion = useCallback(async (actorId, objetivoId, tipoAccion) => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    const { error } = await supabase.from('acciones_noche').upsert(
      { ronda, actor_id: actorId, objetivo_id: objetivoId, tipo_accion: tipoAccion },
      { onConflict: 'ronda,actor_id' }
    )
    return { error }
  }, [estadoJuego])

  // ── Helpers privados ──────────────────────────────────────────────────────
  async function _logEvento(ronda, tipo, descripcion, publica) {
    await supabase.from('log_juego').insert({ ronda, tipo, descripcion, publica })
  }

  async function _marcarAccionesProcesadas(accionesRonda) {
    const ids = accionesRonda.map(a => a.id)
    if (ids.length > 0) {
      await supabase.from('acciones_noche').update({ procesada: true }).in('id', ids)
    }
  }

  function _comprobarVictoriaAsesino(vivosArray) {
    const totalVivos = vivosArray.filter(u => u.vivo !== false).length
    const asesinoVivo = vivosArray.some(u => u.bando === 'asesino' && u.vivo !== false)
    return asesinoVivo && totalVivos <= 2
  }

  // ── Utilidad: obtener info de personaje por id de avatar ─────────────────
  const getPersonaje = (avatarId) => PERSONAJES.find(p => p.id === avatarId)

  return {
    estadoJuego,
    usuarios,
    votos,
    acciones,
    log,
    cargando,
    rtActivo,
    recargar: cargar,
    // Admin
    cambiarFase,
    toggleJuegoHabilitado,
    asignarRoles,
    resetearPassword,
    procesarVotacion,
    procesarNoche,
    // Jugador
    registrarVoto,
    registrarAccion,
    getPersonaje,
  }
}
