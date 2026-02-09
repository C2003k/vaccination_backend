import mongoose from "mongoose";

const vaccineStockSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    vaccine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vaccine",
      required: true,
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ["vials", "doses", "boxes"],
      default: "vials",
    },
    minimumStock: {
      type: Number,
      required: true,
      min: 0,
    },
    maximumStock: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["adequate", "low", "critical", "out_of_stock"],
      default: "adequate",
    },
    daysOfSupply: {
      type: Number,
      default: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    supplier: {
      type: String,
      trim: true,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    usageRate: {
      type: Number, // doses per day
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
vaccineStockSchema.index({ hospital: 1, vaccine: 1 });
vaccineStockSchema.index({ expiryDate: 1 });
vaccineStockSchema.index({ status: 1 });

export default mongoose.model("VaccineStock", vaccineStockSchema);
