import mongoose from "mongoose";

const fieldReportSchema = new mongoose.Schema(
  {
    healthWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportDate: {
      type: Date,
      required: true,
    },
    location: {
      subCounty: {
        type: String,
        required: true,
      },
      ward: {
        type: String,
        required: true,
      },
      village: {
        type: String,
        required: true,
      },
    },
    activities: {
      mothersVisited: {
        type: Number,
        default: 0,
        min: 0,
      },
      vaccinationsGiven: {
        type: Number,
        default: 0,
        min: 0,
      },
      followUps: {
        type: Number,
        default: 0,
        min: 0,
      },
      newRegistrations: {
        type: Number,
        default: 0,
        min: 0,
      },
      defaultersContacted: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    challenges: {
      type: String,
      trim: true,
    },
    achievements: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    nextDayPlan: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved"],
      default: "submitted",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
fieldReportSchema.index({ healthWorker: 1, reportDate: 1 });
fieldReportSchema.index({ reportDate: 1, location: 1 });

export default mongoose.model("FieldReport", fieldReportSchema);
