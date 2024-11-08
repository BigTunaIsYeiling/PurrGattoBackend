const User = require("../Models/User");
const argon = require("argon2");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const cloudinary = require("../Configs/cloudinaryConfig");
const Message = require("../Models/Message");
const Post = require("../Models/Post");
const Notification = require("../Models/Notification");
const { default: mongoose } = require("mongoose");

exports.register = asyncHandler(async (req, res) => {
  let errors = [];
  const { username, password } = req.body;
  const userExists = await User.findOne({ username: username.toLowerCase() });
  if (userExists) {
    errors.push("User already exists");
    return res.status(400).json({ errors });
  }
  const hashedPassword = await argon.hash(password);
  const user = await User.create({
    username: username.toLowerCase(),
    password: hashedPassword,
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
  res.status(201).json({ token });
});

exports.login = asyncHandler(async (req, res) => {
  let errors = [];
  const { username, password } = req.body;
  const user = await User.findOne({ username: username.toLowerCase() });
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
  res.status(200).json({ token });
});

exports.logout = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "User logged out successfully" });
});

exports.getUserData = asyncHandler(async (req, res) => {
  const id = req.user;
  const user = await User.findById(id);
  const Messages = await Message.find({
    $and: [{ receiver: id }, { isAnswered: false }],
  });
  const Notifications = await Notification.find({
    user: id,
    read: false,
  }).countDocuments();
  const UserData = {
    id: user._id,
    username: user.username,
    avatar: user.avatar.url,
    bio: user.bio,
    isAdmin: user.isAdmin,
    isTwitter: user.TwitterId ? true : false,
    messages: Messages.length,
    notifications: Notifications,
  };
  return res.status(200).json(UserData);
});

exports.RefreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
  res.cookie("token", newToken, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    secure: true,
  });
  res.status(200).json({ message: "Token refreshed successfully" });
});

exports.GetUsersList = asyncHandler(async (req, res) => {
  const id = req.user;
  const users = await User.find({ _id: { $ne: id } });
  const UsersData = await Promise.all(
    users.map(async (user) => {
      const Answers = await Post.find({ Author: user._id }).countDocuments();
      return {
        id: user._id,
        username: user.username,
        avatar: user.avatar.url,
        bio: user.bio,
        answers: Answers,
      };
    })
  );
  return res.status(200).json(UsersData);
});

// update user bio, username and avatar
exports.UpdateUser = asyncHandler(async (req, res) => {
  let errors = [];
  const id = req.user;
  const { username, bio, password } = req.body;
  const avatar = req.file?.path;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (username) {
    if (username.trim().length < 3) {
      errors.push("Username must be at least 3 characters long");
      return res.status(400).json({ errors });
    }

    // Check if the username contains spaces
    if (/\s/.test(username.trim())) {
      errors.push("Username must not contain spaces");
      return res.status(400).json({ errors });
    }

    const userExists = await User.findOne({ username: username.toLowerCase() });
    if (userExists) {
      errors.push("Username already exists");
      return res.status(400).json({ errors });
    }
    user.username = username.toLowerCase();
  }
  if (bio) {
    if (bio.length > 100 || bio.trim().length == 0) {
      errors.push("Bio must be between 1 and 100 characters long");
      return res.status(400).json({ errors });
    }
    user.bio = bio;
  }
  if (avatar) {
    if (user.avatar.publicId) {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    }
    const result = await cloudinary.uploader.upload(avatar);
    user.avatar = { url: result.secure_url, publicId: result.public_id };
  }
  if (password) {
    if (password.trim().length < 8) {
      errors.push("Password must be at least 8 characters long");
      return res.status(400).json({ errors });
    }
    const validPassword = await argon.verify(user.password, password);
    if (validPassword) {
      errors.push("New password cannot be the same as the old password");
      return res.status(400).json({ errors });
    }
    user.password = await argon.hash(password);
  }
  await user.save();
  return res.status(200).json({ message: "User updated successfully" });
});

exports.handleTwitterAuth = asyncHandler(async (req, res) => {
  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return res.redirect(`http://localhost:3000/`);
});

exports.getUserByid = asyncHandler(async (req, res) => {
  const id = req.params.id;

  // Check if the provided ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const Messages = await Message.find({
    $and: [{ receiver: id }, { isAnswered: false }],
  });

  const Notifications = await Notification.find({
    user: id,
    read: false,
  }).countDocuments();

  const UserData = {
    id: user._id,
    username: user.username,
    avatar: user.avatar.url,
    bio: user.bio,
    isAdmin: user.isAdmin,
    isTwitter: Boolean(user.TwitterId),
    messages: Messages.length,
    notifications: Notifications,
  };

  res.status(200).json(UserData);
});
exports.DeleteUser = asyncHandler(async (req, res) => {
  const id = req.user;

  // Find the user to delete
  const user = await User.findById(id);

  // Find all posts by the user
  const posts = await Post.find({ Author: id }).select("_id");

  // Find all messages related to those posts and set `replyToPost` to null in bulk
  await Message.updateMany(
    { replyToPost: { $in: posts.map((post) => post._id) } },
    { $set: { replyToPost: null } }
  );

  // Delete all posts by the user
  await Post.deleteMany({ Author: id });

  // Delete all messages where the user is the receiver
  await Message.deleteMany({ receiver: id });

  // Find all messages sent by the user and set `sender` to null in bulk
  await Message.updateMany({ sender: id }, { $set: { sender: null } });

  // Delete notifications related to the user as sender or receiver
  await Notification.deleteMany({ $or: [{ user: id }, { fromUser: id }] });

  // Remove user from posts"s likes array
  await Post.updateMany({ likes: id }, { $pull: { likes: id } });

  // Delete user’s avatar from Cloudinary if it exists
  if (user.avatar.publicId) {
    await cloudinary.uploader.destroy(user.avatar.publicId);
  }

  // Delete the user
  await User.findByIdAndDelete(id);

  // log out
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.clearCookie("token");

  // Send response
  return res.status(200).json({ message: "User deleted successfully" });
});
