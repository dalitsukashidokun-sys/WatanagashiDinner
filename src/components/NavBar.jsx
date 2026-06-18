// src/components/NavBar.jsx
// ─── Barra de Navegación Superior ────────────────────────────────────────────

import { LogOut, ShoppingBag, UtensilsCrossed, LayoutDashboard } from 'lucide-react'
import { PERSONAJES, VISTAS } from '../constants'

/**
 * @param {Object}   usuario      - Usuario en sesión
 * @param {boolean}  esAdmin      - Si true, muestra acceso al panel admin
 * @param {string}   vistaActual  - Vista actualmente visible
 * @param {number}   totalItems   - Número total de ítems en la comanda
 * @param {boolean}  rtActivo     - Indicador de actividad realtime
 * @param {Function} onNavegar    - Callback(vista) para cambiar de vista
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
  const personaje = PERSONAJES.find((p) => p.id === usuario?.avatar)

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
      {/* ── Barra principal ── */}
      <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⛩️</span>
          <div className="hidden sm:block">
            <span className="font-serif text-sm text-gradient-red font-semibold">Hinamizawa</span>
            <span className="text-slate-600 text-xs ml-2">Comandas</span>
          </div>
        </div>

        {/* Centro: navegación */}
        <nav className="flex items-center gap-1">
          {navItems.filter((n) => n.visible).map((item) => (
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
              {/* Badge de cantidad */}
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-700 text-white text-[10px]
                  font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Derecha: usuario + logout */}
        <div className="flex items-center gap-2">
          {/* Indicador realtime */}
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 hidden sm:block
              ${rtActivo ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]' : 'bg-slate-700'}`}
            title={rtActivo ? 'Sincronizando' : 'Conectado'}
          />

          {/* Avatar + nombre */}
          <div className="flex items-center gap-1.5">
            {!esAdmin ? (
              <>
                <span className="text-base">{personaje?.emoji || '👤'}</span>
                <span className="text-sm text-slate-300 hidden sm:inline max-w-24 truncate">
                  {usuario?.nombre}
                </span>
              </>
            ) : (
              <span className="text-xs text-amber-500 border border-amber-800/50
                bg-amber-950/30 px-2 py-0.5 rounded-md font-medium">
                Admin
              </span>
            )}
          </div>

          {/* Botón cerrar sesión */}
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
