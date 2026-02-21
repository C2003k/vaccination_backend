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
import Appointment from "../models/Appointment.js";
import Vaccine from "../models/Vaccine.js";
import { ROLES } from "../config/roles.js";

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

  // Get all children linked to this hospital through appointments
  // This will give us children who have *ever* had an appointment at this hospital
  const childrenWithAppointments = await Appointment.find({ hospital: hospitalId }).distinct('child');
  const totalChildren = childrenWithAppointments.length;

  // Get defaulters (children with at least one missed appointment)
  const childrenWithMissedAppointments = await Appointment.find({
    hospital: hospitalId,
    status: "no_show",
  }).distinct("child");
  const totalDefaulters = childrenWithMissedAppointments.length;

  // Stock Summary
  const stocks = await findStocksByHospitalId(hospitalId);
  const stockSummary = {
    adequate: stocks.filter((s) => s.status === "adequate").length,
    low: stocks.filter((s) => s.status === "low").length,
    critical: stocks.filter((s) => s.status === "critical").length,
    out_of_stock: stocks.filter((s) => s.status === "out_of_stock").length,
    total: stocks.length,
  };
  stockSummary.outOfStock = stockSummary.out_of_stock;

  // Calculate dynamic stock level percentage for stat card
  const currentStockPercentage = stockSummary.total > 0
    ? Math.round(((stockSummary.adequate + stockSummary.low) / stockSummary.total) * 100)
    : 0;

  // Get vaccine coverage data for the charts
  const allVaccines = await Vaccine.find({ isActive: true });
  const coverageData = await Promise.all(allVaccines.map(async (v) => {
    // Count completed vaccinations for this vaccine at this hospital
    const completedCount = await Appointment.countDocuments({
      hospital: hospitalId,
      vaccine: v._id,
      status: 'completed'
    });
    // For simplicity, total eligible children is approximated by totalChildren
    // In a real system, eligibility would be more complex based on age and vaccine schedule
    const percentage = totalChildren === 0 ? 0 : Math.round((completedCount / totalChildren) * 100);

    return {
      vaccine: v.name,
      coverage: percentage,
      target: 90 // Static target
    };
  }));

  // Determine overall coverage from the hospital's own record, or calculate an average if needed.
  // For now, let's use the hospital's stored coverage data if available
  const averageCoverage =
    coverageData.length > 0
      ? Math.round(
          coverageData.reduce((sum, item) => sum + item.coverage, 0) / coverageData.length
        )
      : 0;
  const overallCoverage = hospital.coverage?.current || averageCoverage;

  const stats = {
    totalChildren: totalChildren,
    coverage: `${overallCoverage}%`, // Use existing hospital coverage
    stockLevel: `${currentStockPercentage}%`,
    defaulters: totalDefaulters
  };

  // Retrieve recent stocks with vaccine details for low stock alerts
  const recentStocks = await findStocksByHospitalId(hospitalId);
  const populatedRecentStocks = await Promise.all(recentStocks.slice(0, 5).map(async (stock) => {
      const vaccine = await Vaccine.findById(stock.vaccine);
      return {
          ...stock.toObject(),
          vaccine: vaccine ? { name: vaccine.name, dosage: vaccine.dosage } : null,
          currentStock: stock.quantity,
          status: stock.status,
      };
  }));

  return {
    hospital: {
      id: hospital._id,
      name: hospital.name,
      type: hospital.type,
      location: hospital.location
    },
    stats,
    stockSummary,
    coverageData, // Add coverage data
    recentStocks: populatedRecentStocks,
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

  // Add admin to hospital's adminUsers array if not already present
  if (!hospital.adminUsers.includes(userId)) {
    hospital.adminUsers.push(userId);
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

  // Remove admin from hospital's adminUsers array
  hospital.adminUsers = hospital.adminUsers.filter(
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
    _id: { $in: hospital.adminUsers },
  }).select("-password");

  return staff;
};

export const linkHospitalStaff = async (hospitalId, userId) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== ROLES.HOSPITAL_STAFF) {
    throw new Error("User is not hospital staff");
  }

  user.hospital = hospitalId;
  await user.save();

  if (!hospital.adminUsers.includes(userId)) {
    hospital.adminUsers.push(userId);
    await hospital.save();
  }

  return { hospital, staff: user };
};

export const unlinkHospitalStaff = async (hospitalId, userId) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== ROLES.HOSPITAL_STAFF) {
    throw new Error("User is not hospital staff");
  }

  const isLinkedToHospital =
    (user.hospital && user.hospital.toString() === hospitalId) ||
    hospital.adminUsers.some((adminId) => adminId.toString() === userId);

  if (!isLinkedToHospital) {
    throw new Error("User is not linked to this hospital");
  }

  if (user.hospital && user.hospital.toString() === hospitalId) {
    user.hospital = undefined;
    await user.save();
  }

  hospital.adminUsers = hospital.adminUsers.filter(
    (adminId) => adminId.toString() !== userId
  );
  await hospital.save();

  return { hospital, staff: user };
};

export const getEligibleHealthWorkers = async (hospitalId, options = {}) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  const { search } = options;

  const query = {
    role: ROLES.HEALTH_WORKER,
    isActive: true,
  };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  return await User.find(query)
    .select("name email phone county subCounty ward location")
    .sort({ name: 1 })
    .limit(200)
    .lean();
};

export const getEligibleMothers = async (hospitalId, options = {}) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  const { search, assigned } = options;
  const query = {
    role: ROLES.MOTHER,
    isActive: true,
  };

  if (assigned === "true") {
    query.assignedCHW = { $ne: null };
  }

  if (assigned === "false") {
    query.assignedCHW = null;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  return await User.find(query)
    .select("name email phone county subCounty ward location assignedCHW")
    .populate("assignedCHW", "name email phone")
    .sort({ name: 1 })
    .limit(200)
    .lean();
};

export const assignMotherToHealthWorker = async (hospitalId, motherId, healthWorkerId) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  const mother = await User.findById(motherId);
  if (!mother) {
    throw new Error("Mother not found");
  }
  if (mother.role !== ROLES.MOTHER) {
    throw new Error("User is not a mother");
  }

  const healthWorker = await User.findById(healthWorkerId);
  if (!healthWorker) {
    throw new Error("Health worker not found");
  }
  if (healthWorker.role !== ROLES.HEALTH_WORKER) {
    throw new Error("User is not a health worker");
  }

  mother.assignedCHW = healthWorker._id;
  await mother.save();

  return {
    hospital,
    mother,
    healthWorker,
  };
};

export const getUserHospital = async (userId) => {
  // Primary lookup: hospital where user is in adminUsers list
  let hospital = await Hospital.findOne({
    adminUsers: userId,
    isActive: true,
  });

  if (hospital) return hospital;

  // Fallback lookup: user's direct hospital assignment
  const user = await User.findById(userId).select("hospital");
  if (user?.hospital) {
    hospital = await Hospital.findOne({
      _id: user.hospital,
      isActive: true,
    });
  }

  return hospital;
};
