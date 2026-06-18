// src/components/PanelAdmin.jsx
// ─── Panel de Administrador: Vista global en tiempo real, sin precios ──────────
// Muestra recuento total de platos y desglose desplegable por comensal.
// Escucha Supabase Realtime de forma constante a través del hook useComandas.

import { useState } from 'react'
import { ChevronDown, ChevronUp, Users, Utensils, Radio } from 'lucide-react'
import { PERSONAJES } from '../constants'

/**
 * @param {Array}   comandas  - Todas las comandas con joins (platos + usuarios)
 * @param {boolean} cargando  - Estado de carga inicial
 * @param {number}  totalPlatos - Recuento global de unidades (sin precios)
 * @param {boolean} rtActivo  - Pulso de señal Realtime activa
 */
export default function PanelAdmin({ comandas, cargando, totalPlatos, rtActivo }) {
  // IDs de usuarios con su panel desplegado
  const [desplegados, setDesplegados] = useState(new Set())

  function toggleUsuario(uid) {
    setDesplegados(prev => {
      const siguiente = new Set(prev)
      siguiente.has(uid) ? siguiente.delete(uid) : siguiente.add(uid)
      return siguiente
    })
  }

  // ── Agrupar por usuario ───────────────────────────────────────────────────
  const porUsuario = comandas.reduce((acc, item) => {
    const uid = item.usuarios?.id
    if (!uid) return acc
    if (!acc[uid]) {
      acc[uid] = { usuario: item.usuarios, items: [], totalUnidades: 0 }
    }
    acc[uid].items.push(item)
    acc[uid].totalUnidades += item.cantidad
    return acc
  }, {})

  const filas = Object.values(porUsuario)
  const totalComensales = filas.length

  // ── Ranking de platos más pedidos ────────────────────────────────────────
  const ranking = Object.entries(
    comandas.reduce((acc, c) => {
      const nombre = c.platos?.nombre || 'Desconocido'
      acc[nombre] = (acc[nombre] || 0) + c.cantidad
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const maxRanking = ranking[0]?.[1] || 1

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── Cabecera con indicador Realtime ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-xl text-white">Panel de Control</h2>
          <p className="text-slate-500 text-sm mt-0.5">Vista global · Festival Watanagashi</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium
          transition-all duration-300
          ${rtActivo
            ? 'bg-emerald-950/50 border-emerald-800/50 text-emerald-400'
            : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}
        >
          <Radio size={12} className={rtActivo ? 'animate-pulse' : ''} />
          {rtActivo ? 'Recibiendo cambios' : 'En directo'}
        </div>
      </div>

      {/* ── Métricas: solo cantidades ── */}
      <div className="grid grid-cols-2 gap-3">
        <MetricaCard
          icono={<Utensils size={20} />}
          label="Total de platos pedidos"
          valor={totalPlatos}
          sufijo={totalPlatos === 1 ? 'plato' : 'platos'}
          color="text-red-400"
          bg="bg-red-950/30"
          border="border-red-900/50"
        />
        <MetricaCard
          icono={<Users size={20} />}
          label="Comensales con pedido"
          valor={totalComensales}
          sufijo={totalComensales === 1 ? 'comensal' : 'comensales'}
          color="text-blue-400"
          bg="bg-blue-950/30"
          border="border-blue-900/50"
        />
      </div>

      {/* ── Ranking de platos más pedidos ── */}
      {ranking.length > 0 && (
        <div className="card-dark p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
            🏆 Platos más pedidos
          </h3>
          <div className="space-y-3">
            {ranking.map(([nombre, qty], i) => (
              <div key={nombre} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 font-mono w-4 text-right shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-300 truncate">{nombre}</span>
                    <span className="text-sm font-bold text-red-300 tabular-nums ml-2">
                      ×{qty}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-900 to-red-600 rounded-full transition-all duration-500"
                      style={{ width: `${(qty / maxRanking) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Desglose por comensal: desplegable ── */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          👥 Comanda por comensal
        </h3>

        {cargando ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-dark h-16 animate-pulse" />
            ))}
          </div>
        ) : filas.length === 0 ? (
          <div className="card-dark p-10 text-center text-slate-500 text-sm">
            Aún no hay pedidos registrados.
          </div>
        ) : (
          <div className="space-y-2">
            {filas.map(({ usuario, items, totalUnidades }) => {
              const abierto = desplegados.has(usuario.id)
              const personaje = PERSONAJES.find(p => p.id === usuario.avatar)

              return (
                <div key={usuario.id} className="card-dark overflow-hidden">
                  {/* ── Cabecera del comensal (siempre visible, clic para desplegar) ── */}
                  <button
                    className={`w-full flex items-center justify-between px-4 py-3
                      bg-gradient-to-r hover:brightness-110 transition-all duration-150
                      ${personaje?.color || 'from-slate-800/40 to-slate-800/20'}`}
                    onClick={() => toggleUsuario(usuario.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar del personaje */}
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/50 shrink-0">
                        <img
                          src={personaje?.avatar}
                          alt={usuario.nombre}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${personaje?.textColor || 'text-slate-300'}`}>
                          {usuario.nombre}
                        </p>
                        <p className="text-xs text-slate-500">
                          {totalUnidades} {totalUnidades === 1 ? 'plato' : 'platos'}
                          {' · '}
                          {items.length} {items.length === 1 ? 'tipo' : 'tipos'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Barra visual de proporción */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        {items.map(item => (
                          <div
                            key={item.id}
                            title={`${item.platos?.nombre} ×${item.cantidad}`}
                            className="h-2 rounded-full bg-white/20 min-w-[6px] transition-all"
                            style={{ width: `${item.cantidad * 6}px`, maxWidth: 40 }}
                          />
                        ))}
                      </div>
                      {abierto
                        ? <ChevronUp size={16} className="text-slate-400" />
                        : <ChevronDown size={16} className="text-slate-400" />
                      }
                    </div>
                  </button>

                  {/* ── Detalle desplegable ── */}
                  {abierto && (
                    <div className="divide-y divide-slate-800/60 animate-slide-up">
                      {items.map(item => {
                        const plato = item.platos
                        if (!plato) return null
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                            {plato.imagen_url && (
                              <img
                                src={plato.imagen_url}
                                alt={plato.nombre}
                                className="w-9 h-9 rounded-md object-cover border border-slate-800 shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-200 truncate">{plato.nombre}</p>
                              {item.nota && (
                                <p className="text-xs text-amber-500/70 truncate">
                                  📝 {item.nota}
                                </p>
                              )}
                            </div>
                            {/* Solo cantidad, sin precio */}
                            <span className="text-sm font-bold text-slate-300 tabular-nums shrink-0">
                              ×{item.cantidad}
                            </span>
                          </div>
                        )
                      })}

                      {/* Subtotal del usuario en platos */}
                      <div className="px-4 py-2.5 flex justify-between items-center bg-slate-900/50">
                        <span className="text-xs text-slate-600 uppercase tracking-wider">
                          Total del comensal
                        </span>
                        <span className="text-sm font-bold text-emerald-400 tabular-nums">
                          {totalUnidades} {totalUnidades === 1 ? 'plato' : 'platos'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tarjeta de métrica simple ────────────────────────────────────────────────
function MetricaCard({ icono, label, valor, sufijo, color, bg, border }) {
  return (
    <div className={`card-dark p-4 ${bg} border ${border}`}>
      <div className={`${color} mb-2`}>{icono}</div>
      <p className="text-slate-500 text-xs mb-1 leading-tight">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>
        {valor}
        <span className="text-xs font-normal text-slate-500 ml-1.5">{sufijo}</span>
      </p>
    </div>
  )
}
