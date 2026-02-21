import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Import configurations
import corsOptions from "./config/corsOptions.js";
import connectDB from "./config/db.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import healthWorkerRoutes from "./routes/healthWorkerRoutes.js";
import childRoutes from "./routes/childRoutes.js";
import vaccineRoutes from "./routes/vaccineRoutes.js";
import vaccinationRecordRoutes from "./routes/vaccinationRecordRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import vaccineStockRoutes from "./routes/vaccineStockRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import motherRoutes from "./routes/motherRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

// Body parsing middleware - IMPORTANT: These must be before any route handlers that need req.body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Custom middleware to log req.body for debugging specific routes
// This should be placed *after* body parsing middleware but before routes
app.use((req, res, next) => {
  // Only log for POST requests to /api/auth/* endpoints
  // if (req.path.startsWith('/api/auth') && req.method === 'POST') {
  //   console.log("🐛 app.js - Incoming request to /api/auth. req.body:", req.body);
  // }
  next();
});

// Health check route - typically public
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Vaccination Tracker API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
  });
});

// API routes
// The order matters here. Public routes first, then authenticated ones.
app.use("/api/auth", authRoutes); // Authentication routes (login, register, etc.) - should be public
app.use("/api/users", userRoutes);
app.use("/api/health-worker", healthWorkerRoutes);
app.use("/api/children", childRoutes);
app.use("/api/vaccines", vaccineRoutes);
app.use("/api/vaccination-records", vaccinationRecordRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/vaccine-stocks", vaccineStockRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/mothers", motherRoutes);
app.use("/api/notifications", notificationRoutes);

// Handle undefined routes - catch all for routes not handled above
app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler - MUST be the last middleware
app.use(errorHandler);

export default app;
