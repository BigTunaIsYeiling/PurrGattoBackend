const express = require("express");
const app = express();
const connectDB = require("./Configs/Database");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
require("dotenv").config();
require("./Configs/passport");

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: true, // Only allow cookies over HTTPS
      sameSite: "none", // Allow cookies in cross-origin requests
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: "https://purrgato.vercel.app",
    credentials: true,
  })
);

app.use("/user", require("./Routes/userRoutes"));
app.use("/message", require("./Routes/MessageRoute"));
app.use("/post", require("./Routes/PostRoutes"));
app.use("/note", require("./Routes/NotificatinRoutes"));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
