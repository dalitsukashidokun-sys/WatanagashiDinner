// src/components/VistaDetalle.jsx
// ─── Vista de Detalle: Plato completo + Upsert inmediato a Supabase ───────────
// No hay carrito temporal. Al pulsar "Añadir", la cantidad se persiste al instante.

import { useState } from 'react'
import { ArrowLeft, Plus, Minus, ShoppingBag, AlertCircle, CheckCircle2 } from 'lucide-react'

/**
 * @param {Object}   plato     - Objeto plato completo (sin campo precio)
 * @param {Function} onVolver  - Callback para regresar al menú
 * @param {Function} onAnyadir - async(platoId, cantidad, nota) → { error }
 *                               Llama directamente a upsertItem del hook
 */
export default function VistaDetalle({ plato, onVolver, onAnyadir }) {
  const [cantidad, setCantidad] = useState(1)
  const [nota,     setNota]     = useState('')
  const [estado,   setEstado]   = useState('idle') // 'idle' | 'cargando' | 'ok' | 'error'

  if (!plato) return null

  async function handleAnyadir() {
    setEstado('cargando')
    const { error } = await onAnyadir(plato.id, cantidad, nota)
    if (error) {
      setEstado('error')
      setTimeout(() => setEstado('idle'), 3000)
    } else {
      setEstado('ok')
      setTimeout(() => { setEstado('idle'); onVolver() }, 1600)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* ── Imagen principal ── */}
      <div className="relative h-56 sm:h-72 -mx-4 sm:mx-0 sm:rounded-xl overflow-hidden mb-6">
        {plato.imagen_url ? (
          <img
            src={plato.imagen_url}
            alt={plato.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-6xl">🍱</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

        <button
          onClick={onVolver}
          className="absolute top-4 left-4 sm:left-0 flex items-center gap-1.5
            bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white
            text-sm px-3 py-1.5 rounded-lg border border-slate-700/50 transition-all"
        >
          <ArrowLeft size={14} />
          Volver
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
            {plato.nombre}
          </h1>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Etiquetas */}
        {plato.etiquetas?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {plato.etiquetas.map(tag => (
              <span key={tag} className="tag tag-red">{tag}</span>
            ))}
          </div>
        )}

        {/* Descripción */}
        <div className="card-dark p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Descripción
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
            {plato.descripcion_larga || plato.descripcion_corta}
          </p>
        </div>

        {/* ── Panel de pedido: sin precio ── */}
        <div className="card-dark p-5 space-y-4">
          {/* Selector de cantidad */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Cantidad
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCantidad(q => Math.max(1, q - 1))}
                disabled={cantidad <= 1}
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700
                  flex items-center justify-center text-slate-300 transition-all active:scale-90
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus size={16} />
              </button>
              <span className="text-2xl font-bold text-white min-w-[2rem] text-center tabular-nums">
                {cantidad}
              </span>
              <button
                onClick={() => setCantidad(q => Math.min(20, q + 1))}
                className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700
                  flex items-center justify-center text-slate-300 transition-all active:scale-90"
              >
                <Plus size={16} />
              </button>
              {/* Sin precio — solo unidades */}
              <span className="ml-auto text-slate-500 text-sm">
                {cantidad === 1 ? '1 unidad' : `${cantidad} unidades`}
              </span>
            </div>
          </div>

          {/* Nota */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
              Nota o alergia
              <span className="text-slate-600 font-normal ml-1">(opcional)</span>
            </label>
            <textarea
              className="input-dark resize-none h-20 text-sm"
              placeholder="Sin cebolla, alergia a... cambiar por..."
              value={nota}
              onChange={e => setNota(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Feedback */}
          {estado === 'ok' && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm
              bg-emerald-950/40 border border-emerald-800/50 rounded-lg px-4 py-2.5">
              <CheckCircle2 size={16} />
              <span>Añadido a tu comanda · guardado en Supabase</span>
            </div>
          )}
          {estado === 'error' && (
            <div className="flex items-center gap-2 text-rose-400 text-sm
              bg-rose-950/40 border border-rose-800/50 rounded-lg px-4 py-2.5">
              <AlertCircle size={16} />
              <span>Error al guardar. Inténtalo de nuevo.</span>
            </div>
          )}

          {/* Botón añadir — upsert inmediato */}
          <button
            className="btn-success w-full flex items-center justify-center gap-2 text-base"
            onClick={handleAnyadir}
            disabled={estado === 'cargando' || estado === 'ok'}
          >
            <ShoppingBag size={18} />
            {estado === 'cargando'
              ? 'Guardando en Supabase...'
              : `Añadir ×${cantidad} a mi comanda`
            }
          </button>
        </div>
      </div>
    </div>
  )
}
