require("dotenv").config();
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017");
const db = client.db(process.env.MONGO_DB || "jeux_video");
const games = db.collection("games");

module.exports = { client, games };
