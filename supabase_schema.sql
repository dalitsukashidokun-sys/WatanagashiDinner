-- ══════════════════════════════════════════════════════════════════════════════
-- HIGURASHI COMANDAS — Schema Supabase
-- Ejecutar en: Supabase → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 1. TABLA USUARIOS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT        NOT NULL CHECK (length(trim(nombre)) >= 2),
  avatar     TEXT        NOT NULL DEFAULT 'keiichi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. TABLA PLATOS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platos (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            TEXT        NOT NULL,
  descripcion_corta TEXT,
  descripcion_larga TEXT,
  precio            NUMERIC(8,2) NOT NULL CHECK (precio >= 0),
  categoria         TEXT        NOT NULL CHECK (categoria IN ('principal', 'acompanamiento', 'postre')),
  imagen_url        TEXT,
  etiquetas         TEXT[]      NOT NULL DEFAULT '{}',
  disponible        BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 3. TABLA COMANDAS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comandas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plato_id    UUID        NOT NULL REFERENCES platos(id)   ON DELETE CASCADE,
  cantidad    INTEGER     NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  nota        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ÍNDICES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_comandas_usuario ON comandas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comandas_plato   ON comandas(plato_id);
CREATE INDEX IF NOT EXISTS idx_platos_categoria ON platos(categoria) WHERE disponible = true;

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
-- Acceso público (la autenticación es a nivel de app con contraseña simple)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE platos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acceso_publico_usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico_platos"   ON platos   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico_comandas" ON comandas FOR ALL USING (true) WITH CHECK (true);

-- ─── SUPABASE REALTIME ───────────────────────────────────────────────────────
-- Habilitar publicación de cambios en tiempo real para las tablas clave
ALTER PUBLICATION supabase_realtime ADD TABLE comandas;
ALTER PUBLICATION supabase_realtime ADD TABLE usuarios;

-- ── Trigger para actualizar updated_at automáticamente ──────────────────────
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comandas_updated_at
  BEFORE UPDATE ON comandas
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- DATOS DE EJEMPLO — Menú temático Higurashi
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO platos (nombre, descripcion_corta, descripcion_larga, precio, categoria, imagen_url, etiquetas)
VALUES

-- ─── PLATOS PRINCIPALES ───────────────────────────────────────────────────────
(
  'Curry de Hinamizawa',
  'El curry de la Sra. Sonozaki. Especiado y sin secretos... visibles.',
  'Receta ancestral del clan Sonozaki, preparada con especias traídas de los confines del pueblo. Cordero estofado a fuego lento durante 4 horas, con una mezcla de 12 especias que "solo la familia conoce". El picante aumenta con cada visita. Se sirve con arroz jazmín y chutney de ciruela umeboshi.',
  14.50, 'principal',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
  ARRAY['picante', 'sin gluten', 'favorito de Mion']
),
(
  'Pollo Yakitori de la Clínica Irie',
  'Brochetas preparadas con la precisión de un médico. Perfectas. Demasiado perfectas.',
  'El Dr. Irie prometió que esta receta "solo contiene los ingredientes que aparecen en la lista". Muslo de pollo marinado en salsa tare casera (sake, mirin, soja oscura), glaseado tres veces sobre carbón de binchōtan. Exterior caramelizado, interior jugoso. Se sirve con tare extra y shichimi tōgarashi.',
  12.90, 'principal',
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  ARRAY['a la brasa', 'sin lactosa', 'bestseller']
),
(
  'Tonkatsu del Club de Juegos',
  'El plato que Keiichi prometió compartir. Esta vez sí.',
  'Chuleta de cerdo lomo empanada en panko artesanal, frita a 170°C exactos. La salsa Worcestershire casera es "la penitencia más sabrosa que existe". Se sirve con col lombarda en juliana, arroz gohan y sopa miso de alga konbu.',
  13.50, 'principal',
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80',
  ARRAY['contundente', 'clásico japonés', 'favorito de Keiichi']
),
(
  'Ramen del Festival Watanagashi',
  'Solo se sirve una vez al año. Esta noche es esa noche.',
  'Caldo tonkotsu reducido 18 horas, turbio y untuoso como los secretos del festival. Chashu de panceta confitada, huevo ajitsuke, menma, nori, cebollino y mayu. La receta existe únicamente esta noche. Nadie sabe quién la preparó primero.',
  15.00, 'principal',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
  ARRAY['caldoso', 'sin gluten adaptable', 'edición especial']
),

-- ─── ACOMPAÑAMIENTOS ─────────────────────────────────────────────────────────
(
  'Gyoza de Rena',
  '"¡Me los llevo a casa!" — Rena, sobre estos gyoza.',
  'Empanadillas de cerdo y col napa con el pliegue preciso que Rena practica cada tarde (34 pliegues, ni uno más). Plancha en sartén de hierro fundido: crujientes por abajo, al vapor por arriba. Acompañadas de ponzu cítrico con jengibre rallado fresco.',
  6.50, 'acompanamiento',
  'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&q=80',
  ARRAY['para compartir', 'sin gluten adaptable', 'vegetal disponible']
),
(
  'Edamame con Sal de Oyashiro',
  'Sal extraída de las montañas. Dicen que da suerte. O lo contrario.',
  'Vainas de edamame cocidas al vapor y enfriadas en agua con hielo para fijar el verde intenso. Aliñadas con sal marina de flor, aceite de sésamo tostado y una pizca de shichimi. Se sirven frías.',
  4.00, 'acompanamiento',
  'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&q=80',
  ARRAY['vegano', 'sin gluten', 'ligero']
),
(
  'Takoyaki de Rika',
  '"Nipah~" — aprobado por Furude Rika.',
  'Bolas de pulpo esféricas perfectas. Masa dashi con pulpo del día, jengibre encurtido y cebollino. Cubiertas con salsa okonomiyaki, mayonesa Kewpie, katsuobushi y aonori. Servidas directamente de la plancha redonda.',
  7.50, 'acompanamiento',
  'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80',
  ARRAY['street food', 'sin lácteos', 'favorito de Rika']
),

-- ─── POSTRES ─────────────────────────────────────────────────────────────────
(
  'Mochi de Satoko',
  'Satoko los preparó. Esta vez no llevan nada raro.',
  'Mochi artesanal relleno de anko de judía roja y helado de té matcha. La masa glutinosa se trabaja con el método tradicional mochitsuki. Cubiertos con harina de arroz tostada. Se sirven en grupos de 3.',
  6.00, 'postre',
  'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80',
  ARRAY['sin gluten', 'vegano', 'favorito de Satoko']
),
(
  'Dorayaki del Ángel Mort',
  'Shion los horneó esta tarde. Contiene un ingrediente extra: su sonrisa.',
  'El postre icónico del Ángel Mort. Dos esponjas horneadas en sartén de cobre, rellenas de anko tsubuan y crema chantilly de vainilla bourbon. Shion dice que la clave está en la miel de trébol de la masa.',
  5.50, 'postre',
  'https://images.unsplash.com/photo-1518462592603-0b8f41e8c375?w=600&q=80',
  ARRAY['vegetariano', 'dulce', 'favorito de Shion']
),
(
  'Parfait del Abismo',
  'Keiichi dijo que era el mejor postre de su vida. Minutos después todo cambió.',
  'Capas: granola de almendra tostada, coulis de frutos del bosque, helado de vainilla de Madagascar, chantilly montada a mano, caramelo salado y en la cima, una cereza que alguien tendrá que llevarse. Se sirve en copa alta de cristal.',
  7.00, 'postre',
  'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
  ARRAY['vegetariano', 'indulgente', 'para compartir']
);
