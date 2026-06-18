// src/hooks/usePlatos.js
// ─── Hook: Carga del Menú de Platos ──────────────────────────────────────────

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Carga todos los platos disponibles desde Supabase.
 * Los platos son datos estáticos durante la cena (no necesitan Realtime).
 */
export function usePlatos() {
  const [platos,   setPlatos]   = useState([])
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      try {
        const { data, error: err } = await supabase
          .from('platos')
          .select('*')
          .eq('disponible', true)
          .order('categoria')
          .order('nombre')

        if (err) throw err
        setPlatos(data || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  // Filtrar por categoría
  const porCategoria = (categoria) =>
    platos.filter((p) => p.categoria === categoria)

  return { platos, cargando, error, porCategoria }
}
