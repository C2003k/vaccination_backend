import express from "express";
import {
  getHospitals,
  getHospital,
  createHospitalHandler,
  updateHospitalHandler,
  deleteHospitalHandler,
  getHospitalDashboardHandler,
  getFacilityInfoHandler,
  updateFacilityInfoHandler,
  getPatientsHandler,
  getPatientDetailHandler,
  getCoverageReportsHandler,
  linkHospitalStaffHandler,
  unlinkHospitalStaffHandler,
  getEligibleHealthWorkersHandler,
  getEligibleMothersHandler,
  assignMotherToHealthWorkerHandler,
} from "../controllers/hospitalController.js";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLES } from "../config/roles.js";
import {
  getHospitalsByCounty,
  updateHospitalCoverage,
  addAdminToHospital,
  removeAdminFromHospital,
  findNearbyHospitals,
  getHospitalStatistics,
  getHospitalSystemSummary,
  getHospitalStaff,
  getUserHospital,
  updateHospital,
} from "../services/HospitalService.js";
import { getStockSummary } from "../services/VaccineStockService.js";

const router = express.Router();

router.use(verifyJWT);

const ensureHospitalAccess = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.HOSPITAL_STAFF) {
      return next();
    }

    const hospitalId = req.params.id || req.params.hospitalId;
    const userHospital = await getUserHospital(req.user.id);
    if (!userHospital || userHospital._id.toString() !== hospitalId) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to access this hospital" });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.get(
  "/",
  verifyRoles(ROLES.ADMIN, ROLES.HEALTH_WORKER, ROLES.HOSPITAL_STAFF),
  getHospitals
);

router.get(
  "/search",
  verifyRoles(ROLES.ADMIN, ROLES.HEALTH_WORKER, ROLES.HOSPITAL_STAFF),
  getHospitals
);

