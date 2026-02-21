import express from "express";
import {
  getMotherHandler,
  getMotherChildrenHandler,
  getReminderPreferencesHandler,
  updateReminderPreferencesHandler,
  getMotherRemindersHandler,
} from "../controllers/motherController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/:id", getMotherHandler);
router.get("/:id/children", getMotherChildrenHandler);
router.get("/:id/reminder-preferences", getReminderPreferencesHandler);
router.put("/:id/reminder-preferences", updateReminderPreferencesHandler);
router.get("/:id/reminders", getMotherRemindersHandler);

export default router;
