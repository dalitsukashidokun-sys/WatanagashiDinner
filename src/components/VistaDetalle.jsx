// src/components/VistaDetalle.jsx
// ─── Vista de Detalle: Módulos Crema y Bloques Blancos (v2) ──────────────────
// Totalmente sincronizado con la paleta #fdfbf7 y persistencia en Supabase.

import { useState } from 'react'
import { ArrowLeft, Plus, Minus, ShoppingBag, AlertCircle, CheckCircle2 } from 'lucide-react'

/**
 * @param {Object}   plato     - Objeto plato completo (sin campo precio)
 * @param {Function} onVolver  - Callback para regresar al menú
 * @param {Function} onAnyadir - async(platoId, cantidad, nota) → { error }
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
    <div className="bg-[#fdfbf7] p-4 sm:p-6 rounded-2xl border border-[#decfa8]/60 shadow-xl max-w-3xl mx-auto animate-fade-in my-2">
      
      {/* ── Sección de cabecera con imagen integrada ── */}
      <div className="relative h-56 sm:h-72 rounded-xl overflow-hidden mb-6 border border-stone-200 shadow-sm bg-white">
        {plato.imagen_url ? (
          <img
            src={plato.imagen_url}
            alt={plato.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-stone-100 flex items-center justify-center text-6xl opacity-40">🍱</div>
        )}
        
        {/* Capa de degradado sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />

        <button
          onClick={onVolver}
          className="absolute top-4 left-4 flex items-center gap-1.5
            bg-white/90 hover:bg-white text-stone-800 font-bold
            text-xs px-3 py-1.5 rounded-lg border border-stone-200 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={14} />
          Volver al menú
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-white drop-shadow-md">
            {plato.nombre}
          </h1>
        </div>
      </div>

      <div className="space-y-5 max-w-2xl mx-auto">
        {/* Etiquetas de Categoria */}
        {plato.etiquetas?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {plato.etiquetas.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Descripción (Bloque Blanco Puro) */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-[10px] font-bold text-[#5c4033] uppercase tracking-widest mb-2">
            Detalles de la preparación
          </h2>
          <p className="text-stone-700 leading-relaxed text-xs sm:text-sm font-medium">
            {plato.descripcion_larga || plato.descripcion_corta}
          </p>
        </div>

        {/* Panel de pedido (Bloque Blanco Puro) */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-4">
          
          {/* Selector de cantidad */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-50 pb-3">
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                Seleccionar raciones
              </label>
              <span className="text-[11px] text-stone-400 font-medium">Define cuántas unidades deseas añadir</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCantidad(q => Math.max(1, q - 1))}
                disabled={cantidad <= 1}
                className="w-8 h-8 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200
                  flex items-center justify-center text-stone-700 transition-all active:scale-90
                  disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              >
                <Minus size={14} />
              </button>
              <span className="text-md font-bold text-stone-900 min-w-[2rem] text-center font-mono tabular-nums">
                {cantidad}
              </span>
              <button
                onClick={() => setCantidad(q => Math.min(20, q + 1))}
                className="w-8 h-8 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200
                  flex items-center justify-center text-stone-700 transition-all active:scale-90 shadow-sm"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Caja de Texto para Notas de Cocina */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
              Notas o especificaciones <span className="text-stone-400 font-normal lowercase">(opcional)</span>
            </label>
            <textarea
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-amber-700 placeholder-stone-400 resize-none h-20 leading-normal"
              placeholder="Especifica modificaciones para el chef (ej: sin picante, cambiar acompañamiento...)"
              value={nota}
              onChange={e => setNota(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Alertas de Estado */}
          {estado === 'ok' && (
            <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-semibold animate-fade-in">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>Plato agregado a tu orden. Registrado en cocina con éxito.</span>
            </div>
          )}
          {estado === 'error' && (
            <div className="flex items-center gap-2 text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs font-semibold animate-fade-in">
              <AlertCircle size={14} className="shrink-0" />
              <span>Ocurrió un error en la comunicación de red. Reintenta.</span>
            </div>
          )}

          {/* Botón de acción atómica */}
          <button
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
            onClick={handleAnyadir}
            disabled={estado === 'cargando' || estado === 'ok'}
          >
            <ShoppingBag size={14} />
            {estado === 'cargando'
              ? 'Sincronizando con Supabase...'
              : `Confirmar ×${cantidad} Platillos`
            }
          </button>
        </div>
      </div>
    </div>
  )
}