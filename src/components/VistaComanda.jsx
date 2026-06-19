// src/components/VistaComanda.jsx
// ─── Comanda del Usuario: Sincronización Crema y Blanco en Tiempo Real ─────────
// No existe estado local de carrito. Todo cambio impacta directamente en Supabase.

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
    <div className="animate-fade-in max-w-2xl mx-auto py-2">
      
      {/* ── CONTENEDOR MAESTRO DE LA COMANDA (Fondo Crema unificado con el Menú) ── */}
      <div className="bg-[#fdfbf7] p-5 rounded-2xl border border-[#decfa8]/60 shadow-xl space-y-5">
        
        {/* ── Cabecera con avatar del personaje ── */}
        <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-stone-200 shrink-0 shadow-sm bg-white">
            <img
              src={personaje?.avatar}
              alt={personaje?.nombre}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display='none' }}
            />
          </div>
          <div>
            <h2 className="font-serif text-md font-bold text-stone-900">
              Comanda activa de <span className="text-amber-800">{usuario?.nombre}</span>
            </h2>
            
            {/* Indicador de Transmisión Realtime */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300
                ${rtActivo
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                  : 'bg-stone-400'
                }`}
              />
              <span className="text-[11px] text-stone-500 font-medium">
                {rtActivo ? 'Guardando cambios en Supabase...' : 'Sincronizado con cocina'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Estado vacío (Bloque Blanco) ── */}
        {!cargando && comandas.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-12 text-center space-y-2 shadow-sm">
            <ShoppingBag size={36} className="mx-auto text-stone-300" />
            <p className="text-stone-800 text-xs font-bold">Tu bandeja de comanda está vacía.</p>
            <p className="text-stone-500 text-[11px]">Agrega platos de la cocina desde la pestaña del menú.</p>
          </div>
        )}

        {/* ── Skeletons de Carga Avanzados ── */}
        {cargando && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-xl h-20 animate-pulse shadow-sm" />
            ))}
          </div>
        )}

        {/* ── Lista de Ítems en Bloques Blancos Independientes ── */}
        {!cargando && (
          <div className="space-y-3">
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
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-stone-600 uppercase tracking-wider">Total de platos solicitados</span>
              <div className="text-right">
                <p className="text-xl font-bold text-amber-900 font-mono tabular-nums">
                  {totalPlatos}
                  <span className="text-[11px] font-medium text-stone-500 ml-1">
                    {totalPlatos === 1 ? 'unidad' : 'unidades'}
                  </span>
                </p>
              </div>
            </div>
            <div className="h-px bg-stone-100" />
            <p className="text-[10px] text-stone-400 text-center font-medium">
              Cada interacción altera la persistencia de datos en el servidor de forma inmediata.
            </p>
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
    <div className={`bg-white border border-stone-200 rounded-xl p-3.5 shadow-sm transition-all duration-200 ${procesando ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        
        {/* Miniatura del plato */}
        {plato.imagen_url && (
          <img
            src={plato.imagen_url}
            alt={plato.nombre}
            className="w-14 h-14 rounded-lg object-cover shrink-0 border border-stone-100 shadow-sm"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs font-bold text-stone-900 leading-tight line-clamp-2">
              {plato.nombre}
            </h3>
            <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold font-mono shrink-0">
              ×{item.cantidad}
            </span>
          </div>

          {/* Notas de Cocina registradas */}
          {item.nota && (
            <p className="text-[11px] text-amber-800 bg-amber-50/70 border border-amber-100 px-2 py-1 rounded-md mt-1.5 flex items-start gap-1 font-medium">
              <span className="shrink-0">📝</span>
              <span className="line-clamp-1">{item.nota}</span>
            </p>
          )}

          {/* Bloque de Mandos Atómicos en Red */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-stone-50">
            {procesando ? (
              <div className="flex items-center gap-1.5 text-stone-400 text-[11px] font-mono">
                <Loader2 size={12} className="animate-spin text-amber-800" />
                Actualizando registros...
              </div>
            ) : (
              <>
                <button
                  onClick={() => onCantidad(item.cantidad - 1)}
                  className="w-7 h-7 rounded-md bg-stone-50 hover:bg-stone-100 border border-stone-200
                    flex items-center justify-center text-stone-700 transition-all active:scale-90 shadow-sm"
                >
                  <Minus size={12} />
                </button>
                <span className="text-xs font-bold text-stone-800 min-w-[1.5rem] text-center font-mono tabular-nums">
                  {item.cantidad}
                </span>
                <button
                  onClick={() => onCantidad(item.cantidad + 1)}
                  className="w-7 h-7 rounded-md bg-stone-50 hover:bg-stone-100 border border-stone-200
                    flex items-center justify-center text-stone-700 transition-all active:scale-90 shadow-sm"
                >
                  <Plus size={12} />
                </button>
                <button
                  onClick={onEliminar}
                  className="ml-auto text-xs font-bold text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors active:scale-95"
                >
                  <Trash2 size={12} />
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