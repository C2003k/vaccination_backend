import Hospital from "../models/Hospital.js";
import User from "../models/User.js";

export const findAllHospitals = async (filter = {}, fieldsToExclude = {}) => {
  try {
    return await Hospital.find(filter, fieldsToExclude)
      .populate("adminUsers", "name email phone")
      .sort({ "location.county": 1, name: 1 });
  } catch (error) {
    throw new Error(`Error finding hospitals: ${error.message}`);
  }
};

export const findHospitalById = async (hospitalId, fieldsToExclude = {}) => {
  try {
    return await Hospital.findById(hospitalId, fieldsToExclude).populate(
      "adminUsers",
      "name email phone role"
    );
  } catch (error) {
    throw new Error(`Error finding hospital by ID: ${error.message}`);
  }
};

export const findHospitalsByCounty = async (county, fieldsToExclude = {}) => {
  try {
    return await Hospital.find({ "location.county": county }, fieldsToExclude)
      .populate("adminUsers", "name email")
      .sort({ facilityLevel: -1, name: 1 });
  } catch (error) {
    throw new Error(`Error finding hospitals by county: ${error.message}`);
  }
};

export const findHospitalsByType = async (type, fieldsToExclude = {}) => {
  try {
    return await Hospital.find({ type }, fieldsToExclude)
      .populate("adminUsers", "name email")
      .sort({ "location.county": 1, name: 1 });
  } catch (error) {
    throw new Error(`Error finding hospitals by type: ${error.message}`);
  }
};

export const findHospitalByPhone = async (phone) => {
  try {
    return await Hospital.findOne({ "contact.phone": phone });
  } catch (error) {
    throw new Error(`Error finding hospital by phone: ${error.message}`);
  }
};

export const createNewHospital = async (hospitalData) => {
  try {
    const hospital = new Hospital(hospitalData);
    return await hospital.save();
  } catch (error) {
    throw new Error(`Error creating hospital: ${error.message}`);
  }
};

export const updateExistingHospital = async (hospitalId, updateData) => {
  try {
    return await Hospital.findByIdAndUpdate(hospitalId, updateData, {
      new: true,
      runValidators: true,
    }).populate("adminUsers", "name email phone");
  } catch (error) {
    throw new Error(`Error updating hospital: ${error.message}`);
  }
};

export const deleteExistingHospital = async (hospitalId) => {
  try {
    return await Hospital.findByIdAndDelete(hospitalId);
  } catch (error) {
    throw new Error(`Error deleting hospital: ${error.message}`);
  }
};

export const addAdminToHospital = async (hospitalId, userId) => {
  try {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is already an admin
    if (hospital.adminUsers.includes(userId)) {
      return hospital;
    }

    hospital.adminUsers.push(userId);
    await hospital.save();

    // Update user role if needed
    if (user.role === "health_worker") {
      user.role = "hospital_staff";
      await user.save();
    }

    return hospital.populate("adminUsers", "name email phone");
  } catch (error) {
    throw new Error(`Error adding admin to hospital: ${error.message}`);
  }
};

export const removeAdminFromHospital = async (hospitalId, userId) => {
  try {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      throw new Error("Hospital not found");
    }

    hospital.adminUsers = hospital.adminUsers.filter(
      (adminId) => adminId.toString() !== userId.toString()
    );
    await hospital.save();

    return hospital.populate("adminUsers", "name email phone");
  } catch (error) {
    throw new Error(`Error removing admin from hospital: ${error.message}`);
  }
};

export const updateHospitalCoverage = async (hospitalId, coverageData) => {
  try {
    return await Hospital.findByIdAndUpdate(
      hospitalId,
      {
        "coverage.current": coverageData.current,
        "coverage.target": coverageData.target || 90,
        "coverage.lastUpdated": new Date(),
      },
      { new: true, runValidators: true }
    );
  } catch (error) {
    throw new Error(`Error updating hospital coverage: ${error.message}`);
  }
};

export const countHospitalsByRegion = async () => {
  try {
    return await Hospital.aggregate([
      {
        $group: {
          _id: "$location.county",
          count: { $sum: 1 },
          types: { $push: "$type" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  } catch (error) {
    throw new Error(`Error counting hospitals by region: ${error.message}`);
  }
};

export const findNearbyHospitals = async (
  latitude,
  longitude,
  maxDistance = 5000
) => {
  try {
    return await Hospital.find({
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance,
        },
      },
      isActive: true,
    }).populate("adminUsers", "name email");
  } catch (error) {
    throw new Error(`Error finding nearby hospitals: ${error.message}`);
  }
};
