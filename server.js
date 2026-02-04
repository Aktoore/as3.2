const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const { connectDB } = require("./database/mongo");
require("dotenv").config();

(async () => {
  try {
    console.log("==== TRYING TO CONNECT TO MONGO ====");
    const db = await connectDB();
    console.log("✅ CONNECTED TO DB:", db.databaseName);
  } catch (err) {
    console.error("❌ MONGO CONNECTION FAILED:", err);
    process.exit(1);
  }
})();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret123",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views/login.html"));
});

app.get("/admin", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }

  res.sendFile(path.join(__dirname, "views/admin.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "views/contact.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views/about.html"));
});

app.get("/search", (req, res) => {
  res.sendFile(path.join(__dirname, "views/search.html"));
});

const assetsRoutes = require("./routes/assets");
app.use("/api/assets", assetsRoutes);

const contactsRoutes = require("./routes/contacts");
app.use("/api/contacts", contactsRoutes);

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(404).json({ error: "API route not found" });
  } else {
    res.status(404).sendFile(path.join(__dirname, "views/404.html"));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
