import {
  getAllChildren,
  getChildById,
  createChild,
  updateChild,
  deleteChild,
  getChildrenByParentId,
  getChildrenByAgeRange,
} from "../services/ChildService.js";

/**
 * @desc    Get all children (Admin/Health Worker only)
 * @route   GET /api/children
 * @access  Private/Admin/Health Worker
 */
export const getAllChildrenHandler = async (req, res) => {
  try {
    const filters = {};

    // Apply filters if provided
    const { gender, minAge, maxAge, location } = req.query;

    if (gender) filters.gender = gender;
    if (location) filters.location = location;

    const children = await getAllChildren(filters);

    res.status(200).json({
      success: true,
      count: children.length,
      data: children,
    });
  } catch (error) {
    console.error("Get all children error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving children",
    });
  }
};

/**
 * @desc    Get child by ID
 * @route   GET /api/children/:id
 * @access  Private
 */
export const getChildByIdHandler = async (req, res) => {
  try {
    const childId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get child with population of parent data
    const child = await getChildById(childId);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Check authorization: user is parent or has appropriate role
    const isParent = child.parent.toString() === userId;
    const isAuthorized =
      isParent ||
      userRole === "admin" ||
      userRole === "health_worker" ||
      userRole === "hospital_staff";

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this child record",
      });
    }

    res.status(200).json({
      success: true,
      data: child,
    });
  } catch (error) {
    console.error("Get child by ID error:", error);

    if (error.message === "Child not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving child",
    });
  }
};

/**
 * @desc    Get children by parent ID
 * @route   GET /api/children/parent/:parentId
 * @access  Private
 */
export const getChildrenByParentIdHandler = async (req, res) => {
  try {
    const parentId = req.params.parentId;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user is authorized to view these children
    if (
      parentId !== userId &&
      userRole !== "admin" &&
      userRole !== "health_worker" &&
      userRole !== "hospital_staff"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these children",
      });
    }

    const children = await getChildrenByParentId(parentId);

    res.status(200).json({
      success: true,
      count: children.length,
      data: children,
    });
  } catch (error) {
    console.error("Get children by parent error:", error);

    if (error.message === "Parent not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving children",
    });
  }
};

/**
 * @desc    Create new child
 * @route   POST /api/children
 * @access  Private/Mother
 */
export const createChildHandler = async (req, res) => {
  try {
    const childData = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only mothers can create child records
    if (userRole !== "mother") {
      return res.status(403).json({
        success: false,
        message: "Only mothers can create child records",
      });
    }

    // Set the parent to the logged-in user
    const child = await createChild(childData, userId);

    res.status(201).json({
      success: true,
      message: "Child registered successfully",
      data: child,
    });
  } catch (error) {
    console.error("Create child error:", error);

    if (
      error.message.includes("required") ||
      error.message.includes("cannot be in the future") ||
      error.message.includes("Only mothers can")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error creating child record",
    });
  }
};

/**
 * @desc    Update child
 * @route   PUT /api/children/:id
 * @access  Private
 */
export const updateChildHandler = async (req, res) => {
  try {
    const childId = req.params.id;
    const updateData = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get child to check authorization
    const child = await getChildById(childId);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Check authorization: user is parent or has appropriate role
    const isParent = child.parent.toString() === userId;
    const isAuthorized =
      isParent ||
      userRole === "admin" ||
      (userRole === "health_worker" && updateData.medicalUpdates) ||
      userRole === "hospital_staff";

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this child record",
      });
    }

    // Health workers can only update medical-related fields
    if (userRole === "health_worker" && !updateData.medicalUpdates) {
      return res.status(403).json({
        success: false,
        message: "Health workers can only update medical information",
      });
    }

    const updatedChild = updateChild(childId, updateData, userId);

    res.status(200).json({
      success: true,
      message: "Child updated successfully",
      data: updatedChild,
    });
  } catch (error) {
    console.error("Update child error:", error);

    if (error.message === "Child not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes("Not authorized") ||
      error.message.includes("cannot be in the future")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error updating child record",
    });
  }
};

/**
 * @desc    Delete child
 * @route   DELETE /api/children/:id
 * @access  Private/Mother/Admin
 */
export const deleteChildHandler = async (req, res) => {
  try {
    const childId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get child to check authorization
    const child = await getChildById(childId);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Check authorization: only parent or admin can delete
    const isParent = child.parent.toString() === userId;
    const isAuthorized = isParent || userRole === "admin";

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this child record",
      });
    }

    await deleteChild(childId, userId);

    res.status(200).json({
      success: true,
      message: "Child record deleted successfully",
    });
  } catch (error) {
    console.error("Delete child error:", error);

    if (error.message === "Child not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("Not authorized")) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error deleting child record",
    });
  }
};

/**
 * @desc    Get children by age range
 * @route   GET /api/children/age-range
 * @access  Private/Health Worker/Hospital Staff/Admin
 */
