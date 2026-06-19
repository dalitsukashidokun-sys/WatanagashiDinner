// src/components/VistaMenu.jsx
// ─── Vista del Menú: Categorías y Tarjetas de Platos (Versión Crema) ─────────
// Totalmente sincronizado con la estética #fdfbf7 y bg-white.

import { useState } from 'react'
import { CATEGORIAS } from '../constants'

/**
 * @param {Array}    platos       - Lista de platos cargados de Supabase
 * @param {boolean}  cargando     - Estado de carga inicial
 * @param {Function} onVerDetalle - Callback al hacer clic en una tarjeta
 */
export default function VistaMenu({ platos, cargando, onVerDetalle }) {
  const [categoriaActiva, setCategoriaActiva] = useState('principal')

  const platosFiltrados = platos.filter((p) => p.categoria === categoriaActiva)

  return (
    <div className="bg-[#fdfbf7] p-4 sm:p-6 rounded-2xl border border-[#decfa8]/60 shadow-xl max-w-5xl mx-auto animate-fade-in my-2">
      
      {/* ── Pestañas de categoría (Estilo Crema) ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4 border-b border-stone-200">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoriaActiva(cat.id)}
            className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              categoriaActiva === cat.id 
                ? 'bg-amber-800 text-white border-amber-800 shadow-sm' 
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:text-stone-800'
            }`}
          >
            <span className="text-sm">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Estado de carga (Skeletons Claros) ── */}
      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl h-64 animate-pulse overflow-hidden shadow-sm">
              <div className="h-36 bg-stone-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-full" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : platosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-stone-500 bg-white border border-stone-200 rounded-xl shadow-sm">
          <div className="text-4xl mb-3 opacity-60">🍱</div>
          <p className="text-sm font-medium">La cocina no ha preparado platos para esta categoría.</p>
        </div>
      ) : (
        /* ── Grid de tarjetas ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platosFiltrados.map((plato) => (
            <TarjetaPlato
              key={plato.id}
              plato={plato}
              onClick={() => onVerDetalle(plato)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tarjeta individual de plato (Módulo Blanco Puro) ─────────────────────────
function TarjetaPlato({ plato, onClick }) {
  return (
    <article
      className="bg-white border border-stone-200 rounded-xl overflow-hidden cursor-pointer hover:border-amber-700/40 hover:shadow-md transition-all duration-300 group flex flex-col"
      onClick={onClick}
    >
      {/* Imagen limpia sin overlays oscuros */}
      <div className="relative h-40 overflow-hidden shrink-0 border-b border-stone-100">
        {plato.imagen_url ? (
          <img
            src={plato.imagen_url}
            alt={plato.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-stone-100 flex items-center justify-center text-4xl opacity-50">
            🍱
          </div>
        )}
      </div>

      {/* Contenido de la Tarjeta */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-serif text-sm font-bold text-stone-900 leading-tight mb-1.5 line-clamp-2">
          {plato.nombre}
        </h3>
        
        <p className="text-stone-500 text-xs leading-relaxed line-clamp-2 min-h-[2rem] mb-3">
          {plato.descripcion_corta}
        </p>

        {/* Etiquetas + CTA (Empujados al fondo automático) */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-stone-50">
          <div className="flex flex-wrap gap-1.5">
            {plato.etiquetas?.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded border border-stone-200 bg-stone-50 text-stone-500 text-[9px] font-medium uppercase tracking-wider">
                {tag}
              </span>
            ))}
            {plato.etiquetas?.length > 2 && (
              <span className="px-1.5 py-0.5 rounded border border-stone-200 bg-stone-50 text-stone-500 text-[9px] font-medium">
                +{plato.etiquetas.length - 2}
              </span>
            )}
          </div>
          <span className="text-[11px] text-amber-800 font-bold group-hover:text-amber-600 transition-colors shrink-0">
            Ver detalles →
          </span>
        </div>
      </div>
    </article>
  )
}