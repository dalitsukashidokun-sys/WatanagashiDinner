// src/App.jsx
// ─── Raíz v2: Comanda + Motor de Juego ───────────────────────────────────────

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
import ModuloMusica  from './components/ModuloMusica' // 👈 INTEGRADO: Importación global

export default function App() {
  const [usuario,         setUsuario]         = useState(null)
  const [esAdmin,         setEsAdmin]         = useState(false)
  const [vista,           setVista]           = useState(VISTAS.MENU)
  const [platoDetalle,    setPlatoDetalle]    = useState(null)
  const [juegoHabilitado, setJuegoHabilitado] = useState(false)

  // ── Restaurar sesión ─────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const admin  = localStorage.getItem('higurashi_admin')
      const sesion = localStorage.getItem('higurashi_sesion')
      if (admin === 'true') {
        setEsAdmin(true); setVista(VISTAS.ADMIN)
        setUsuario({ id: 'admin', nombre: 'Admin', avatar: 'irie' })
        return
      }
      if (sesion) { setUsuario(JSON.parse(sesion)); setVista(VISTAS.MENU) }
    } catch { localStorage.clear() }
  }, [])

  // ── Escuchar juego_habilitado en tiempo real ──────────────────────────────
  useEffect(() => {
    if (!usuario) return

    // Carga inicial
    supabase.from('estado_juego').select('juego_habilitado').eq('id', 1).single()
      .then(({ data }) => { if (data) setJuegoHabilitado(data.juego_habilitado) })

    const canal = supabase
      .channel('app-estado-juego')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'estado_juego' }, ({ new: row }) => {
        if (row?.juego_habilitado !== undefined) setJuegoHabilitado(row.juego_habilitado)
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [usuario])

  // ── Fondos responsivos según vista ───────────────────────────────────────
  const esVistaConFondoMenu = !esAdmin && (vista === VISTAS.MENU || vista === VISTAS.DETALLE || vista === VISTAS.COMANDA)

  // ── Hooks de datos ────────────────────────────────────────────────────────
  const { platos, cargando: cargandoPlatos } = usePlatos()

  const { comandas: misComandas, cargando: cargandoMisComandas, totalPlatos: miTotal,
    rtActivo: rtUser, upsertItem, actualizarCantidad, eliminarItem,
  } = useComandas(usuario?.id !== 'admin' ? usuario?.id : null, false)

  const { comandas: todasComandas, cargando: cargandoAdmin, totalPlatos: totalGlobal,
    rtActivo: rtAdmin,
  } = useComandas(null, esAdmin)

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogin        = (u)  => { setUsuario(u); setVista(VISTAS.MENU); setEsAdmin(false) }
  const handleAdminAccess  = ()   => { setEsAdmin(true); setVista(VISTAS.ADMIN); setUsuario({ id: 'admin', nombre: 'Admin', avatar: 'irie' }) }
  const handleLogout       = ()   => { localStorage.removeItem('higurashi_sesion'); localStorage.removeItem('higurashi_admin'); setUsuario(null); setEsAdmin(false); setVista(VISTAS.MENU); setPlatoDetalle(null) }
  const handleVerDetalle   = (p)  => { setPlatoDetalle(p); setVista(VISTAS.DETALLE) }
  const handleVolverAlMenu = ()   => { setPlatoDetalle(null); setVista(VISTAS.MENU) }
  const handleAnyadir      = async (pid, qty, nota) => await upsertItem(pid, qty, nota)
  const handleNavegar      = (v)  => { setPlatoDetalle(null); setVista(v) }

  // ── Sin sesión → login ────────────────────────────────────────────────────
  if (!usuario) {
    return <PantallaLogin onLogin={handleLogin} onAdminAccess={handleAdminAccess} />
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* ── Fondos ── */}
      <div className={`fixed inset-0 bg-cover bg-center bg-fixed transition-opacity duration-700 block md:hidden
        ${esVistaConFondoMenu ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: "url('/fondos/Fondomenu_movil.png')" }} />
      
      <div className={`fixed inset-0 bg-cover bg-center bg-fixed transition-opacity duration-700 hidden md:block
        ${esVistaConFondoMenu ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: "url('/fondos/Fondomenu_pc.png')" }} />

      <div className={`fixed inset-0 bg-cover bg-center bg-fixed transition-opacity duration-700 block md:hidden
        ${!esVistaConFondoMenu ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: "url('/fondos/fondo2.png')" }} />
      
      <div className={`fixed inset-0 bg-cover bg-center bg-fixed transition-opacity duration-700 hidden md:block
        ${!esVistaConFondoMenu ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: "url('/fondos/fondo.png')" }} />

      {/* Capa de oscurecimiento */}
      <div className="fixed inset-0 bg-black/72 pointer-events-none" />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col flex-1">
        <NavBar
          usuario={usuario}
          esAdmin={esAdmin}
          vistaActual={vista}
          totalItems={misComandas.length}
          rtActivo={esAdmin ? rtAdmin : rtUser}
          juegoHabilitado={!esAdmin && juegoHabilitado}
          onNavegar={handleNavegar}
          onLogout={handleLogout}
        />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
          {vista === VISTAS.MENU && (
            <VistaMenu platos={platos} cargando={cargandoPlatos} onVerDetalle={handleVerDetalle} />
          )}
          {vista === VISTAS.DETALLE && platoDetalle && (
            <VistaDetalle plato={platoDetalle} onVolver={handleVolverAlMenu} onAnyadir={handleAnyadir} />
          )}
          {vista === VISTAS.COMANDA && (
            <VistaComanda usuario={usuario} comandas={misComandas} cargando={cargandoMisComandas}
              totalPlatos={miTotal} rtActivo={rtUser}
              onActualizarCantidad={actualizarCantidad} onEliminar={eliminarItem} />
          )}
          {vista === VISTAS.ADMIN && esAdmin && (
            <PanelAdmin comandas={todasComandas} cargando={cargandoAdmin}
              totalPlatos={totalGlobal} rtActivo={rtAdmin} />
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

        {/* ── INTEGRACIÓN DEL REPRODUCTOR DE MÚSICA GLOBAL ── */}
        <ModuloMusica />
      </div>
    </div>
  )
}