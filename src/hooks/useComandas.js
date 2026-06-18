// src/hooks/useComandas.js
// ─── Hook: Comandas con upsert inmediato y Supabase Realtime ─────────────────
// No existe "carrito temporal": cada cambio de cantidad se persiste al instante.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

/**
 * @param {string|null} usuarioId - UUID del usuario en sesión (null solo en admin puro)
 * @param {boolean}     esAdmin   - Si true, carga TODAS las comandas sin filtro de usuario
 */
export function useComandas(usuarioId, esAdmin = false) {
  const [comandas, setComandas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState(null)
  const [rtActivo, setRtActivo] = useState(false)

  // ── Carga completa (usada en mount y en cada evento Realtime) ─────────────
  const cargarComandas = useCallback(async () => {
    setCargando(true)
    try {
      let query = supabase
        .from('comandas')
        .select(`
          id,
          cantidad,
          nota,
          usuario_id,
          plato_id,
          created_at,
          updated_at,
          platos  ( id, nombre, categoria, imagen_url, etiquetas ),
          usuarios( id, nombre, avatar )
        `)
        .order('created_at', { ascending: true })

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

  // ── Suscripción Realtime ──────────────────────────────────────────────────
  useEffect(() => {
    if (!usuarioId && !esAdmin) return

    cargarComandas()

    const canalNombre = esAdmin ? 'rt-admin-comandas' : `rt-user-${usuarioId}`

    const canal = supabase
      .channel(canalNombre)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comandas' },
        () => {
          // Pulso visual del indicador de actividad
          setRtActivo(true)
          setTimeout(() => setRtActivo(false), 800)
          // Recarga con joins completos (más fiable que aplicar el diff manualmente)
          cargarComandas()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [usuarioId, esAdmin, cargarComandas])

  // ── UPSERT INMEDIATO ──────────────────────────────────────────────────────
  // Se usa tanto para "Añadir desde detalle" como para +/- en la comanda.
  // Si el plato ya existe para ese usuario → UPDATE cantidad.
  // Si no existe → INSERT.
  // Si la nueva cantidad es 0 → DELETE.
  const upsertItem = useCallback(async (platoId, cantidad, nota = null) => {
    if (!usuarioId) return { error: 'Sin usuario en sesión' }

    // Cantidad 0 o negativa = eliminar
    if (cantidad <= 0) {
      const { error: err } = await supabase
        .from('comandas')
        .delete()
        .eq('usuario_id', usuarioId)
        .eq('plato_id', platoId)
      return { error: err?.message || null }
    }

    // Upsert: la combinación (usuario_id, plato_id) debe tener constraint UNIQUE en Supabase.
    // El script SQL del proyecto ya lo incluye. Si no, añádelo:
    // ALTER TABLE comandas ADD CONSTRAINT comandas_usuario_plato_key UNIQUE (usuario_id, plato_id);
    const { error: err } = await supabase
      .from('comandas')
      .upsert(
        {
          usuario_id:  usuarioId,
          plato_id:    platoId,
          cantidad,
          nota:        nota ?? null,
          updated_at:  new Date().toISOString(),
        },
        { onConflict: 'usuario_id,plato_id' }
      )

    return { error: err?.message || null }
  }, [usuarioId])

  // ── Actualizar cantidad desde la comanda (por id de fila) ─────────────────
  // Traduce el id de fila → (usuario_id, plato_id) y llama a upsertItem.
  const actualizarCantidad = useCallback(async (comandaId, nuevaCantidad) => {
    // Buscar la fila en el estado local para obtener plato_id
    const fila = comandas.find(c => c.id === comandaId)
    if (!fila) return { error: 'Ítem no encontrado' }

    if (nuevaCantidad <= 0) {
      // Eliminar directamente por id
      const { error: err } = await supabase
        .from('comandas')
        .delete()
        .eq('id', comandaId)
      return { error: err?.message || null }
    }

    const { error: err } = await supabase
      .from('comandas')
      .update({ cantidad: nuevaCantidad, updated_at: new Date().toISOString() })
      .eq('id', comandaId)
    return { error: err?.message || null }
  }, [comandas])

  // ── Eliminar por id de fila ───────────────────────────────────────────────
  const eliminarItem = useCallback(async (comandaId) => {
    const { error: err } = await supabase
      .from('comandas')
      .delete()
      .eq('id', comandaId)
    return { error: err?.message || null }
  }, [])

  // ── Recuento total de platos (sin precios) ────────────────────────────────
  const totalPlatos = comandas.reduce((acc, c) => acc + c.cantidad, 0)

  return {
    comandas,
    cargando,
    error,
    rtActivo,
    totalPlatos,   // cantidad total, no monetaria
    upsertItem,
    actualizarCantidad,
    eliminarItem,
    recargar: cargarComandas,
  }
}
