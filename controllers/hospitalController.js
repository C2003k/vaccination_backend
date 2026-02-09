import {
  getAllHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  deleteHospital,
  getHospitalsByCounty,
  getHospitalDashboard,
} from "../services/HospitalService.js";

export const getHospitals = async (req, res) => {
  try {
    const { county, type, status } = req.query;
    const filters = {};

    if (county) filters["location.county"] = county;
    if (type) filters.type = type;
    if (status) filters.isActive = status === "active";

    const hospitals = await getAllHospitals(filters);

    res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getHospital = async (req, res) => {
  try {
    const hospital = await getHospitalById(req.params.id);

    res.status(200).json({
      success: true,
      data: hospital,
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

export const createHospitalHandler = async (req, res) => {
  try {
    const hospital = await createHospital(req.body);

    res.status(201).json({
      success: true,
      message: "Hospital created successfully",
      data: hospital,
    });
  } catch (error) {
    if (
      error.message.includes("required") ||
      error.message.includes("Phone must be")
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

export const updateHospitalHandler = async (req, res) => {
  try {
    const hospital = await updateHospital(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Hospital updated successfully",
      data: hospital,
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

export const deleteHospitalHandler = async (req, res) => {
  try {
    const result = await deleteHospital(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
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

export const getHospitalDashboardHandler = async (req, res) => {
  try {
    const dashboard = await getHospitalDashboard(req.params.id);

    res.status(200).json({
      success: true,
      data: dashboard,
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
