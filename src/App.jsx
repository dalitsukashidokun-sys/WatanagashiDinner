// src/App.jsx
// ─── Componente Raíz: Orquestación de la SPA ─────────────────────────────────
// Gestiona el estado global de sesión y navegación entre vistas.
// No usa react-router-dom: la "ruta" es simplemente un estado de React.

import { useState, useEffect } from 'react'
import { VISTAS } from './constants'
import { useComandas } from './hooks/useComandas'
import { usePlatos }   from './hooks/usePlatos'

// Componentes de vista
import PantallaLogin  from './components/PantallaLogin'
import NavBar         from './components/NavBar'
import VistaMenu      from './components/VistaMenu'
import VistaDetalle   from './components/VistaDetalle'
import VistaComanda   from './components/VistaComanda'
import PanelAdmin     from './components/PanelAdmin'

export default function App() {
  // ── Estado de sesión ──────────────────────────────────────────────────────
  const [usuario,  setUsuario]  = useState(null)   // objeto usuario de Supabase
  const [esAdmin,  setEsAdmin]  = useState(false)  // modo administrador

  // ── Estado de navegación ─────────────────────────────────────────────────
  const [vista,         setVista]         = useState(VISTAS.MENU)
  const [platoDetalle,  setPlatoDetalle]  = useState(null) // plato seleccionado

  // ── Restaurar sesión desde localStorage al cargar la app ─────────────────
  useEffect(() => {
    try {
      const sesionGuardada = localStorage.getItem('higurashi_sesion')
      const adminGuardado  = localStorage.getItem('higurashi_admin')

      if (adminGuardado === 'true') {
        setEsAdmin(true)
        setVista(VISTAS.ADMIN)
        setUsuario({ nombre: 'Admin', avatar: 'irie', id: 'admin' })
        return
      }

      if (sesionGuardada) {
        const sesion = JSON.parse(sesionGuardada)
        setUsuario(sesion)
        setVista(VISTAS.MENU)
      }
    } catch (_) {
      // Si el JSON está corrupto, limpiar y mostrar login
      localStorage.clear()
    }
  }, [])

  // ── Datos: platos del menú ────────────────────────────────────────────────
  const { platos, cargando: cargandoPlatos } = usePlatos()

  // ── Datos: comandas del usuario actual ───────────────────────────────────
  const {
    comandas:          misComandas,
    cargando:          cargandoMisComandas,
    total:             miTotal,
    rtActivo:          rtUser,
    anyadirItem,
    actualizarCantidad,
    eliminarItem,
  } = useComandas(usuario?.id !== 'admin' ? usuario?.id : null, false)

  // ── Datos: TODAS las comandas (solo admin) ────────────────────────────────
  const {
    comandas: todasComandas,
    cargando: cargandoAdmin,
    total:    totalGlobal,
    rtActivo: rtAdmin,
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
    setUsuario({ nombre: 'Admin', avatar: 'irie', id: 'admin' })
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

  // ── Añadir ítem a comanda (desde VistaDetalle) ────────────────────────────
  async function handleAnyadirAComanda(platoId, cantidad, nota) {
    return await anyadirItem(platoId, cantidad, nota)
  }

  // ── Total de ítems distintos en la comanda (para el badge) ────────────────
  const totalItemsComanda = misComandas.length

  // ── Si no hay sesión, mostrar pantalla de login ───────────────────────────
  if (!usuario) {
    return (
      <PantallaLogin
        onLogin={handleLogin}
        onAdminAccess={handleAdminAccess}
      />
    )
  }

  // ── App principal con navegación ──────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar sticky */}
      <NavBar
        usuario={usuario}
        esAdmin={esAdmin}
        vistaActual={vista}
        totalItems={totalItemsComanda}
        rtActivo={esAdmin ? rtAdmin : rtUser}
        onNavegar={(v) => {
          setPlatoDetalle(null)
          setVista(v)
        }}
        onLogout={handleLogout}
      />

      {/* Contenido principal */}
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
            total={miTotal}
            rtActivo={rtUser}
            onActualizarCantidad={actualizarCantidad}
            onEliminar={eliminarItem}
          />
        )}

        {vista === VISTAS.ADMIN && esAdmin && (
          <PanelAdmin
            comandas={todasComandas}
            cargando={cargandoAdmin}
            total={totalGlobal}
            rtActivo={rtAdmin}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-4 px-4 mt-auto">
        <p className="text-center text-slate-700 text-xs font-serif">
          Cuando las cigarras lloran · Higurashi no Naku Koro ni
        </p>
      </footer>
    </div>
  )
}
