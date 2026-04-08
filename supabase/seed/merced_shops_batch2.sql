-- Seed data: Shops 6–10 for Merced, CA (Week 3 — 10 total)
-- Expands coverage to surrounding areas: Atwater, Livingston, Los Banos

INSERT INTO shops (id, name, address, city, state, zip, phone, location, verified, claimed, active)
VALUES
  -- 6. Carnicería Los Compadres — Atwater, east of Merced
  ('a1000000-0000-0000-0000-000000000006',
   'Carnicería Los Compadres', '1441 Winton Way', 'Atwater', 'CA', '95301',
   '(209) 555-0106',
   ST_SetSRID(ST_MakePoint(-120.6090, 37.3476), 4326)::geography,
   TRUE, FALSE, TRUE),

  -- 7. Rancho Grande Meats — south Merced
  ('a1000000-0000-0000-0000-000000000007',
   'Rancho Grande Meats', '2230 E Gerard Ave', 'Merced', 'CA', '95340',
   '(209) 555-0107',
   ST_SetSRID(ST_MakePoint(-120.4560, 37.2890), 4326)::geography,
   TRUE, TRUE, TRUE),  -- This one is claimed by owner

  -- 8. Mi Carnicería — Livingston, popular weekend spot
  ('a1000000-0000-0000-0000-000000000008',
   'Mi Carnicería', '620 B St', 'Livingston', 'CA', '95334',
   '(209) 555-0108',
   ST_SetSRID(ST_MakePoint(-120.7235, 37.3868), 4326)::geography,
   TRUE, FALSE, TRUE),

  -- 9. Super Carnicería El Rey — north Merced
  ('a1000000-0000-0000-0000-000000000009',
   'Super Carnicería El Rey', '780 W Olive Ave', 'Merced', 'CA', '95340',
   '(209) 555-0109',
   ST_SetSRID(ST_MakePoint(-120.4850, 37.3080), 4326)::geography,
   TRUE, FALSE, TRUE),

  -- 10. Carnicería La Fe — Los Banos, west expansion
  ('a1000000-0000-0000-0000-000000000010',
   'Carnicería La Fe', '340 W Pacheco Blvd', 'Los Banos', 'CA', '93635',
   '(209) 555-0110',
   ST_SetSRID(ST_MakePoint(-120.8520, 37.0585), 4326)::geography,
   TRUE, FALSE, TRUE)

ON CONFLICT (name, location) DO NOTHING;

-- Hours for shops 6-10
-- Shop 6: Los Compadres (Mon-Sat 7am-8pm, Sun 8am-5pm)
INSERT INTO shop_hours (shop_id, day_of_week, open_time, close_time) VALUES
  ('a1000000-0000-0000-0000-000000000006', 0, '08:00', '17:00'),
  ('a1000000-0000-0000-0000-000000000006', 1, '07:00', '20:00'),
  ('a1000000-0000-0000-0000-000000000006', 2, '07:00', '20:00'),
  ('a1000000-0000-0000-0000-000000000006', 3, '07:00', '20:00'),
  ('a1000000-0000-0000-0000-000000000006', 4, '07:00', '20:00'),
  ('a1000000-0000-0000-0000-000000000006', 5, '07:00', '20:00'),
  ('a1000000-0000-0000-0000-000000000006', 6, '07:00', '20:00');

-- Shop 7: Rancho Grande (Mon-Sun 6am-9pm, opens early)
INSERT INTO shop_hours (shop_id, day_of_week, open_time, close_time) VALUES
  ('a1000000-0000-0000-0000-000000000007', 0, '07:00', '19:00'),
  ('a1000000-0000-0000-0000-000000000007', 1, '06:00', '21:00'),
  ('a1000000-0000-0000-0000-000000000007', 2, '06:00', '21:00'),
  ('a1000000-0000-0000-0000-000000000007', 3, '06:00', '21:00'),
  ('a1000000-0000-0000-0000-000000000007', 4, '06:00', '21:00'),
  ('a1000000-0000-0000-0000-000000000007', 5, '06:00', '21:00'),
  ('a1000000-0000-0000-0000-000000000007', 6, '06:00', '21:00');

