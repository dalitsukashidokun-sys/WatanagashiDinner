// src/components/NavBar.jsx
// ─── Barra de Navegación v2 ───────────────────────────────────────────────────
// Añade botón Juego parpadeante cuando el admin lo habilita.

import { LogOut, ShoppingBag, UtensilsCrossed, LayoutDashboard, Swords } from 'lucide-react'
import { PERSONAJES, VISTAS } from '../constants'

export default function NavBar({
  usuario, esAdmin, vistaActual, totalItems, rtActivo,
  juegoHabilitado, onNavegar, onLogout,
}) {
  const personaje = PERSONAJES.find(p => p.id === usuario?.avatar)

  return (
    <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-sm border-b border-stone-800/80">
      <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto gap-2">

        {/* Logo */}
        <button onClick={() => onNavegar(VISTAS.MENU)}
          className="flex items-center gap-2 shrink-0">
          <span className="text-xl">⛩️</span>
          <div className="hidden sm:block">
            <span className="font-serif text-sm text-gradient-sunset font-semibold">Hinamizawa</span>
            <span className="text-stone-600 text-xs ml-2">Comandas</span>
          </div>
        </button>

        {/* Nav central */}
        <nav className="flex items-center gap-1">
          {!esAdmin && (
            <>
              <NavBtn id={VISTAS.MENU}    label="Menú"       icon={<UtensilsCrossed size={15} />} vistaActual={vistaActual} onNavegar={onNavegar} />
              <NavBtn id={VISTAS.COMANDA} label="Comanda"    icon={<ShoppingBag size={15} />}    vistaActual={vistaActual} onNavegar={onNavegar}
                badge={totalItems > 0 ? totalItems : null} />

              {/* Botón juego: solo si habilitado */}
              {juegoHabilitado && (
                <button onClick={() => onNavegar(VISTAS.JUEGO)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${vistaActual === VISTAS.JUEGO
                      ? 'bg-red-900/30 text-red-300 border border-red-800/50'
                      : 'text-red-500 border border-red-900/40 hover:bg-red-950/30 animate-flicker'
                    }`}>
                  <Swords size={15} />
                  <span className="hidden sm:inline">Juego</span>
                </button>
              )}
            </>
          )}

          {esAdmin && (
            <NavBtn id={VISTAS.ADMIN} label="Panel" icon={<LayoutDashboard size={15} />}
              vistaActual={vistaActual} onNavegar={onNavegar} />
          )}
        </nav>

        {/* Perfil + RT + logout */}
        <div className="flex items-center gap-2 shrink-0">
          <span title={rtActivo ? 'Sincronizando' : 'Conectado'}
            className={`w-1.5 h-1.5 rounded-full hidden sm:block transition-all ${
              rtActivo ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]' : 'bg-stone-700'
            }`} />

          {!esAdmin ? (
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-stone-800 border border-stone-700 shrink-0">
                <img src={personaje?.avatar} alt={personaje?.nombre}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }} />
              </div>
              <span className="text-sm text-stone-300 hidden sm:inline max-w-[100px] truncate">
                {usuario?.nombre}
              </span>
            </div>
          ) : (
            <span className="text-xs text-amber-500 border border-amber-800/50 bg-amber-950/30 px-2 py-0.5 rounded-md font-medium">
              Admin
            </span>
          )}

          <button onClick={onLogout}
            className="btn-ghost flex items-center gap-1.5 text-xs px-2.5 py-1.5"
            title="Cerrar sesión">
            <LogOut size={14} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function NavBtn({ id, label, icon, vistaActual, onNavegar, badge }) {
  const activo = vistaActual === id
  return (
    <button onClick={() => onNavegar(id)}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-150 active:scale-95
        ${activo
          ? 'bg-red-900/30 text-red-300 border border-red-900/50'
          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/80'
        }`}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 bg-red-700 text-white text-[10px] font-bold
          w-4 h-4 rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}
