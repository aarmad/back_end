// Initialise MySQL (tables + catalogue + comptes de démo) et MongoDB (collection wishlists + validation + index).
// npm run db:init        → crée ce qui manque, sans rien effacer
// npm run db:reset       → vide aussi les favoris et les wishlists
import { readFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { env } from "../config/env";
import { mongoClient, mongoDb } from "../config/mongodb";

const databaseDir = path.resolve(__dirname, "../../database");
const reset = process.argv.includes("--reset");

const demoUsers = [
  { id: "user-alice", username: "alice", password: "password123" },
  { id: "user-bastien", username: "bastien", password: "password123" },
];

async function initMysql() {
  const connection = await mysql.createConnection({
    host: env.mysql.host,
    port: env.mysql.port,
    user: env.mysql.user,
    password: env.mysql.password,
    multipleStatements: true,
  });
  try {
    // Le nom de la base est défini dans les scripts SQL : on le remplace si MYSQL_DATABASE est différent
    const sql = (file: string) =>
      readFileSync(path.join(databaseDir, "mysql", file), "utf8").replaceAll("game_lists", env.mysql.database);

    await connection.query(sql("schema.sql"));
    await connection.query(sql("seed.sql"));

    for (const user of demoUsers) {
      const hash = await bcrypt.hash(user.password, 10);
      await connection.query(
        "INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)",
        [user.id, user.username, hash],
      );
    }
    if (reset) await connection.query("DELETE FROM user_favorites");

    const [[{ games }]] = await connection.query<mysql.RowDataPacket[]>("SELECT COUNT(*) AS games FROM games");
    console.log(`MySQL   : base "${env.mysql.database}" prête (${games} jeux, ${demoUsers.length} comptes de démo)`);
  } finally {
    await connection.end();
  }
}

async function initMongo() {
  await mongoClient.connect();
  try {
    const validator = JSON.parse(readFileSync(path.join(databaseDir, "mongodb", "wishlists.schema.json"), "utf8"));
    const exists = (await mongoDb.listCollections({ name: "wishlists" }).toArray()).length > 0;

    if (exists) await mongoDb.command({ collMod: "wishlists", validator, validationLevel: "strict" });
    else await mongoDb.createCollection("wishlists", { validator, validationLevel: "strict" });

    const wishlists = mongoDb.collection("wishlists");
    await wishlists.createIndex({ userId: 1 }, { unique: true, name: "unique_user" });
    if (reset) await wishlists.deleteMany({});

    console.log(`MongoDB : collection "${env.mongo.database}.wishlists" prête (validation JSON Schema + index unique userId)`);
  } finally {
    await mongoClient.close();
  }
}

Promise.all([initMysql(), initMongo()])
  .then(() => console.log(reset ? "Favoris et wishlists vidés." : "Initialisation terminée."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
