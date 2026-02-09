import mongoose from "mongoose";

const vaccinationRecordSchema = new mongoose.Schema(
  {
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
    doseSequence: {
      type: Number,
      required: true,
      min: 1,
    },
    dateGiven: {
      type: Date,
      required: true,
    },
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    healthFacility: {
      type: String,
      trim: true,
    },
    location: {
      subCounty: String,
      ward: String,
      village: String,
    },
    nextDueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["completed", "scheduled", "missed"],
      default: "completed",
    },
    notes: {
      type: String,
      trim: true,
    },
    adverseReactions: {
      type: String,
      trim: true,
    },
    weightAtVaccination: {
      type: Number,
    },
    heightAtVaccination: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
vaccinationRecordSchema.index({ child: 1, vaccine: 1, doseSequence: 1 });
vaccinationRecordSchema.index({ dateGiven: 1 });
vaccinationRecordSchema.index({ givenBy: 1 });

export default mongoose.model("VaccinationRecord", vaccinationRecordSchema);
