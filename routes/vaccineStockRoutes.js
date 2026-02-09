// import express from "express";
// import {
//   getVaccineStocks,
//   getVaccineStock,
//   getHospitalStocks,
//   createVaccineStockHandler,
//   updateVaccineStockHandler,
//   getCriticalStocksHandler,
//   getStockSummaryHandler,
//   getExpiringStocks,
//   recordStockUsage,
//   generateStockReport,
// } from "../controllers/vaccineStockController.js";
// import { verifyJWT } from "../middleware/verifyJWT.js";
// import { verifyRoles } from "../middleware/verifyRoles.js";
// import { ROLES } from "../config/roles.js";

// const router = express.Router();

// // All routes require authentication
// router.use(verifyJWT);

// // Read operations - accessible by hospital staff, health workers, and admin
// router.get(
//   "/",
//   verifyRoles(ROLES.ADMIN, "hospital_staff", ROLES.HEALTH_WORKER),
//   getVaccineStocks
// );
// router.get(
//   "/summary",
//   verifyRoles(ROLES.ADMIN, "hospital_staff", ROLES.HEALTH_WORKER),
//   getStockSummaryHandler
// );
// router.get(
//   "/critical",
//   verifyRoles(ROLES.ADMIN, "hospital_staff"),
//   getCriticalStocksHandler
// );
// router.get(
//   "/expiring",
//   verifyRoles(ROLES.ADMIN, "hospital_staff"),
//   getExpiringStocks
// );
// router.get(
//   "/hospital/:hospitalId",
//   verifyRoles(ROLES.ADMIN, "hospital_staff", ROLES.HEALTH_WORKER),
//   getHospitalStocks
// );
// router.get(
//   "/:id",
//   verifyRoles(ROLES.ADMIN, "hospital_staff", ROLES.HEALTH_WORKER),
//   getVaccineStock
// );
// router.post(
//   "/report",
//   verifyRoles(ROLES.ADMIN, "hospital_staff"),
//   generateStockReport
// );

// // Write operations - only hospital staff and admin
// router.post(
//   "/",
//   verifyRoles(ROLES.ADMIN, "hospital_staff"),
//   createVaccineStockHandler
// );
// router.put(
//   "/:id",
//   verifyRoles(ROLES.ADMIN, "hospital_staff"),
//   updateVaccineStockHandler
// );
// router.post(
//   "/:id/usage",
//   verifyRoles(ROLES.ADMIN, "hospital_staff"),
//   recordStockUsage
// );

// export default router;
