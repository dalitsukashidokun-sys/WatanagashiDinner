// src/hooks/useJuego.js
// ─── Hook: Motor de Estado del Juego Oculto (v3.5 - Blindaje Inteligente) ────
// Implementa el Protocolo de Aislamiento por Avatar para evitar fugas y bloqueos.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { PERSONAJES } from '../constants'

/**
 * @param {string} miAvatar - El identificador del jugador actual (ej: 'keiichi', 'admin')
 */
export function useJuego(miAvatar) {
  const [estadoJuego, setEstadoJuego] = useState(null)
  const [usuarios,     setUsuarios]    = useState([])
  const [votos,        setVotos]       = useState([])
  const [acciones,     setAcciones]    = useState([])
  const [log,          setLog]         = useState([])
  const [cargando,     setCargando]    = useState(true)
  const [rtActivo,     setRtActivo]    = useState(false)

  // ── Carga Completa con Criptografía de Roles ──────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const { data: estado } = await supabase.from('estado_juego').select('*').single()
      if (estado) setEstadoJuego(estado)

      // El Admin o una partida finalizada tienen acceso total a la columna bando
      const bandoQuery = (estado?.fase_actual === 'finalizado' || miAvatar === 'admin') ? ',bando' : ''

      const [resUsuarios, resVotos, resAcciones, resLog] = await Promise.all([
        supabase.from('usuarios').select(`id,nombre,avatar,password,vivo,objeto_usado${bandoQuery}`).order('nombre'),
        supabase.from('votos').select('*').order('created_at'),
        supabase.from('acciones_noche').select('*').order('created_at'),
        supabase.from('log_juego').select('*').order('created_at', { ascending: false }).limit(50),
      ])

      let listaUsuarios = resUsuarios.data || []

      // JUGADOR INDIVIDUAL: Si la partida está activa, el jugador descarga en secreto SOLO su bando
      if (miAvatar && miAvatar !== 'admin' && estado?.fase_actual !== 'finalizado' && listaUsuarios.length > 0) {
        const { data: miPerfil } = await supabase.from('usuarios').select('bando').eq('avatar', miAvatar).single()
        if (miPerfil) {
          listaUsuarios = listaUsuarios.map(u => 
            u.avatar === miAvatar ? { ...u, bando: miPerfil.bando } : u
          )
        }
      }

      setUsuarios(listaUsuarios)
      setVotos(resVotos.data || [])
      setAcciones(resAcciones.data || [])
      setLog(resLog.data || [])
    } catch (e) {
      console.error('Error en carga useJuego:', e)
    } finally {
      setCargando(false)
    }
  }, [miAvatar])

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
    return { error }
  }, [estadoJuego])

  const toggleJuegoHabilitado = useCallback(async () => {
    const { error } = await supabase
      .from('estado_juego')
      .update({ juego_habilitado: !estadoJuego?.juego_habilitado })
      .eq('id', 1)
    return { error }
  }, [estadoJuego])

  // ── Asignar Roles (Blindado contra datos locales faltantes) ───────────────
  const asignarRoles = useCallback(async () => {
    const { data: listaReal } = await supabase.from('usuarios').select('*')
    const vivos = (listaReal || []).filter(u => u.avatar !== 'admin')
    if (vivos.length === 0) return { error: 'No hay usuarios registrados.' }

    const idxAsesino = Math.floor(Math.random() * vivos.length)
    
    const updates = vivos.map((u, i) => ({
      id: u.id,
      nombre: u.nombre,
      avatar: u.avatar,
      password: u.password,
      bando: i === idxAsesino ? 'asesino' : 'aldeano',
      vivo: true,
      objeto_usado: 0,
    }))

    const { error } = await supabase.from('usuarios').upsert(updates)
    if (error) return { error: error.message }

    await supabase.from('votos').delete().gte('ronda', 0)
    await supabase.from('acciones_noche').delete().gte('ronda', 0)
    await supabase.from('log_juego').delete().gte('ronda', 0)

    await supabase.from('estado_juego').update({
      fase_actual: 'espera',
      ronda_actual: 0,
      ganador: null,
    }).eq('id', 1)

    return { error: null }
  }, [])

  const resetearPassword = useCallback(async (usuarioId, nuevaPassword) => {
    return await supabase.from('usuarios').update({ password: nuevaPassword }).eq('id', usuarioId)
  }, [])

  // ── Procesamiento de Votación Diurna Cruda de Servidor ────────────────────
  const procesarVotacion = useCallback(async () => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    const votosRonda = votos.filter(v => v.ronda === ronda)

    const conteo = {}
    votosRonda.forEach(v => {
      if (v.nominado_id === 'nadie') return
      conteo[v.nominado_id] = (conteo[v.nominado_id] || 0) + (v.peso || 1)
    })

    const entries = Object.entries(conteo).sort((a, b) => b[1] - a[1])

    if (entries.length === 0) {
      await _logEvento(ronda, 'sin_victima_dia', 'El pueblo debatió intensamente, pero decidió otorgar una tregua y no ejecutar a nadie hoy.', true)
      await cambiarFase('noche')
      return { resultado: 'nadie', error: null }
    }

    const [masVotadoId, maxVotos] = entries[0]
    if (entries.filter(([, v]) => v === maxVotos).length > 1) {
      await _logEvento(ronda, 'empate_dia', 'Las acusaciones están completamente divididas. Nadie fue llevado al cadalso.', true)
      await cambiarFase('noche')
      return { resultado: 'empate', error: null }
    }

    // Consulta de Datos Reales directamente de la BD (Sin filtros de cliente)
    const { data: victima } = await supabase.from('usuarios').select('*').eq('avatar', masVotadoId).single()
    if (!victima) return { error: 'Víctima no encontrada' }

    const esAsesino = victima.bando === 'asesino'

    if (!esAsesino && victima.avatar === 'rena' && victima.objeto_usado === 0) {
      const votanteRena = votosRonda.filter(v => v.nominado_id === 'rena').sort((a, b) => (b.peso || 1) - (a.peso || 1))[0]
      if (votanteRena) {
        await supabase.from('usuarios').update({ vivo: false }).eq('avatar', votanteRena.votante_id)
        await supabase.from('usuarios').update({ objeto_usado: 1 }).eq('avatar', 'rena')
        await _logEvento(ronda, 'machete_rena', `Rena fue linchada injustamente. En un estallido de locura antes de caer, su Machete arrebató la vida de su principal acusador.`, true)
      }
    }

    await supabase.from('usuarios').update({ vivo: false }).eq('id', victima.id)

    if (esAsesino) {
      await _logEvento(ronda, 'victoria_aldeanos', `¡Las sospechas eran ciertas! El culpable ha sido descubierto y neutralizado. La paz vuelve a Hinamizawa.`, true)
      await supabase.from('estado_juego').update({ fase_actual: 'finalizado', ganador: 'aldeanos' }).eq('id', 1)
      return { resultado: 'victoria_aldeanos', error: null }
    } else {
      await _logEvento(ronda, 'muerte_dia', `${victima.nombre} fue ejecutado/a por el veredicto del pueblo. Era un habitante inocente.`, true)
    }

    // Chequeo final de supervivientes directo de la base de datos
    const { data: todos } = await supabase.from('usuarios').select('*')
    const vivosDespues = todos.filter(u => u.vivo && u.avatar !== 'admin')
    if (vivosDespues.length <= 2 && vivosDespues.some(u => u.bando === 'asesino')) {
      const elAsesino = vivosDespues.find(u => u.bando === 'asesino')
      await _logEvento(ronda, 'victoria_asesino', `La paranoia ha fragmentado la mesa. Ya no quedan suficientes votos para detener la tragedia.`, true)
      await supabase.from('estado_juego').update({ fase_actual: 'finalizado', ganador: 'asesino' }).eq('id', 1)
      return { resultado: 'victoria_asesino', error: null }
    }

    await cambiarFase('noche')
    return { resultado: 'muerte_inocente', error: null }
  }, [votos, estadoJuego, cambiarFase])

  const procesarNoche = useCallback(async () => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    const accionesRonda = acciones.filter(a => a.ronda === ronda && !a.procesada)

    const { data: listaUsuarios } = await supabase.from('usuarios').select('*')
    const estadoLocal = listaUsuarios.reduce((acc, u) => {
      acc[u.avatar] = { ...u, paralizadoEstaNoche: false, seMovioEstaNoche: false }
      return acc
    }, {})

    accionesRonda.forEach(a => {
      if (estadoLocal[a.actor_id]) estadoLocal[a.actor_id].seMovioEstaNoche = true
    })

    // 1. Shion
    const accShion = accionesRonda.find(a => a.actor_id === 'shion' && a.tipo_accion === 'paralizar')
    if (accShion?.objetivo_id && estadoLocal['shion'] && !estadoLocal['shion'].paralizadoEstaNoche) {
      const obj = accShion.objetivo_id
      if (estadoLocal[obj]) {
        estadoLocal[obj].paralizadoEstaNoche = true
        await supabase.from('acciones_noche').update({ resultado_secreto: `Has inmovilizado con éxito a ${estadoLocal[obj].nombre} con tu Táser. Sus planes para esta noche se han desmoronado.` }).eq('id', accShion.id)
      }
    }

    // 2. Keiichi
    let protegidoId = null
    const accKeiichi = accionesRonda.find(a => a.actor_id === 'keiichi' && a.tipo_accion === 'proteger')
    if (accKeiichi?.objetivo_id && estadoLocal['keiichi'] && !estadoLocal['keiichi'].paralizadoEstaNoche && estadoLocal['keiichi'].objeto_usado < 1) {
      protegidoId = accKeiichi.objetivo_id
      await supabase.from('usuarios').update({ objeto_usado: 1 }).eq('avatar', 'keiichi')
      await supabase.from('acciones_noche').update({ resultado_secreto: `Te has apostado en los alrededores de la casa de ${estadoLocal[protegidoId].nombre} empuñando tu bate.` }).eq('id', accKeiichi.id)
    }

    // 3. Rika
    const accRika = accionesRonda.find(a => a.actor_id === 'rika' && a.tipo_accion === 'revelar')
    if (accRika?.objetivo_id && estadoLocal['rika'] && !estadoLocal['rika'].paralizadoEstaNoche && estadoLocal['rika'].objeto_usado < 1) {
      const obj = estadoLocal[accRika.objetivo_id]
      await supabase.from('usuarios').update({ objeto_usado: 1 }).eq('avatar', 'rika')
      const veredicto = obj.bando === 'asesino' ? 'pertenece al bando del ASESINO' : 'es un Aldeano totalmente inocente'
      await supabase.from('acciones_noche').update({ resultado_secreto: `Has observado los hilos del Fragmento. Confirmado: ${obj.nombre} ${veredicto}.` }).eq('id', accRika.id)
    }

    // 4. Satoko
    const accSatoko = accionesRonda.find(a => a.actor_id === 'satoko' && a.tipo_accion === 'paralizar')
    if (accSatoko?.objetivo_id && estadoLocal['satoko'] && !estadoLocal['satoko'].paralizadoEstaNoche && estadoLocal['satoko'].objeto_usado < 2) {
      const obj = estadoLocal[accSatoko.objetivo_id]
      const nuevoContador = (estadoLocal['satoko'].objeto_usado || 0) + 1
      await supabase.from('usuarios').update({ objeto_usado: nuevoContador }).eq('avatar', 'satoko')
      
      const seMovio = obj.seMovioEstaNoche && !obj.paralizadoEstaNoche
      const reporteMovimiento = seMovio
        ? `Tus hilos espía se tensaron bruscamente: ${obj.nombre} SALIÓ de su hogar en la oscuridad.`
        : `Tus hilos permanecen intactos: No hubo ningún tipo de movimiento en la casa de ${obj.nombre}.`
      await supabase.from('acciones_noche').update({ resultado_secreto: `${reporteMovimiento} (Trampa ${nuevoContador}/2 desplegada con éxito).` }).eq('id', accSatoko.id)
    }

    // 5. Asesinato
    const accAsesino = accionesRonda.find(a => a.tipo_accion === 'asesinar')
    let alguienMurio = false
    let nombreMuerto = ''

    if (accAsesino?.objetivo_id && estadoLocal[accAsesino.actor_id] && !estadoLocal[accAsesino.actor_id].paralizadoEstaNoche) {
      const objId = accAsesino.objetivo_id
      const obj = estadoLocal[objId]

      if (obj?.vivo) {
        let ataqueExitoso = true

        if (protegidoId === objId) {
          ataqueExitoso = false
          await supabase.from('acciones_noche').update({ resultado_secreto: `Te colaste en los aposentos de ${obj.nombre}, pero Keiichi apareció de la nada blandiendo su bate y frustró tu ataque.` }).eq('id', accAsesino.id)
          if (accKeiichi) {
            const asesinoReal = estadoLocal[accAsesino.actor_id]
            await supabase.from('acciones_noche').update({ resultado_secreto: `¡Tu guardia fue providencial! El Asesino intentó atacar a tu protegido, pero interceptaste el golpe. Has descubierto que el atacante infiltrado es ${asesinoReal.nombre}.` }).eq('id', accKeiichi.id)
          }
        }

        if (ataqueExitoso) {
          await supabase.from('usuarios').update({ vivo: false }).eq('avatar', objId)
          alguienMurio = true
          nombreMuerto = obj.nombre
          await supabase.from('acciones_noche').update({ resultado_secreto: `Te infiltraste sin hacer ruido. Tu ejecución sobre ${obj.nombre} ha sido limpia y letal.` }).eq('id', accAsesino.id)
        }
      }
    } else if (accAsesino && estadoLocal[accAsesino.actor_id]?.paralizadoEstaNoche) {
      await supabase.from('acciones_noche').update({ resultado_secreto: `Intentaste salir a limpiar las calles, pero Shion te emboscó primero con su Táser, dejándote completamente inmovilizado.` }).eq('id', accAsesino.id)
    }

    if (alguienMurio) {
      await _logEvento(ronda, 'muerte_noche', `Las cigarras cantaron con un tono desgarrador a mitad de la noche. Al amanecer, se descubre que las calles reclaman el cuerpo sin vida de ${nombreMuerto}.`, true)
    } else {
      await _logEvento(ronda, 'paz_noche', `La noche transcurrió bajo un silencio denso pero pacífico. Con los primeros rayos de sol, todos los integrantes se saludan ilesos en el desayuno.`, true)
    }

    const { data: chequeoVictoria } = await supabase.from('usuarios').select('*')
    const vivosFin = chequeoVictoria.filter(u => u.vivo && u.avatar !== 'admin')
    if (vivosFin.length <= 2 && vivosFin.some(u => u.bando === 'asesino')) {
      await _logEvento(ronda, 'victoria_asesino', `Los supervivientes se miran con desesperación. Ya no quedan manos suficientes para detener la purga.`, true)
      await supabase.from('estado_juego').update({ fase_actual: 'finalizado', ganador: 'asesino' }).eq('id', 1)
      await supabase.from('acciones_noche').update({ procesada: true }).in('id', accionesRonda.map(a => a.id))
      return { resultado: 'victoria_asesino', error: null }
    }

    await supabase.from('acciones_noche').update({ procesada: true }).in('id', accionesRonda.map(a => a.id))
    await cambiarFase('dia', 1)
    return { resultado: 'noche_procesada', error: null }
  }, [acciones, estadoJuego, cambiarFase])

  const registrarVoto = useCallback(async (votanteId, nominadoId) => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    const votante = usuarios.find(u => u.avatar === votanteId)
    const peso = votanteId === 'mion' && votante?.objeto_usado === 0 ? 2 : 1
    if (votanteId === 'mion' && votante?.objeto_usado === 0) {
      await supabase.from('usuarios').update({ objeto_usado: 1 }).eq('avatar', 'mion')
    }
    const { error } = await supabase.from('votos').upsert({ votante_id: votanteId, nominado_id: nominadoId, ronda, peso }, { onConflict: 'votante_id,ronda' })
    return { error }
  }, [estadoJuego, usuarios])

  const registrarAccion = useCallback(async (actorId, objetivoId, tipoAccion) => {
    const ronda = estadoJuego?.ronda_actual ?? 0
    const { error } = await supabase.from('acciones_noche').upsert({ ronda, actor_id: actorId, objetivo_id: objetivoId, tipo_accion: tipoAccion, resultado_secreto: 'Preparando preparativos en absoluto secreto...' }, { onConflict: 'ronda,actor_id' })
    return { error }
  }, [estadoJuego])

  async function _logEvento(ronda, tipo, descripcion, publica) {
    await supabase.from('log_juego').insert({ ronda, tipo, descripcion, publica })
  }

  return { estadoJuego, usuarios, votos, acciones, log, cargando, rtActivo, recargar: cargar, cambiarFase, toggleJuegoHabilitado, asignarRoles, resetearPassword, procesarVotacion, procesarNoche, registrarVoto, registrarAccion, getPersonaje: (id) => PERSONAJES.find(p => p.id === id) }
}
