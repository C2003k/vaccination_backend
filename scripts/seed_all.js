import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from "bcryptjs";

// Models
import Hospital from "../models/Hospital.js";
import User from "../models/User.js";
import Vaccine from "../models/Vaccine.js";
import VaccineStock from "../models/VaccineStock.js";
import Child from "../models/Child.js";
import Appointment from "../models/Appointment.js"; // You might need to check if this model exists and import it correctly. 
// Note: I am assuming Appointment model exists based on previous code.

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const vaccines = [
    { name: "BCG", code: "BCG", description: "Tuberculosis Vaccine", protectsAgainst: ["Tuberculosis"], dueAtBirth: true, recommendedAge: { months: 0, weeks: 0 }, dosage: "0.05ml", route: "Intradermal", site: "Left upper arm" },
    { name: "OPV0", code: "OPV0", description: "Oral Polio Vaccine 0", protectsAgainst: ["Polio"], dueAtBirth: true, recommendedAge: { months: 0, weeks: 0 }, dosage: "2 drops", route: "Oral", site: "Mouth" },
    { name: "PENTA1", code: "PENTA1", description: "Pentavalent Vaccine 1", protectsAgainst: ["DPT", "HepB", "Hib"], dueAtBirth: false, recommendedAge: { months: 0, weeks: 6 }, dosage: "0.5ml", route: "Intramuscular", site: "Left outer thigh" },
    { name: "PCV1", code: "PCV1", description: "Pneumococcal Conjugate Vaccine 1", protectsAgainst: ["Pneumonia"], dueAtBirth: false, recommendedAge: { months: 0, weeks: 6 }, dosage: "0.5ml", route: "Intramuscular", site: "Right outer thigh" },
    { name: "Measles", code: "MR1", description: "Measles Rubella Vaccine 1", protectsAgainst: ["Measles", "Rubella"], dueAtBirth: false, recommendedAge: { months: 9, weeks: 0 }, dosage: "0.5ml", route: "Subcutaneous", site: "Right upper arm" }
];

const seedAll = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/vaccination_tracker";
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");

        // 1. Clear Data
        console.log("Clearing existing data...");
        await Appointment.deleteMany({});
        await Child.deleteMany({});
        await VaccineStock.deleteMany({});
        await Vaccine.deleteMany({});
        // We will TRY to keep the hospital and admin if they exist, to avoid breaking other things, 
        // but for a clean seed, maybe better to clear everything?
        // Let's clear everything to be safe and consistent.
        await Hospital.deleteMany({});
        await User.deleteMany({});

        console.log("Data cleared.");

        // 2. Seed Vaccines
        console.log("Seeding Vaccines...");
        const createdVaccines = await Vaccine.insertMany(vaccines.map(v => ({ ...v, isActive: true })));
        const vaccineMap = {};
        createdVaccines.forEach(v => vaccineMap[v.code] = v._id);

        // 3. Create Hospital
        console.log("Creating Hospital...");
        const hospital = await Hospital.create({
            name: "Central City Hospital",
            type: "sub_county",
            facilityLevel: "level_4",
            location: {
                county: "Nairobi",
                subCounty: "Westlands",
                ward: "Parklands",
                coordinates: { lat: -1.265, lng: 36.804 }
            },
            contact: {
                phone: "254711000000",
                email: "info@centralhospital.co.ke",
                address: "Healthcare Road"
            },
            stats: { total: 0 }, // Initialize stats
            isActive: true
        });

        // 4. Create Users (Admin, Staff, Mothers)
        console.log("Creating Users...");
        const admin = await User.create({
            name: "Dr. Admin",
            username: "admin",
            email: "admin@hospital.com",
            password: "password123", // Let the pre-save hook hash it
            role: "hospital_staff",
            phone: "254722000000",
            hospital: hospital._id,
            isActive: true,
            isVerified: true
        });

        // Link admin to hospital
        hospital.adminUsers.push(admin._id);
        await hospital.save();

        const mothers = [];
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        for (let i = 1; i <= 10; i++) {
            mothers.push({
                name: `Mother ${i}`,
                username: `mother${i}`,
                email: `mother${i}@test.com`,
                password: hashedPassword,
                role: "mother",
                phone: `2547000000${i.toString().padStart(2, '0')}`,
                location: "Westlands",
                isActive: true,
                isVerified: true
            });
        }
        const createdMothers = await User.insertMany(mothers);

        // 5. Create Children
        console.log("Creating Children...");
        const children = [];
        const createdChildren = [];

        for (const mother of createdMothers) {
            // Each mother has 1-2 children
            const numChildren = Math.floor(Math.random() * 2) + 1;
            for (let j = 0; j < numChildren; j++) {
                // Random age between 0 and 5 years (in ms)
                const ageInMs = Math.floor(Math.random() * 5 * 365 * 24 * 60 * 60 * 1000);
                const dob = new Date(Date.now() - ageInMs);

                const child = await Child.create({
                    parent: mother._id,
                    name: `Child ${mother.name.split(' ')[1]}-${j + 1}`,
                    dateOfBirth: dob,
                    gender: Math.random() > 0.5 ? "male" : "female",
                    birthWeight: 3.5,
                    birthHeight: 50,
                    vaccinationStatus: "up-to-date"
                });
                createdChildren.push(child);
            }
        }

        // 6. Create Appointments (Simulate history)
        console.log("Creating Appointments...");
        const appointments = [];
        const statuses = ["completed", "completed", "completed", "scheduled", "no_show"];

        for (const child of createdChildren) {
            // For each vaccine, create an appointment
            // Randomly decide if it's done, scheduled, or missed based on age logic would be better,
            // but for simple seeding we just randomize.

            for (const v of createdVaccines) {
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                // If scheduled/missed, date should be future/past respectively
                let date = new Date();
                if (status === "completed" || status === "missed") {
                    date.setDate(date.getDate() - Math.floor(Math.random() * 300));
                } else {
                    date.setDate(date.getDate() + Math.floor(Math.random() * 60));
                }

                appointments.push({
                    hospital: hospital._id,
                    child: child._id,
                    mother: child.parent,
                    vaccine: v._id,
                    scheduledDate: date,
                    scheduledTime: "10:00 AM", // Add default time
                    status: status,
                    type: "vaccination"
                    // notes: "Seeded appointment"
                });
            }
        }
        await Appointment.insertMany(appointments);

        // 7. Seed Vaccine Stock
        console.log("Seeding Stock...");
        const stocks = createdVaccines.map(v => ({
            hospital: hospital._id,
            vaccine: v._id,
            quantity: Math.floor(Math.random() * 500) + 50,
            minimumStock: 100,
            maximumStock: 1000,
            batchNumber: `BATCH-${Math.floor(Math.random() * 10000)}`,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            deliveryDate: new Date(), // Add delivery date
            status: "adequate"
        }));
        await VaccineStock.insertMany(stocks);

        console.log("Seeding Complete!");
        console.log("-----------------------------------");
        console.log(`Hospital: ${hospital.name}`);
        console.log(`Admin Email: ${admin.email}`);
        console.log(`Password: password123`);
        console.log(`Mothers: ${createdMothers.length}`);
        console.log(`Children: ${createdChildren.length}`);
        console.log(`Appointments: ${appointments.length}`);
        console.log("-----------------------------------");

        process.exit(0);

    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedAll();
