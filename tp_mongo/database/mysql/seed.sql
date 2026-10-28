-- Catalogue de jeux de démo (les utilisateurs sont créés par le script d'init, pour hacher leurs mots de passe)
USE game_lists;

INSERT INTO games (id, title, genre, release_year) VALUES
  ('zelda-botw', 'The Legend of Zelda: Breath of the Wild', 'aventure', 2017),
  ('elden-ring', 'Elden Ring', 'rpg', 2022),
  ('hades', 'Hades', 'action', 2020),
  ('stardew-valley', 'Stardew Valley', 'simulation', 2016),
  ('celeste', 'Celeste', 'plateforme', 2018),
  ('witcher-3', 'The Witcher 3: Wild Hunt', 'rpg', 2015),
  ('hollow-knight', 'Hollow Knight', 'action', 2017),
  ('mario-kart-8', 'Mario Kart 8 Deluxe', 'course', 2017),
  ('minecraft', 'Minecraft', 'bac à sable', 2011),
  ('rdr2', 'Red Dead Redemption 2', 'aventure', 2018),
  ('tetris-effect', 'Tetris Effect', 'puzzle', 2018),
  ('baldurs-gate-3', 'Baldur''s Gate 3', 'rpg', 2023)
ON DUPLICATE KEY UPDATE title = VALUES(title), genre = VALUES(genre), release_year = VALUES(release_year);
