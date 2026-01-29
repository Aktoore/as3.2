const express = require("express");
const { ObjectId } = require("mongodb");
const { connectDB } = require("../database/mongo");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("assets");

    const filter = {};

    if (req.query.q) {
      filter.$or = [
        { name: { $regex: req.query.q, $options: "i" } },
        { symbol: { $regex: req.query.q, $options: "i" } }
      ];
    }

    if (req.query.symbol) {
      filter.symbol = String(req.query.symbol).toUpperCase();
    }

    if (req.query.minPrice) {
      filter.price = { ...filter.price, $gte: Number(req.query.minPrice) };
    }

    if (req.query.maxPrice) {
      filter.price = { ...filter.price, $lte: Number(req.query.maxPrice) };
    }

    let sort = { _id: 1 };
    if (req.query.sortBy === "price") sort = { price: 1 };
    if (req.query.sortBy === "priceDesc") sort = { price: -1 };
    if (req.query.sortBy === "name") sort = { name: 1 };
    if (req.query.sortBy === "nameDesc") sort = { name: -1 };
    if (req.query.sortBy === "marketCap") sort = { marketCap: -1 };

    let projection = {};
    if (req.query.fields) {
      req.query.fields.split(",").forEach((f) => {
        projection[f.trim()] = 1;
      });
    }

    const assets = await collection
      .find(filter)
      .project(projection)
      .sort(sort)
      .toArray();

    res.status(200).json(assets);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("assets");

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const asset = await collection.findOne({ _id: new ObjectId(req.params.id) });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.status(200).json(asset);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, symbol, price, description, marketCap, change24h, imageUrl } = req.body;

    if (!name || !symbol || price === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = await connectDB();
    const collection = db.collection("assets");

    const newAsset = {
      name: String(name),
      symbol: String(symbol).toUpperCase(),
      price: Number(price),
      description: description ? String(description) : "",
      marketCap: marketCap !== undefined ? Number(marketCap) : 0,
      change24h: change24h !== undefined ? Number(change24h) : 0,
      imageUrl: imageUrl ? String(imageUrl) : "",
      createdAt: new Date()
    };

    const result = await collection.insertOne(newAsset);

    res.status(201).json({
      _id: result.insertedId,
      ...newAsset
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, symbol, price, description, marketCap, change24h, imageUrl } = req.body;

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    if (!name || !symbol || price === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = await connectDB();
    const collection = db.collection("assets");

    const updated = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          name: String(name),
          symbol: String(symbol).toUpperCase(),
          price: Number(price),
          description: description ? String(description) : "",
          marketCap: marketCap !== undefined ? Number(marketCap) : 0,
          change24h: change24h !== undefined ? Number(change24h) : 0,
          imageUrl: imageUrl ? String(imageUrl) : "",
          updatedAt: new Date()
        }
      }
    );

    if (updated.matchedCount === 0) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.status(200).json({ message: "Asset updated" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const db = await connectDB();
    const collection = db.collection("assets");

    const deleted = await collection.deleteOne({ _id: new ObjectId(req.params.id) });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.status(200).json({ message: "Asset deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