-- Shop 8: Mi Carnicería (Wed-Mon 8am-7pm, closed Tue)
INSERT INTO shop_hours (shop_id, day_of_week, open_time, close_time) VALUES
  ('a1000000-0000-0000-0000-000000000008', 0, '08:00', '19:00'),
  ('a1000000-0000-0000-0000-000000000008', 1, '08:00', '19:00'),
  ('a1000000-0000-0000-0000-000000000008', 2, NULL, NULL),
  ('a1000000-0000-0000-0000-000000000008', 3, '08:00', '19:00'),
  ('a1000000-0000-0000-0000-000000000008', 4, '08:00', '19:00'),
  ('a1000000-0000-0000-0000-000000000008', 5, '08:00', '19:00'),
  ('a1000000-0000-0000-0000-000000000008', 6, '08:00', '20:00');

-- Shop 9: Super El Rey (Mon-Sun 7am-9pm)
INSERT INTO shop_hours (shop_id, day_of_week, open_time, close_time) VALUES
  ('a1000000-0000-0000-0000-000000000009', 0, '08:00', '19:00'),
  ('a1000000-0000-0000-0000-000000000009', 1, '07:00', '21:00'),
  ('a1000000-0000-0000-0000-000000000009', 2, '07:00', '21:00'),
  ('a1000000-0000-0000-0000-000000000009', 3, '07:00', '21:00'),
  ('a1000000-0000-0000-0000-000000000009', 4, '07:00', '21:00'),
  ('a1000000-0000-0000-0000-000000000009', 5, '07:00', '21:00'),
  ('a1000000-0000-0000-0000-000000000009', 6, '07:00', '21:00');

-- Shop 10: La Fe (Mon-Sat 7:30am-8pm, Sun 8am-6pm)
INSERT INTO shop_hours (shop_id, day_of_week, open_time, close_time) VALUES
  ('a1000000-0000-0000-0000-000000000010', 0, '08:00', '18:00'),
  ('a1000000-0000-0000-0000-000000000010', 1, '07:30', '20:00'),
  ('a1000000-0000-0000-0000-000000000010', 2, '07:30', '20:00'),
  ('a1000000-0000-0000-0000-000000000010', 3, '07:30', '20:00'),
  ('a1000000-0000-0000-0000-000000000010', 4, '07:30', '20:00'),
  ('a1000000-0000-0000-0000-000000000010', 5, '07:30', '20:00'),
  ('a1000000-0000-0000-0000-000000000010', 6, '07:30', '20:00');

-- Prices for shops 6-10 (3+ cuts each, Central Valley rates)
-- Shop 6: Los Compadres — good chicken prices
INSERT INTO prices (shop_id, cut_id, unit_id, price, recorded_at)
SELECT 'a1000000-0000-0000-0000-000000000006', mc.id, pu.id, v.price,
  now() - (v.days_ago || ' days')::interval
FROM (VALUES
  ('Fajita / Arrachera',    'lb', 8.49, 0),
  ('Fajita / Arrachera',    'lb', 8.29, 5),
  ('Pollo Entero',           'lb', 0.89, 0),
  ('Pollo Entero',           'lb', 0.99, 4),
  ('Pechuga de Pollo',       'lb', 2.49, 0),
  ('Chuletas de Puerco',     'lb', 3.19, 0),
  ('Diezmillo',              'lb', 4.39, 0)
) AS v(cut_es, unit_abbr, price, days_ago)
JOIN meat_cuts mc ON mc.name_es = v.cut_es
JOIN price_unit pu ON pu.abbreviation = v.unit_abbr
ON CONFLICT DO NOTHING;

