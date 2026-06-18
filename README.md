# ⛩️ Higurashi Comandas

Sistema de comandas en tiempo real con temática de *Higurashi no Naku Koro ni*.  
Stack: **React + Vite · Tailwind CSS · Supabase Realtime**

---

## Estructura del proyecto

```
higurashi-comandas/
├── public/
│   └── cicada.svg                  # Favicon
├── src/
│   ├── components/
│   │   ├── NavBar.jsx              # Barra de navegación sticky
│   │   ├── PantallaLogin.jsx       # Selección de personaje
│   │   ├── VistaMenu.jsx           # Menú con pestañas por categoría
│   │   ├── VistaDetalle.jsx        # Detalle de plato + añadir a comanda
│   │   ├── VistaComanda.jsx        # Carrito del usuario
│   │   └── PanelAdmin.jsx          # Panel de control en tiempo real
│   ├── hooks/
│   │   ├── useComandas.js          # Hook: comandas + Supabase Realtime
│   │   └── usePlatos.js            # Hook: carga del menú
│   ├── App.jsx                     # Raíz: navegación por estado
│   ├── constants.js                # Personajes, categorías, constantes
│   ├── index.css                   # Tailwind + estilos globales temáticos
│   ├── main.jsx                    # Punto de entrada React
│   └── supabaseClient.js           # Cliente Supabase con env vars
├── supabase_schema.sql             # Script SQL completo para Supabase
├── .env.example                    # Plantilla de variables de entorno
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

---

## 1. Configuración de Supabase

### 1.1 Crear el proyecto
1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Anota la **Project URL** y la **anon public key** (Settings → API)

### 1.2 Ejecutar el schema SQL
1. En tu proyecto Supabase → **SQL Editor** → **New query**
2. Copia el contenido de `supabase_schema.sql` y ejecútalo
3. Verifica que se han creado las tablas `usuarios`, `platos` y `comandas`

### 1.3 Habilitar Realtime (si no lo hace el script)
- Database → **Replication** → asegúrate de que `comandas` y `usuarios` aparecen en la publicación `supabase_realtime`

---

## 2. Instalación local

```bash
# 1. Crear el proyecto con Vite
npm create vite@latest higurashi-comandas -- --template react
cd higurashi-comandas

# 2. Instalar dependencias de producción
npm install @supabase/supabase-js lucide-react

# 3. Instalar Tailwind CSS y herramientas de build
npm install -D tailwindcss postcss autoprefixer

# 4. (Opcional) Inicializar config de Tailwind si no usas los archivos provistos
npx tailwindcss init -p
```

> Si usas los archivos de este proyecto, **salta el paso 4** — `tailwind.config.js` y `postcss.config.js` ya están configurados.

### 2.1 Variables de entorno

```bash
# Copia la plantilla
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales reales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 Arrancar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

---

## 3. Despliegue en Vercel

```bash
# Opción A: desde la CLI de Vercel
npm i -g vercel
vercel

# Opción B: conectar el repo de GitHub en vercel.com → Import Project
```

### Variables de entorno en Vercel
Settings → **Environment Variables** → añade:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://tu-proyecto.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | tu anon key |

---

## 4. Credenciales de la app

| Rol | Cómo acceder |
|---|---|
| **Comensal** | Pantalla de login → nombre + personaje |
| **Administrador** | Login → "¿Eres el organizador?" → contraseña `admin123` |

Para cambiar la contraseña de admin, edita `ADMIN_PASSWORD` en `src/constants.js`.

---

## 5. Funcionalidades

- **Login con personaje** — Keiichi, Rena, Mion, Shion, Rika, Satoko, Hanyuu, Dr. Irie
- **Menú por categorías** — Principales · Acompañamientos · Postres
- **Detalle de plato** — imagen, descripción larga, etiquetas, selector de cantidad y nota
- **Comanda propia** — añadir, modificar cantidad, eliminar; sincronización en tiempo real
- **Panel admin** — recaudación total, ranking de platos, desglose por comensal; todo en vivo
- **Persistencia de sesión** — localStorage para no perder la sesión al recargar
- **Indicador Realtime** — punto verde que pulsa cuando llegan cambios de Supabase

---

## 6. Personalización rápida

| Qué cambiar | Dónde |
|---|---|
| Personajes jugables | `src/constants.js` → `PERSONAJES` |
| Categorías del menú | `src/constants.js` → `CATEGORIAS` |
| Colores / fuentes | `tailwind.config.js` + `src/index.css` |
| Contraseña admin | `src/constants.js` → `ADMIN_PASSWORD` |
| Platos del menú | Supabase → tabla `platos` (o re-ejecutar el SQL) |
