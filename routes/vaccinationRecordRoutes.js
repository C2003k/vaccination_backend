// import express from "express";
// import {
//   getVaccinationRecords,
//   getVaccinationRecord,
//   getChildVaccinationRecords,
//   recordVaccination,
//   getChildVaccinationStatusHandler,
// } from "../controllers/vaccinationRecordController.js";
// import { verifyJWT } from "../middleware/verifyJWT.js";
// import { verifyRoles } from "../middleware/verifyRoles.js";
// import { ROLES } from "../config/roles.js";

// const router = express.Router();

// // All routes require authentication
// router.use(verifyJWT);

// // Health workers and admins can access all routes
// router.get(
//   "/",
//   verifyRoles(ROLES.HEALTH_WORKER, ROLES.ADMIN),
//   getVaccinationRecords
// );
// router.get("/child/:childId", getChildVaccinationRecords);
// router.get("/child/:childId/status", getChildVaccinationStatusHandler);
// router.get("/:id", getVaccinationRecord);
// router.post(
//   "/",
//   verifyRoles(ROLES.HEALTH_WORKER, ROLES.ADMIN),
//   recordVaccination
// );

// export default router;
