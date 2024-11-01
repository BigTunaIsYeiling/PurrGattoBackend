const route = require("express").Router();

const {
  getNotifications,
  markAllAsRead,
  deleteNoti,
} = require("../Controllers/Notification");

const { UserAuth } = require("../Middlewares/UserAuth");

route.get("/", UserAuth, getNotifications);
route.put("/", UserAuth, markAllAsRead);
route.delete("/:id", UserAuth, deleteNoti);

module.exports = route;