export const getChildrenByAgeRangeHandler = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Only authorized roles can access age range data
    if (
      userRole !== "admin" &&
      userRole !== "health_worker" &&
      userRole !== "hospital_staff"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access age range data",
      });
    }

    const { minMonths = 0, maxMonths = 60 } = req.query;

    const min = parseInt(minMonths);
    const max = parseInt(maxMonths);

    if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || min > max) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid age range parameters. Please provide valid minMonths and maxMonths.",
      });
    }

    const children = await getChildrenByAgeRange(min, max);

    res.status(200).json({
      success: true,
      count: children.length,
      ageRange: `${min}-${max} months`,
      data: children,
    });
  } catch (error) {
    console.error("Get children by age range error:", error);

    if (error.message.includes("Invalid age range")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving children by age range",
    });
  }
};

/**
 * @desc    Search children
 * @route   GET /api/children/search
 * @access  Private/Health Worker/Hospital Staff/Admin
 */
export const searchChildrenHandler = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Only authorized roles can search children
    if (
      userRole !== "admin" &&
      userRole !== "health_worker" &&
      userRole !== "hospital_staff"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to search children",
      });
    }

    const { name, location, gender } = req.query;

    if (!name && !location && !gender) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one search parameter (name, location, or gender)",
      });
    }

    const searchCriteria = {};

    if (name) {
      searchCriteria.name = { $regex: name, $options: "i" };
    }

    if (location) {
      searchCriteria.location = { $regex: location, $options: "i" };
    }

    if (gender) {
      searchCriteria.gender = gender.toLowerCase();
    }

    const children = await getAllChildren(searchCriteria);

    res.status(200).json({
      success: true,
      count: children.length,
      searchCriteria,
      data: children,
    });
  } catch (error) {
    console.error("Search children error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error searching children",
    });
  }
};

/**
 * @desc    Get child's vaccination summary
 * @route   GET /api/children/:id/vaccination-summary
 * @access  Private
 */
export const getChildVaccinationSummaryHandler = async (req, res) => {
  try {
    const childId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get child to check authorization
    const child = await getChildById(childId);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Check authorization: user is parent or has appropriate role
    const isParent = child.parent.toString() === userId;
    const isAuthorized =
      isParent ||
      userRole === "admin" ||
      userRole === "health_worker" ||
      userRole === "hospital_staff";

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this child's vaccination summary",
      });
    }

    // Calculate child's age in months
    const today = new Date();
    const birthDate = new Date(child.dateOfBirth);
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12;

    // Get vaccination records for this child
    const vaccinationRecords = await getVaccinationRecordsByChildId(childId);

    // Get all vaccines due for child's age
    const vaccines = await getAllVaccines({ isActive: true });
    const dueVaccines = vaccines.filter(
      (v) => v.recommendedAge.months <= ageInMonths
    );

    // Calculate vaccination status
    const vaccinationStatus = dueVaccines.map((vaccine) => {
      const childVaccinations = vaccinationRecords.filter(
        (record) => record.vaccine.toString() === vaccine._id.toString()
      );

      const completedDoses = childVaccinations.filter(
        (record) => record.status === "completed"
      ).length;
      const totalDoses =
        1 + (vaccine.boosterDoses ? vaccine.boosterDoses.length : 0);

      return {
        vaccine: {
          _id: vaccine._id,
          name: vaccine.name,
          code: vaccine.code,
        },
        completedDoses,
        totalDoses,
        isComplete: completedDoses >= totalDoses,
        lastGiven:
          childVaccinations.length > 0 ? childVaccinations[0].dateGiven : null,
        nextDue: null, // Would calculate based on last dose
        status:
          completedDoses >= totalDoses
            ? "complete"
            : completedDoses > 0
            ? "partial"
            : "pending",
      };
    });

    const summary = {
      child: {
        _id: child._id,
        name: child.name,
        dateOfBirth: child.dateOfBirth,
        ageInMonths,
        gender: child.gender,
      },
      vaccinationStatus,
      completedVaccines: vaccinationStatus.filter((v) => v.isComplete).length,
      totalDueVaccines: dueVaccines.length,
      coverageRate:
        dueVaccines.length > 0
          ? (vaccinationStatus.filter((v) => v.isComplete).length /
              dueVaccines.length) *
            100
          : 0,
      upcomingVaccinations: vaccinationStatus
        .filter((v) => !v.isComplete)
        .map((v) => ({
          vaccine: v.vaccine,
          dosesNeeded: v.totalDoses - v.completedDoses,
        })),
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Get child vaccination summary error:", error);

    if (error.message === "Child not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving vaccination summary",
    });
  }
};

// Import required services
import { getVaccinationRecordsByChildId } from "../services/VaccinationRecordService.js";
import { getAllVaccines } from "../services/VaccineService.js";
