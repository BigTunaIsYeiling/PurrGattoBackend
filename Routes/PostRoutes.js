const router = require("express").Router();
const {
  createPost,
  createReplyPost,
  likePost,
  getUserPosts,
  deletePost,
  getPostWithRelations,
} = require("../Controllers/Post");
const { UserAuth } = require("../Middlewares/UserAuth");

router.post("/", UserAuth, createPost);
router.post("/reply", UserAuth, createReplyPost);
router.put("/like", UserAuth, likePost);
router.get("/:userId", getUserPosts);
router.get("/:userId/p/:postId", getPostWithRelations);
router.delete("/:postId", UserAuth, deletePost);

module.exports = router;
