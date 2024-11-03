const router = require("express").Router();
const passport = require("passport");
const upload = require("../Middlewares/UploadMulter");
const {
  register,
  login,
  logout,
  getUserData,
  RefreshToken,
  GetUsersList,
  UpdateUser,
  handleTwitterAuth,
  getUserByid,
  DeleteUser
} = require("../Controllers/User");
const {
  Validate,
  ValidateRegister,
} = require("../Middlewares/InputsValidations");

const { UserAuth } = require("../Middlewares/UserAuth");

router.post("/", ValidateRegister, Validate, register);
router.post("/login", ValidateRegister, Validate, login);
router.get("/", UserAuth, getUserData);
router.get("/one/:id", getUserByid);
router.put("/", UserAuth, upload.single("avatar"), UpdateUser);
router.get("/users", UserAuth, GetUsersList);
router.get("/refresh", UserAuth, RefreshToken);
router.get("/logout", UserAuth, logout);
router.delete("/", UserAuth, DeleteUser);

router.get("/auth/twitter", passport.authenticate("twitter"));
router.get(
  "/auth/twitter/callback",
  passport.authenticate("twitter", { failureRedirect: "/login" }),
  handleTwitterAuth
);

module.exports = router;
