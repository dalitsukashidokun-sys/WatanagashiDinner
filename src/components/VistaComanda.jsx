// src/components/VistaComanda.jsx
// ─── Comanda del Usuario: Sincronización Crema y Blanco en Tiempo Real ─────────
// Estructura adaptada para cuadrícula (Grid) expansiva en PC y móvil.

import { useState } from 'react'
import { Plus, Minus, Trash2, ShoppingBag, Loader2 } from 'lucide-react'
import { PERSONAJES } from '../constants'

/**
 * @param {Object}   usuario            - Usuario en sesión
 * @param {Array}    comandas           - Ítems sincronizados desde Supabase (con joins)
 * @param {boolean}  cargando           - Estado de carga
 * @param {number}   totalPlatos          - Recuento total de unidades (sin precios)
 * @param {boolean}  rtActivo           - Pulso de señal Realtime
 * @param {Function} onActualizarCantidad - async(comandaId, nuevaCantidad) → { error }
 * @param {Function} onEliminar           - async(comandaId) → { error }
 */
export default function VistaComanda({
  usuario,
  comandas,
  cargando,
  totalPlatos,
  rtActivo,
  onActualizarCantidad,
  onEliminar,
}) {
  const [procesandoId, setProcesandoId] = useState(null)

  const personaje = PERSONAJES.find(p => p.id === usuario?.avatar)

  async function handleCantidad(id, nuevaCantidad) {
    setProcesandoId(id)
    await onActualizarCantidad(id, nuevaCantidad)
    setProcesandoId(null)
  }

  async function handleEliminar(id) {
    setProcesandoId(id)
    await onEliminar(id)
    setProcesandoId(null)
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto py-4">
      
      {/* ── CONTENEDOR MAESTRO DE LA COMANDA (Fondo Crema unificado) ── */}
      <div className="bg-[#fdfbf7] p-5 sm:p-6 rounded-2xl border border-[#decfa8]/60 shadow-xl space-y-6">
        
        {/* ── Cabecera con avatar del personaje ── */}
        <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200 shrink-0 shadow-sm bg-white">
            <img
              src={personaje?.avatar}
              alt={personaje?.nombre}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display='none' }}
            />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-900">
              Comanda activa de <span className="text-amber-800">{usuario?.nombre}</span>
            </h2>
            
            {/* Indicador de Transmisión Realtime */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full transition-all duration-300
                ${rtActivo
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                  : 'bg-stone-400'
                }`}
              />
              <span className="text-xs text-stone-500 font-medium">
                {rtActivo ? 'Guardando cambios en Supabase...' : 'Sincronizado con cocina'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Estado vacío (Bloque Blanco) ── */}
        {!cargando && comandas.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-16 text-center space-y-3 shadow-sm">
            <ShoppingBag size={48} className="mx-auto text-stone-300" />
            <p className="text-stone-800 text-sm font-bold">Tu bandeja de comanda está vacía.</p>
            <p className="text-stone-500 text-xs">Agrega platos de la cocina desde la pestaña del menú.</p>
          </div>
        )}

        {/* ── Skeletons de Carga Avanzados (Grid) ── */}
        {cargando && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-xl h-24 animate-pulse shadow-sm" />
            ))}
          </div>
        )}

        {/* ── Lista de Ítems en Bloques Blancos Independientes (Grid) ── */}
        {!cargando && comandas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comandas.map(item => (
              <ItemComanda
                key={item.id}
                item={item}
                procesando={procesandoId === item.id}
                onCantidad={nueva => handleCantidad(item.id, nueva)}
                onEliminar={() => handleEliminar(item.id)}
              />
            ))}
          </div>
        )}

        {/* ── Resumen de Unidades (Bloque Blanco Opcional) ── */}
        {comandas.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3 mt-2">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="text-stone-600 uppercase tracking-wider">Total de platos solicitados</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-900 font-mono tabular-nums">
                  {totalPlatos}
                  <span className="text-xs font-medium text-stone-500 ml-1.5 uppercase">
                    {totalPlatos === 1 ? 'unidad' : 'unidades'}
                  </span>
                </p>
              </div>
            </div>
            <div className="h-px bg-stone-100" />
            
          </div>
        )}
        
      </div>
    </div>
  )
}

// ─── Componente Interno: Ítem de Comanda Hermético ────────────────────────────
function ItemComanda({ item, procesando, onCantidad, onEliminar }) {
  const plato = item.platos
  if (!plato) return null

  return (
    <div className={`bg-white border border-stone-200 rounded-xl p-4 shadow-sm transition-all duration-200 flex flex-col h-full hover:border-amber-700/30 ${procesando ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3 flex-1">
        
        {/* Miniatura del plato */}
        {plato.imagen_url && (
          <img
            src={plato.imagen_url}
            alt={plato.nombre}
            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-stone-100 shadow-sm"
          />
        )}

        <div className="flex-1 min-w-0 flex flex-col h-full">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-stone-900 leading-tight line-clamp-2">
              {plato.nombre}
            </h3>
            <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold font-mono shrink-0">
              ×{item.cantidad}
            </span>
          </div>

          {/* Notas de Cocina registradas */}
          {item.nota && (
            <p className="text-xs text-amber-800 bg-amber-50/70 border border-amber-100 px-2.5 py-1.5 rounded-md mt-2 flex items-start gap-1 font-medium">
              <span className="shrink-0">📝</span>
              <span className="line-clamp-2 leading-snug">{item.nota}</span>
            </p>
          )}

          {/* Bloque de Mandos Atómicos en Red (Empujados al fondo automáticamente) */}
          <div className="flex items-center gap-2 mt-auto pt-3 border-t border-stone-50">
            {procesando ? (
              <div className="flex items-center gap-1.5 text-stone-400 text-xs font-mono">
                <Loader2 size={14} className="animate-spin text-amber-800" />
                Actualizando...
              </div>
            ) : (
              <>
                <button
                  onClick={() => onCantidad(item.cantidad - 1)}
                  className="w-8 h-8 rounded-md bg-stone-50 hover:bg-stone-100 border border-stone-200
                    flex items-center justify-center text-stone-700 transition-all active:scale-90 shadow-sm"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-bold text-stone-800 min-w-[1.5rem] text-center font-mono tabular-nums">
                  {item.cantidad}
                </span>
                <button
                  onClick={() => onCantidad(item.cantidad + 1)}
                  className="w-8 h-8 rounded-md bg-stone-50 hover:bg-stone-100 border border-stone-200
                    flex items-center justify-center text-stone-700 transition-all active:scale-90 shadow-sm"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={onEliminar}
                  className="ml-auto text-xs font-bold text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors active:scale-95"
                >
                  <Trash2 size={14} />
                  Quitar
                </button>
              </>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}