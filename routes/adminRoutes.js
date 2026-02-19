import express from "express";
import {
    getDashboardStats,
    getSystemActivity,
    getSystemHealth,
    getSettings,
    updateSettings,
    getAnalyticsData
} from "../controllers/adminController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { verifyAdmin } from "../middleware/verifyRoles.js";

const router = express.Router();

// All routes are protected and require Admin role
router.use(verifyJWT);
router.use(verifyAdmin);

router.get("/stats", getDashboardStats);
router.get("/activity", getSystemActivity);
router.get("/health", getSystemHealth);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.get("/analytics", getAnalyticsData);

export default router;
