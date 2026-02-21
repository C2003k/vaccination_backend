import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

const seedNotifications = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/vaccination_tracker";
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    const users = await User.find({});
    if (users.length === 0) {
      console.log("No users found. Seed users before notifications.");
      process.exit(0);
    }

    await Notification.deleteMany({});

    const notifications = [];
    users.forEach((user) => {
      const base = {
        user: user._id,
        isRead: false,
      };

      if (user.role === "mother") {
        notifications.push({
          ...base,
          type: "reminder",
          priority: "high",
          title: "Upcoming Vaccination",
          message: "Your child has an upcoming vaccine visit in 7 days.",
        });
        notifications.push({
          ...base,
          type: "success",
          priority: "low",
          title: "Profile Updated",
          message: "Your profile details were updated successfully.",
          isRead: true,
        });
      }

      if (user.role === "health_worker") {
        notifications.push({
          ...base,
          type: "alert",
          priority: "high",
          title: "Follow-up Needed",
          message: "Two assigned mothers are overdue for follow-up visits.",
        });
        notifications.push({
          ...base,
          type: "system",
          priority: "medium",
          title: "Weekly Summary Ready",
          message: "Your weekly field activity summary is available.",
        });
      }

      if (user.role === "hospital_staff") {
        notifications.push({
          ...base,
          type: "alert",
          priority: "high",
          title: "Stock Alert",
          message: "BCG vaccine stock is running low at your facility.",
        });
        notifications.push({
          ...base,
          type: "system",
          priority: "medium",
          title: "Appointments Scheduled",
          message: "New vaccination appointments were scheduled today.",
        });
      }

      if (user.role === "admin") {
        notifications.push({
          ...base,
          type: "system",
          priority: "medium",
          title: "System Health Check",
          message: "All services are operational as of the latest check.",
        });
        notifications.push({
          ...base,
          type: "success",
          priority: "low",
          title: "User Created",
          message: "A new user account was created successfully.",
          isRead: true,
        });
      }
    });

    await Notification.insertMany(notifications);
    console.log(`Seeded ${notifications.length} notifications.`);

    process.exit(0);
  } catch (error) {
    console.error("Notification seeding error:", error);
    process.exit(1);
  }
};

seedNotifications();
