const { check, validationResult } = require("express-validator");
const validations = {
  ValidateRegister: [
    check("username")
      .trim() // Remove leading and trailing spaces
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long")
      .custom((value) => {
        if (/\s/.test(value)) {
          throw new Error("Username must not contain spaces");
        }
        return true;
      }),
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
