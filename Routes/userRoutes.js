const router = require("express").Router();
const {
  register,
  login,
  logout,
  getUserData,
  RefreshToken,
  GetUsersList,
  UpdateUser,
} = require("../Controllers/User");
const upload = require("../Middlewares/UploadMulter");
const {
  Validate,
  ValidateRegister,
} = require("../Middlewares/InputsValidations");

const { UserAuth } = require("../Middlewares/UserAuth");

router.post("/", ValidateRegister, Validate, register);
router.post("/login", ValidateRegister, Validate, login);
router.get("/", UserAuth, getUserData);
router.put("/", UserAuth, upload.single("avatar"), UpdateUser);
router.get("/users", UserAuth, GetUsersList);
router.get("/refresh", UserAuth, RefreshToken);
router.get("/logout", UserAuth, logout);

module.exports = router;
