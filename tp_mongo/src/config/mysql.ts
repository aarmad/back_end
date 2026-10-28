import mysql from "mysql2/promise";
import { env } from "./env";

// Pool de connexions MySQL partagé par toute l'application
export const mysqlPool = mysql.createPool({
  host: env.mysql.host,
  port: env.mysql.port,
  user: env.mysql.user,
  password: env.mysql.password,
  database: env.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  // Les TIMESTAMP sont renvoyés en objets Date, les COUNT(*) en nombres
  dateStrings: false,
  decimalNumbers: true,
});

export async function checkMysqlConnection(): Promise<void> {
  const connection = await mysqlPool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}
