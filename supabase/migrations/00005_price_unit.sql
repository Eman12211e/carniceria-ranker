-- Price units — how meat is sold
CREATE TABLE price_unit (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en     TEXT NOT NULL UNIQUE,
  name_es     TEXT NOT NULL UNIQUE,
  abbreviation TEXT NOT NULL UNIQUE  -- "lb", "kg", "ea", "pk"
);

-- Seed standard units
INSERT INTO price_unit (name_en, name_es, abbreviation) VALUES
  ('per pound',   'por libra',    'lb'),
  ('per kilogram','por kilogramo', 'kg'),
  ('each',        'cada uno',     'ea'),
  ('per pack',    'por paquete',  'pk');
