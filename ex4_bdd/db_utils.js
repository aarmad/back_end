
const { Client } = require('pg');

// 1. Se connecter à la base de données
async function getConnection(username, password, database) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: username,
    password: password,
    database: database
  });

  await client.connect();
  return client;
}

// 2. Récupérer tous les utilisateurs
async function getUsers(callback) {
  let client;

  try {
    client = await getConnection(
      process.env.dbuser,
      process.env.dbpwd,
      'mabase'
    );

    const result = await client.query('SELECT * FROM users');

    callback(null, result.rows);
  } catch (error) {
    callback(error, null);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// 3. Insérer un utilisateur
async function insert_user(user) {
  const client = await getConnection(
    process.env.dbuser,
    process.env.dbpwd,
    'mabase'
  );

  try {
    const result = await client.query(
      'INSERT INTO users (email) VALUES ($1) RETURNING *',
      [user.email]
    );

    return result.rows[0];
  } finally {
    await client.end();
  }
}

// 4. Tester les fonctions
async function main() {
  try {
    const user = await insert_user({
      email: 'nouveau@test.com'
    });

    console.log('Utilisateur ajouté :', user);

    await getUsers((error, users) => {
      if (error) {
        console.error(error);
        return;
      }

      console.log('Liste des utilisateurs :', users);
    });
  } catch (error) {
    console.error('Erreur :', error.message);
  }
}

main();
