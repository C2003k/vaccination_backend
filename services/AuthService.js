import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  findUserByEmail,
  findUserByUsername,
  updateUserLastLogin,
} from "../repositories/UserRepository.js";
import { ROLES } from "../config/roles.js";
import { addNewUser } from "../repositories/UserRepository.js";

const ACCESS_KEY = process.env.JWT_SECRET;

/**
 * Authentication Service - Handles authentication business logic
 */

/**
 * Login user with email/username and password
 * @param {Object} loginData - Login credentials
 * @returns {Object} Authentication result with success flag
 */
export const loginUser = async (loginData) => {
  const { email, password } = loginData;

  if (!email || !password) {
    return {
      success: false,
      message: "Email and password are required",
    };
  }

  try {
    // Find user by email with password included and populate hospital
    let user = await findUserByEmail(email, true); // Assuming true means populate hospital

    // If not found by email, try username with password included and populate hospital
    if (!user) {
      user = await findUserByUsername(email, true); // Assuming true means populate hospital
    }

    if (!user) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // console.log("🔍 User found for login:", {
    //   email: user.email,
    //   hasPassword: !!user.password,
    //   passwordType: typeof user.password,
    //   passwordLength: user.password ? user.password.length : 0,
    //   passwordStartsWith: user.password
    //     ? user.password.substring(0, 10)
    //     : "N/A",
    // });

    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        message: "Account has been deactivated. Please contact administrator.",
      };
    }

    // Check if user has a password hash
    if (!user.password) {
      console.error("User has no password hash:", user.email);
      return {
        success: false,
        message: "Invalid user account configuration",
      };
    }

    // Validate password input
    if (!password || typeof password !== "string" || password.trim() === "") {
      return {
        success: false,
        message: "Valid password is required",
      };
    }

    // Compare passwords with error handling
    let isMatch;
    try {
      isMatch = await user.comparePassword(password.trim());
    } catch (error) {
      console.error("Password comparison error:", error.message);
      return {
        success: false,
        message: "Authentication error",
      };
    }

    if (!isMatch) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Generate JWT access token
    const accessToken = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        iss: process.env.JWT_ISSUER || "vaccination-tracker",
      },
      ACCESS_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
    );

    // Update last login
    await updateUserLastLogin(user._id);

    // Return user data without sensitive information
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      success: true,
      data: {
        user: userResponse,
        accessToken,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Auth service error:", error);
    return {
      success: false,
      message: "Authentication service error",
    };
  }
};

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Object} Registration result with success flag
 */
export const registerUser = async (userData) => {
  const {
    name,
    username,
    email,
    password,
    role,
    phone,
    subCounty,
    ward,
    location,
    children,
  } = userData;

  try {
    // Validate required fields
    if (!name || !username || !email || !password || !role) {
      return {
        success: false,
        message: "Please provide all required fields",
      };
    }

    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      return {
        success: false,
        message: "Invalid role provided",
      };
    }

    // Check if user already exists
    const existingUserByEmail = await findUserByEmail(email);
    if (existingUserByEmail) {
      return {
        success: false,
        message: "User with this email already exists",
      };
    }

    const existingUserByUsername = await findUserByUsername(username);
    if (existingUserByUsername) {
      return {
        success: false,
        message: "User with this username already exists",
      };
    }

    // Additional validation for mother role
    if (role === ROLES.MOTHER) {
      // Check if fields exist AND are not empty strings
      if (
        !phone ||
        phone.trim() === "" ||
        !subCounty ||
        subCounty.trim() === "" ||
        !ward ||
        ward.trim() === "" ||
        !location ||
        location.trim() === ""
      ) {
        return {
          success: false,
          message:
            "Phone, sub-county, ward, and location are required for mother role",
        };
      }
    }

    // Create user - only pass location fields for mothers
    const userObj = {
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      role,
    };

    // Only add location fields for mother role
    if (role === ROLES.MOTHER) {
      userObj.phone = phone;
      userObj.subCounty = subCounty;
      userObj.ward = ward;
      userObj.location = location;
    }
    // For non-mother roles, don't add these fields at all

    const user = await addNewUser(userObj);

    // Generate token
    const accessToken = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        iss: process.env.JWT_ISSUER || "vaccination-tracker",
      },
      ACCESS_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      success: true,
      data: {
        user: userResponse,
        accessToken,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Registration service error:", error);

    // Check if error is from User model validation
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return {
        success: false,
        message: `Validation error: ${messages}`,
      };
    }

    return {
      success: false,
      message: "Error during user registration: " + error.message,
    };
  }
};

/**
 * Verify user token
 * @param {string} token - JWT token to verify
 * @returns {Object} Verification result
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, ACCESS_KEY);
    return {
      success: true,
      data: decoded,
    };
  } catch (error) {
    return {
      success: false,
      message: "Invalid or expired token",
    };
  }
};
