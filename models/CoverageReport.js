import mongoose from "mongoose";

const coverageReportSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    period: {
      month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        required: true,
      },
      quarter: {
        type: Number,
        min: 1,
        max: 4,
      },
    },
    coverageData: [
      {
        vaccine: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vaccine",
          required: true,
        },
        target: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        actual: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        gap: {
          type: Number,
          default: 0,
        },
        trend: {
          type: String,
          enum: ["up", "down", "stable"],
          default: "stable",
        },
        status: {
          type: String,
          enum: ["on_target", "near_target", "off_target"],
          default: "off_target",
        },
        vaccinationsGiven: {
          type: Number,
          default: 0,
        },
        eligibleChildren: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalCoverage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalVaccinations: {
      type: Number,
      default: 0,
    },
    totalEligible: {
      type: Number,
      default: 0,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isFinal: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
coverageReportSchema.index({ hospital: 1, period: 1 });
coverageReportSchema.index({ period: 1 });

export default mongoose.model("CoverageReport", coverageReportSchema);
