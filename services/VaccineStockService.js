import {
  findAllVaccineStocks,
  findVaccineStockById,
  findStocksByHospitalId,
  createNewVaccineStock,
  updateExistingVaccineStock,
  findCriticalStocks,
} from "../repositories/VaccineStockRepository.js";
import { findHospitalById } from "../repositories/HospitalRepository.js";
import { findVaccineById } from "../repositories/VaccineRepository.js";

export const getAllVaccineStocks = async (filters = {}) => {
  return await findAllVaccineStocks(filters);
};

export const getVaccineStockById = async (stockId) => {
  const stock = await findVaccineStockById(stockId);
  if (!stock) {
    throw new Error("Vaccine stock not found");
  }
  return stock;
};

export const getStocksByHospitalId = async (hospitalId) => {
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }
  return await findStocksByHospitalId(hospitalId);
};

export const createVaccineStock = async (stockData) => {
  const {
    hospitalId,
    vaccineId,
    quantity,
    minimumStock,
    maximumStock,
    expiryDate,
  } = stockData;

  if (
    !hospitalId ||
    !vaccineId ||
    !quantity ||
    !minimumStock ||
    !maximumStock ||
    !expiryDate
  ) {
    throw new Error("All required fields must be provided");
  }

  // Validate hospital exists
  const hospital = await findHospitalById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }

  // Validate vaccine exists
  const vaccine = await findVaccineById(vaccineId);
  if (!vaccine) {
    throw new Error("Vaccine not found");
  }

  // Validate expiry date
  if (new Date(expiryDate) <= new Date()) {
    throw new Error("Expiry date must be in the future");
  }

  // Calculate status based on quantity and minimum stock
  let status = "adequate";
  if (quantity === 0) {
    status = "out_of_stock";
  } else if (quantity <= minimumStock * 0.3) {
    status = "critical";
  } else if (quantity <= minimumStock * 0.7) {
    status = "low";
  }

  // Calculate days of supply (simplified calculation)
  const usageRate = 5; // Default usage rate, should be calculated based on historical data
  const daysOfSupply = Math.floor(quantity / usageRate);

  const stock = await createNewVaccineStock({
    ...stockData,
    hospital: hospitalId,
    vaccine: vaccineId,
    status,
    daysOfSupply,
  });

  return stock;
};

export const updateVaccineStock = async (stockId, updateData) => {
  const stock = await findVaccineStockById(stockId);
  if (!stock) {
    throw new Error("Vaccine stock not found");
  }

  // Recalculate status if quantity is updated
  if (updateData.quantity !== undefined) {
    let status = "adequate";
    if (updateData.quantity === 0) {
      status = "out_of_stock";
    } else if (updateData.quantity <= stock.minimumStock * 0.3) {
      status = "critical";
    } else if (updateData.quantity <= stock.minimumStock * 0.7) {
      status = "low";
    }
    updateData.status = status;

    // Recalculate days of supply
    const usageRate = stock.usageRate || 5;
    updateData.daysOfSupply = Math.floor(updateData.quantity / usageRate);
  }

  return await updateExistingVaccineStock(stockId, updateData);
};

export const getCriticalStocks = async (hospitalId = null) => {
  return await findCriticalStocks(hospitalId);
};

export const getStockSummary = async (hospitalId = null) => {
  const filter = hospitalId ? { hospital: hospitalId } : {};
  const stocks = await findAllVaccineStocks(filter);

  const summary = {
    adequate: 0,
    low: 0,
    critical: 0,
    outOfStock: 0,
    total: stocks.length,
    soonToExpire: 0,
  };

  stocks.forEach((stock) => {
    summary[stock.status]++;

    // Check if stock expires in next 30 days
    const daysToExpiry = Math.ceil(
      (new Date(stock.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (daysToExpiry <= 30 && daysToExpiry > 0) {
      summary.soonToExpire++;
    }
  });

  return summary;
};
