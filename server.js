import app from "./app.js"; // server entry point
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import cluster from "cluster";
import os from "os";

// Load environment variables
dotenv.config();

/**
 * Start Express server with optional clustering
 */
const startServer = () => {
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || "localhost";

  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize Socket.IO for real-time features
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:3000",
      ],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Join room for specific user
    socket.on("join-user", (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join room for specific hospital
    socket.on("join-hospital", (hospitalId) => {
      socket.join(`hospital-${hospitalId}`);
      console.log(`Hospital ${hospitalId} room joined`);
    });

    // Handle vaccination updates
    socket.on("vaccination-recorded", (data) => {
      io.to(`hospital-${data.hospitalId}`).emit("new-vaccination", data);
      io.to(`user-${data.motherId}`).emit("vaccination-updated", data);
    });

    // Handle stock updates
    socket.on("stock-updated", (data) => {
      io.to(`hospital-${data.hospitalId}`).emit("stock-changed", data);
    });

    // Handle appointment updates
    socket.on("appointment-updated", (data) => {
      io.to(`user-${data.userId}`).emit("appointment-changed", data);
      io.to(`hospital-${data.hospitalId}`).emit("appointment-update", data);
    });

    // Disconnect handling
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Make io accessible to routes
  app.set("io", io);

  // Start server
  httpServer.listen(PORT, HOST, () => {
    console.log(`Server started successfully on http://${HOST}:${PORT}`);
  });

  // Handle graceful shutdown
  const gracefulShutdown = () => {
    console.log(
      "\n Received shutdown signal. Graceful shutdown initiated..."
    );

    // Close HTTP server
    httpServer.close(() => {
      console.log(" HTTP server closed");

      // Close database connections here if needed

      console.log("All connections closed. Exiting process.");
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error(
        "❌ Could not close connections in time. Forcing shutdown."
      );
      process.exit(1);
    }, 10000);
  };

  // Handle different shutdown signals
  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    gracefulShutdown();
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown();
  });

  return httpServer;
};

// Enable clustering for production
if (process.env.CLUSTER_MODE === "true" && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(
    `🔄 Master process ${process.pid} is running with ${numCPUs} workers`
  );

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker exit
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  // Start server in worker process
  startServer();
}

export default startServer;
