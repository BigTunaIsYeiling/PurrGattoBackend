const Post = require("../Models/Post");
const Message = require("../Models/Message");
const User = require("../Models/User");
const Reply = require("../Models/Reply");
exports.createPost = async (req, res) => {
  try {
    const id = req.user;
    const { PostBody, messageId } = req.body;
    if (PostBody.length < 1)
      return res.status(400).json({ error: "Post body cannot be empty" });
    const message = await Message.findById(messageId);
    if (message.receiver.toString() !== id.toString()) {
      return res.status(400).json({
        error: "You are not authorized to create a post for this message",
      });
    }
    const newPost = new Post({
      PostBody,
      messageId,
      Author: id,
    });
    const savedPost = await newPost.save();
    message.isAnswered = true;
    await message.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ error: "Unable to create post" });
  }
};

exports.likePost = async (req, res) => {
  try {
    const id = req.user;
    const { postId } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.likes.includes(id)) {
      post.likes = post.likes.filter((userId) => userId.toString() !== id);
    } else {
      post.likes.push(id);
    }
    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(400).json({ error: "Unable to like post" });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ Author: userId }).sort({ createdAt: -1 });
    const PostsData = await Promise.all(
      posts.map(async (post) => {
        const message = await Message.findById(post.messageId);
        return {
          answer: post.PostBody,
          ask: message.content,
          postId: post.id,
          createdAt: post.createdAt,
          likes: post.likes,
          message: message._id,
        };
      })
    );

    res.status(200).json(PostsData);
  } catch (err) {
    res.status(400).json({ error: "Unable to get posts" });
  }
};

exports.DeletePost = async (req, res) => {
  try {
    const id = req.user;
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.Author.toString() !== id.toString()) {
      return res.status(400).json({
        error: "You are not authorized to delete this post",
      });
    }
    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Unable to delete post" });
  }
};

exports.AddReply = async (req, res) => {
  try {
    const id = req.user;
    const { postId, replyBody } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (replyBody.length < 1)
      return res.status(400).json({ error: "Post body cannot be empty" });
    if (id == post.Author) {
      return res
        .status(400)
        .json({ error: "You can't reply to your own post" });
    }
    const newReply = new Reply({
      replyBody,
      postId,
      Author: id,
      originalMessage: post.messageId,
    });
    const savedReply = await newReply.save();
    post.replies.push(savedReply._id);
    await post.save();
    res.status(201).json(savedReply);
  } catch (err) {
    res.status(400).json({ error: "Unable to add reply" });
  }
};
