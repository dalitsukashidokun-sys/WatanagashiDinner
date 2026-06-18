// src/supabaseClient.js
// ─── Cliente Supabase ──────────────────────────────────────────────────────────
// Utiliza variables de entorno de Vite (prefijo VITE_).
// Define estas variables en .env.local para desarrollo local, y
// en Settings → Environment Variables de Vercel para producción.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación en tiempo de desarrollo para detectar configuración incompleta
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '⛩️ Faltan las variables de entorno de Supabase.\n' +
    'Crea un archivo .env.local con:\n' +
    '  VITE_SUPABASE_URL=https://tu-proyecto.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=tu-anon-key'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    // Configuración de Realtime para actualizaciones en tiempo real
    params: {
      eventsPerSecond: 10,
    },
  },
})
