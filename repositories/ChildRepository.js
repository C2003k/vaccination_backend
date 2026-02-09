import Child from "../models/Child.js";

/**
 * Child Repository - Data access layer for Child model
 */

// Find all children with optional filtering
export const findAllChildren = async (filter = {}, fieldsToExclude = {}) => {
  try {
    return await Child.find(filter, fieldsToExclude).populate("parent");
  } catch (error) {
    throw new Error(`Error finding children: ${error.message}`);
  }
};

// Find child by ID
export const findChildById = async (childId, fieldsToExclude = {}) => {
  try {
    return await Child.findById(childId, fieldsToExclude).populate("parent");
  } catch (error) {
    throw new Error(`Error finding child by ID: ${error.message}`);
  }
};

// Find children by parent ID
export const findChildrenByParentId = async (
  parentId,
  fieldsToExclude = {}
) => {
  try {
    return await Child.find({ parent: parentId }, fieldsToExclude);
  } catch (error) {
    throw new Error(`Error finding children by parent: ${error.message}`);
  }
};

// Create new child
export const createNewChild = async (childData) => {
  try {
    const child = new Child(childData);
    return await child.save();
  } catch (error) {
    throw new Error(`Error creating child: ${error.message}`);
  }
};

// Update existing child
export const updateExistingChild = async (childId, updateData) => {
  try {
    return await Child.findByIdAndUpdate(childId, updateData, {
      new: true,
      runValidators: true,
    }).populate("parent");
  } catch (error) {
    throw new Error(`Error updating child: ${error.message}`);
  }
};

// Delete child
export const deleteExistingChild = async (childId) => {
  try {
    return await Child.findByIdAndDelete(childId);
  } catch (error) {
    throw new Error(`Error deleting child: ${error.message}`);
  }
};

// Find children by age range
export const findChildrenByAgeRange = async (minMonths, maxMonths) => {
  try {
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() - maxMonths);

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() - minMonths);

    return await Child.find({
      dateOfBirth: { $gte: minDate, $lte: maxDate },
    }).populate("parent");
  } catch (error) {
    throw new Error(`Error finding children by age range: ${error.message}`);
  }
};
