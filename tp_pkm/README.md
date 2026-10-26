# TP Pokémon — API REST (Express + TypeScript + PostgreSQL)

## Lancer le projet

```bash
cp .env.example .env     # DATABASE_URL + PORT (3001 par défaut)
npm install              # génère aussi le client Prisma
npm run db:migrate       # crée la base et les tables
npm run db:seed          # données de démo : Sacha et Ondine, 3 Pokémon chacun
npm run dev              # http://localhost:3001/api
```

PostgreSQL doit tourner sur `localhost:5432` (utilisateur `main` / mot de passe `main`).

## Architecture

| Dossier | Rôle |
|---|---|
| `src/classes` | Classes métier POO : `Attack`, `Pokemon`, `Trainer` (+ `GameError`) |
| `src/services/CombatService.ts` | Combats : défi aléatoire, arène 1, défi déterministe, arène 2 |
| `src/repositories/GameRepository.ts` | Passage base de données ↔ objets métier (Prisma) |
| `src/controllers`, `src/routes` | Couche HTTP |
| `prisma/schema.prisma` | Tables `Trainer`, `Pokemon`, `Attack`, `PokemonAttack` (compteur d'usage par Pokémon) |

## Règles du jeu

- Un Pokémon connaît **4 attaques au maximum**, sans doublon.
- Se soigner restaure les PV et remet à zéro les usages des attaques.
- Une attaque est tirée au hasard parmi celles qui ont encore des utilisations.
- Chaque victoire rapporte **1 XP** au dresseur ; à **10 XP**, il gagne un niveau.
- Si aucun des deux Pokémon ne peut plus attaquer, celui qui a le plus de PV gagne (égalité = match nul).

## Routes (`/api`)

| Méthode | Route | Body |
|---|---|---|
| GET / POST | `/attacks` | `{ name, damage, usageLimit }` |
| GET | `/attacks/:id` | |
| GET / POST | `/pokemons` | `{ name, lifePoint, trainerId? }` |
| GET | `/pokemons/:id` | |
| POST | `/pokemons/:id/attacks` | `{ attackId }` (apprendre une attaque) |
| POST | `/pokemons/:id/heal` | |
| POST | `/pokemons/:id/attack` | `{ targetId }` |
| GET / POST | `/trainers` | `{ name }` |
| GET | `/trainers/:id` | |
| POST | `/trainers/:id/pokemons` | `{ pokemonId }` |
| POST | `/trainers/:id/tavern` | |
| POST | `/trainers/:id/experience` | `{ amount }` |
| POST | `/combats/random-challenge` | `{ trainer1Id, trainer2Id }` |
| POST | `/combats/arena1` | `{ trainer1Id, trainer2Id }` |
| POST | `/combats/deterministic-challenge` | `{ trainer1Id, trainer2Id }` |
| POST | `/combats/arena2` | `{ trainer1Id, trainer2Id }` |
