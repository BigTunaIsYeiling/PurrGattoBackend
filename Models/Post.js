const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    PostBody: {
      type: String,
      required: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    Author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    parentPost: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", PostSchema);
