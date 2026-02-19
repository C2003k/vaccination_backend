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
// import vaccineRoutes from "./routes/vaccineRoutes.js";
// import vaccinationRecordRoutes from "./routes/vaccinationRecordRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import vaccineStockRoutes from "./routes/vaccineStockRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

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

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Health check route
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
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/health-worker", healthWorkerRoutes);
app.use("/api/children", childRoutes);
// app.use("/api/vaccines", vaccineRoutes);
// app.use("/api/vaccination-records", vaccinationRecordRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/vaccine-stocks", vaccineStockRoutes);
app.use("/api/admin", adminRoutes);

// Handle undefined routes
app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

export default app;
