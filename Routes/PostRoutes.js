const router = require("express").Router();
const { createPost, likePost, getUserPosts } = require("../Controllers/Post");
const { UserAuth } = require("../Middlewares/UserAuth");

router.post("/", UserAuth, createPost);
router.put("/", UserAuth, likePost);
router.get("/:userId", getUserPosts);

module.exports = router;
