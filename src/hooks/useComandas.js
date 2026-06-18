// src/hooks/useComandas.js
// ─── Hook: Gestión de Comandas con Supabase Realtime ─────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Gestiona las comandas del usuario actual y (opcionalmente) todas las comandas
 * para el panel de admin. Se suscribe a cambios en tiempo real de Supabase.
 *
 * @param {string|null} usuarioId - UUID del usuario en sesión (null si es admin)
 * @param {boolean}     esAdmin   - Si true, carga todas las comandas
 */
export function useComandas(usuarioId, esAdmin = false) {
  const [comandas,    setComandas]    = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [error,       setError]       = useState(null)
  const [rtActivo,    setRtActivo]    = useState(false)   // indicador de señal realtime

  // ── Cargar comandas iniciales ──────────────────────────────────────────────
  const cargarComandas = useCallback(async () => {
    setCargando(true)
    try {
      let query = supabase
        .from('comandas')
        .select(`
          id,
          cantidad,
          nota,
          created_at,
          updated_at,
          platos ( id, nombre, precio, categoria, imagen_url, etiquetas ),
          usuarios ( id, nombre, avatar )
        `)
        .order('created_at', { ascending: true })

      // Si no es admin, filtrar solo las del usuario actual
      if (!esAdmin && usuarioId) {
        query = query.eq('usuario_id', usuarioId)
      }

      const { data, error: err } = await query
      if (err) throw err
      setComandas(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [usuarioId, esAdmin])

  // ── Suscripción a cambios en tiempo real ─────────────────────────────────
  useEffect(() => {
    if (!usuarioId && !esAdmin) return

    cargarComandas()

    // Canal único por combinación usuario/rol
    const canalNombre = esAdmin ? 'admin-comandas' : `user-${usuarioId}-comandas`

    const canal = supabase
      .channel(canalNombre)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comandas' },
        (payload) => {
          // Pulsar indicador visual de actividad realtime
          setRtActivo(true)
          setTimeout(() => setRtActivo(false), 800)

          // Recargar cuando hay cambios (INSERT, UPDATE, DELETE)
          // Una recarga completa evita inconsistencias con los joins
          cargarComandas()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [usuarioId, esAdmin, cargarComandas])

  // ── Añadir o actualizar un ítem en la comanda ─────────────────────────────
  const anyadirItem = useCallback(async (platoId, cantidad, nota) => {
    if (!usuarioId) return { error: 'No hay usuario en sesión' }

    // Verificar si ya existe este plato en la comanda del usuario
    const { data: existente } = await supabase
      .from('comandas')
      .select('id, cantidad')
      .eq('usuario_id', usuarioId)
      .eq('plato_id', platoId)
      .maybeSingle()

    if (existente) {
      // Actualizar cantidad sumando la nueva
      const { error: err } = await supabase
        .from('comandas')
        .update({
          cantidad: existente.cantidad + cantidad,
          nota: nota || existente.nota,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existente.id)
      return { error: err?.message || null }
    } else {
      // Insertar nuevo ítem
      const { error: err } = await supabase
        .from('comandas')
        .insert({ usuario_id: usuarioId, plato_id: platoId, cantidad, nota: nota || null })
      return { error: err?.message || null }
    }
  }, [usuarioId])

  // ── Actualizar cantidad de un ítem ────────────────────────────────────────
  const actualizarCantidad = useCallback(async (comandaId, nuevaCantidad) => {
    if (nuevaCantidad < 1) {
      return eliminarItem(comandaId)
    }
    const { error: err } = await supabase
      .from('comandas')
      .update({ cantidad: nuevaCantidad, updated_at: new Date().toISOString() })
      .eq('id', comandaId)
    return { error: err?.message || null }
  }, [])

  // ── Eliminar un ítem de la comanda ────────────────────────────────────────
  const eliminarItem = useCallback(async (comandaId) => {
    const { error: err } = await supabase
      .from('comandas')
      .delete()
      .eq('id', comandaId)
    return { error: err?.message || null }
  }, [])

  // ── Total económico de las comandas cargadas ──────────────────────────────
  const total = comandas.reduce((acc, c) => {
    return acc + (c.platos?.precio || 0) * c.cantidad
  }, 0)

  return {
    comandas,
    cargando,
    error,
    rtActivo,
    total,
    anyadirItem,
    actualizarCantidad,
    eliminarItem,
    recargar: cargarComandas,
  }
}
