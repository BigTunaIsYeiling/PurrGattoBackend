const router = require("express").Router();
const {
  createPost,
  likePost,
  getUserPosts,
  DeletePost,
} = require("../Controllers/Post");
const { UserAuth } = require("../Middlewares/UserAuth");

router.post("/", UserAuth, createPost);
router.put("/like", UserAuth, likePost);
router.get("/:userId", getUserPosts);
router.delete("/:postId", UserAuth, DeletePost);

module.exports = router;
