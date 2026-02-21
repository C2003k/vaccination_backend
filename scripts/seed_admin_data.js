import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from "bcryptjs";

// Models
import Hospital from "../models/Hospital.js";
import User from "../models/User.js";
import Vaccine from "../models/Vaccine.js";
import Child from "../models/Child.js";
import VaccinationRecord from "../models/VaccinationRecord.js";
import SystemLog from "../models/SystemLog.js";
import { ROLES } from "../config/roles.js";

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const seedAdminData = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/vaccination_tracker";
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");

        // Clear existing data for a fresh start (optional, but good for testing)
        console.log("Clearing existing data...");
        await User.deleteMany({});
        await Hospital.deleteMany({});
        await Vaccine.deleteMany({});
        await Child.deleteMany({});
        await VaccinationRecord.deleteMany({});
        await SystemLog.deleteMany({});

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash("admin123", salt);

        // 1. Create System Admin
        console.log("Creating System Admin...");
        const admin = await User.create({
            name: "System Administrator",
            username: "admin",
            email: "admin@vactrack.com",
            password: hashedPassword,
            role: ROLES.ADMIN,
            phone: "254700000000",
            isActive: true,
            isVerified: true
        });

        // 2. Create Hospitals
        console.log("Creating Hospitals...");
        const hospitals = await Hospital.insertMany([
            {
                name: "Nairobi Referral Hospital",
                type: "national_referral",
                facilityLevel: "level_6",
                location: { county: "Nairobi", subCounty: "Dagoretti", ward: "Kenyatta" },
                contact: { phone: "254711111111", email: "nrh@health.go.ke", address: "Hospital Rd" },
                isActive: true
            },
            {
                name: "Mombasa General Hospital",
                type: "county",
                facilityLevel: "level_5",
                location: { county: "Mombasa", subCounty: "Mvita", ward: "Island" },
                contact: { phone: "254722222222", email: "mgh@mombasa.go.ke", address: "Coast Ave" },
                isActive: true
            }
        ]);

        // 3. Create Health Workers and Hospital Staff
        console.log("Creating Health Workers and Staff...");
        const staffHashedPassword = await bcrypt.hash("password123", salt);
        
        const staff = await User.insertMany([
            {
                name: "Dr. Jane Smith",
                username: "janesmith",
                email: "jane@nrh.com",
                password: staffHashedPassword,
                role: ROLES.HOSPITAL_STAFF,
                hospital: hospitals[0]._id,
                phone: "254733333333",
                isActive: true,
                isVerified: true
            },
            {
                name: "John CHW",
                username: "johnchw",
                email: "john@chw.com",
                password: staffHashedPassword,
                role: ROLES.HEALTH_WORKER,
                phone: "254744444444",
                isActive: true,
                isVerified: true
            }
        ]);

        // 4. Create some activity logs
        console.log("Creating System Logs...");
        await SystemLog.insertMany([
            {
                user: admin._id,
                action: "USER_LOGIN",
                module: "Auth",
                status: "success",
                description: "Admin logged into the system",
                ipAddress: "127.0.0.1"
            },
            {
                user: admin._id,
                action: "HOSPITAL_CREATE",
                module: "HospitalManagement",
                status: "success",
                description: "Created Nairobi Referral Hospital",
                ipAddress: "127.0.0.1"
            }
        ]);

        // 5. Create Vaccines
        console.log("Creating Vaccines...");
        const vaccines = await Vaccine.insertMany([
            { name: "BCG", code: "BCG", description: "Tuberculosis Vaccine", protectsAgainst: ["Tuberculosis"], dueAtBirth: true, recommendedAge: { months: 0, weeks: 0 }, dosage: "0.05ml", route: "Intradermal", site: "Left upper arm", isActive: true },
            { name: "OPV", code: "OPV", description: "Oral Polio Vaccine", protectsAgainst: ["Polio"], dueAtBirth: true, recommendedAge: { months: 0, weeks: 0 }, dosage: "2 drops", route: "Oral", site: "Mouth", isActive: true },
            { name: "Pentavalent", code: "PENTA", description: "Pentavalent Vaccine", protectsAgainst: ["DPT", "HepB", "Hib"], dueAtBirth: false, recommendedAge: { months: 0, weeks: 6 }, dosage: "0.5ml", route: "Intramuscular", site: "Left outer thigh", isActive: true }
        ]);

        console.log("Seeding Complete!");
        console.log("Admin Email: admin@vactrack.com");
        console.log("Admin Password: admin123");
        
        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedAdminData();
