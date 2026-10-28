-- Base MySQL du TP « Favoris & Wishlist »
-- Exécuté par `npm run db:init` (ou à la main : mysql -u root < database/mysql/schema.sql)

CREATE DATABASE IF NOT EXISTS game_lists CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE game_lists;

-- Catalogue des jeux : un jeu doit exister ici avant d'être ajouté aux favoris ou à la wishlist
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  genre VARCHAR(50) NOT NULL,
  release_year SMALLINT NOT NULL,
  INDEX idx_genre (genre)
);

-- Comptes utilisateurs (authentification JWT)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table imposée par l'énoncé, complétée par des clés étrangères vers users et games
CREATE TABLE IF NOT EXISTS user_favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  game_id VARCHAR(100) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorite (user_id, game_id),
  INDEX idx_user (user_id),
  CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_favorite_game FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
);
