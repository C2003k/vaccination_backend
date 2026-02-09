import Vaccine from "../models/Vaccine.js";

/**
 * Vaccine Repository - Data access layer for Vaccine model
 */

/**
 * Find all vaccines with optional filtering
 * @param {Object} filter - Filter criteria
 * @param {Object} fieldsToExclude - Fields to exclude from response
 * @returns {Promise<Array>} List of vaccines
 */
export const findAllVaccines = async (filter = {}, fieldsToExclude = {}) => {
  try {
    return await Vaccine.find(filter, fieldsToExclude).sort({
      recommendedAge: 1,
    });
  } catch (error) {
    throw new Error(`Error finding vaccines: ${error.message}`);
  }
};

/**
 * Find vaccine by ID
 * @param {string} vaccineId - Vaccine ID
 * @param {Object} fieldsToExclude - Fields to exclude from response
 * @returns {Promise<Object>} Vaccine object
 */
export const findVaccineById = async (vaccineId, fieldsToExclude = {}) => {
  try {
    return await Vaccine.findById(vaccineId, fieldsToExclude);
  } catch (error) {
    throw new Error(`Error finding vaccine by ID: ${error.message}`);
  }
};

/**
 * Find vaccine by code
 * @param {string} code - Vaccine code
 * @returns {Promise<Object>} Vaccine object
 */
export const findVaccineByCode = async (code) => {
  try {
    return await Vaccine.findOne({ code: code.toUpperCase() });
  } catch (error) {
    throw new Error(`Error finding vaccine by code: ${error.message}`);
  }
};

/**
 * Find vaccines by disease they protect against
 * @param {string} disease - Disease name
 * @returns {Promise<Array>} List of vaccines
 */
export const findVaccinesByDisease = async (disease) => {
  try {
    return await Vaccine.find({
      protectsAgainst: { $regex: disease, $options: "i" },
    }).sort({ recommendedAge: 1 });
  } catch (error) {
    throw new Error(`Error finding vaccines by disease: ${error.message}`);
  }
};

/**
 * Find vaccines due at birth
 * @returns {Promise<Array>} List of birth vaccines
 */
export const findBirthVaccines = async () => {
  try {
    return await Vaccine.find({ dueAtBirth: true }).sort({ name: 1 });
  } catch (error) {
    throw new Error(`Error finding birth vaccines: ${error.message}`);
  }
};

/**
 * Find vaccines by age range
 * @param {number} minAge - Minimum age in months
 * @param {number} maxAge - Maximum age in months
 * @returns {Promise<Array>} List of vaccines in age range
 */
export const findVaccinesByAgeRange = async (minAge, maxAge) => {
  try {
    return await Vaccine.find({
      "recommendedAge.months": { $gte: minAge, $lte: maxAge },
      isActive: true,
    }).sort({ "recommendedAge.months": 1, name: 1 });
  } catch (error) {
    throw new Error(`Error finding vaccines by age range: ${error.message}`);
  }
};

/**
 * Find vaccines due for a specific age
 * @param {number} ageInMonths - Age in months
 * @returns {Promise<Array>} List of vaccines due
 */
export const findVaccinesDueAtAge = async (ageInMonths) => {
  try {
    return await Vaccine.find({
      "recommendedAge.months": ageInMonths,
      isActive: true,
    });
  } catch (error) {
    throw new Error(`Error finding vaccines due at age: ${error.message}`);
  }
};

/**
 * Find vaccines with booster doses
 * @returns {Promise<Array>} List of vaccines with boosters
 */
export const findVaccinesWithBoosters = async () => {
  try {
    return await Vaccine.find({
      boosterDoses: { $exists: true, $not: { $size: 0 } },
      isActive: true,
    });
  } catch (error) {
    throw new Error(`Error finding vaccines with boosters: ${error.message}`);
  }
};

/**
 * Find active vaccines only
 * @returns {Promise<Array>} List of active vaccines
 */
export const findActiveVaccines = async () => {
  try {
    return await Vaccine.find({ isActive: true }).sort({ recommendedAge: 1 });
  } catch (error) {
    throw new Error(`Error finding active vaccines: ${error.message}`);
  }
};

/**
 * Create new vaccine
 * @param {Object} vaccineData - Vaccine data
 * @returns {Promise<Object>} Created vaccine
 */
export const createNewVaccine = async (vaccineData) => {
  try {
    // Ensure code is uppercase
    if (vaccineData.code) {
      vaccineData.code = vaccineData.code.toUpperCase();
    }

    const vaccine = new Vaccine(vaccineData);
    return await vaccine.save();
  } catch (error) {
    throw new Error(`Error creating vaccine: ${error.message}`);
  }
};

/**
 * Update existing vaccine
 * @param {string} vaccineId - Vaccine ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated vaccine
 */
export const updateExistingVaccine = async (vaccineId, updateData) => {
  try {
    // Ensure code is uppercase if being updated
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    return await Vaccine.findByIdAndUpdate(vaccineId, updateData, {
      new: true,
      runValidators: true,
    });
  } catch (error) {
    throw new Error(`Error updating vaccine: ${error.message}`);
  }
};

