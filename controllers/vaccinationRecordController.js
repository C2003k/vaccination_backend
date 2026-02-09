import {
  getAllVaccinationRecords,
  getVaccinationRecordById,
  getRecordsByChildId,
  createVaccinationRecord,
  getChildVaccinationStatus,
} from "../services/VaccinationRecordService.js";

export const getVaccinationRecords = async (req, res) => {
  try {
    const { childId, vaccineId, startDate, endDate } = req.query;
    const filters = {};

    if (childId) filters.child = childId;
    if (vaccineId) filters.vaccine = vaccineId;
    if (startDate || endDate) {
      filters.dateGiven = {};
      if (startDate) filters.dateGiven.$gte = new Date(startDate);
      if (endDate) filters.dateGiven.$lte = new Date(endDate);
    }

    const records = await getAllVaccinationRecords(filters);

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getVaccinationRecord = async (req, res) => {
  try {
    const record = await getVaccinationRecordById(req.params.id);

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    if (error.message === "Vaccination record not found") {
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

export const getChildVaccinationRecords = async (req, res) => {
  try {
    const records = await getRecordsByChildId(req.params.childId);

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    if (error.message === "Child not found") {
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

export const recordVaccination = async (req, res) => {
  try {
    const healthWorkerId = req.user.id;
    const record = await createVaccinationRecord(req.body, healthWorkerId);

    res.status(201).json({
      success: true,
      message: "Vaccination recorded successfully",
      data: record,
    });
  } catch (error) {
    if (
      error.message.includes("required") ||
      error.message.includes("not found") ||
      error.message.includes("already recorded") ||
      error.message.includes("Unauthorized")
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

export const getChildVaccinationStatusHandler = async (req, res) => {
  try {
    const status = await getChildVaccinationStatus(req.params.childId);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    if (error.message === "Child not found") {
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
