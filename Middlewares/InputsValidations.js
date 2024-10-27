const { check, validationResult } = require("express-validator");
const User = require("../Models/User");
const validations = {
  ValidateRegister: [
    check("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    check("password")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  Validate: async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array().map((e) => e.msg) });
    }
    next();
  },
};

module.exports = validations;
