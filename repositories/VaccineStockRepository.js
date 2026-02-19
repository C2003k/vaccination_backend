import VaccineStock from "../models/VaccineStock.js";

export const findAllVaccineStocks = async (filter = {}) => {
  try {
    return await VaccineStock.find(filter)
      .populate("hospital")
      .populate("vaccine")
      .sort({ status: 1, daysOfSupply: 1 });
  } catch (error) {
    throw new Error(`Error finding vaccine stocks: ${error.message}`);
  }
};

export const findVaccineStockById = async (stockId) => {
  try {
    return await VaccineStock.findById(stockId)
      .populate("hospital")
      .populate("vaccine");
  } catch (error) {
    throw new Error(`Error finding vaccine stock by ID: ${error.message}`);
  }
};

export const findStocksByHospitalId = async (hospitalId) => {
  try {
    return await VaccineStock.find({ hospital: hospitalId })
      .populate("vaccine")
      .sort({ status: 1 });
  } catch (error) {
    throw new Error(`Error finding stocks by hospital: ${error.message}`);
  }
};

export const findStocksByVaccineId = async (vaccineId) => {
  try {
    return await VaccineStock.find({ vaccine: vaccineId })
      .populate("hospital")
      .sort({ status: 1 });
  } catch (error) {
    throw new Error(`Error finding stocks by vaccine: ${error.message}`);
  }
};

export const createNewVaccineStock = async (stockData) => {
  try {
    const stock = new VaccineStock(stockData);
    return await stock.save();
  } catch (error) {
    throw new Error(`Error creating vaccine stock: ${error.message}`);
  }
};

export const updateExistingVaccineStock = async (stockId, updateData) => {
  try {
    return await VaccineStock.findByIdAndUpdate(stockId, updateData, {
      new: true,
      runValidators: true,
    }).populate("hospital vaccine");
  } catch (error) {
    throw new Error(`Error updating vaccine stock: ${error.message}`);
  }
};

export const findCriticalStocks = async (hospitalId = null) => {
  try {
    const filter = { status: { $in: ["low", "critical", "out_of_stock"] } };
    if (hospitalId) {
      filter.hospital = hospitalId;
    }
    return await VaccineStock.find(filter)
      .populate("hospital")
      .populate("vaccine")
      .sort({ status: 1, daysOfSupply: 1 });
  } catch (error) {
    throw new Error(`Error finding critical stocks: ${error.message}`);
  }
};

export const deleteVaccineStock = async (stockId) => {
  try {
    return await VaccineStock.findByIdAndDelete(stockId);
  } catch (error) {
    throw new Error(`Error deleting vaccine stock: ${error.message}`);
  }
};
