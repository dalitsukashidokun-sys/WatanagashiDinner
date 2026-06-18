// src/components/PanelAdmin.jsx
// ─── Panel de Administrador: Resumen Global en Tiempo Real ────────────────────

import { PERSONAJES } from '../constants'
import { Users, Utensils, TrendingUp, Radio } from 'lucide-react'

/**
 * @param {Array}   comandas  - Todas las comandas de todos los usuarios (con joins)
 * @param {boolean} cargando  - Estado de carga
 * @param {number}  total     - Total global acumulado
 * @param {boolean} rtActivo  - Pulso de señal realtime activa
 */
export default function PanelAdmin({ comandas, cargando, total, rtActivo }) {
  // ── Agrupar comandas por usuario ─────────────────────────────────────────
  const porUsuario = comandas.reduce((acc, item) => {
    const uid = item.usuarios?.id
    if (!uid) return acc
    if (!acc[uid]) {
      acc[uid] = {
        usuario: item.usuarios,
        items: [],
        subtotal: 0,
      }
    }
    acc[uid].items.push(item)
    acc[uid].subtotal += (item.platos?.precio || 0) * item.cantidad
    return acc
  }, {})

  const usuariosConComanda = Object.values(porUsuario)
  const totalPlatos = comandas.reduce((s, c) => s + c.cantidad, 0)

  // ── Ranking de platos más pedidos ────────────────────────────────────────
  const rankingPlatos = Object.entries(
    comandas.reduce((acc, c) => {
      const nombre = c.platos?.nombre || 'Desconocido'
      acc[nombre] = (acc[nombre] || 0) + c.cantidad
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const maxRanking = rankingPlatos[0]?.[1] || 1

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Cabecera con indicador realtime ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl text-white">Panel de Control</h2>
          <p className="text-slate-500 text-sm mt-0.5">Vista global de la cena</p>
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

      {/* ── Métricas globales ── */}
      <div className="grid grid-cols-3 gap-3">
        <MetricaCard
          icono={<TrendingUp size={18} />}
          label="Recaudación total"
          valor={`${total.toFixed(2)} €`}
          color="text-emerald-400"
          bgColor="bg-emerald-950/30"
          borderColor="border-emerald-900/50"
        />
        <MetricaCard
          icono={<Users size={18} />}
          label="Comensales activos"
          valor={usuariosConComanda.length}
          color="text-blue-400"
          bgColor="bg-blue-950/30"
          borderColor="border-blue-900/50"
        />
        <MetricaCard
          icono={<Utensils size={18} />}
          label="Platos pedidos"
          valor={totalPlatos}
          color="text-violet-400"
          bgColor="bg-violet-950/30"
          borderColor="border-violet-900/50"
        />
      </div>

      {/* ── Ranking de platos ── */}
      {rankingPlatos.length > 0 && (
        <div className="card-dark p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
            🏆 Platos más pedidos
          </h3>
          <div className="space-y-3">
            {rankingPlatos.map(([nombre, qty], i) => (
              <div key={nombre} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 font-mono w-4 text-right shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-300 truncate">{nombre}</span>
                    <span className="text-sm font-bold text-red-300 tabular-nums ml-2">×{qty}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-900 to-red-700 rounded-full transition-all duration-500"
                      style={{ width: `${(qty / maxRanking) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Desglose por usuario ── */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          👥 Detalle por comensal
        </h3>
        {cargando ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-dark h-24 animate-pulse" />
            ))}
          </div>
        ) : usuariosConComanda.length === 0 ? (
          <div className="card-dark p-10 text-center text-slate-500 text-sm">
            Aún no hay pedidos registrados.
          </div>
        ) : (
          <div className="space-y-3">
            {usuariosConComanda.map(({ usuario, items, subtotal }) => (
              <FilaUsuario
                key={usuario.id}
                usuario={usuario}
                items={items}
                subtotal={subtotal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tarjeta de métrica ───────────────────────────────────────────────────────
function MetricaCard({ icono, label, valor, color, bgColor, borderColor }) {
  return (
    <div className={`card-dark p-4 ${bgColor} border ${borderColor}`}>
      <div className={`${color} mb-2`}>{icono}</div>
      <p className="text-slate-500 text-xs mb-0.5 leading-tight">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{valor}</p>
    </div>
  )
}

// ─── Fila desplegable de usuario ──────────────────────────────────────────────
function FilaUsuario({ usuario, items, subtotal }) {
  const personaje = PERSONAJES.find((p) => p.id === usuario.avatar)

  return (
    <div className="card-dark overflow-hidden">
      {/* Cabecera del usuario */}
      <div className={`flex items-center justify-between px-4 py-3
        bg-gradient-to-r ${personaje?.color || 'from-slate-800/40 to-slate-800/20'}
        border-b border-slate-800/80`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{personaje?.emoji || '👤'}</span>
          <div>
            <p className={`text-sm font-semibold ${personaje?.textColor || 'text-slate-300'}`}>
              {usuario.nombre}
            </p>
            <p className="text-xs text-slate-500">
              {items.reduce((s, i) => s + i.cantidad, 0)} platos
            </p>
          </div>
        </div>
        <span className="text-sm font-bold text-emerald-400 tabular-nums">
          {subtotal.toFixed(2)} €
        </span>
      </div>

      {/* Lista de platos del usuario */}
      <div className="divide-y divide-slate-800/50">
        {items.map((item) => {
          const plato = item.platos
          if (!plato) return null
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              {/* Imagen miniatura */}
              {plato.imagen_url && (
                <img
                  src={plato.imagen_url}
                  alt={plato.nombre}
                  className="w-8 h-8 rounded object-cover border border-slate-800 shrink-0"
                />
              )}
              {/* Detalles */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{plato.nombre}</p>
                {item.nota && (
                  <p className="text-xs text-amber-500/70 truncate">📝 {item.nota}</p>
                )}
              </div>
              {/* Cantidad y subtotal */}
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-400">×{item.cantidad}</p>
                <p className="text-sm font-medium text-slate-300 tabular-nums">
                  {(Number(plato.precio) * item.cantidad).toFixed(2)} €
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
