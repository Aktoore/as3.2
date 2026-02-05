const express = require("express");
const bcrypt = require("bcrypt");
const { connectDB } = require("../database/mongo");

const router = express.Router();


/* CHECK SESSION */

router.get("/me", (req, res) => {

  if (!req.session?.user) {
    return res.json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user: {
      username: req.session.user.username,
      role: req.session.user.role
    }
  });

});


/* REGISTER */

router.post("/register", async (req, res) => {

  try {

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (password.length < 5) {
      return res.status(400).json({ error: "Password too short" });
    }

    const db = await connectDB();
    const users = db.collection("users");

    const exists = await users.findOne({ username });

    if (exists) {
      return res.status(400).json({ error: "User exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    await users.insertOne({
      username,
      passwordHash: hash,
      role: "user",
      createdAt: new Date()
    });

    res.json({ success: true });

  } catch (e) {

    res.status(500).json({ error: "Server error" });

  }

});


/* LOGIN */

router.post("/login", async (req, res) => {

  try {

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Invalid data" });
    }

    const db = await connectDB();
    const users = db.collection("users");

    const user = await users.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Wrong login" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
      return res.status(401).json({ error: "Wrong login" });
    }

    req.session.user = {
      id: String(user._id),
      username: user.username,
      role: user.role
    };

    res.json({ success: true });

  } catch (e) {

    res.status(500).json({ error: "Server error" });

  }

});


/* LOGOUT */

router.post("/logout", (req, res) => {

  if (!req.session) return res.json({ success: true });

  req.session.destroy(() => {

    res.clearCookie("connect.sid");
    res.json({ success: true });

  });

});


module.exports = router;
