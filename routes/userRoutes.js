import express from "express";
import {
  returnAllUsers,
  returnUserById,
  updateAnExistingUser,
  deleteAnExistingUser,
  getUsersByRoleHandler,
  updateUserPasswordHandler,
} from "../controllers/userController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { verifyRoles } from "../middleware/verifyRoles.js";
import { ROLES } from "../config/roles.js";

const router = express.Router();

// All routes are protected
router.use(verifyJWT);

// Admin only routes
router.get("/", verifyRoles(ROLES.ADMIN), returnAllUsers);
router.get("/role/:role", verifyRoles(ROLES.ADMIN), getUsersByRoleHandler);
router.delete("/:id", verifyRoles(ROLES.ADMIN), deleteAnExistingUser);

// User can access their own data
router.get("/:id", returnUserById);
router.put("/:id", updateAnExistingUser);
router.put("/:id/password", updateUserPasswordHandler);

export default router;