/**
 * Delete vaccine
 * @param {string} vaccineId - Vaccine ID
 * @returns {Promise<Object>} Deleted vaccine
 */
export const deleteExistingVaccine = async (vaccineId) => {
  try {
    return await Vaccine.findByIdAndDelete(vaccineId);
  } catch (error) {
    throw new Error(`Error deleting vaccine: ${error.message}`);
  }
};

/**
 * Soft delete vaccine (deactivate)
 * @param {string} vaccineId - Vaccine ID
 * @returns {Promise<Object>} Deactivated vaccine
 */
export const deactivateVaccine = async (vaccineId) => {
  try {
    return await Vaccine.findByIdAndUpdate(
      vaccineId,
      { isActive: false },
      { new: true }
    );
  } catch (error) {
    throw new Error(`Error deactivating vaccine: ${error.message}`);
  }
};

/**
 * Activate vaccine
 * @param {string} vaccineId - Vaccine ID
 * @returns {Promise<Object>} Activated vaccine
 */
export const activateVaccine = async (vaccineId) => {
  try {
    return await Vaccine.findByIdAndUpdate(
      vaccineId,
      { isActive: true },
      { new: true }
    );
  } catch (error) {
    throw new Error(`Error activating vaccine: ${error.message}`);
  }
};

/**
 * Get vaccine statistics
 * @returns {Promise<Object>} Vaccine statistics
 */
