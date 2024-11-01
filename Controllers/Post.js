const Post = require("../Models/Post");
const Message = require("../Models/Message");
const User = require("../Models/User");

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

exports.createReplyPost = async (req, res) => {
  try {
    const id = req.user;
    const { PostBody, messageId, parentPostId } = req.body;

    if (PostBody.length < 1)
      return res.status(400).json({ error: "Post body cannot be empty" });

    // Verify that the user is authorized to create a post for the given message
    const message = await Message.findById(messageId);
    if (message.receiver.toString() !== id.toString()) {
      return res.status(400).json({
        error: "You are not authorized to create a post for this message",
      });
    }

    // Create and save the new reply post
    const newPost = new Post({
      PostBody,
      messageId,
      Author: id,
      parentPost: parentPostId,
    });
    const savedPost = await newPost.save();

    // Mark the message as answered
    message.isAnswered = true;
    await message.save();

    // Find the top-level post and update its `updatedAt` field
    let topLevelPost = await Post.findById(parentPostId);
    while (topLevelPost.parentPost) {
      topLevelPost = await Post.findById(topLevelPost.parentPost);
    }
    // Update `updatedAt` for the main post
    topLevelPost.updatedAt = new Date();
    await topLevelPost.save();

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
// Function to get all replies in a flat structure for a given post
const getAllReplies = async (postId) => {
  const repliesQueue = [postId];
  const allReplies = [];

  while (repliesQueue.length > 0) {
    const currentPostId = repliesQueue.shift();
    const replies = await Post.find({ parentPost: currentPostId }).sort({
      createdAt: -1,
    });

    // Map each reply to retrieve message and other details
    for (const reply of replies) {
      const submessage = await Message.findById(reply.messageId);
      allReplies.push({
        answer: reply.PostBody,
        ask: submessage.content,
        postId: reply._id,
        createdAt: reply.createdAt,
        likes: reply.likes,
        message: submessage._id,
      });

      // Add reply ID to queue to check for further sub-replies
      repliesQueue.push(reply._id);
    }
  }

  return allReplies;
};

exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const AllAnswers = await Post.find({ Author: userId }).countDocuments();
    // Fetch all top-level posts
    const posts = await Post.find({
      $and: [{ Author: userId }, { parentPost: null }],
    }).sort({ updatedAt: -1 });

    // Map each post and fetch its flat list of replies
    const PostsData = await Promise.all(
      posts.map(async (post) => {
        const message = await Message.findById(post.messageId);

        // Use getAllReplies to fetch a flat list of all replies to this post
        const RepliesData = await getAllReplies(post._id);

        return {
          answer: post.PostBody,
          ask: message.content,
          postId: post._id,
          createdAt: post.createdAt,
          likes: post.likes,
          message: message._id,
          replies: RepliesData, // All replies at the same level
          AllAnswers: AllAnswers,
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
