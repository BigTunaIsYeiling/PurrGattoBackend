const express = require("express");
const app = express();
const connectDB = require("./Configs/Database");
const cookieParser = require("cookie-parser");
require("dotenv").config();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/user", require("./Routes/userRoutes"));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
