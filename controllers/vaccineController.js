import {
  getAllVaccines,
  getVaccineById,
  createVaccine,
  updateVaccine,
  getVaccinationSchedule,
} from "../services/VaccineService.js";

export const getVaccines = async (req, res) => {
  try {
    const { active } = req.query;
    const activeOnly = active !== "false";
    const vaccines = await getAllVaccines(activeOnly);

    res.status(200).json({
      success: true,
      count: vaccines.length,
      data: vaccines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getVaccine = async (req, res) => {
  try {
    const vaccine = await getVaccineById(req.params.id);

    res.status(200).json({
      success: true,
      data: vaccine,
    });
  } catch (error) {
    if (error.message === "Vaccine not found") {
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

export const createVaccineHandler = async (req, res) => {
  try {
    const vaccine = await createVaccine(req.body);

    res.status(201).json({
      success: true,
      message: "Vaccine created successfully",
      data: vaccine,
    });
  } catch (error) {
    if (
      error.message.includes("already exists") ||
      error.message.includes("required")
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

export const updateVaccineHandler = async (req, res) => {
  try {
    const vaccine = await updateVaccine(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Vaccine updated successfully",
      data: vaccine,
    });
  } catch (error) {
    if (error.message === "Vaccine not found") {
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

export const getVaccinationScheduleHandler = async (req, res) => {
  try {
    const { childId } = req.params;
    const { ageInMonths } = req.query;

    let age = parseInt(ageInMonths);
    if (!age) {
      // Calculate age from child's date of birth if childId provided
      // This would require fetching child details
      return res.status(400).json({
        success: false,
        message: "Age in months is required",
      });
    }

    const schedule = await getVaccinationSchedule(age);

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
