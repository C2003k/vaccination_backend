// import express from "express";
// import {
//   getCoverageReportsHandler,
//   getCoverageReportHandler,
//   generateCoverageReportHandler,
//   updateCoverageReportHandler,
//   getRegionalCoverageHandler,
//   getVaccineCoverageTrendsHandler,
//   getCoverageGapAnalysisHandler,
// } from "../controllers/coverageController.js";
// import { verifyJWT } from "../middleware/verifyJWT.js";
// import { verifyRoles } from "../middleware/verifyRoles.js";
// import { ROLES } from "../config/roles.js";

// const router = express.Router();

// // All routes require authentication
// router.use(verifyJWT);

// // Public coverage data (read-only)
// router.get("/regional", getRegionalCoverageHandler);
// router.get("/trends", getVaccineCoverageTrendsHandler);
// router.get("/gap-analysis", getCoverageGapAnalysisHandler);

// // Hospital staff and admin can access reports
// router.get(
//   "/",
//   verifyRoles(ROLES.ADMIN, "hospital_staff", ROLES.HEALTH_WORKER),
//   getCoverageReportsHandler
// );
// router.get(
//   "/:id",
//   verifyRoles(ROLES.ADMIN, "hospital_staff", ROLES.HEALTH_WORKER),
//   getCoverageReportHandler
// );

// // Only hospital staff and admin can generate/update reports
// router.post(
//   "/",
//   verifyRoles(ROLES.ADMIN, "hospital_staff"),
//   generateCoverageReportHandler
// );
// router.put(
//   "/:id",
//   verifyRoles(ROLES.ADMIN, "hospital_staff"),
//   updateCoverageReportHandler
// );

// export default router;
