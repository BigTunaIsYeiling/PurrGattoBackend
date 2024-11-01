const router = require("express").Router();
const {
  createPost,
  createReplyPost,
  likePost,
  getUserPosts,
  DeletePost,
} = require("../Controllers/Post");
const { UserAuth } = require("../Middlewares/UserAuth");

router.post("/", UserAuth, createPost);
router.post("/reply", UserAuth, createReplyPost);
router.put("/like", UserAuth, likePost);
router.get("/:userId", getUserPosts);
router.delete("/:postId", UserAuth, DeletePost);

module.exports = router;
