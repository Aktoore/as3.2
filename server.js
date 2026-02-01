const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

app.get("/admin", (req, res) => {
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

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(404).json({ error: "API route not found" });
  } else {
    res.status(404).sendFile(path.join(__dirname, "views/404.html"));
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