-- Shop 7: Rancho Grande — claimed shop, complete pricing
INSERT INTO prices (shop_id, cut_id, unit_id, price, recorded_at)
SELECT 'a1000000-0000-0000-0000-000000000007', mc.id, pu.id, v.price,
  now() - (v.days_ago || ' days')::interval
FROM (VALUES
  ('Diezmillo',              'lb', 4.19, 0),
  ('Diezmillo',              'lb', 4.19, 3),
  ('Fajita / Arrachera',    'lb', 7.99, 0),
  ('Pollo Entero',           'lb', 1.19, 0),
  ('Espaldilla de Puerco',   'lb', 2.79, 0),
  ('Costillas de Puerco',    'lb', 2.69, 0),
  ('Lengua de Res',          'lb', 6.49, 0),
  ('Carne Molida de Res',    'lb', 4.49, 0)
) AS v(cut_es, unit_abbr, price, days_ago)
JOIN meat_cuts mc ON mc.name_es = v.cut_es
JOIN price_unit pu ON pu.abbreviation = v.unit_abbr
ON CONFLICT DO NOTHING;

-- Shop 8: Mi Carnicería — Livingston, pork-heavy
INSERT INTO prices (shop_id, cut_id, unit_id, price, recorded_at)
SELECT 'a1000000-0000-0000-0000-000000000008', mc.id, pu.id, v.price,
  now() - (v.days_ago || ' days')::interval
FROM (VALUES
  ('Espaldilla de Puerco',   'lb', 2.49, 0),
  ('Tocino / Panceta',       'lb', 4.99, 0),
  ('Chorizo Fresco',         'lb', 3.99, 0),
  ('Carne al Pastor',        'lb', 5.49, 0),
  ('Pollo Entero',           'lb', 1.09, 0)
) AS v(cut_es, unit_abbr, price, days_ago)
JOIN meat_cuts mc ON mc.name_es = v.cut_es
JOIN price_unit pu ON pu.abbreviation = v.unit_abbr
ON CONFLICT DO NOTHING;

-- Shop 9: Super El Rey — wide selection
INSERT INTO prices (shop_id, cut_id, unit_id, price, recorded_at)
SELECT 'a1000000-0000-0000-0000-000000000009', mc.id, pu.id, v.price,
  now() - (v.days_ago || ' days')::interval
FROM (VALUES
  ('Diezmillo',              'lb', 4.59, 0),
  ('Fajita / Arrachera',    'lb', 8.29, 0),
  ('Pollo Entero',           'lb', 1.19, 0),
  ('Pechuga de Pollo',       'lb', 2.79, 0),
  ('Costillas de Res',       'lb', 5.69, 0),
  ('Chambarete',             'lb', 4.29, 0)
) AS v(cut_es, unit_abbr, price, days_ago)
JOIN meat_cuts mc ON mc.name_es = v.cut_es
JOIN price_unit pu ON pu.abbreviation = v.unit_abbr
ON CONFLICT DO NOTHING;

-- Shop 10: La Fe — Los Banos, goat + beef focus
INSERT INTO prices (shop_id, cut_id, unit_id, price, recorded_at)
SELECT 'a1000000-0000-0000-0000-000000000010', mc.id, pu.id, v.price,
  now() - (v.days_ago || ' days')::interval
FROM (VALUES
  ('Chivo para Birria',      'lb', 8.49, 0),
  ('Pierna de Borrego',      'lb', 7.49, 0),
  ('Diezmillo',              'lb', 4.49, 0),
  ('Fajita / Arrachera',    'lb', 8.79, 0),
  ('Pollo Entero',           'lb', 1.29, 0)
) AS v(cut_es, unit_abbr, price, days_ago)
JOIN meat_cuts mc ON mc.name_es = v.cut_es
JOIN price_unit pu ON pu.abbreviation = v.unit_abbr
ON CONFLICT DO NOTHING;