export const getVaccineStatistics = async () => {
  try {
    const totalVaccines = await Vaccine.countDocuments();
    const activeVaccines = await Vaccine.countDocuments({ isActive: true });
    const birthVaccines = await Vaccine.countDocuments({ dueAtBirth: true });
    const vaccinesWithBoosters = await Vaccine.countDocuments({
      boosterDoses: { $exists: true, $not: { $size: 0 } },
    });

    // Get age distribution
    const ageDistribution = await Vaccine.aggregate([
      {
        $group: {
          _id: "$recommendedAge.months",
          count: { $sum: 1 },
          vaccines: { $push: "$name" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get route distribution
    const routeDistribution = await Vaccine.aggregate([
      {
        $group: {
          _id: "$route",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      totalVaccines,
      activeVaccines,
      inactiveVaccines: totalVaccines - activeVaccines,
      birthVaccines,
      vaccinesWithBoosters,
      ageDistribution,
      routeDistribution,
    };
  } catch (error) {
    throw new Error(`Error getting vaccine statistics: ${error.message}`);
  }
};

/**
 * Search vaccines by name, code, or disease
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} List of matching vaccines
 */
export const searchVaccines = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim() === "") {
      return await Vaccine.find({ isActive: true }).sort({ name: 1 });
    }

    const searchRegex = new RegExp(searchTerm, "i");

    return await Vaccine.find({
      $or: [
        { name: searchRegex },
        { code: searchRegex },
        { description: searchRegex },
        { protectsAgainst: searchRegex },
      ],
      isActive: true,
    }).sort({ name: 1 });
  } catch (error) {
    throw new Error(`Error searching vaccines: ${error.message}`);
  }
};

/**
 * Get vaccines with similar recommended age
 * @param {number} ageInMonths - Age in months
 * @param {number} tolerance - Tolerance in months (default: 1)
 * @returns {Promise<Array>} List of similar vaccines
 */
export const findSimilarVaccinesByAge = async (ageInMonths, tolerance = 1) => {
  try {
    return await Vaccine.find({
      "recommendedAge.months": {
        $gte: ageInMonths - tolerance,
        $lte: ageInMonths + tolerance,
      },
      isActive: true,
    }).sort({ "recommendedAge.months": 1 });
  } catch (error) {
    throw new Error(`Error finding similar vaccines by age: ${error.message}`);
  }
};

/**
 * Get vaccine schedule for a specific age in months
 * @param {number} ageInMonths - Age in months
 * @returns {Promise<Object>} Vaccine schedule
 */
export const getVaccineScheduleForAge = async (ageInMonths) => {
  try {
    const vaccines = await Vaccine.find({ isActive: true }).sort({
      "recommendedAge.months": 1,
    });

    const schedule = {
      ageInMonths,
      vaccinesDueNow: [],
      vaccinesCompleted: [],
      vaccinesUpcoming: [],
      nextVaccineDue: null,
    };

    // Categorize vaccines based on age
    vaccines.forEach((vaccine) => {
      const vaccineAge = vaccine.recommendedAge.months;

      if (vaccineAge <= ageInMonths) {
        schedule.vaccinesDueNow.push(vaccine);
      } else if (vaccineAge <= ageInMonths + 3) {
        schedule.vaccinesUpcoming.push({
          ...vaccine.toObject(),
          dueInMonths: vaccineAge - ageInMonths,
        });
      }
    });

    // Find next vaccine due
    if (schedule.vaccinesUpcoming.length > 0) {
      schedule.nextVaccineDue = schedule.vaccinesUpcoming[0];
    }

    return schedule;
  } catch (error) {
    throw new Error(`Error getting vaccine schedule for age: ${error.message}`);
  }
};

/**
 * Bulk create vaccines
 * @param {Array} vaccinesData - Array of vaccine data
 * @returns {Promise<Array>} Created vaccines
 */
export const bulkCreateVaccines = async (vaccinesData) => {
  try {
    // Ensure all codes are uppercase
    const processedData = vaccinesData.map((vaccine) => ({
      ...vaccine,
      code: vaccine.code ? vaccine.code.toUpperCase() : vaccine.code,
    }));

    return await Vaccine.insertMany(processedData);
  } catch (error) {
    throw new Error(`Error bulk creating vaccines: ${error.message}`);
  }
};

/**
 * Update vaccine dosage information
 * @param {string} vaccineId - Vaccine ID
 * @param {Object} dosageInfo - Dosage information
 * @returns {Promise<Object>} Updated vaccine
 */
export const updateVaccineDosage = async (vaccineId, dosageInfo) => {
  try {
    return await Vaccine.findByIdAndUpdate(
      vaccineId,
      {
        dosage: dosageInfo.dosage,
        route: dosageInfo.route,
        site: dosageInfo.site,
        "recommendedAge.months": dosageInfo.recommendedAge?.months,
        "recommendedAge.weeks": dosageInfo.recommendedAge?.weeks,
      },
      { new: true, runValidators: true }
    );
  } catch (error) {
    throw new Error(`Error updating vaccine dosage: ${error.message}`);
  }
};

/**
 * Add booster dose to vaccine
 * @param {string} vaccineId - Vaccine ID
 * @param {Object} boosterData - Booster dose data
 * @returns {Promise<Object>} Updated vaccine
 */
export const addBoosterDose = async (vaccineId, boosterData) => {
  try {
    const vaccine = await Vaccine.findById(vaccineId);

    if (!vaccine) {
      throw new Error("Vaccine not found");
    }

    // Calculate sequence number
    const sequence = vaccine.boosterDoses ? vaccine.boosterDoses.length + 1 : 1;

    vaccine.boosterDoses.push({
      sequence,
      recommendedAge: boosterData.recommendedAge,
    });

    return await vaccine.save();
  } catch (error) {
    throw new Error(`Error adding booster dose: ${error.message}`);
  }
};

/**
 * Remove booster dose from vaccine
 * @param {string} vaccineId - Vaccine ID
 * @param {number} sequence - Booster sequence number
 * @returns {Promise<Object>} Updated vaccine
 */
export const removeBoosterDose = async (vaccineId, sequence) => {
  try {
    return await Vaccine.findByIdAndUpdate(
      vaccineId,
      {
        $pull: { boosterDoses: { sequence } },
      },
      { new: true }
    );
  } catch (error) {
    throw new Error(`Error removing booster dose: ${error.message}`);
  }
};

/**
 * Get vaccines by route of administration
 * @param {string} route - Route (Oral, Intramuscular, etc.)
 * @returns {Promise<Array>} List of vaccines
 */
export const findVaccinesByRoute = async (route) => {
  try {
    return await Vaccine.find({
      route: { $regex: new RegExp(`^${route}$`, "i") },
      isActive: true,
    }).sort({ name: 1 });
  } catch (error) {
    throw new Error(`Error finding vaccines by route: ${error.message}`);
  }
};

/**
 * Check if vaccine exists by code
 * @param {string} code - Vaccine code
 * @returns {Promise<boolean>} True if exists
 */
export const vaccineExistsByCode = async (code) => {
  try {
    const count = await Vaccine.countDocuments({ code: code.toUpperCase() });
    return count > 0;
  } catch (error) {
    throw new Error(`Error checking vaccine existence: ${error.message}`);
  }
};

/**
 * Get paginated vaccines
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Object>} Paginated vaccines
 */
export const getPaginatedVaccines = async (
  page = 1,
  limit = 10,
  filter = {}
) => {
  try {
    const skip = (page - 1) * limit;

    const [vaccines, total] = await Promise.all([
      Vaccine.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
      Vaccine.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      vaccines,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    throw new Error(`Error getting paginated vaccines: ${error.message}`);
  }
};

export default {
  findAllVaccines,
  findVaccineById,
  findVaccineByCode,
  findVaccinesByDisease,
  findBirthVaccines,
  findVaccinesByAgeRange,
  findVaccinesDueAtAge,
  findVaccinesWithBoosters,
  findActiveVaccines,
  createNewVaccine,
  updateExistingVaccine,
  deleteExistingVaccine,
  deactivateVaccine,
  activateVaccine,
  getVaccineStatistics,
  searchVaccines,
  findSimilarVaccinesByAge,
  getVaccineScheduleForAge,
  bulkCreateVaccines,
  updateVaccineDosage,
  addBoosterDose,
  removeBoosterDose,
  findVaccinesByRoute,
  vaccineExistsByCode,
  getPaginatedVaccines,
};
