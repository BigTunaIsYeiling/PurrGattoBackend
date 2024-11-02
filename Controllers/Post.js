const Post = require("../Models/Post");
const Message = require("../Models/Message");
const User = require("../Models/User");
const Notification = require("../Models/Notification");

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
    if (message.sender) {
      const newNotification = new Notification({
        user: message.sender,
        fromUser: id,
        post: savedPost._id,
        message: messageId,
        type: "reply",
      });
      await newNotification.save();
    }
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

    if (message.sender) {
      const newNotification = new Notification({
        user: message.sender,
        fromUser: id,
        post: savedPost._id,
        message: messageId,
        type: "reply",
      });
      await newNotification.save();
    }

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
      if (post.Author.toString() !== id.toString()) {
        const newNotification = new Notification({
          user: post.Author,
          fromUser: id,
          post: post._id,
          type: "like",
        });
        await newNotification.save();
      }
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
    const AllAnswers = await Post.find({ Author: userId }).countDocuments();
    const user = await User.findById(userId);
    const posts = await Post.find({ Author: userId }).sort({ createdAt: -1 });
    const PostsData = await Promise.all(
      posts.map(async (post) => {
        const message = await Message.findById(post.messageId);
        return {
          answer: post.PostBody,
          ask: message.content,
          postId: post._id,
          createdAt: post.createdAt,
          likes: post.likes,
          message: message._id,
          username: user.username,
          avatar: user.avatar.url,
        };
      })
    );
    res.status(200).json({ PostsData, AllAnswers });
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

// Recursive function to fetch all parent posts
const fetchParentPosts = async (post) => {
  const parentPosts = [];
  while (post && post.parentPost) {
    post = await Post.findById(post.parentPost)
      .populate("Author", "name")
      .populate("likes", "name");
    if (post) parentPosts.push(post);
  }
  return parentPosts.reverse(); // Reverse to order from top-level down
};

// Recursive function to fetch all child posts
const fetchChildPosts = async (postId) => {
  const childPosts = [];
  const children = await Post.find({ parentPost: postId })
    .populate("Author", "name")
    .populate("likes", "name");

  for (const child of children) {
    childPosts.push(child);
    const subChildren = await fetchChildPosts(child._id); // Recursively fetch deeper children
    childPosts.push(...subChildren);
  }
  return childPosts;
};

exports.getPostWithRelations = async (req, res) => {
  try {
    const { postId } = req.params;
    let currentPost = await Post.findById(postId)
      .populate("Author", "name")
      .populate("likes", "name");

    if (!currentPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Fetch all parent posts
    const parentPosts = await fetchParentPosts(currentPost);

    // Fetch all child posts
    const childPosts = await fetchChildPosts(postId);

    // Combine all related posts
    const relatedPosts = [...parentPosts, currentPost, ...childPosts];
    const PostsData = await Promise.all(
      relatedPosts.map(async (post) => {
        const message = await Message.findById(post.messageId);
        const user = await User.findById(post.Author._id);
        return {
          answer: post.PostBody,
          ask: message.content,
          postId: post._id,
          createdAt: post.createdAt,
          likes: post.likes.map((like) => like._id),
          message: message._id,
          username: user.username,
          avatar: user.avatar.url,
          isSubAnswer: post.parentPost ? true : false,
        };
      })
    );
    res.json(PostsData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
