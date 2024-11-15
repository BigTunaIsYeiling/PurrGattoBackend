const express = require("express");
const app = express();
const connectDB = require("./Configs/Database");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const cors = require("cors");
require("dotenv").config();
require("./Configs/passport");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000", "https://purrgato.vercel.app"],
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
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
