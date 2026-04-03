-- Bilingual Meat-Cut Dictionary — Seed Data
-- Covers the most common cuts sold at Central Valley carnicerías

-- ==================
-- BEEF (Res)
-- ==================
INSERT INTO meat_cuts (animal, name_en, name_es, alt_names) VALUES
  ('beef', 'Chuck Roast',        'Diezmillo',           '{"chuck roll", "roast beef"}'),
  ('beef', 'Ribeye Steak',       'Rib Eye',             '{"Delmonico", "costilla de res"}'),
  ('beef', 'Skirt Steak',        'Fajita / Arrachera',  '{"arrachera", "fajita meat", "tira de res"}'),
  ('beef', 'Flank Steak',        'Falda de Res',        '{"falda", "flank"}'),
  ('beef', 'Short Ribs',         'Costilla Corta',      '{"costillas de res", "beef ribs"}'),
  ('beef', 'Beef Shank',         'Chambarete',          '{"osso buco", "shank cross-cut"}'),
  ('beef', 'Sirloin Steak',      'Aguayón',             '{"top sirloin", "sirloin tip"}'),
  ('beef', 'T-Bone Steak',       'T-Bone',              '{"porterhouse"}'),
  ('beef', 'Ground Beef',        'Carne Molida de Res', '{"hamburger meat", "molida"}'),
  ('beef', 'Beef Tongue',        'Lengua de Res',       '{"lengua", "tongue"}'),
  ('beef', 'Beef Head',          'Cabeza de Res',       '{"cabeza"}'),
  ('beef', 'Beef Tripe',         'Pancita / Mondongo',  '{"tripas", "menudo meat", "panza"}'),
  ('beef', 'Beef Cheeks',        'Cachete de Res',      '{"cachete"}'),
  ('beef', 'Beef Liver',         'Hígado de Res',       '{"hígado", "liver"}'),
  ('beef', 'Oxtail',             'Rabo de Res',         '{"cola de res", "rabo"}'),
  ('beef', 'Brisket',            'Pecho de Res',        '{"pecho", "breast"}'),
  ('beef', 'Stew Meat',          'Carne para Guisar',   '{"guisar", "stew beef"}'),
  ('beef', 'Thin-Sliced Beef',   'Bistec de Res',       '{"bistec", "milanesa", "cecina"}'),
  ('beef', 'Top Round',          'Bola de Res',         '{"bola", "cuete", "round roast"}'),
  ('beef', 'Beef Intestines',    'Tripas de Res',       '{"tripas", "intestines"}');

-- ==================
-- PORK (Cerdo / Puerco)
-- ==================
INSERT INTO meat_cuts (animal, name_en, name_es, alt_names) VALUES
  ('pork', 'Pork Shoulder',      'Espaldilla de Puerco','{"butt", "boston butt", "shoulder roast"}'),
  ('pork', 'Pork Chops',         'Chuletas de Puerco',  '{"chuleta", "loin chops"}'),
  ('pork', 'Pork Belly',         'Tocino / Panceta',    '{"panceta", "belly", "chicharrón crudo"}'),
  ('pork', 'Pork Ribs',          'Costillas de Puerco', '{"costillas", "spare ribs", "baby back"}'),
  ('pork', 'Pork Loin',          'Lomo de Puerco',      '{"lomo", "tenderloin"}'),
  ('pork', 'Ground Pork',        'Carne Molida de Puerco','{"molida de puerco"}'),
  ('pork', 'Pork Leg',           'Pierna de Puerco',    '{"pierna", "ham", "fresh ham"}'),
  ('pork', 'Pork Feet',          'Patas de Puerco',     '{"manitas", "trotters"}'),
  ('pork', 'Pork Skin',          'Cuero de Puerco',     '{"cuero", "rind", "chicharrón"}'),
  ('pork', 'Pork Head',          'Cabeza de Puerco',    '{"cabeza de cerdo"}'),
  ('pork', 'Pork Stomach',       'Estómago de Puerco',  '{"buche"}'),
  ('pork', 'Chorizo (Fresh)',    'Chorizo Fresco',      '{"chorizo", "mexican chorizo"}'),
  ('pork', 'Al Pastor Meat',     'Carne al Pastor',     '{"al pastor", "adobada"}');

-- ==================
-- CHICKEN (Pollo)
-- ==================
INSERT INTO meat_cuts (animal, name_en, name_es, alt_names) VALUES
  ('chicken', 'Whole Chicken',     'Pollo Entero',        '{"whole bird"}'),
  ('chicken', 'Chicken Breast',    'Pechuga de Pollo',    '{"pechuga", "breast"}'),
  ('chicken', 'Chicken Thighs',    'Muslos de Pollo',     '{"muslos", "thighs"}'),
  ('chicken', 'Chicken Drumsticks','Piernas de Pollo',    '{"piernas", "drumstick"}'),
  ('chicken', 'Chicken Wings',     'Alas de Pollo',       '{"alitas", "wings"}'),
  ('chicken', 'Chicken Feet',      'Patas de Pollo',      '{"patas"}'),
  ('chicken', 'Chicken Liver',     'Hígado de Pollo',     '{"hígado"}'),
  ('chicken', 'Chicken Gizzards',  'Mollejas de Pollo',   '{"mollejas"}');

-- ==================
-- GOAT (Chivo / Cabra)
-- ==================
INSERT INTO meat_cuts (animal, name_en, name_es, alt_names) VALUES
  ('goat', 'Goat Leg',          'Pierna de Chivo',     '{"pierna de cabra", "leg of goat"}'),
  ('goat', 'Goat Shoulder',     'Espaldilla de Chivo', '{"shoulder"}'),
  ('goat', 'Goat Ribs',         'Costillas de Chivo',  '{"costillas de cabra"}'),
  ('goat', 'Goat Stew Meat',    'Chivo para Birria',   '{"birria meat", "chivo en trozos"}');

-- ==================
-- LAMB (Borrego / Cordero)
-- ==================
INSERT INTO meat_cuts (animal, name_en, name_es, alt_names) VALUES
  ('lamb', 'Lamb Leg',          'Pierna de Borrego',   '{"pierna de cordero"}'),
  ('lamb', 'Lamb Chops',        'Chuletas de Borrego', '{"chuletas de cordero", "lamb loin chops"}'),
  ('lamb', 'Lamb Shoulder',     'Espaldilla de Borrego','{"shoulder of lamb"}'),
  ('lamb', 'Lamb Ribs',         'Costillas de Borrego','{"costillas de cordero"}'),
  ('lamb', 'Lamb Stew Meat',    'Borrego para Barbacoa','{"barbacoa meat", "borrego en trozos"}');
