const express = require("express");
const bcrypt = require("bcrypt");
const { connectDB } = require("../database/mongo");

const router = express.Router();

router.get("/me", (req, res) => {
  if (!req.session?.user) {
    return res.status(200).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: true,
    user: {
      username: req.session.user.username,
      role: req.session.user.role
    }
  });
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const db = await connectDB();
    const users = db.collection("users");

    const user = await users.findOne({ username: String(username) });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.user = {
      id: String(user._id),
      username: user.username,
      role: user.role
    };

    return res.status(200).json({ message: "Logged in" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  if (!req.session) return res.status(200).json({ message: "Logged out" });

  req.session.destroy(() => {
    res.clearCookie("sid");
    return res.status(200).json({ message: "Logged out" });
  });
});

module.exports = router;
