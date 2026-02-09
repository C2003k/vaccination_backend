import User from "../models/User.js";

/**
 * User Repository - Data access layer for User model
 */

// Find all users with optional field selection
export const findAllUsers = async (fieldsToExclude = {}) => {
  try {
    return await User.find({}, fieldsToExclude).populate("children");
  } catch (error) {
    throw new Error(`Error finding users: ${error.message}`);
  }
};

// Find user by ID with optional field selection
export const findUserById = async (userId, fieldsToExclude = {}) => {
  try {
    return await User.findById(userId, fieldsToExclude).populate("children");
  } catch (error) {
    throw new Error(`Error finding user by ID: ${error.message}`);
  }
};

// Find user by phone number
export const findUserByPhoneNumber = async (phoneNumber) => {
  try {
    return await User.findOne({ phone: phoneNumber });
  } catch (error) {
    throw new Error(`Error finding user by phone number: ${error.message}`);
  }
};

// Add new user
export const addNewUser = async (userData) => {
  try {
    const user = new User(userData);
    return await user.save();
  } catch (error) {
    throw new Error(`Error creating user: ${error.message}`);
  }
};

// Update existing user
export const updateExistingUser = async (userId, updateData) => {
  try {
    return await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).populate("children");
  } catch (error) {
    throw new Error(`Error updating user: ${error.message}`);
  }
};

// Delete user
export const deleteExistingUser = async (userId) => {
  try {
    return await User.findByIdAndDelete(userId);
  } catch (error) {
    throw new Error(`Error deleting user: ${error.message}`);
  }
};

// Find users by role
export const findUsersByRole = async (role, fieldsToExclude = {}) => {
  try {
    return await User.find({ role }, fieldsToExclude).populate("children");
  } catch (error) {
    throw new Error(`Error finding users by role: ${error.message}`);
  }
};

// Update user last login
export const updateUserLastLogin = async (userId) => {
  try {
    return await User.findByIdAndUpdate(
      userId,
      { lastLogin: new Date() },
      { new: true }
    );
  } catch (error) {
    throw new Error(`Error updating last login: ${error.message}`);
  }
};

// Find user by email (with password for login)
export const findUserByEmail = async (email) => {
  try {
    return await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    ); // IMPORTANT: Include password field
  } catch (error) {
    throw new Error(`Error finding user by email: ${error.message}`);
  }
};

// Find user by username (with password for login)
export const findUserByUsername = async (username) => {
  try {
    return await User.findOne({ username: username.toLowerCase() }).select(
      "+password"
    ); // IMPORTANT: Include password field
  } catch (error) {
    throw new Error(`Error finding user by username: ${error.message}`);
  }
};

// Find user by email without password (for general use)
export const findUserByEmailWithoutPassword = async (email) => {
  try {
    return await User.findOne({ email: email.toLowerCase() });
  } catch (error) {
    throw new Error(`Error finding user by email: ${error.message}`);
  }
};

// Find user by username without password (for general use)
export const findUserByUsernameWithoutPassword = async (username) => {
  try {
    return await User.findOne({ username: username.toLowerCase() });
  } catch (error) {
    throw new Error(`Error finding user by username: ${error.message}`);
  }
};
