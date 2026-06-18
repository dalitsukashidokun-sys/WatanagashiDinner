// src/components/VistaMenu.jsx
// ─── Vista del Menú: Categorías y Tarjetas de Platos ─────────────────────────

import { useState } from 'react'
import { CATEGORIAS } from '../constants'

/**
 * @param {Array}    platos      - Lista de platos cargados de Supabase
 * @param {boolean}  cargando    - Estado de carga inicial
 * @param {Function} onVerDetalle - Callback al hacer clic en una tarjeta
 */
export default function VistaMenu({ platos, cargando, onVerDetalle }) {
  const [categoriaActiva, setCategoriaActiva] = useState('principal')

  const platosFiltrados = platos.filter((p) => p.categoria === categoriaActiva)

  return (
    <div className="animate-fade-in">
      {/* ── Pestañas de categoría ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-6">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoriaActiva(cat.id)}
            className={`tab-item whitespace-nowrap flex items-center gap-1.5 ${
              categoriaActiva === cat.id ? 'active' : ''
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Estado de carga ── */}
      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-dark h-64 animate-pulse">
              <div className="h-40 bg-slate-800/50" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-800/50 rounded w-3/4" />
                <div className="h-3 bg-slate-800/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : platosFiltrados.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-3">🍱</div>
          <p>No hay platos en esta categoría.</p>
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

// ─── Tarjeta individual de plato ──────────────────────────────────────────────
function TarjetaPlato({ plato, onClick }) {
  return (
    <article
      className="card-dark group cursor-pointer hover:border-red-900/50 hover:-translate-y-1 hover:glow-red"
      onClick={onClick}
    >
      {/* Imagen con overlay */}
      <div className="relative h-44 overflow-hidden">
        {plato.imagen_url ? (
          <img
            src={plato.imagen_url}
            alt={plato.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-4xl">
            🍱
          </div>
        )}
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        {/* Precio superpuesto */}
        <div className="absolute top-3 right-3">
          <span className="bg-slate-950/90 text-red-300 text-sm font-semibold px-2.5 py-1 rounded-lg border border-red-900/30">
            {Number(plato.precio).toFixed(2)} €
          </span>
        </div>

        {/* Nombre sobre la imagen */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-serif text-base font-semibold text-white leading-tight line-clamp-2">
            {plato.nombre}
          </h3>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-3">
        {/* Descripción corta */}
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {plato.descripcion_corta}
        </p>

        {/* Etiquetas */}
        {plato.etiquetas?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {plato.etiquetas.slice(0, 3).map((tag) => (
              <span key={tag} className="tag tag-slate">{tag}</span>
            ))}
            {plato.etiquetas.length > 3 && (
              <span className="tag tag-slate">+{plato.etiquetas.length - 3}</span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="pt-1">
          <span className="text-xs text-red-400 group-hover:text-red-300 transition-colors font-medium">
            Ver detalle →
          </span>
        </div>
      </div>
    </article>
  )
}
