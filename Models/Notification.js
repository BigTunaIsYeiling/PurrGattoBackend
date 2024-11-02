const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["reply", "like"], required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
