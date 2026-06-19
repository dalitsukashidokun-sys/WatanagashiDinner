// src/constants.js
// ─── Constantes y Datos Estáticos ─────────────────────────────────────────────

// Contraseña del panel de administrador
export const ADMIN_PASSWORD = 'Naku'

// ─── Personajes jugables ─────────────────────────────────────────────────────
export const PERSONAJES = [
  {
    id: 'keiichi',
    nombre: 'Keiichi Maebara',
    avatar: '/avatares/keiichi.png',
    color: 'from-blue-900/40 to-blue-950',
    borderColor: 'border-blue-700/50',
    textColor: 'text-blue-300',
    descripcion: 'El chico nuevo de Hinamizawa',
    objeto: 'Bate de béisbol',
    descripcionObjeto: 'Protege a un jugador del ataque nocturno del asesino.',
    tipoAccion: 'proteger',
    emoji: '⚾',
  },
  {
    id: 'rena',
    nombre: 'Rena Ryuuguu',
    avatar: '/avatares/rena.png',
    color: 'from-pink-900/40 to-pink-950',
    borderColor: 'border-pink-700/50',
    textColor: 'text-pink-300',
    descripcion: '¡Me lo llevo a casa!',
    objeto: 'Machete',
    descripcionObjeto: 'Si el pueblo la lincha por error, ejecuta al jugador que más votos le dio.',
    tipoAccion: 'pasiva',
    emoji: '🔪',
  },
  {
    id: 'mion',
    nombre: 'Mion Sonozaki',
    avatar: '/avatares/mion.png',
    color: 'from-emerald-900/40 to-emerald-950',
    borderColor: 'border-emerald-700/50',
    textColor: 'text-emerald-300',
    descripcion: 'Líder del Club de Juegos',
    objeto: 'Rotulador',
    descripcionObjeto: 'Su voto diurno cuenta doble. Solo se usa durante la fase de votación.',
    tipoAccion: 'votar_doble',
    emoji: '✍️',
  },
  {
    id: 'shion',
    nombre: 'Shion Sonozaki',
    avatar: '/avatares/shion.png',
    color: 'from-violet-900/40 to-violet-950',
    borderColor: 'border-violet-700/50',
    textColor: 'text-violet-300',
    descripcion: 'Gemela de Mion',
    objeto: 'Táser',
    descripcionObjeto: 'Paraliza a un personaje esta noche, anulando su acción.',
    tipoAccion: 'paralizar',
    emoji: '⚡',
  },
  {
    id: 'rika',
    nombre: 'Furude Rika',
    avatar: '/avatares/rika.png',
    color: 'from-indigo-900/40 to-indigo-950',
    borderColor: 'border-indigo-700/50',
    textColor: 'text-indigo-300',
    descripcion: 'Miko del Santuario Furude',
    objeto: 'Fragmento de Tiempo',
    descripcionObjeto: 'Sobrevive automáticamente al primer intento de asesinato nocturno.',
    tipoAccion: 'pasiva',
    emoji: '⏳',
  },
  {
    id: 'satoko',
    nombre: 'Houjou Satoko',
    avatar: '/avatares/satoko.png',
    color: 'from-amber-900/40 to-amber-950',
    borderColor: 'border-amber-700/50',
    textColor: 'text-amber-300',
    descripcion: 'Maestra de las trampas',
    objeto: 'Trampas',
    descripcionObjeto: 'Revela en secreto el bando (Aldeano/Asesino) del personaje elegido.',
    tipoAccion: 'revelar',
    emoji: '🪤',
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
  JUEGO:   'juego',
}

// ─── Fases del juego ──────────────────────────────────────────────────────────
export const FASES = {
  ESPERA:     'espera',
  DIA:        'dia',
  NOCHE:      'noche',
  VOTACION:   'votacion',
  FINALIZADO: 'finalizado',
}
