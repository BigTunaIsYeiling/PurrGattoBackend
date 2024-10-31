const router = require("express").Router();
const { GetUserMessages, createMessage } = require("../Controllers/Message");
const { UserAuth } = require("../Middlewares/UserAuth");

router.post("/", createMessage);
router.get("/", UserAuth, GetUserMessages);

module.exports = router;
