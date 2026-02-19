import mongoose from "mongoose";

const growthRecordSchema = new mongoose.Schema(
    {
        child: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Child",
            required: true,
        },
        dateRecorded: {
            type: Date,
            required: true,
            default: Date.now,
        },
        ageInMonths: {
            type: Number,
            required: true,
        },
        weight: {
            type: Number, // in kg
            required: true,
            min: 0,
        },
        height: {
            type: Number, // in cm
            required: true,
            min: 0,
        },
        headCircumference: {
            type: Number, // in cm
        },
        notes: {
            type: String,
            trim: true,
        },
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Could be health worker or mother
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
growthRecordSchema.index({ child: 1, dateRecorded: -1 });

export default mongoose.model("GrowthRecord", growthRecordSchema);
