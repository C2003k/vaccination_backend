import {
  findAllHospitals,
  findHospitalById,
  createNewHospital,
  updateExistingHospital,
  deleteExistingHospital,
  findHospitalsByCounty,
} from "../repositories/HospitalRepository.js";
import { findStocksByHospitalId } from "../repositories/VaccineStockRepository.js";
import User from "../models/User.js";
import Hospital from "../models/Hospital.js";

export const getAllHospitals = async (filters = {}) => {
  return await findAllHospitals(filters);
};

export const getHospitalById = async (hospitalId) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }
  return hospital;
};

export const getHospitalsByCounty = async (county) => {
  return await findHospitalsByCounty(county);
};

export const createHospital = async (hospitalData) => {
  const { name, type, facilityLevel, contact, location } = hospitalData;

  if (
    !name ||
    !type ||
    !facilityLevel ||
    !contact ||
    !contact.phone ||
    !location ||
    !location.county
  ) {
    throw new Error("All required fields must be provided");
  }

  // Validate phone format
  const phoneRegex = /^254\d{9}$/;
  if (!phoneRegex.test(contact.phone)) {
    throw new Error("Phone must be in format 254712345678");
  }

  return await createNewHospital(hospitalData);
};

export const updateHospital = async (hospitalId, updateData) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  return await updateExistingHospital(hospitalId, updateData);
};

export const deleteHospital = async (hospitalId) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  await deleteExistingHospital(hospitalId);
  return { message: "Hospital deleted successfully" };
};

export const getHospitalDashboard = async (hospitalId) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  // Stock Summary
  const stocks = await findStocksByHospitalId(hospitalId);
  const stockSummary = {
    adequate: stocks.filter((s) => s.status === "adequate").length,
    low: stocks.filter((s) => s.status === "low").length,
    critical: stocks.filter((s) => s.status === "critical").length,
    outOfStock: stocks.filter((s) => s.status === "out_of_stock").length,
    total: stocks.length,
  };

  // Basic Patient Stats (Mock logic for now as Patient repository interactions are complex)
  // In a real scenario, we would query:
  // - Total children registered in this facility's catchment area
  // - Vaccination coverage (fully immunized / total eligible)
  // - Defaulters (missed appointments)

  // For now, let's use the hospital's stored coverage data if available, or simulate
  const coverage = hospital.coverage?.current || 0;

  // Mocking other stats for the dashboard demo until Patient module is fully linked
  const stats = {
    totalChildren: 1247, // Placeholder or fetch from User/Child models if linked to Hospital
    coverage: `${coverage}%`,
    stockLevel: `${Math.round((stockSummary.adequate / (stockSummary.total || 1)) * 100)}%`,
    defaulters: 45 // Placeholder
  };

  return {
    hospital: {
      id: hospital._id,
      name: hospital.name,
      type: hospital.type,
      location: hospital.location
    },
    stats,
    stockSummary,
    recentStocks: stocks.slice(0, 5),
  };
};

export const updateHospitalCoverage = async (hospitalId, coverageData) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  return await updateExistingHospital(hospitalId, { coverage: coverageData });
};

export const addAdminToHospital = async (hospitalId, userId) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Add admin to hospital's admins array if not already present
  if (!hospital.admins.includes(userId)) {
    hospital.admins.push(userId);
    await hospital.save();
  }

  return hospital;
};

export const removeAdminFromHospital = async (hospitalId, userId) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Remove admin from hospital's admins array
  hospital.admins = hospital.admins.filter(
    (adminId) => adminId.toString() !== userId
  );
  await hospital.save();

  return hospital;
};

export const findNearbyHospitals = async (latitude, longitude, maxDistance) => {
  // Find hospitals within maxDistance (in meters) from the given coordinates
  const hospitals = await Hospital.find({
    isActive: true,
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
  });

  return hospitals;
};

export const getHospitalStatistics = async (hospitalId, period, startDate, endDate) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  // This is a placeholder implementation
  // In a real scenario, you would query vaccination records, appointments, etc.
  return {
    period,
    vaccinations: {
      total: 0,
      byVaccine: [],
    },
    coverage: hospital.coverage?.current || 0,
    appointments: {
      total: 0,
      completed: 0,
      pending: 0,
      cancelled: 0,
    },
  };
};

export const getHospitalSystemSummary = async () => {
  const hospitals = await findAllHospitals({});

  const summary = {
    totalHospitals: hospitals.length,
    activeHospitals: hospitals.filter((h) => h.isActive).length,
    inactiveHospitals: hospitals.filter((h) => !h.isActive).length,
    byType: {},
    byFacilityLevel: {},
    byCounty: {},
  };

  hospitals.forEach((hospital) => {
    // Count by type
    summary.byType[hospital.type] = (summary.byType[hospital.type] || 0) + 1;

    // Count by facility level
    summary.byFacilityLevel[hospital.facilityLevel] =
      (summary.byFacilityLevel[hospital.facilityLevel] || 0) + 1;

    // Count by county
    if (hospital.location?.county) {
      summary.byCounty[hospital.location.county] =
        (summary.byCounty[hospital.location.county] || 0) + 1;
    }
  });

  return summary;
};

export const getHospitalStaff = async (hospitalId) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  // Find all users who are admins of this hospital
  const staff = await User.find({
    _id: { $in: hospital.admins },
  }).select("-password");

  return staff;
};

export const getUserHospital = async (userId) => {
  // Find the hospital where this user is an admin
  const hospital = await Hospital.findOne({
    admins: userId,
    isActive: true,
  });

  return hospital;
};
