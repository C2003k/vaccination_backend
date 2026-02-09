import mongoose from "mongoose";

const systemLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["info", "warning", "error", "critical"],
      default: "info",
    },
    module: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    duration: {
      type: Number, // in milliseconds
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index({ module: 1, level: 1 });
systemLogSchema.index({ user: 1 });

export default mongoose.model("SystemLog", systemLogSchema);
