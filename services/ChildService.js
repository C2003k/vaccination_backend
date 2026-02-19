import {
  findAllChildren,
  findChildById,
  createNewChild,
  updateExistingChild,
  deleteExistingChild,
  findChildrenByParentId,
  findChildrenByAgeRange,
  createGrowthRecord,
  findGrowthRecordsByChildId,
} from "../repositories/ChildRepository.js";
import { findUserById } from "../repositories/UserRepository.js";
import { ROLES } from "../config/roles.js";

/**
 * Child Service - Handles child business logic
 */

/**
 * Get all children with optional filters
 * @param {Object} filters - Filter criteria
 * @returns {Array} List of children
 */
export const getAllChildren = async (filters = {}) => {
  const children = await findAllChildren(filters);
  return children;
};

/**
 * Get child by ID
 * @param {string} childId - Child ID
 * @returns {Object} Child object
 */
export const getChildById = async (childId) => {
  const child = await findChildById(childId);
  if (!child) {
    throw new Error("Child not found");
  }
  return child;
};

/**
 * Get children by parent ID
 * @param {string} parentId - Parent user ID
 * @returns {Array} List of children
 */
export const getChildrenByParentId = async (parentId) => {
  const parent = await findUserById(parentId);
  if (!parent) {
    throw new Error("Parent not found");
  }

  if (parent.role !== ROLES.MOTHER) {
    throw new Error("Only mothers can have children records");
  }

  return await findChildrenByParentId(parentId);
};

/**
 * Create new child
 * @param {Object} childData - Child data
 * @param {string} parentId - Parent user ID
 * @returns {Object} Created child
 */
export const createChild = async (childData, parentId) => {
  const {
    name,
    dateOfBirth,
    gender,
    birthWeight,
    birthHeight,
    allergies,
    specialNeeds,
  } = childData;

  // Validate required fields
  if (!name || !dateOfBirth || !gender) {
    throw new Error("Name, date of birth, and gender are required");
  }

  // Validate parent exists and is a mother
  const parent = await findUserById(parentId);
  if (!parent) {
    throw new Error("Parent not found");
  }

  if (parent.role !== ROLES.MOTHER) {
    throw new Error("Only mothers can create child records");
  }

  // Validate date of birth is not in future
  const dob = new Date(dateOfBirth);
  if (dob > new Date()) {
    throw new Error("Date of birth cannot be in the future");
  }

  // Create child
  const child = await createNewChild({
    parent: parentId,
    name: name.trim(),
    dateOfBirth: dob,
    gender,
    birthWeight,
    birthHeight,
    allergies: allergies || [],
    specialNeeds,
  });

  return child;
};

/**
 * Update existing child
 * @param {string} childId - Child ID
 * @param {Object} childData - Updated child data
 * @param {string} userId - User ID making the request
 * @returns {Object} Updated child
 */
export const updateChild = async (childId, childData, userId) => {
  const child = await findChildById(childId);
  if (!child) {
    throw new Error("Child not found");
  }

  // Check if user is the parent or has appropriate permissions
  if (child.parent.toString() !== userId) {
    throw new Error("Not authorized to update this child record");
  }

  // Validate date of birth if provided
  if (childData.dateOfBirth) {
    const dob = new Date(childData.dateOfBirth);
    if (dob > new Date()) {
      throw new Error("Date of birth cannot be in the future");
    }
    childData.dateOfBirth = dob;
  }

  const updatedChild = await updateExistingChild(childId, childData);
  return updatedChild;
};

/**
 * Delete child
 * @param {string} childId - Child ID to delete
 * @param {string} userId - User ID making the request
 * @returns {Object} Deletion result
 */
export const deleteChild = async (childId, userId) => {
  const child = await findChildById(childId);
  if (!child) {
    throw new Error("Child not found");
  }

  // Check if user is the parent
  if (child.parent.toString() !== userId) {
    throw new Error("Not authorized to delete this child record");
  }

  await deleteExistingChild(childId);
  return { message: "Child deleted successfully" };
};

/**
 * Get children by age range
 * @param {number} minMonths - Minimum age in months
 * @param {number} maxMonths - Maximum age in months
 * @returns {Array} List of children in age range
 */
export const getChildrenByAgeRange = async (minMonths, maxMonths) => {
  if (minMonths < 0 || maxMonths < 0 || minMonths > maxMonths) {
    throw new Error("Invalid age range parameters");
  }

  return await findChildrenByAgeRange(minMonths, maxMonths);
};

/**
 * Add growth record for a child
 * @param {string} childId - Child ID
 * @param {Object} growthData - Growth data (weight, height, etc.)
 * @param {string} userId - User ID (mother or health worker)
 * @returns {Object} Created growth record
 */
export const addGrowthRecord = async (childId, growthData, userId) => {
  const child = await findChildById(childId);
  if (!child) {
    throw new Error("Child not found");
  }

  // Calculate age in months at time of recording if not provided
  // For simplicity, we calculate current age if dateRecorded is close to now
  // Real implementation might be more complex
  const today = new Date();
  const birthDate = new Date(child.dateOfBirth);
  const ageInMonths =
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    (today.getMonth() - birthDate.getMonth());

  return await createGrowthRecord({
    ...growthData,
    child: childId,
    ageInMonths,
    recordedBy: userId,
  });
};

/**
 * Get growth history for a child
 * @param {string} childId - Child ID
 * @returns {Array} List of growth records
 */
export const getGrowthHistory = async (childId) => {
  const child = await findChildById(childId);
  if (!child) {
    throw new Error("Child not found");
  }

  return await findGrowthRecordsByChildId(childId);
};
