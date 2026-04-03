-- Bilingual meat-cut dictionary
CREATE TYPE meat_animal AS ENUM ('beef', 'pork', 'chicken', 'goat', 'lamb', 'other');

CREATE TABLE meat_cuts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal      meat_animal NOT NULL,
  name_en     TEXT NOT NULL,
  name_es     TEXT NOT NULL,
  alt_names   TEXT[] DEFAULT '{}',   -- additional search terms in either language
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (animal, name_en),
  UNIQUE (animal, name_es)
);

-- Full-text search index for bilingual cut lookup
CREATE INDEX idx_cuts_name_en ON meat_cuts USING GIN (to_tsvector('english', name_en));
CREATE INDEX idx_cuts_name_es ON meat_cuts USING GIN (to_tsvector('spanish', name_es));
CREATE INDEX idx_cuts_animal ON meat_cuts (animal);
