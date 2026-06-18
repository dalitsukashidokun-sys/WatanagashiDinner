// src/components/VistaComanda.jsx
// ─── Vista de Comanda Propia: Carrito del Usuario ─────────────────────────────

import { useState } from 'react'
import { Plus, Minus, Trash2, ShoppingBag, Loader2 } from 'lucide-react'
import { PERSONAJES } from '../constants'

/**
 * @param {Object}   usuario            - Objeto usuario en sesión
 * @param {Array}    comandas            - Ítems de la comanda del usuario (con joins)
 * @param {boolean}  cargando            - Estado de carga de comandas
 * @param {number}   total               - Total calculado en el hook
 * @param {boolean}  rtActivo            - Pulso de señal realtime activa
 * @param {Function} onActualizarCantidad - async(id, nuevaCantidad)
 * @param {Function} onEliminar          - async(id)
 */
export default function VistaComanda({
  usuario,
  comandas,
  cargando,
  total,
  rtActivo,
  onActualizarCantidad,
  onEliminar,
}) {
  const [cargandoId, setCargandoId] = useState(null) // ID del ítem procesándose

  const personaje = PERSONAJES.find((p) => p.id === usuario?.avatar)

  // ── Wrapper con indicador de carga por ítem ──────────────────────────────
  async function handleCantidad(id, nuevaCantidad) {
    setCargandoId(id)
    await onActualizarCantidad(id, nuevaCantidad)
    setCargandoId(null)
  }

  async function handleEliminar(id) {
    setCargandoId(id)
    await onEliminar(id)
    setCargandoId(null)
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* ── Cabecera con identidad del usuario ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-b ${personaje?.color || 'from-slate-800 to-slate-900'}
          border ${personaje?.borderColor || 'border-slate-700'} flex items-center justify-center text-xl`}>
          {personaje?.emoji || '👤'}
        </div>
        <div>
          <h2 className="font-serif text-lg text-white">
            Comanda de <span className={personaje?.textColor || 'text-slate-300'}>{usuario?.nombre}</span>
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* Indicador de sincronización en tiempo real */}
            <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300
              ${rtActivo ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-600'}`}
            />
            <span className="text-xs text-slate-500">
              {rtActivo ? 'Sincronizando...' : 'Sincronizado con Supabase'}
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

      {/* ── Lista de ítems ── */}
      {cargando ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card-dark h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {comandas.map((item) => (
            <ItemComanda
              key={item.id}
              item={item}
              procesando={cargandoId === item.id}
              onCantidad={(nueva) => handleCantidad(item.id, nueva)}
              onEliminar={() => handleEliminar(item.id)}
            />
          ))}
        </div>
      )}

      {/* ── Resumen total ── */}
      {comandas.length > 0 && (
        <div className="card-dark p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">
              {comandas.reduce((s, c) => s + c.cantidad, 0)} platos en total
            </span>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total mi comanda</p>
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                {total.toFixed(2)} €
              </p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-900/50 to-transparent" />
          <p className="text-xs text-slate-600 mt-3 text-center">
            Los precios se actualizan en tiempo real.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Ítem individual de la comanda ────────────────────────────────────────────
function ItemComanda({ item, procesando, onCantidad, onEliminar }) {
  const plato = item.platos
  if (!plato) return null

  const subtotal = (Number(plato.precio) * item.cantidad).toFixed(2)

  return (
    <div className={`card-dark p-4 transition-opacity duration-200 ${procesando ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Imagen pequeña */}
        {plato.imagen_url && (
          <img
            src={plato.imagen_url}
            alt={plato.nombre}
            className="w-14 h-14 rounded-lg object-cover shrink-0 border border-slate-800"
          />
        )}

        {/* Info del plato */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-sm font-semibold text-slate-100 leading-tight line-clamp-2">
              {plato.nombre}
            </h3>
            <span className="text-sm font-bold text-red-300 tabular-nums shrink-0">
              {subtotal} €
            </span>
          </div>

          {/* Nota */}
          {item.nota && (
            <p className="text-xs text-amber-500/80 mt-0.5 flex items-start gap-1">
              <span className="shrink-0">📝</span>
              <span className="line-clamp-1">{item.nota}</span>
            </p>
          )}

          {/* Controles */}
          <div className="flex items-center gap-2 mt-2.5">
            {procesando ? (
              <Loader2 size={16} className="text-slate-500 animate-spin" />
            ) : (
              <>
                {/* Botón reducir */}
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

                {/* Botón aumentar */}
                <button
                  onClick={() => onCantidad(item.cantidad + 1)}
                  className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700
                    flex items-center justify-center text-slate-400 transition-all active:scale-90"
                >
                  <Plus size={12} />
                </button>

                {/* Precio unitario */}
                <span className="text-xs text-slate-600 ml-1">
                  × {Number(plato.precio).toFixed(2)} €
                </span>

                {/* Botón eliminar */}
                <button
                  onClick={onEliminar}
                  className="ml-auto btn-danger flex items-center gap-1"
                  title="Eliminar de la comanda"
                >
                  <Trash2 size={12} />
                  <span>Quitar</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
