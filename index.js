const express = require("express");
const app = express();
const connectDB = require("./Configs/Database");
require("dotenv").config();

connectDB();

app.get("/hello", (req, res) => {
  res.send("Hello World!");
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
