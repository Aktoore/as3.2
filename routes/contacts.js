const express = require("express");
const { connectDB } = require("../database/mongo");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = await connectDB();
    const collection = db.collection("contacts");

    await collection.insertOne({
      name: String(name),
      email: String(email),
      message: String(message),
      createdAt: new Date()
    });

    res.status(201).json({ message: "Contact saved" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
