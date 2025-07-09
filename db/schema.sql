-- Database schema for the ticketing challenge

CREATE TABLE IF NOT EXISTS organisation (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    organisation_id INTEGER REFERENCES organisation(id)
);

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    user_id INTEGER REFERENCES users(id),
    organisation_id INTEGER REFERENCES organisation(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dummy organisations
INSERT INTO organisation (name) VALUES
  ('Acme Corp'),
  ('Globex Inc');

-- Dummy users
INSERT INTO users (name, organisation_id) VALUES
  ('Alice', 1),
  ('Bob',   1),
  ('Carol', 2);

-- Dummy tickets
INSERT INTO tickets (title, description, status, user_id, organisation_id) VALUES
  ('Broken printer',          'The 3rd floor printer is jammed.', 'open',    1, 1),
  ('VPN not connecting',      'Cannot connect since morning.',    'open',    2, 1),
  ('Website down',            'Landing page returns 500.',        'open',    3, 2),
  ('Request new laptop',      'Need a MacBook Pro M3.',           'pending', 1, 1),
  ('Email spam issue',        'Receiving lots of spam emails.',   'open',    2, 1);
