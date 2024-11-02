const router = require("express").Router();
const {
  createPost,
  createReplyPost,
  likePost,
  getUserPosts,
  DeletePost,
  getPostWithRelations,
} = require("../Controllers/Post");
const { UserAuth } = require("../Middlewares/UserAuth");

router.post("/", UserAuth, createPost);
router.post("/reply", UserAuth, createReplyPost);
router.put("/like", UserAuth, likePost);
router.get("/:userId", getUserPosts);
router.delete("/:postId", UserAuth, DeletePost);
router.get("/p/:postId", getPostWithRelations);

module.exports = router;
