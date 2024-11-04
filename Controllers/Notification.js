const Notification = require("../Models/Notification");
const User = require("../Models/User");
const Post = require("../Models/Post");
const Message = require("../Models/Message");
const asyncHandler = require("express-async-handler");

exports.getNotifications = asyncHandler(async (req, res) => {
  const id = req.user;
  const notifications = await Notification.find({ user: id }).sort({
    createdAt: -1,
  });
  
  const NotificationsData = await Promise.all(
    notifications.map(async (notification) => {
      const fromUser = await User.findById(notification.fromUser);
      const post = await Post.findById(notification.post);
      const message = await Message.findById(notification.message);
      if (notification.type === "reply") {
        return {
          id: notification._id,
          type: notification.type,
          fromUser: {
            username: fromUser.username,
            avatar: fromUser.avatar.url,
          },
          message: {
            id: message._id,
            title: message.content,
          },
          createdAt: notification.createdAt,
          post: {
            id: post._id,
            title: post.PostBody,
          },
          notLink: `/${fromUser._id}/post/${post._id}`,
        };
      } else {
        return {
          id: notification._id,
          type: notification.type,
          fromUser: {
            username: fromUser.username,
            avatar: fromUser.avatar.url,
          },
          post: {
            id: post._id,
            title: post.PostBody,
          },
          createdAt: notification.createdAt,
          notLink: `/${id}/post/${post._id}`,
        };
      }
    })
  );
  res.status(200).json(NotificationsData);
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  const id = req.user;
  await Notification.updateMany({ user: id }, { read: true });
  res.status(200).json({ message: "All notifications marked as read" });
});

exports.deleteNoti = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await Notification.findByIdAndDelete(id);
  res.status(200).json({ message: "Notification deleted successfully" });
});
