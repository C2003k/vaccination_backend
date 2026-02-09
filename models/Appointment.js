import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
    },
    mother: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vaccine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vaccine",
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["vaccination", "routine_check", "follow_up", "consultation"],
      default: "vaccination",
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "completed", "cancelled", "no_show"],
      default: "scheduled",
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    duration: {
      type: Number, // in minutes
      default: 30,
    },
    notes: {
      type: String,
      trim: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    outcome: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
appointmentSchema.index({ hospital: 1, scheduledDate: 1 });
appointmentSchema.index({ mother: 1, scheduledDate: 1 });
appointmentSchema.index({ status: 1, scheduledDate: 1 });

export default mongoose.model("Appointment", appointmentSchema);
