const Message = require("../Models/Message");
const User = require("../Models/User");

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

exports.GetUserMessages = async (req, res) => {
  try {
    const id = req.user;
    const messages = await Message.find({ receiver: id }).sort({
      createdAt: -1,
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
