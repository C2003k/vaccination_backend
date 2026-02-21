import express from "express";
import {
    getDashboardStats,
    getAssignedMothers,
    getSchedule,
    createSchedule,
    updateSchedule,
    sendMotherReminder,
    getFieldReports,
    createFieldReport,
    recordVaccination
} from "../controllers/healthWorkerController.js";
import { verifyJWT as protect } from "../middleware/verifyJWT.js";
import { verifyRoles as authorize } from "../middleware/verifyRoles.js";
import { ROLES } from "../config/roles.js";

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize(ROLES.HEALTH_WORKER, ROLES.ADMIN)); // Allow CHW and Admin

router.get("/stats", getDashboardStats);
router.get("/assigned-mothers", getAssignedMothers);

// Schedule Routes
router.get("/schedule", getSchedule);
router.post("/schedule", createSchedule);
router.patch("/schedule/:id", updateSchedule);

router.post("/mothers/:motherId/reminder", sendMotherReminder);

// Field Reports Routes
router.get("/reports", getFieldReports);
router.post("/reports", createFieldReport);

// Vaccination Route
router.post("/vaccination", recordVaccination);

export default router;
