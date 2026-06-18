-- ══════════════════════════════════════════════════════════════════════════════
-- HIGURASHI COMANDAS — Schema Supabase (v2: sin precios, upsert por unique key)
-- Ejecutar en: Supabase → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 1. TABLA USUARIOS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT        NOT NULL CHECK (length(trim(nombre)) >= 2),
  avatar     TEXT        NOT NULL DEFAULT 'keiichi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. TABLA PLATOS (sin campo precio) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS platos (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            TEXT        NOT NULL,
  descripcion_corta TEXT,
  descripcion_larga TEXT,
  categoria         TEXT        NOT NULL CHECK (categoria IN ('principal','acompanamiento','postre')),
  imagen_url        TEXT,
  etiquetas         TEXT[]      NOT NULL DEFAULT '{}',
  disponible        BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 3. TABLA COMANDAS ──────────────────────────────────────────────────────
-- UNIQUE(usuario_id, plato_id) es OBLIGATORIO para que el upsert inmediato
-- funcione con onConflict: 'usuario_id,plato_id' en el cliente Supabase.
CREATE TABLE IF NOT EXISTS comandas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plato_id    UUID        NOT NULL REFERENCES platos(id)   ON DELETE CASCADE,
  cantidad    INTEGER     NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  nota        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT  comandas_usuario_plato_key UNIQUE (usuario_id, plato_id)
);

-- ─── ÍNDICES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_comandas_usuario ON comandas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comandas_plato   ON comandas(plato_id);
CREATE INDEX IF NOT EXISTS idx_platos_categoria ON platos(categoria) WHERE disponible = true;

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE platos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acceso_publico_usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico_platos"   ON platos   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico_comandas" ON comandas FOR ALL USING (true) WITH CHECK (true);

-- ─── SUPABASE REALTIME ───────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE comandas;
ALTER PUBLICATION supabase_realtime ADD TABLE usuarios;

-- ─── Trigger updated_at automático ──────────────────────────────────────────
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
-- DATOS DE EJEMPLO — Menú temático Higurashi (sin precios)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO platos (nombre, descripcion_corta, descripcion_larga, categoria, imagen_url, etiquetas)
VALUES

-- ── PRINCIPALES ──────────────────────────────────────────────────────────────
('Curry de Hinamizawa',
 'El curry de la Sra. Sonozaki. Especiado y sin secretos... visibles.',
 'Receta ancestral del clan Sonozaki. Cordero estofado a fuego lento durante 4 horas con 12 especias que "solo la familia conoce". Se sirve con arroz jazmín y chutney de ciruela umeboshi.',
 'principal',
 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
 ARRAY['picante','sin gluten','favorito de Mion']),

('Pollo Yakitori de la Clínica Irie',
 'Brochetas preparadas con la precisión de un médico. Demasiado perfectas.',
 'El Dr. Irie prometió que esta receta "solo contiene los ingredientes que aparecen en la lista". Muslo de pollo marinado en salsa tare casera, glaseado tres veces sobre carbón de binchōtan.',
 'principal',
 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
 ARRAY['a la brasa','sin lactosa','bestseller']),

('Tonkatsu del Club de Juegos',
 'El plato que Keiichi prometió compartir. Esta vez sí.',
 'Chuleta de cerdo empanada en panko artesanal, frita a 170°C exactos. Salsa Worcestershire casera, col lombarda en juliana, arroz gohan y sopa miso de konbu.',
 'principal',
 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80',
 ARRAY['contundente','clásico japonés','favorito de Keiichi']),

('Ramen del Festival Watanagashi',
 'Solo se sirve una vez al año. Esta noche es esa noche.',
 'Caldo tonkotsu reducido 18 horas. Chashu de panceta confitada, huevo ajitsuke, menma, nori, cebollino y mayu. La receta existe únicamente esta noche.',
 'principal',
 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
 ARRAY['caldoso','edición especial','sin gluten adaptable']),

-- ── ACOMPAÑAMIENTOS ──────────────────────────────────────────────────────────
('Gyoza de Rena',
 '"¡Me los llevo a casa!" — Rena, sobre estos gyoza.',
 'Empanadillas de cerdo y col napa con 34 pliegues exactos. Plancha en sartén de hierro fundido: crujientes abajo, al vapor arriba. Con ponzu cítrico y jengibre fresco.',
 'acompanamiento',
 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&q=80',
 ARRAY['para compartir','vegetal disponible']),

('Edamame con Sal de Oyashiro',
 'Sal extraída de las montañas. Dicen que da suerte. O lo contrario.',
 'Vainas cocidas al vapor y enfriadas en agua con hielo. Aliñadas con sal marina de flor, aceite de sésamo tostado y shichimi. Se sirven frías.',
 'acompanamiento',
 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&q=80',
 ARRAY['vegano','sin gluten','ligero']),

('Takoyaki de Rika',
 '"Nipah~" — aprobado por Furude Rika.',
 'Bolas de pulpo esféricas perfectas. Masa dashi con pulpo, jengibre encurtido y cebollino. Cubiertas con salsa okonomiyaki, mayonesa Kewpie, katsuobushi y aonori.',
 'acompanamiento',
 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80',
 ARRAY['street food','sin lácteos','favorito de Rika']),

-- ── POSTRES ───────────────────────────────────────────────────────────────────
('Mochi de Satoko',
 'Satoko los preparó. Esta vez no llevan nada raro.',
 'Mochi artesanal relleno de anko de judía roja y helado de té matcha. Elaborado con el método tradicional mochitsuki. Se sirven de 3 en 3.',
 'postre',
 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80',
 ARRAY['sin gluten','vegano','favorito de Satoko']),

('Dorayaki del Ángel Mort',
 'Shion los horneó esta tarde. Contiene un ingrediente extra: su sonrisa.',
 'Dos esponjas horneadas en sartén de cobre, rellenas de anko tsubuan y crema chantilly de vainilla bourbon. La clave está en la miel de trébol de la masa.',
 'postre',
 'https://images.unsplash.com/photo-1518462592603-0b8f41e8c375?w=600&q=80',
 ARRAY['vegetariano','dulce','favorito de Shion']),

('Parfait del Abismo',
 'Keiichi dijo que era el mejor postre de su vida. Minutos después todo cambió.',
 'Granola de almendra, coulis de frutos del bosque, helado de vainilla de Madagascar, chantilly, caramelo salado y en la cima, una cereza que alguien tendrá que llevarse.',
 'postre',
 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
 ARRAY['vegetariano','indulgente','para compartir']);

-- ── NOTA: Si ya tenías la tabla platos con campo 'precio', ejecuta esto primero:
-- ALTER TABLE platos DROP COLUMN IF EXISTS precio;
-- Y si ya tenías la tabla comandas sin el UNIQUE, añádelo así:
-- ALTER TABLE comandas ADD CONSTRAINT comandas_usuario_plato_key UNIQUE (usuario_id, plato_id);
