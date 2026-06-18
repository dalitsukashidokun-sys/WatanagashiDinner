// src/App.jsx
// ─── Componente Raíz ──────────────────────────────────────────────────────────
// Orquesta sesión, navegación por estado y paso de datos entre componentes.
// Cambios v2: sin precios, upsertItem como única operación de escritura para
// añadir/actualizar, fondo global gestionado desde PantallaLogin.

import { useState, useEffect } from 'react'
import { VISTAS } from './constants'
import { useComandas } from './hooks/useComandas'
import { usePlatos }   from './hooks/usePlatos'

import PantallaLogin from './components/PantallaLogin'
import NavBar        from './components/NavBar'
import VistaMenu     from './components/VistaMenu'
import VistaDetalle  from './components/VistaDetalle'
import VistaComanda  from './components/VistaComanda'
import PanelAdmin    from './components/PanelAdmin'

export default function App() {
  const [usuario,      setUsuario]      = useState(null)
  const [esAdmin,      setEsAdmin]      = useState(false)
  const [vista,        setVista]        = useState(VISTAS.MENU)
  const [platoDetalle, setPlatoDetalle] = useState(null)

  // ── Restaurar sesión desde localStorage ──────────────────────────────────
  useEffect(() => {
    try {
      const admin  = localStorage.getItem('higurashi_admin')
      const sesion = localStorage.getItem('higurashi_sesion')

      if (admin === 'true') {
        setEsAdmin(true)
        setVista(VISTAS.ADMIN)
        setUsuario({ id: 'admin', nombre: 'Admin', avatar: 'irie' })
        return
      }
      if (sesion) {
        setUsuario(JSON.parse(sesion))
        setVista(VISTAS.MENU)
      }
    } catch {
      localStorage.clear()
    }
  }, [])

  // ── Platos del menú (estáticos durante la sesión) ─────────────────────────
  const { platos, cargando: cargandoPlatos } = usePlatos()

  // ── Comandas del usuario actual ───────────────────────────────────────────
  const {
    comandas:          misComandas,
    cargando:          cargandoMisComandas,
    totalPlatos:       miTotalPlatos,
    rtActivo:          rtUser,
    upsertItem,                 // ← única función de escritura (añadir + actualizar)
    actualizarCantidad,
    eliminarItem,
  } = useComandas(
    usuario?.id !== 'admin' ? usuario?.id : null,
    false
  )

  // ── Todas las comandas (solo admin) ───────────────────────────────────────
  const {
    comandas:    todasComandas,
    cargando:    cargandoAdmin,
    totalPlatos: totalGlobalPlatos,
    rtActivo:    rtAdmin,
  } = useComandas(null, esAdmin)

  // ── Handlers de sesión ────────────────────────────────────────────────────
  function handleLogin(usuarioData) {
    setUsuario(usuarioData)
    setVista(VISTAS.MENU)
    setEsAdmin(false)
  }

  function handleAdminAccess() {
    setEsAdmin(true)
    setVista(VISTAS.ADMIN)
    setUsuario({ id: 'admin', nombre: 'Admin', avatar: 'irie' })
  }

  function handleLogout() {
    localStorage.removeItem('higurashi_sesion')
    localStorage.removeItem('higurashi_admin')
    setUsuario(null)
    setEsAdmin(false)
    setVista(VISTAS.MENU)
    setPlatoDetalle(null)
  }

  // ── Handlers de navegación ────────────────────────────────────────────────
  function handleVerDetalle(plato) {
    setPlatoDetalle(plato)
    setVista(VISTAS.DETALLE)
  }

  function handleVolverAlMenu() {
    setPlatoDetalle(null)
    setVista(VISTAS.MENU)
  }

  // ── Desde VistaDetalle: upsert inmediato (sin carrito temporal) ───────────
  async function handleAnyadirAComanda(platoId, cantidad, nota) {
    return await upsertItem(platoId, cantidad, nota)
  }

  // Sin sesión → pantalla de login
  if (!usuario) {
    return (
      <PantallaLogin
        onLogin={handleLogin}
        onAdminAccess={handleAdminAccess}
      />
    )
  }

  // ── App principal ─────────────────────────────────────────────────────────
  // El fondo global (bg-cover/fondo.jpg) se aplica aquí con una capa oscura
  // para que todas las vistas internas mantengan la estética.
  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/fondos/fondo.jpg')" }}
    >
      {/* Capa de oscurecimiento sobre el fondo */}
      <div className="absolute inset-0 bg-black/70 pointer-events-none" />

      {/* Todo el contenido encima de la capa */}
      <div className="relative flex flex-col flex-1">
        <NavBar
          usuario={usuario}
          esAdmin={esAdmin}
          vistaActual={vista}
          totalItems={misComandas.length}
          rtActivo={esAdmin ? rtAdmin : rtUser}
          onNavegar={v => { setPlatoDetalle(null); setVista(v) }}
          onLogout={handleLogout}
        />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
          {vista === VISTAS.MENU && (
            <VistaMenu
              platos={platos}
              cargando={cargandoPlatos}
              onVerDetalle={handleVerDetalle}
            />
          )}

          {vista === VISTAS.DETALLE && platoDetalle && (
            <VistaDetalle
              plato={platoDetalle}
              onVolver={handleVolverAlMenu}
              onAnyadir={handleAnyadirAComanda}
            />
          )}

          {vista === VISTAS.COMANDA && (
            <VistaComanda
              usuario={usuario}
              comandas={misComandas}
              cargando={cargandoMisComandas}
              totalPlatos={miTotalPlatos}
              rtActivo={rtUser}
              onActualizarCantidad={actualizarCantidad}
              onEliminar={eliminarItem}
            />
          )}

          {vista === VISTAS.ADMIN && esAdmin && (
            <PanelAdmin
              comandas={todasComandas}
              cargando={cargandoAdmin}
              totalPlatos={totalGlobalPlatos}
              rtActivo={rtAdmin}
            />
          )}
        </main>

        <footer className="border-t border-slate-800/30 py-4 px-4 mt-auto">
          <p className="text-center text-slate-600 text-xs font-serif">
            Cuando las cigarras lloran · Higurashi no Naku Koro ni
          </p>
        </footer>
      </div>
    </div>
  )
}
