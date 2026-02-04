const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const { connectDB } = require("./database/mongo");
require("dotenv").config();

(async () => {
  try {
    console.log("==== TRYING TO CONNECT TO MONGO ====");
    const db = await connectDB();
    console.log("CONNECTED:", db.databaseName);
  } catch (err) {
    console.error("MONGO FAILED:", err);
    process.exit(1);
  }
})();


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    name: "crypto.sid",

    secret: process.env.SESSION_SECRET || "secret123",

    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),

    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views/login.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views/about.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "views/contact.html"));
});

app.get("/search", (req, res) => {
  res.sendFile(path.join(__dirname, "views/search.html"));
});

app.get("/admin", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }

  res.sendFile(path.join(__dirname, "views/admin.html"));
});

app.use("/api/assets", require("./routes/assets"));
app.use("/api/contacts", require("./routes/contacts"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/session", require("./routes/session"));

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({ error: "API not found" });
  }

  res.status(404).sendFile(path.join(__dirname, "views/404.html"));
});

app.listen(PORT, () => {
  console.log("SERVER RUNNING:", PORT);
});
