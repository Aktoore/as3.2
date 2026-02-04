const { MongoClient } = require("mongodb");

console.log("==== MONGO DEBUG START ====");
console.log("process.env.MONGO_URI =", process.env.MONGO_URI);
console.log("==========================");

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("MONGO_URI is NOT defined");
}

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
