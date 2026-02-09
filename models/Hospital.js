import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "national_referral",
        "county",
        "sub_county",
        "health_center",
        "clinic",
      ],
      required: true,
    },
    facilityLevel: {
      type: String,
      enum: ["level_6", "level_5", "level_4", "level_3", "level_2"],
      required: true,
    },
    contact: {
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    location: {
      county: {
        type: String,
        required: true,
      },
      subCounty: {
        type: String,
        required: true,
      },
      ward: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    staff: {
      medical: {
        type: Number,
        default: 0,
      },
      nursing: {
        type: Number,
        default: 0,
      },
      support: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
    capacity: {
      beds: {
        type: Number,
        default: 0,
      },
      vaccinationStations: {
        type: Number,
        default: 1,
      },
      storageCapacity: {
        type: String,
        enum: ["small", "medium", "large", "x_large"],
      },
    },
    coverage: {
      target: {
        type: Number,
        default: 90,
      },
      current: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    adminUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
hospitalSchema.index({ location: 1 });
hospitalSchema.index({ type: 1 });
hospitalSchema.index({ isActive: 1 });

export default mongoose.model("Hospital", hospitalSchema);
