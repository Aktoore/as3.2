const { MongoClient } = require("mongodb");

console.log("==== MONGO DEBUG START ====");
console.log("process.env.MONGO_URI =", process.env.MONGO_URI);
console.log("===========================");

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI IS UNDEFINED");
  throw new Error("MONGO_URI is missing");
}

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);

let db;

async function connectDB() {
  try {
    if (!db) {
      console.log("⏳ Connecting to Mongo...");

      await client.connect();

      db = client.db("crypto_watcher");

      console.log("✅ CONNECTED TO DB:", db.databaseName);
    }

    return db;

  } catch (err) {
    console.error("🔥 MONGO CONNECTION ERROR:");
    console.error(err);

    throw err;
  }
}

module.exports = { connectDB };
