const asyncHandler = require("express-async-handler");
const { verify } = require("jsonwebtoken");
exports.UserAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
});
