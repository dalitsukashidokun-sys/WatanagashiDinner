// src/App.jsx
// ─── Componente Raíz v3: Sincronización de Fondos y Navbar Discreta ──────────

import { useState, useEffect } from 'react'
import { VISTAS } from './constants'
import { useComandas } from './hooks/useComandas'
import { usePlatos }   from './hooks/usePlatos'
import { supabase }    from './supabaseClient'

import PantallaLogin from './components/PantallaLogin'
import NavBar        from './components/NavBar'
import VistaMenu     from './components/VistaMenu'
import VistaDetalle  from './components/VistaDetalle'
import VistaComanda  from './components/VistaComanda'
import PanelAdmin    from './components/PanelAdmin'
import VistaJuego    from './components/VistaJuego'

export default function App() {
  const [usuario,      setUsuario]      = useState(null)
  const [esAdmin,      setEsAdmin]      = useState(false)
  const [vista,        setVista]        = useState(VISTAS.MENU)
  const [platoDetalle, setPlatoDetalle] = useState(null)
  const [juegoHabilitado, setJuegoHabilitado] = useState(false)

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

  // ── Escuchar cambios en juego_habilitado (Realtime) ───────────────────────
  useEffect(() => {
    if (!usuario) return

    supabase.from('estado_juego').select('juego_habilitado').single().then(({ data }) => {
      if (data) setJuegoHabilitado(data.juego_habilitado)
    })

    const canal = supabase
      .channel('app-estado-juego')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estado_juego' }, (payload) => {
        if (payload.new?.juego_habilitado !== undefined) {
          setJuegoHabilitado(payload.new.juego_habilitado)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [usuario])

  // ── FONDOS UNIFICADOS (Idénticos a la Vista de Detalle) ───────────────────
  // Se fuerza a que todas las pantallas utilicen el fondo base original
// ── Fondos responsivos por vista ──────────────────────────────────────────
  // Si está en Menú, Detalle o Comanda, se activa el set "Fondomenu"
  const esSeccionGastronomica = 
    (vista === VISTAS.MENU || vista === VISTAS.DETALLE || vista === VISTAS.COMANDA) && !esAdmin

  const fondoPc = esSeccionGastronomica ? '/fondos/Fondomenu_pc.png' : '/fondos/fondo.png'
  const fondoMovil = esSeccionGastronomica ? '/fondos/Fondomenu_movil.png' : '/fondos/fondo2.png'
  // ── Platos del menú ───────────────────────────────────────────────────────
  const { platos, cargando: cargandoPlatos } = usePlatos()

  // ── Comandas del usuario ──────────────────────────────────────────────────
  const {
    comandas:      misComandas,
    cargando:      cargandoMisComandas,
    totalPlatos:   miTotalPlatos,
    rtActivo:      rtUser,
    upsertItem,
    actualizarCantidad,
    eliminarItem,
  } = useComandas(usuario?.id !== 'admin' ? usuario?.id : null, false)

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

  async function handleAnyadirAComanda(platoId, cantidad, nota) {
    return await upsertItem(platoId, cantidad, nota)
  }

  if (!usuario) {
    return (
      <PantallaLogin
        onLogin={handleLogin}
        onAdminAccess={handleAdminAccess}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* ── Fondos responsivos unificados ── */}
      <div
        className="fixed inset-0 bg-cover bg-center transition-all duration-700 block md:hidden"
        style={{ backgroundImage: `url('${fondoMovil}')` }}
      />
      <div
        className="fixed inset-0 bg-cover bg-center transition-all duration-700 hidden md:block"
        style={{ backgroundImage: `url('${fondoPc}')` }}
      />

      {/* Capa de oscurecimiento */}
      <div className="fixed inset-0 bg-black/72 pointer-events-none" />

      {/* Contenido */}
      <div className="relative flex flex-col flex-1 z-10">
        <NavBar
          usuario={usuario}
          esAdmin={esAdmin}
          vistaActual={vista}
          totalItems={0} // SOLUCIÓN: Forzado a 0 para eliminar permanentemente las notificaciones del icono
          rtActivo={esAdmin ? rtAdmin : rtUser}
          juegoHabilitado={!esAdmin && juegoHabilitado}
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

          {vista === VISTAS.JUEGO && !esAdmin && (
            <VistaJuego usuario={usuario} />
          )}
        </main>

        <footer className="border-t border-stone-800/30 py-4 px-4 mt-auto">
          <p className="text-center text-stone-600 text-xs font-serif">
            Cuando las cigarras lloran · Higurashi no Naku Koro ni
          </p>
        </footer>
      </div>
    </div>
  )
}