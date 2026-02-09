import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    healthWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mother: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
    },
    type: {
      type: String,
      enum: [
        "home_visit",
        "facility_visit",
        "follow_up",
        "vaccination",
        "routine_check",
      ],
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
    duration: {
      type: Number, // in minutes
      default: 30,
    },
    location: {
      subCounty: String,
      ward: String,
      village: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    purpose: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled", "no_show"],
      default: "scheduled",
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    outcome: {
      type: String,
      trim: true,
    },
    vaccinesAdministered: [
      {
        vaccine: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vaccine",
        },
        batchNumber: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
scheduleSchema.index({ healthWorker: 1, scheduledDate: 1 });
scheduleSchema.index({ mother: 1, scheduledDate: 1 });
scheduleSchema.index({ status: 1, scheduledDate: 1 });
scheduleSchema.index({ priority: 1, scheduledDate: 1 });

export default mongoose.model("Schedule", scheduleSchema);
