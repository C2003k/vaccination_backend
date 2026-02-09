import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    mother: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
    },
    vaccine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vaccine",
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    reminderType: {
      type: String,
      enum: ["upcoming", "overdue", "defaulter"],
      required: true,
    },
    daysOverdue: {
      type: Number,
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    status: {
      type: String,
      enum: ["pending", "sent", "acknowledged", "action_taken"],
      default: "pending",
    },
    sentAt: {
      type: Date,
    },
    acknowledgedAt: {
      type: Date,
    },
    message: {
      type: String,
      required: true,
    },
    communicationChannel: {
      type: String,
      enum: ["sms", "whatsapp", "in_app", "phone_call"],
      default: "sms",
    },
    followUpActions: [
      {
        action: String,
        date: Date,
        healthWorker: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        outcome: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
reminderSchema.index({ mother: 1, dueDate: 1 });
reminderSchema.index({ status: 1, riskLevel: 1 });
reminderSchema.index({ child: 1, vaccine: 1 });

export default mongoose.model("Reminder", reminderSchema);
