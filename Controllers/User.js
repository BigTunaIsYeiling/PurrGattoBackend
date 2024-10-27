const User = require("../Models/User");
const argon = require("argon2");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

exports.register = asyncHandler(async (req, res) => {
  let errors = [];
  const { username, password } = req.body;
  const userExists = await User.findOne({ username });
  if (userExists) {
    errors.push("User already exists");
    return res.status(400).json({ errors });
  }
  const hashedPassword = await argon.hash(password);
  const user = await User.create({
    username,
    password: hashedPassword,
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.status(201).json({ message: "User created successfully" });
});

exports.login = asyncHandler(async (req, res) => {
  let errors = [];
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    errors.push("User does not exist");
    return res.status(400).json({ errors });
  }
  const validPassword = await argon.verify(user.password, password);
  if (!validPassword) {
    errors.push("Incorrect password");
    return res.status(400).json({ errors });
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.status(200).json({ message: "User logged in successfully" });
});

exports.logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.clearCookie("token");
  res.status(200).json({ message: "User logged out successfully" });
});

exports.getUserData = asyncHandler(async (req, res) => {
  const id = req.user;
  const user = await User.findById(id);
  const UserData = {
    id: user._id,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    isAdmin: user.isAdmin,
  };
  res.status(200).json(UserData);
});
