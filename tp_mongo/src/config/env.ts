import "dotenv/config";

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
};

export const env = {
  port: Number(process.env.PORT) || 3003,
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "2h",
  mysql: {
    host: process.env.MYSQL_HOST ?? "localhost",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER ?? "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE ?? "game_lists",
  },
  mongo: {
    url: process.env.MONGO_URL ?? "mongodb://localhost:27017",
    database: process.env.MONGO_DATABASE ?? "game_lists",
  },
};
