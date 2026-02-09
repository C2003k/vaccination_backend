import {
  getAllVaccineStocks,
  getVaccineStockById,
  getStocksByHospitalId,
  createVaccineStock,
  updateVaccineStock,
  getCriticalStocks,
  getStockSummary,
} from "../services/VaccineStockService.js";

export const getVaccineStocks = async (req, res) => {
  try {
    const { hospitalId, vaccineId, status } = req.query;
    const filters = {};

    if (hospitalId) filters.hospital = hospitalId;
    if (vaccineId) filters.vaccine = vaccineId;
    if (status) filters.status = status;

    const stocks = await getAllVaccineStocks(filters);

    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getVaccineStock = async (req, res) => {
  try {
    const stock = await getVaccineStockById(req.params.id);

    res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    if (error.message === "Vaccine stock not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getHospitalStocks = async (req, res) => {
  try {
    const stocks = await getStocksByHospitalId(req.params.hospitalId);

    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error) {
    if (error.message === "Hospital not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createVaccineStockHandler = async (req, res) => {
  try {
    const stock = await createVaccineStock(req.body);

    res.status(201).json({
      success: true,
      message: "Vaccine stock created successfully",
      data: stock,
    });
  } catch (error) {
    if (
      error.message.includes("required") ||
      error.message.includes("not found") ||
      error.message.includes("Expiry date")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateVaccineStockHandler = async (req, res) => {
  try {
    const stock = await updateVaccineStock(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Vaccine stock updated successfully",
      data: stock,
    });
  } catch (error) {
    if (error.message === "Vaccine stock not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCriticalStocksHandler = async (req, res) => {
  try {
    const { hospitalId } = req.query;
    const stocks = await getCriticalStocks(hospitalId);

    res.status(200).json({
      success: true,
      count: stocks.length,
      data: stocks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStockSummaryHandler = async (req, res) => {
  try {
    const { hospitalId } = req.query;
    const summary = await getStockSummary(hospitalId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
