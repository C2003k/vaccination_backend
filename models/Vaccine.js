import mongoose from "mongoose";

const vaccineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    protectsAgainst: {
      type: [String],
      required: true,
    },
    dueAtBirth: {
      type: Boolean,
      default: false,
    },
    recommendedAge: {
      months: {
        type: Number,
        required: true,
      },
      weeks: {
        type: Number,
        default: 0,
      },
    },
    dosage: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      enum: ["Oral", "Intramuscular", "Subcutaneous", "Intradermal"],
      required: true,
    },
    site: {
      type: String,
      trim: true,
    },
    boosterDoses: [
      {
        sequence: Number,
        recommendedAge: {
          months: Number,
          weeks: Number,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
// vaccineSchema.index({ code: 1 }); // Removed duplicate index
vaccineSchema.index({ isActive: 1 });

export default mongoose.model("Vaccine", vaccineSchema);
