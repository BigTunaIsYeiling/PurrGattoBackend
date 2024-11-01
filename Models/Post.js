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
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Reply",
      },
    ],
  },
  {
    timestamps: true,
  }
);
