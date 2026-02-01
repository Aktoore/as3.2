const { MongoClient } = require("mongodb");

console.log("ENV MONGO_URI =", process.env.MONGO_URI);

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("crypto_watcher");

    console.log("Connected to DB:", db.databaseName);
  }

  return db;
}

module.exports = { connectDB };
