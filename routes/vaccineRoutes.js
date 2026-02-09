// import express from "express";
// import {
//   getVaccines,
//   getVaccine,
//   createVaccineHandler,
//   updateVaccineHandler,
//   getVaccinationScheduleHandler,
// } from "../controllers/vaccineController.js";
// import { verifyJWT } from "../middleware/verifyJWT.js";
// import { verifyRoles } from "../middleware/verifyRoles.js";
// import { ROLES } from "../config/roles.js";

// const router = express.Router();

// // Public routes
// router.get("/", getVaccines);
// router.get("/schedule", getVaccinationScheduleHandler);

// // Protected routes
// router.use(verifyJWT);

// router.get("/:id", getVaccine);
// router.post("/", verifyRoles(ROLES.ADMIN), createVaccineHandler);
// router.put("/:id", verifyRoles(ROLES.ADMIN), updateVaccineHandler);

// export default router;
