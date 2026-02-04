const bcrypt = require("bcrypt");

async function ensureDefaultUsers(db) {
  const users = db.collection("users");

  await users.createIndex({ username: 1 }, { unique: true });

  const defaults = [
    { username: "admin", password: "admin123", role: "admin" },
    { username: "user", password: "user123", role: "user" }
  ];

  for (const u of defaults) {
    const exists = await users.findOne({ username: u.username });
    if (exists) continue;

    const passwordHash = await bcrypt.hash(u.password, 10);
    await users.insertOne({
      username: u.username,
      passwordHash,
      role: u.role,
      createdAt: new Date()
    });
  }
}

module.exports = { ensureDefaultUsers };
