import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", verifyJWT, getMe);

export default router;
