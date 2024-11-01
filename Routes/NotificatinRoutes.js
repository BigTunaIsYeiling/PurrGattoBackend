const route = require("express").Router();
const {
  getNotifications,
  markAllAsRead,
  deleteNoti,
} = require("../Controllers/Notification");

const { UserAuth } = require("../Middlewares/UserAuth");

route.get("/", UserAuth, getNotifications);
route.get("/Read", UserAuth, markAllAsRead);
route.delete("/:id", UserAuth, deleteNoti);

module.exports = route;
