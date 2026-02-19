
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Hospital from "../models/Hospital.js";
import User from "../models/User.js";
import VaccineStock from "../models/VaccineStock.js"; // We might need this too
import Vaccine from "../models/Vaccine.js";

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const seedHospitals = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/vaccination_tracker";
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");

        // 1. Create a Hospital
        // Check if hospital exists
        let hospital = await Hospital.findOne({ name: "Central City Hospital" });
        if (!hospital) {
            console.log("Creating Hospital...");
            hospital = await Hospital.create({
                name: "Central City Hospital",
                type: "sub_county", // Matches enum
                facilityLevel: "level_4", // Matches enum
                location: {
                    county: "Nairobi",
                    subCounty: "Westlands",
                    ward: "Parklands",
                    coordinates: { lat: -1.265, lng: 36.804 } // Matches nested structure
                },
                contact: {
                    phone: "254711000000",
                    email: "info@centralhospital.co.ke",
                    address: "123 Healthcare Road, Westlands" // Added required field
                },
                isActive: true
            });
            console.log("Hospital created:", hospital.name);
        } else {
            console.log("Hospital already exists:", hospital.name);
        }

        // 2. Create Hospital Admin/Staff
        let staffUser = await User.findOne({ email: "admin@hospital.com" });
        if (!staffUser) {
            staffUser = await User.create({
                name: "Dr. Admin",
                username: "hospitaladmin",
                email: "admin@hospital.com",
                password: "password123",
                role: "hospital_staff",
                phone: "254722000000",
                isActive: true,
                isVerified: true,
                hospital: hospital._id // Link user to hospital
            });
            console.log("Hospital Staff created:", staffUser.email);
        } else {
            // Ensure link
            staffUser.hospital = hospital._id;
            await staffUser.save();
            console.log("Updated Staff User with Hospital link");
        }

        // Add user to hospital admins list
        if (!hospital.adminUsers.includes(staffUser._id)) {
            hospital.adminUsers.push(staffUser._id);
            await hospital.save();
        }

        // 3. Seed Vaccine Stocks for this Hospital
        const vaccines = await Vaccine.find();
        if (vaccines.length > 0) {
            await VaccineStock.deleteMany({ hospital: hospital._id });

            const stockData = vaccines.map(v => ({
                hospital: hospital._id,
                vaccine: v._id,
                quantity: Math.floor(Math.random() * 500) + 50,
                minimumStock: 100,
                maximumStock: 1000,
                batchNumber: `BATCH-${Math.floor(Math.random() * 10000)}`,
                expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                deliveryDate: new Date()
            }));

            await VaccineStock.insertMany(stockData);
            console.log(`Seeded ${stockData.length} vaccine stock records.`);
        } else {
            console.log("No vaccines found. Run seedVaccines.js first.");
        }

        console.log("Hospital Seeding Complete!");
        process.exit(0);

    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedHospitals();
