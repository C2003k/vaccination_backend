import {
  findAllVaccinationRecords,
  findVaccinationRecordById,
  findRecordsByChildId,
  createNewVaccinationRecord,
  updateExistingVaccinationRecord,
} from "../repositories/VaccinationRecordRepository.js";
import { findChildById } from "../repositories/ChildRepository.js";
import { findVaccineById } from "../repositories/VaccineRepository.js";
import { findUserById } from "../repositories/UserRepository.js";
import e from "express";

export const getAllVaccinationRecords = async (filters = {}) => {
  return await findAllVaccinationRecords(filters);
};

export const getVaccinationRecordById = async (recordId) => {
  const record = await findVaccinationRecordById(recordId);
  if (!record) {
    throw new Error("Vaccination record not found");
  }
  return record;
};

export const getRecordsByChildId = async (childId) => {
  const child = await findChildById(childId);
  if (!child) {
    throw new Error("Child not found");
  }
  return await findRecordsByChildId(childId);
};

export const createVaccinationRecord = async (recordData, healthWorkerId) => {
  const { childId, vaccineId, doseSequence, dateGiven, batchNumber } =
    recordData;

  // Validate required fields
  if (!childId || !vaccineId || !doseSequence || !dateGiven || !batchNumber) {
    throw new Error(
      "Child, vaccine, dose sequence, date given, and batch number are required"
    );
  }

  // Validate child exists
  const child = await findChildById(childId);
  if (!child) {
    throw new Error("Child not found");
  }

  // Validate vaccine exists
  const vaccine = await findVaccineById(vaccineId);
  if (!vaccine) {
    throw new Error("Vaccine not found");
  }

  // Validate health worker exists and is authorized
  const healthWorker = await findUserById(healthWorkerId);
  if (
    !healthWorker ||
    !["health_worker", "admin"].includes(healthWorker.role)
  ) {
    throw new Error("Unauthorized to record vaccinations");
  }

  // Check if this dose was already recorded
  const existingRecord = await findAllVaccinationRecords({
    child: childId,
    vaccine: vaccineId,
    doseSequence,
  });

  if (existingRecord.length > 0) {
    throw new Error(
      `Dose ${doseSequence} of ${vaccine.name} already recorded for this child`
    );
  }

  const record = await createNewVaccinationRecord({
    ...recordData,
    child: childId,
    vaccine: vaccineId,
    givenBy: healthWorkerId,
    status: "completed",
  });

  return record;
};

export const getChildVaccinationStatus = async (childId) => {
  const child = await findChildById(childId);
  if (!child) {
    throw new Error("Child not found");
  }

  const records = await findRecordsByChildId(childId);
  const childAgeInMonths = calculateAgeInMonths(child.dateOfBirth);

  // Get all vaccines due for child's age
  const allVaccines = await findAllVaccines({ isActive: true });
  const dueVaccines = allVaccines.filter(
    (v) => v.recommendedAge.months <= childAgeInMonths
  );

  const vaccinationStatus = dueVaccines.map((vaccine) => {
    const childRecords = records.filter(
      (record) => record.vaccine._id.toString() === vaccine._id.toString()
    );
    const completedDoses = childRecords.filter(
      (record) => record.status === "completed"
    ).length;

    return {
      vaccine: vaccine,
      completedDoses,
      totalDoses: 1 + (vaccine.boosterDoses ? vaccine.boosterDoses.length : 0),
      lastGiven: childRecords.length > 0 ? childRecords[0].dateGiven : null,
      status: completedDoses > 0 ? "completed" : "pending",
    };
  });

  return {
    child,
    vaccinationStatus,
    coverageRate:
      (vaccinationStatus.filter((v) => v.status === "completed").length /
        dueVaccines.length) *
      100,
  };
};

export const updateVaccinationRecord = async (recordId, updateData) => {
  const record = await findVaccinationRecordById(recordId);
  if (!record) {
    throw new Error("Vaccination record not found");
  }

  return await updateExistingVaccinationRecord(recordId, updateData);
};

export const getVaccinationRecordsByChildId = async (childId) => {
  const child = await findChildById(childId);
  if (!child) {
    throw new Error("Child not found");
  }

  return await findRecordsByChildId(childId);
};

// Helper function to calculate age in months
const calculateAgeInMonths = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  return months + today.getMonth() - birthDate.getMonth();
};
