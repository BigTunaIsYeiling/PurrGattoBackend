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

// Configure CORS with credentials and specific origin
app.use(
  cors({
    origin: "https://purrgato.vercel.app",
    credentials: true, // Allows cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Configure express-session with cross-origin cookie settings
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,  // Only accessible by the server
      secure: true,    // Requires HTTPS
      sameSite: "none" // Allows cross-origin requests
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/user", require("./Routes/userRoutes"));
app.use("/message", require("./Routes/MessageRoute"));
app.use("/post", require("./Routes/PostRoutes"));
app.use("/note", require("./Routes/NotificatinRoutes"));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
