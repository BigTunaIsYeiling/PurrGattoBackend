const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReplySchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    originalMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // Null if anonymous
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Reply", ReplySchema);
