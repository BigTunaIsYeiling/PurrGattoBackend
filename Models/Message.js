const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isAnswered: {
      type: Boolean,
      default: false,
    },
    replyToPost: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
