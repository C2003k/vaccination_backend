
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Child from "../models/Child.js";
import { ROLES } from "../config/roles.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const seedTestUsers = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/vaccination_tracker";
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");

        // Clear existing users and children (be careful in production!)
        await User.deleteMany({ email: { $in: ['chw@test.com', 'mother@test.com'] } });
        await Child.deleteMany({ name: { $in: ['Baby Test'] } });
        console.log("Cleared existing test users");

        // Create Health Worker
        const healthWorker = await User.create({
            name: "Sarah KW",
            username: "sarahchw",
            email: "chw@test.com",
            password: "password123",
            role: ROLES.HEALTH_WORKER,
            phone: "254712345678",
            isActive: true,
            isVerified: true
        });
        console.log("Health Worker created:", healthWorker.email);

        // Create Mother assigned to Health Worker
        const mother = await User.create({
            name: "Mary Mother",
            username: "marymother",
            email: "mother@test.com",
            password: "password123",
            role: ROLES.MOTHER,
            phone: "254723456789",
            assignedCHW: healthWorker._id,
            county: "Kitui County",
            subCounty: "Kitui Central",
            ward: "Township",
            location: "Majengo",
            isActive: true,
            isVerified: true
        });
        console.log("Mother created:", mother.email);

        // Create Child for Mother
        const child = await Child.create({
            parent: mother._id,
            name: "Baby Test",
            dateOfBirth: new Date(new Date().setMonth(new Date().getMonth() - 2)), // 2 months old
            gender: "male",
            birthWeight: 3.5,
            birthHeight: 50,
            vaccinationStatus: "not-started"
        });
        console.log("Child created:", child.name);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding test users:", error);
        process.exit(1);
    }
};

seedTestUsers();
