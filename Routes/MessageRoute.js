const router = require("express").Router();
const {
  GetUserMessages,
  createMessage,
  DeleteMessage,
} = require("../Controllers/Message");
const { UserAuth } = require("../Middlewares/UserAuth");

router.post("/", createMessage);
router.get("/", UserAuth, GetUserMessages);
router.delete("/", UserAuth, DeleteMessage);

module.exports = router;
