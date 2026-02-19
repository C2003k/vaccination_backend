import express from "express";
import {
    getAllChildrenHandler as getAllChildren,
    getChildByIdHandler as getChildById,
    createChildHandler as createChild,
    updateChildHandler as updateChild,
    deleteChildHandler as deleteChild,
    getChildrenByParentIdHandler as getChildrenByParentId,
    getChildrenByAgeRangeHandler as getChildrenByAgeRange,
    getChildVaccinationSummaryHandler as getChildVaccinationSummary,
    addGrowthRecordHandler as addGrowthRecord,
    getGrowthHistoryHandler as getGrowthHistory,
} from "../controllers/childController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLES } from "../config/roles.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Health workers and admins can access all children
router.get("/", verifyRoles(ROLES.HEALTH_WORKER, ROLES.ADMIN), getAllChildren);
router.get(
    "/age-range",
    verifyRoles(ROLES.HEALTH_WORKER, ROLES.ADMIN),
    getChildrenByAgeRange
);

// Parents can access their own children
router.get("/parent/:parentId", getChildrenByParentId);
router.get("/:id", getChildById);
router.post("/", verifyRoles(ROLES.MOTHER), createChild);
router.put("/:id", updateChild);
router.delete("/:id", deleteChild);

// Vaccination Summary
router.get("/:id/vaccination-summary", getChildVaccinationSummary);

// Growth Records
router.post("/:id/growth", addGrowthRecord);
router.get("/:id/growth", getGrowthHistory);

export default router;
