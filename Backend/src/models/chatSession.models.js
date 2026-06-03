import mongoose, { Schema } from "mongoose";

const chatSessionSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    // Flexible mixed array to natively preserve the Gemini chat history structure,
    // including text messages, function calls, and function responses.
    history: {
      type: [Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// TTL Index: Auto-delete chat sessions after 30 days of inactivity (updatedAt + 30 days)
chatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
