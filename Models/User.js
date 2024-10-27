const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    TwitterId: {
      type: String,
    },
    password: {
      type: String,
    },
    bio: {
      type: String,
      default: "Hello, I'm a new user!",
    },
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/drsodrtuf/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_10px_solid_white,b_rgb:262c35/v1729339258/a_sleek_minimalist_cat_face_without_squares_under_the_face_xbqyap.jpg",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
