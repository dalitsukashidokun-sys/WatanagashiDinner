// src/components/NavBar.jsx
// ─── Barra de Navegación Superior ────────────────────────────────────────────
// Usa la imagen de avatar del personaje en lugar de emoji.

import { LogOut, ShoppingBag, UtensilsCrossed, LayoutDashboard } from 'lucide-react'
import { PERSONAJES, VISTAS } from '../constants'

/**
 * @param {Object}   usuario      - Usuario en sesión
 * @param {boolean}  esAdmin      - Muestra acceso al panel admin
 * @param {string}   vistaActual  - Vista activa para resaltar la pestaña
 * @param {number}   totalItems   - Número de tipos de platos en comanda (para badge)
 * @param {boolean}  rtActivo     - Indicador de actividad Realtime
 * @param {Function} onNavegar    - Callback(vista)
 * @param {Function} onLogout     - Callback para cerrar sesión
 */
export default function NavBar({
  usuario,
  esAdmin,
  vistaActual,
  totalItems,
  rtActivo,
  onNavegar,
  onLogout,
}) {
  const personaje = PERSONAJES.find(p => p.id === usuario?.avatar)

  const navItems = [
    {
      id: VISTAS.MENU,
      label: 'Menú',
      icono: <UtensilsCrossed size={16} />,
      visible: !esAdmin,
    },
    {
      id: VISTAS.COMANDA,
      label: 'Mi comanda',
      icono: <ShoppingBag size={16} />,
      badge: totalItems > 0 ? totalItems : null,
      visible: !esAdmin,
    },
    {
      id: VISTAS.ADMIN,
      label: 'Panel',
      icono: <LayoutDashboard size={16} />,
      visible: esAdmin,
    },
  ]

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/80">
      <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⛩️</span>
          <div className="hidden sm:block">
            <span className="font-serif text-sm text-gradient-red font-semibold">Hinamizawa</span>
            <span className="text-slate-600 text-xs ml-2">Comandas</span>
          </div>
        </div>

        {/* Navegación central */}
        <nav className="flex items-center gap-1">
          {navItems.filter(n => n.visible).map(item => (
            <button
              key={item.id}
              onClick={() => onNavegar(item.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                font-medium transition-all duration-150 active:scale-95
                ${vistaActual === item.id
                  ? 'bg-red-900/30 text-red-300 border border-red-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
            >
              {item.icono}
              <span className="hidden sm:inline">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-700 text-white text-[10px]
                  font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Derecha: avatar + nombre + logout */}
        <div className="flex items-center gap-2">
          {/* Indicador Realtime */}
          <span
            title={rtActivo ? 'Sincronizando' : 'Conectado'}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 hidden sm:block
              ${rtActivo
                ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]'
                : 'bg-slate-700'
              }`}
          />

          {!esAdmin ? (
            <div className="flex items-center gap-1.5">
              {/* Avatar del personaje (imagen local) */}
              <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                <img
                  src={personaje?.avatar}
                  alt={personaje?.nombre}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }}
                />
              </div>
              <span className="text-sm text-slate-300 hidden sm:inline max-w-24 truncate">
                {usuario?.nombre}
              </span>
            </div>
          ) : (
            <span className="text-xs text-amber-500 border border-amber-800/50
              bg-amber-950/30 px-2 py-0.5 rounded-md font-medium">
              Admin
            </span>
          )}

          <button
            onClick={onLogout}
            className="btn-ghost flex items-center gap-1.5 text-xs px-2.5 py-1.5"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  )
}
