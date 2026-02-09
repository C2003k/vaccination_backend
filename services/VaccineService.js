import {
  findAllVaccines,
  findVaccineById,
  findVaccineByCode,
  createNewVaccine,
  updateExistingVaccine,
} from "../repositories/VaccineRepository.js";

export const getAllVaccines = async (activeOnly = true) => {
  const filter = activeOnly ? { isActive: true } : {};
  return await findAllVaccines(filter);
};

export const getVaccineById = async (vaccineId) => {
  const vaccine = await findVaccineById(vaccineId);
  if (!vaccine) {
    throw new Error("Vaccine not found");
  }
  return vaccine;
};

export const getVaccineByCode = async (code) => {
  const vaccine = await findVaccineByCode(code);
  if (!vaccine) {
    throw new Error("Vaccine not found");
  }
  return vaccine;
};

export const createVaccine = async (vaccineData) => {
  const {
    name,
    code,
    description,
    protectsAgainst,
    recommendedAge,
    route,
    dosage,
  } = vaccineData;

  if (
    !name ||
    !code ||
    !description ||
    !protectsAgainst ||
    !recommendedAge ||
    !route ||
    !dosage
  ) {
    throw new Error("All required fields must be provided");
  }

  // Check if vaccine with same code already exists
  const existingVaccine = await findVaccineByCode(code);
  if (existingVaccine) {
    throw new Error("Vaccine with this code already exists");
  }

  return await createNewVaccine(vaccineData);
};

export const updateVaccine = async (vaccineId, updateData) => {
  const vaccine = await findVaccineById(vaccineId);
  if (!vaccine) {
    throw new Error("Vaccine not found");
  }

  return await updateExistingVaccine(vaccineId, updateData);
};

export const getVaccinationSchedule = async (childAgeInMonths) => {
  const vaccines = await findAllVaccines({ isActive: true });

  return vaccines
    .filter((vaccine) => {
      // Check if vaccine is due based on child's age
      return vaccine.recommendedAge.months <= childAgeInMonths;
    })
    .sort((a, b) => a.recommendedAge.months - b.recommendedAge.months);
};
