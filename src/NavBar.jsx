// src/components/NavBar.jsx
// ─── Barra de Navegación v2 ───────────────────────────────────────────────────
// Añade el botón "Juego" (parpadeante en rojo) cuando juegoHabilitado=true

import { ShoppingBag, LayoutGrid, User, LogOut, Swords, Settings } from 'lucide-react'
import { VISTAS, PERSONAJES } from '../constants'

export default function NavBar({
  usuario,
  esAdmin,
  vistaActual,
  totalItems,
  rtActivo,
  juegoHabilitado,
  onNavegar,
  onLogout,
}) {
  const personaje = PERSONAJES.find(p => p.id === usuario?.avatar)

  const navBtn = (vista, icon, label, extra = '') => (
    <button
      onClick={() => onNavegar(vista)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${extra}
        ${vistaActual === vista
          ? 'bg-stone-800/80 text-stone-100 border border-stone-700/50'
          : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/40'
        }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-stone-800/50 backdrop-blur-md bg-stone-950/80">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2">

        {/* ── Logo / título ── */}
        <button
          onClick={() => onNavegar(VISTAS.MENU)}
          className="font-serif text-stone-200 text-base font-semibold hover:text-white transition-colors shrink-0 tracking-wide"
        >
          <span className="hidden sm:inline">Higurashi · Festival</span>
          <span className="sm:hidden text-red-500">⛩</span>
        </button>

        {/* ── Navegación central ── */}
        {!esAdmin && (
          <nav className="flex items-center gap-1">
            {navBtn(VISTAS.MENU, <LayoutGrid size={16} />, 'Menú')}
            {navBtn(VISTAS.COMANDA,
              <div className="relative">
                <ShoppingBag size={16} />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </div>,
              'Comanda'
            )}

            {/* ── Botón Juego: solo visible si juegoHabilitado ── */}
            {juegoHabilitado && (
              <button
                onClick={() => onNavegar(VISTAS.JUEGO)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${vistaActual === VISTAS.JUEGO
                    ? 'bg-red-900/60 text-red-300 border border-red-700/50'
                    : 'text-red-500 hover:text-red-400 hover:bg-red-950/40 border border-red-900/40 animate-flicker'
                  }`}
              >
                <Swords size={16} />
                <span className="hidden sm:inline">Juego</span>
              </button>
            )}
          </nav>
        )}

        {/* Admin: tab de Panel */}
        {esAdmin && (
          <nav className="flex items-center gap-1">
            <button
              onClick={() => onNavegar(VISTAS.ADMIN)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-950/30 transition-all"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Panel Admin</span>
            </button>
          </nav>
        )}

        {/* ── Perfil y logout ── */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Indicador Realtime */}
          {rtActivo && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          )}

          {/* Avatar y nombre */}
          <div className="flex items-center gap-2">
            {personaje ? (
              <div className={`w-7 h-7 rounded-full overflow-hidden border ${personaje.borderColor} bg-stone-800 shrink-0`}>
                <img src={personaje.avatar} alt={usuario.nombre} className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }} />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
                <User size={14} className="text-stone-500" />
              </div>
            )}
            <span className="text-sm text-stone-400 hidden md:inline truncate max-w-[120px]">
              {usuario.nombre}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-1.5 text-stone-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}
