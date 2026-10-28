import { app } from "./app";
import { env } from "./config/env";
import { mongoClient } from "./config/mongodb";
import { checkMysqlConnection, mysqlPool } from "./config/mysql";

async function start() {
  await Promise.all([checkMysqlConnection(), mongoClient.connect()]);
  const server = app.listen(env.port, () => {
    console.log(`API démarrée sur http://localhost:${env.port}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await Promise.all([mysqlPool.end(), mongoClient.close()]);
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((error) => {
  console.error("Démarrage impossible :", error.message);
  process.exit(1);
});
