const Message = require("../Models/Message");
const Post = require("../Models/Post");
const asyncHandler = require("express-async-handler");
exports.createMessage = async (req, res) => {
  try {
    const { content, senderId, receiverId } = req.body;
    if (content.trim().length < 1) {
      return res.status(400).json({ error: "Message can't be empty" });
    }
    if (senderId == receiverId) {
      return res
        .status(400)
        .json({ error: "You can't send message to yourself" });
    }
    const message = new Message({
      content,
      sender: senderId,
      receiver: receiverId,
    });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.createReplyMessage = async (req, res) => {
  try {
    const { content, senderId, receiverId, postId } = req.body;
    if (content.trim().length < 1) {
      return res.status(400).json({ error: "Message can't be empty" });
    }
    if (senderId == receiverId) {
      return res
        .status(400)
        .json({ error: "You can't send message to yourself" });
    }
    const message = new Message({
      content,
      sender: senderId,
      receiver: receiverId,
      replyToPost: postId,
    });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.GetUserMessages = async (req, res) => {
  try {
    const id = req.user;
    const messages = await Message.find({
      $and: [{ receiver: id }, { isAnswered: false }],
    }).sort({
      createdAt: -1,
    });
    const MessagesData = await Promise.all(
      messages.map(async (message) => {
        const post = await Post.findById(message.replyToPost);
        return {
          id: message._id,
          content: message.content,
          createdAt: message.createdAt,
          post: post ? post.PostBody : null,
          parentPost: post ? message.replyToPost : null,
        };
      })
    );
    res.status(200).json(MessagesData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.DeleteMessage = async (req, res) => {
  try {
    const id = req.user;
    const { messageId } = req.body;
    if (!messageId) {
      return res.status(400).json({ error: "Message ID is required" });
    }
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (message.receiver.toString() !== id) {
      return res.status(401).json({ error: "You can't delete this message" });
    }
    await message.deleteOne();
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
