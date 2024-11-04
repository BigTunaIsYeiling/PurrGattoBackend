const Post = require("../Models/Post");
const Message = require("../Models/Message");
const User = require("../Models/User");
const Notification = require("../Models/Notification");
const asyncHandler = require("express-async-handler");

exports.createPost = asyncHandler(async (req, res) => {
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
});

exports.createReplyPost = asyncHandler(async (req, res) => {
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
});

exports.likePost = asyncHandler(async (req, res) => {
  try {
    const id = req.user; // ID of the user liking the post
    const { postId } = req.body;

    // Find the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if the user has already liked the post
    const hasLiked = post.likes.includes(id);

    if (hasLiked) {
      // If already liked, remove the like
      post.likes = post.likes.filter((userId) => userId.toString() !== id);

      // Remove the "like" notification if it exists
      await Notification.findOneAndDelete({
        user: post.Author,
        fromUser: id,
        post: post._id,
        type: "like",
      });
    } else {
      // If not liked, add the like
      post.likes.push(id);

      // Only create a notification if the post author is not the same as the liker
      if (post.Author.toString() !== id.toString()) {
        // Check if a "like" notification already exists
        const existingNotification = await Notification.findOne({
          user: post.Author,
          fromUser: id,
          post: post._id,
          type: "like",
        });

        // If no notification exists, create a new one
        if (!existingNotification) {
          const newNotification = new Notification({
            user: post.Author,
            fromUser: id,
            post: post._id,
            type: "like",
          });
          await newNotification.save();
        }
      }
    }

    // Save the updated post
    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Unable to like post" });
  }
});

exports.getUserPosts = asyncHandler(async (req, res) => {
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
          isParentPost: post.parentPost ? false : true,
        };
      })
    );
    res.status(200).json({ PostsData, AllAnswers });
  } catch (err) {
    res.status(400).json({ error: "Unable to get posts" });
  }
});

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

exports.getPostWithRelations = asyncHandler(async (req, res) => {
  try {
    const { postId, userId } = req.params;
    let currentPost = await Post.findById(postId)
      .populate("Author", "name")
      .populate("likes", "name");
    if (!currentPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (currentPost.Author._id.toString() != userId) {
      return res
        .status(404)
        .json({ message: "This user ain't the author of this post" });
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
});

exports.deletePost = asyncHandler(async (req, res) => {
  try {
    // Find the post to delete
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found; cannot be deleted." });
    }

    // Find the immediate child of the post to be deleted
    let currentPost = await Post.findOne({ parentPost: postId });

    // Update the chain of posts
    let parentPost = post.parentPost;
    while (currentPost) {
      // Update the parentPost of the current child
      await Post.findByIdAndUpdate(currentPost._id, { parentPost: parentPost });

      // Move down the chain
      parentPost = currentPost._id;
      currentPost = await Post.findOne({ parentPost: currentPost._id });
    }

    // Update messages to point to the `parentPost` of the deleted post, if applicable
    await Message.updateMany(
      { replyToPost: postId },
      { $set: { replyToPost: post.parentPost } }
    );

    // Delete notifications that post is "postId"
    await Notification.deleteMany({ post: postId });

    // Finally, delete the post itself
    await Post.findByIdAndDelete(postId);

    // Send response
    return res.status(200).json({
      message: "Post deleted successfully, thread continuity maintained",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while deleting the post" });
  }
});
