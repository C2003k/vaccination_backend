import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES } from "../config/roles.js";

/**
 * User Schema definition
 */
const userSchema = new mongoose.Schema(
  {
    // Personal Information
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
        },
        message: "Please enter a valid email",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },

    // Role and Permissions
    role: {
      type: String,
      required: true,
      enum: {
        values: Object.values(ROLES),
        message: "Role must be one of: " + Object.values(ROLES).join(", "),
      },
    },

    // Contact Information (required for mothers)
    phone: {
      type: String,
      sparse: true, // Allows multiple nulls but enforces uniqueness for non-null
      validate: {
        validator: function (phone) {
          if (!phone) return true; // Optional for some roles
          return /^254\d{9}$/.test(phone);
        },
        message: "Phone must be in format 254712345678",
      },
    },

    // Health Worker Assignment (for mothers)
    assignedCHW: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },

    // Hospital Affiliation (for hospital_staff)
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      sparse: true,
    },

    // Location Information (required for mothers)
    county: {
      type: String,
      default: "Kitui County",
    },
    subCounty: {
      type: String,
      sparse: true,
    },
    ward: {
      type: String,
      sparse: true,
    },
    location: {
      type: String,
      sparse: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Reminder preferences (primarily for mothers)
    reminderPreferences: {
      smsReminders: {
        type: Boolean,
        default: true,
      },
      phoneReminders: {
        type: Boolean,
        default: false,
      },
      daysBefore: {
        type: [Number],
        default: [7, 3, 1],
      },
      timeOfDay: {
        type: String,
        default: "09:00",
      },
      language: {
        type: String,
        default: "english",
      },
    },

    // Timestamps
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for children (for mother role)
userSchema.virtual("children", {
  ref: "Child",
  localField: "_id",
  foreignField: "parent",
});

/**
 * Pre-save middleware to hash password
 */
userSchema.pre("save", async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified("password")) return next();

  try {
    // Trim the password before hashing
    this.password = this.password.trim();

    // Hash password with salt rounds
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS));
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password method
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} True if passwords match
 */
// In your User model, find the comparePassword method:
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // Add validation to ensure both passwords exist
    if (!candidatePassword || !this.password) {
      return false;
    }

    // Ensure candidatePassword is a string
    const passwordToCompare = String(candidatePassword).trim();

    return await bcrypt.compare(passwordToCompare, this.password);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
};

/**
 * Check if user is mother role
 * @returns {boolean} True if user is mother
 */
userSchema.methods.isMother = function () {
  return this.role === ROLES.MOTHER;
};

/**
 * Check if user is health worker
 * @returns {boolean} True if user is health worker
 */
userSchema.methods.isHealthWorker = function () {
  return this.role === ROLES.HEALTH_WORKER;
};

userSchema.methods.isHospitalStaff = function () {
  return this.role === ROLES.HOSPITAL_STAFF;
};

/**
 * Check if user is admin
 * @returns {boolean} True if user is admin
 */
userSchema.methods.isAdmin = function () {
  return this.role === ROLES.ADMIN;
};

export default mongoose.model("User", userSchema);
