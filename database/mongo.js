const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("crypto_watcher");
  }
  return db;
}

module.exports = { connectDB };
