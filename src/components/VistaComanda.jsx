// src/components/VistaComanda.jsx
// ─── Comanda del Usuario: cada +/- persiste inmediatamente en Supabase ─────────
// No existe estado local de carrito. Todo cambio es un UPDATE/DELETE directo.

import { useState } from 'react'
import { Plus, Minus, Trash2, ShoppingBag, Loader2 } from 'lucide-react'
import { PERSONAJES } from '../constants'

/**
 * @param {Object}   usuario              - Usuario en sesión
 * @param {Array}    comandas             - Ítems sincronizados desde Supabase (con joins)
 * @param {boolean}  cargando             - Estado de carga
 * @param {number}   totalPlatos          - Recuento total de unidades (sin precios)
 * @param {boolean}  rtActivo             - Pulso de señal Realtime
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
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* ── Cabecera con avatar del personaje ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-b
          ${personaje?.color || 'from-slate-800 to-slate-900'}
          border ${personaje?.borderColor || 'border-slate-700'} shrink-0`}>
          <img
            src={personaje?.avatar}
            alt={personaje?.nombre}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display='none' }}
          />
        </div>
        <div>
          <h2 className="font-serif text-lg text-white">
            Comanda de{' '}
            <span className={personaje?.textColor || 'text-slate-300'}>{usuario?.nombre}</span>
          </h2>
          {/* Indicador Realtime */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300
              ${rtActivo
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                : 'bg-slate-600'
              }`}
            />
            <span className="text-xs text-slate-500">
              {rtActivo ? 'Guardando en Supabase...' : 'Sincronizado'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Estado vacío ── */}
      {!cargando && comandas.length === 0 && (
        <div className="card-dark p-12 text-center space-y-3">
          <ShoppingBag size={40} className="mx-auto text-slate-700" />
          <p className="text-slate-500 text-sm">Tu comanda está vacía.</p>
          <p className="text-slate-600 text-xs">Añade platos desde el menú.</p>
        </div>
      )}

      {/* ── Skeleton de carga ── */}
      {cargando && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card-dark h-20 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Lista de ítems ── */}
      {!cargando && (
        <div className="space-y-3 mb-6">
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

      {/* ── Resumen: solo recuento, sin precios ── */}
      {comandas.length > 0 && (
        <div className="card-dark p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Total de platos pedidos</span>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                {totalPlatos}
                <span className="text-sm font-normal text-slate-500 ml-1">
                  {totalPlatos === 1 ? 'plato' : 'platos'}
                </span>
              </p>
            </div>
          </div>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-emerald-900/50 to-transparent" />
          <p className="text-xs text-slate-600 mt-3 text-center">
            Cada cambio se guarda al instante en Supabase.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Ítem individual ──────────────────────────────────────────────────────────
function ItemComanda({ item, procesando, onCantidad, onEliminar }) {
  const plato = item.platos
  if (!plato) return null

  return (
    <div className={`card-dark p-4 transition-opacity duration-200 ${procesando ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Imagen miniatura */}
        {plato.imagen_url && (
          <img
            src={plato.imagen_url}
            alt={plato.nombre}
            className="w-14 h-14 rounded-lg object-cover shrink-0 border border-slate-800"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-sm font-semibold text-slate-100 leading-tight line-clamp-2">
              {plato.nombre}
            </h3>
            {/* Sin precio — solo cantidad */}
            <span className="text-sm font-bold text-slate-400 tabular-nums shrink-0">
              ×{item.cantidad}
            </span>
          </div>

          {item.nota && (
            <p className="text-xs text-amber-500/80 mt-0.5 flex items-start gap-1">
              <span className="shrink-0">📝</span>
              <span className="line-clamp-1">{item.nota}</span>
            </p>
          )}

          {/* Controles — cada clic hace UPDATE inmediato en Supabase */}
          <div className="flex items-center gap-2 mt-2.5">
            {procesando ? (
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Loader2 size={14} className="animate-spin" />
                Guardando...
              </div>
            ) : (
              <>
                <button
                  onClick={() => onCantidad(item.cantidad - 1)}
                  className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700
                    flex items-center justify-center text-slate-400 transition-all active:scale-90"
                >
                  <Minus size={12} />
                </button>
                <span className="text-sm font-semibold text-white min-w-[1.5rem] text-center tabular-nums">
                  {item.cantidad}
                </span>
                <button
                  onClick={() => onCantidad(item.cantidad + 1)}
                  className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700
                    flex items-center justify-center text-slate-400 transition-all active:scale-90"
                >
                  <Plus size={12} />
                </button>
                <button
                  onClick={onEliminar}
                  className="ml-auto btn-danger flex items-center gap-1"
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
