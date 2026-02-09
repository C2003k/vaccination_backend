import bcrypt from "bcryptjs";
import {
  findAllUsers,
  findUserById,
  updateExistingUser,
  deleteExistingUser,
  findUserByEmail,
  findUserByUsername,
  findUserByPhoneNumber,
  findUsersByRole,
} from "../repositories/UserRepository.js";
import {
  createNewChild,
  findChildrenByParentId,
} from "../repositories/ChildRepository.js";
import { ROLES } from "../config/roles.js";

/**
 * User Service - Handles user business logic
 */

// Define fields to exclude from responses
const SENSITIVE_FIELDS = {
  password: 0,
  __v: 0,
};

/**
 * Sanitize user data by removing sensitive fields
 * @param {Object} user - User object to sanitize
 * @returns {Object} Sanitized user object
 */
const sanitizeUser = (user) => {
  if (!user) return null;

  const userObj = user.toObject ? user.toObject() : user;
  const { password, __v, ...safeUser } = userObj;
  return safeUser;
};

/**
 * Get all users
 * @returns {Array} List of sanitized users
 */
export const getAllUsers = async () => {
  const users = await findAllUsers(SENSITIVE_FIELDS);
  return users.map(sanitizeUser);
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object} Sanitized user object
 */
export const getUserById = async (userId) => {
  const user = await findUserById(userId, SENSITIVE_FIELDS);
  return sanitizeUser(user);
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Object} Created user
 */
export const createNewUser = async (userData) => {
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

  // Validate required fields
  if (!name || !username || !email || !password || !role) {
    throw new Error(
      "All fields (name, username, email, password, role) are required."
    );
  }

  // Validate email format
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please provide a valid email address");
  }

  // Validate password length
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  // Check for existing users
  const existingUserByEmail = await findUserByEmail(email);
  if (existingUserByEmail) {
    throw new Error("User with this email already exists");
  }

  const existingUserByUsername = await findUserByUsername(username);
  if (existingUserByUsername) {
    throw new Error("User with this username already exists");
  }

  // Validate role
  if (!Object.values(ROLES).includes(role)) {
    throw new Error("Invalid role provided");
  }

  // Additional validation for mother role
  if (role === ROLES.MOTHER) {
    if (!phone || !subCounty || !ward || !location) {
      throw new Error(
        "Phone, sub-county, ward, and location are required for mother role"
      );
    }

    // Validate phone format for Kenya
    const phoneRegex = /^254\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error("Phone must be in format 254712345678");
    }
  }

  // Create user (password hashing is handled in User model)
  const user = await createNewUser({
    name: name.trim(),
    username: username.toLowerCase().trim(),
    email: email.toLowerCase().trim(),
    password,
    role,
    phone: role === ROLES.MOTHER ? phone : undefined,
    subCounty: role === ROLES.MOTHER ? subCounty : undefined,
    ward: role === ROLES.MOTHER ? ward : undefined,
    location: role === ROLES.MOTHER ? location : undefined,
  });

  // Create children if mother role and children provided
  if (role === ROLES.MOTHER && children && children.length > 0) {
    const childPromises = children.map((childData) =>
      createNewChild({
        parent: user._id,
        name: childData.name,
        dateOfBirth: childData.dateOfBirth,
        gender: childData.gender,
      })
    );
    await Promise.all(childPromises);
  }

  return sanitizeUser(user);
};

/**
 * Update existing user
 * @param {string} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Object} Updated user
 */
export const updateUser = async (userId, userData) => {
  // Create a copy and remove sensitive fields that shouldn't be updated directly
  const updateData = { ...userData };
  delete updateData.password; // Password updates should use separate endpoint

  // Validate email if provided
  if (updateData.email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(updateData.email)) {
      throw new Error("Please provide a valid email address");
    }

    const existingUser = await findUserByEmail(updateData.email);
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error("User with this email already exists");
    }
    updateData.email = updateData.email.toLowerCase();
  }

  // Validate username if provided
  if (updateData.username) {
    const existingUser = await findUserByUsername(updateData.username);
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error("User with this username already exists");
    }
    updateData.username = updateData.username.toLowerCase();
  }

  // Validate phone if provided
  if (updateData.phone) {
    const phoneRegex = /^254\d{9}$/;
    if (!phoneRegex.test(updateData.phone)) {
      throw new Error("Phone must be in format 254712345678");
    }

    const existingUser = await findUserByPhoneNumber(updateData.phone);
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new Error("User with this phone number already exists");
    }
  }

  const updatedUser = await updateExistingUser(userId, updateData);
  if (!updatedUser) {
    throw new Error("User not found");
  }

  return sanitizeUser(updatedUser);
};

/**
 * Delete user
 * @param {string} userId - User ID to delete
 * @returns {Object} Deletion result
 */
export const deleteUser = async (userId) => {
  const deletedUser = await deleteExistingUser(userId);
  if (!deletedUser) {
    throw new Error("User not found");
  }
  return { message: "User deleted successfully" };
};

/**
 * Get users by role
 * @param {string} role - User role to filter by
 * @returns {Array} List of users with specified role
 */
export const getUsersByRole = async (role) => {
  if (!Object.values(ROLES).includes(role)) {
    throw new Error("Invalid role provided");
  }

  const users = await findUsersByRole(role, SENSITIVE_FIELDS);
  return users.map(sanitizeUser);
};

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} Update result
 */
export const updateUserPassword = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  // Validate new password
  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long");
  }

  // Update password (hashing is handled in model pre-save middleware)
  user.password = newPassword;
  await user.save();

  return { message: "Password updated successfully" };
};
