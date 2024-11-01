const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The user to notify
    type: { type: String, enum: ["reply", "like"], required: true }, // Type of notification
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // Post related to the notification
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User who triggered the notification
    message: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }, // Message associated with the reply
    read: { type: Boolean, default: false }, // Status of the notification (read/unread)
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
