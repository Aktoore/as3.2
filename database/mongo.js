const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

async function connectDB() {
  if (!db) {
    await client.connect();

    // ЯВНО указываем БД
    db = client.db("crypto_watcher");

    console.log("Connected to DB:", db.databaseName);
  }

  return db;
}

module.exports = { connectDB };
