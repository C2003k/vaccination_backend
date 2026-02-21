import express from "express";
import {
  getUserNotifications,
  createNotification,
  updateNotification,
  markNotificationRead,
  markAllRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLES } from "../config/roles.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getUserNotifications);
router.post("/", verifyRoles(ROLES.ADMIN), createNotification);
router.put("/:id", verifyRoles(ROLES.ADMIN), updateNotification);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markNotificationRead);
router.delete("/:id", deleteNotification);

export default router;
