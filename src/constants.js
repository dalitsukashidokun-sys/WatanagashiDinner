// src/constants.js
// ─── Constantes y Datos Estáticos ─────────────────────────────────────────────

// Contraseña del panel de administrador
export const ADMIN_PASSWORD = 'admin123'

// ─── Personajes jugables ─────────────────────────────────────────────────────
// Los avatares se sirven desde /public/avatares/<id>.png
// Coloca tus imágenes en: public/avatares/keiichi.png, rena.png, etc.
export const PERSONAJES = [
  {
    id: 'keiichi',
    nombre: 'Keiichi Maebara',
    avatar: '/avatares/keiichi.png',
    color: 'from-blue-900/40 to-blue-950',
    borderColor: 'border-blue-700/50',
    textColor: 'text-blue-300',
    descripcion: 'El chico nuevo de Hinamizawa',
  },
  {
    id: 'rena',
    nombre: 'Rena Ryuuguu',
    avatar: '/avatares/rena.png',
    color: 'from-pink-900/40 to-pink-950',
    borderColor: 'border-pink-700/50',
    textColor: 'text-pink-300',
    descripcion: '¡Me lo llevo a casa!',
  },
  {
    id: 'mion',
    nombre: 'Mion Sonozaki',
    avatar: '/avatares/mion.png',
    color: 'from-emerald-900/40 to-emerald-950',
    borderColor: 'border-emerald-700/50',
    textColor: 'text-emerald-300',
    descripcion: 'Líder del Club de Juegos',
  },
  {
    id: 'shion',
    nombre: 'Shion Sonozaki',
    avatar: '/avatares/shion.png',
    color: 'from-violet-900/40 to-violet-950',
    borderColor: 'border-violet-700/50',
    textColor: 'text-violet-300',
    descripcion: 'Gemela de Mion',
  },
  {
    id: 'rika',
    nombre: 'Furude Rika',
    avatar: '/avatares/rika.png',
    color: 'from-indigo-900/40 to-indigo-950',
    borderColor: 'border-indigo-700/50',
    textColor: 'text-indigo-300',
    descripcion: 'Miko del Santuario Furude',
  },
  {
    id: 'satoko',
    nombre: 'Houjou Satoko',
    avatar: '/avatares/satoko.png',
    color: 'from-amber-900/40 to-amber-950',
    borderColor: 'border-amber-700/50',
    textColor: 'text-amber-300',
    descripcion: 'Maestra de las trampas',
  },
  {
    id: 'satoshi',
    nombre: 'Houjou Satoshi',
    avatar: '/avatares/satoshi.png',
    color: 'from-teal-900/40 to-teal-950',
    borderColor: 'border-teal-700/50',
    textColor: 'text-teal-300',
    descripcion: 'El hermano mayor de Satoko',
  },
]

// ─── Categorías del menú ─────────────────────────────────────────────────────
export const CATEGORIAS = [
  { id: 'principal',      label: 'Platos Principales', emoji: '🍱' },
  { id: 'acompanamiento', label: 'Acompañamientos',    emoji: '🥢' },
  { id: 'postre',         label: 'Postres',             emoji: '🍡' },
]

// ─── Vistas de la SPA ────────────────────────────────────────────────────────
export const VISTAS = {
  LOGIN:   'login',
  MENU:    'menu',
  DETALLE: 'detalle',
  COMANDA: 'comanda',
  ADMIN:   'admin',
}