router.get(
  "/county/:county",
  verifyRoles(ROLES.ADMIN, ROLES.HEALTH_WORKER, ROLES.HOSPITAL_STAFF),
  async (req, res) => {
    try {
      const hospitals = await getHospitalsByCounty(req.params.county);
      res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.get(
  "/nearby",
  verifyRoles(ROLES.ADMIN, ROLES.HEALTH_WORKER, ROLES.HOSPITAL_STAFF, ROLES.MOTHER),
  async (req, res) => {
    try {
      const { lat, lng, maxDistance = 5000 } = req.query;
      if (!lat || !lng) {
        return res
          .status(400)
          .json({ success: false, message: "Latitude and longitude are required" });
      }

      const hospitals = await findNearbyHospitals(
        parseFloat(lat),
        parseFloat(lng),
        parseInt(maxDistance, 10)
      );

      res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.get(
  "/statistics/summary",
  verifyRoles(ROLES.ADMIN),
  async (req, res) => {
    try {
      const summary = await getHospitalSystemSummary();
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.get(
  "/:id/dashboard",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  async (req, res, next) => {
    try {
      if (req.user.role === ROLES.HOSPITAL_STAFF) {
        const userHospital = await getUserHospital(req.user.id);
        if (!userHospital || userHospital._id.toString() !== req.params.id) {
          return res
            .status(403)
            .json({ success: false, message: "Not authorized to access this hospital dashboard" });
        }
      }
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  getHospitalDashboardHandler
);

router.get(
  "/:id/statistics",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  async (req, res) => {
    try {
      const { period = "monthly", startDate, endDate } = req.query;
      const data = await getHospitalStatistics(req.params.id, period, startDate, endDate);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.get(
  "/:id/staff",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  ensureHospitalAccess,
  async (req, res) => {
    try {
      const staff = await getHospitalStaff(req.params.id);
      res.status(200).json({ success: true, count: staff.length, data: staff });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.post(
  "/:hospitalId/staff",
  verifyRoles(ROLES.ADMIN),
  linkHospitalStaffHandler
);
router.delete(
  "/:hospitalId/staff/:userId",
  verifyRoles(ROLES.ADMIN),
  unlinkHospitalStaffHandler
);

router.get(
  "/:hospitalId/eligible-health-workers",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  ensureHospitalAccess,
  getEligibleHealthWorkersHandler
);
router.get(
  "/:hospitalId/eligible-mothers",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  ensureHospitalAccess,
  getEligibleMothersHandler
);
router.post(
  "/:hospitalId/mother-assignments",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  ensureHospitalAccess,
  assignMotherToHealthWorkerHandler
);

router.get(
  "/:id/stock-summary",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  async (req, res) => {
    try {
      const data = await getStockSummary(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.get(
  "/:hospitalId/appointments",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  getAppointments
);
router.post(
  "/:hospitalId/appointments",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  createAppointment
);
router.put(
  "/:hospitalId/appointments/:appointmentId",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  updateAppointment
);
router.delete(
  "/:hospitalId/appointments/:appointmentId",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  deleteAppointment
);
router.patch(
  "/:hospitalId/appointments/:appointmentId/status",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  updateAppointmentStatus
);

router.get(
  "/:hospitalId/facility",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  getFacilityInfoHandler
);
router.put(
  "/:hospitalId/facility",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  updateFacilityInfoHandler
);

router.get(
  "/:hospitalId/patients",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  getPatientsHandler
);
router.get(
  "/:hospitalId/patients/:patientId",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  getPatientDetailHandler
);

router.get(
  "/:hospitalId/coverage-reports",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  getCoverageReportsHandler
);

router.get(
  "/:id",
  verifyRoles(ROLES.ADMIN, ROLES.HEALTH_WORKER, ROLES.HOSPITAL_STAFF, ROLES.MOTHER),
  getHospital
);

router.post("/", verifyRoles(ROLES.ADMIN), createHospitalHandler);
router.put("/:id", verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF), updateHospitalHandler);
router.delete("/:id", verifyRoles(ROLES.ADMIN), deleteHospitalHandler);

router.post("/:id/admins", verifyRoles(ROLES.ADMIN), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    const hospital = await addAdminToHospital(req.params.id, userId);
    res.status(200).json({
      success: true,
      message: "Admin added to hospital successfully",
      data: hospital,
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
});

router.delete("/:id/admins/:userId", verifyRoles(ROLES.ADMIN), async (req, res) => {
  try {
    const hospital = await removeAdminFromHospital(req.params.id, req.params.userId);
    res.status(200).json({
      success: true,
      message: "Admin removed from hospital successfully",
      data: hospital,
    });
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put(
  "/:id/coverage",
  verifyRoles(ROLES.ADMIN, ROLES.HOSPITAL_STAFF),
  async (req, res) => {
    try {
      const { current, target } = req.body;
      if (current === undefined) {
        return res
          .status(400)
          .json({ success: false, message: "Current coverage rate is required" });
      }

      const hospital = await updateHospitalCoverage(req.params.id, {
        current: parseFloat(current),
        target: target !== undefined ? parseFloat(target) : 90,
      });

      res.status(200).json({
        success: true,
        message: "Coverage updated successfully",
        data: hospital,
      });
    } catch (error) {
      res.status(error.message === "Hospital not found" ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.patch("/:id/activate", verifyRoles(ROLES.ADMIN), async (req, res) => {
  try {
    const hospital = await updateHospital(req.params.id, { isActive: true });
    res.status(200).json({ success: true, message: "Hospital activated successfully", data: hospital });
  } catch (error) {
    res.status(error.message === "Hospital not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
});

router.patch("/:id/deactivate", verifyRoles(ROLES.ADMIN), async (req, res) => {
  try {
    const hospital = await updateHospital(req.params.id, { isActive: false });
    res.status(200).json({
      success: true,
      message: "Hospital deactivated successfully",
      data: hospital,
    });
  } catch (error) {
    res.status(error.message === "Hospital not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
