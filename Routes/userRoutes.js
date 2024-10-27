const router = require("express").Router();
const { register, login, logout, getUserData } = require("../Controllers/User");
const {
  Validate,
  ValidateRegister,
} = require("../Middlewares/InputsValidations");

const { UserAuth } = require("../Middlewares/UserAuth");

router.post("/", ValidateRegister, Validate, register);
router.post("/login", ValidateRegister, Validate, login);
router.get("/", UserAuth, getUserData);
router.get("/logout", UserAuth, logout);

module.exports = router;
