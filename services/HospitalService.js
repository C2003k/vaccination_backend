import {
  findAllHospitals,
  findHospitalById,
  createNewHospital,
  updateExistingHospital,
  deleteExistingHospital,
  findHospitalsByCounty,
} from "../repositories/HospitalRepository.js";
import { findStocksByHospitalId } from "../repositories/VaccineStockRepository.js";

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

  const stocks = await findStocksByHospitalId(hospitalId);

  const stockSummary = {
    adequate: stocks.filter((s) => s.status === "adequate").length,
    low: stocks.filter((s) => s.status === "low").length,
    critical: stocks.filter((s) => s.status === "critical").length,
    outOfStock: stocks.filter((s) => s.status === "out_of_stock").length,
    total: stocks.length,
  };

  return {
    hospital,
    stockSummary,
    recentStocks: stocks.slice(0, 5),
  };
};
