import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Connect to MongoDB database (simplified for MongoDB Driver 4.0+)
 */
const connectDB = async () => {
  try {
    // For MongoDB Driver 4.0+, you can just pass the URI
    // Most options are handled automatically
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected Successfully");

    // Optional: Set up event listeners for better debugging
    mongoose.connection.on(
      "error",
      console.error.bind(console, "MongoDB connection error:")
    );
  } catch (error) {
    console.error("MongoDB connection error:", error.message);

    // Provide helpful error messages
    if (error.name === "MongoParseError") {
      console.error("Check your MONGODB_URI format in .env file");
      console.error(
        "Format should be: mongodb://localhost:27017/your-database-name"
      );
    }

    if (error.name === "MongoServerSelectionError") {
      console.error(
        "⚠️  Make sure MongoDB is running locally or the remote server is accessible"
      );
      console.error(
        "⚠️  Run: sudo service mongod start (Linux) or mongod (macOS/Windows)"
      );
    }

    process.exit(1);
  }
};

export default connectDB;
