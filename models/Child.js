import mongoose from "mongoose";

/**
 * Child Schema definition
 */
const childSchema = new mongoose.Schema(
  {
    // Parent reference
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Child information
    name: {
      type: String,
      required: [true, "Child name is required"],
      trim: true,
      maxlength: [100, "Child name cannot exceed 100 characters"],
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (dob) {
          return dob <= new Date();
        },
        message: "Date of birth cannot be in the future",
      },
    },
    gender: {
      type: String,
      required: true,
      enum: {
        values: ["male", "female", "other"],
        message: "Gender must be male, female, or other",
      },
    },

    // Medical information
    birthWeight: {
      type: Number,
      min: [0.5, "Birth weight seems too low"],
      max: [6, "Birth weight seems too high"],
    },
    birthHeight: {
      type: Number,
      min: [30, "Birth height seems too low"],
      max: [70, "Birth height seems too high"],
    },

    // Vaccination tracking
    vaccinationStatus: {
      type: String,
      enum: ["up-to-date", "behind", "not-started"],
      default: "not-started",
    },

    // Additional information
    allergies: [
      {
        type: String,
        trim: true,
      },
    ],
    specialNeeds: {
      type: String,
      maxlength: [500, "Special needs description too long"],
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for age calculation
childSchema.virtual("ageInMonths").get(function () {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  const months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  return months + (today.getMonth() - birthDate.getMonth());
});

// Index for efficient queries
childSchema.index({ parent: 1, dateOfBirth: 1 });
childSchema.index({ name: 1 });

export default mongoose.model("Child", childSchema);
