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
import Appointment from "../models/Appointment.js";
import VaccinationRecord from "../models/VaccinationRecord.js";
import SystemLog from "../models/SystemLog.js"; // For dashboard activity
import { ROLES } from "../config/roles.js";

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const seedHospitalData = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/vaccination_tracker";
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");

        console.log("Clearing existing children, appointments, vaccination records, vaccine stocks, and users...");
        await Appointment.deleteMany({});
        await Child.deleteMany({});
        await VaccinationRecord.deleteMany({});
        await VaccineStock.deleteMany({});
        await User.deleteMany({});
        // Keep hospitals and vaccines from previous admin seed

        // Re-create the main admin and hospital staff
        console.log("Re-creating System Admin and Hospital Staff...");
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash("admin123", salt);

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

        // Find existing hospitals (should be seeded by seed_admin_data.js first)
        const hospitals = await Hospital.find({});
        if (hospitals.length === 0) {
            console.error("No hospitals found. Please run seed_admin_data.js first or ensure it seeds hospitals.");
            process.exit(1);
        }

        const staffHashedPassword = await bcrypt.hash("password123", salt);
        const hospitalStaffUser = await User.create({
            name: "Dr. Jane Smith",
            username: "janesmith",
            email: "jane@nrh.com",
            password: staffHashedPassword,
            role: ROLES.HOSPITAL_STAFF,
            hospital: hospitals[0]._id, // Link to the first seeded hospital
            phone: "254733333333",
            isActive: true,
            isVerified: true
        });

        // Ensure the hospital has this staff member in its adminUsers array if applicable
        // This is primarily for linking the hospital to the staff member as an "admin" type for that hospital
        if (!hospitals[0].adminUsers.includes(hospitalStaffUser._id)) {
            hospitals[0].adminUsers.push(hospitalStaffUser._id);
            await hospitals[0].save();
        }

        // Find existing vaccines (should be seeded by seed_admin_data.js first)
        const vaccines = await Vaccine.find({});
        if (vaccines.length === 0) {
            console.error("No vaccines found. Please run seed_admin_data.js first or ensure it seeds vaccines.");
            process.exit(1);
        }

        // Use this hospital staff for seeding appointments/records
        const hospitalStaffForSeeding = [hospitalStaffUser];

        // Seed Mothers
        console.log("Creating Mothers...");
        const mothers = [];
        for (let i = 1; i <= 20; i++) {
            mothers.push({
                name: `Mother ${i}`,
                username: `mother${i}`,
                email: `mother${i}@example.com`,
                password: hashedPassword,
                role: ROLES.MOTHER,
                phone: `2547000001${String(i).padStart(2, '0')}`,
                location: hospitals[0].location.county, // Link to first hospital's county
                isActive: true,
                isVerified: true
            });
        }
        const createdMothers = await User.insertMany(mothers);

        // Seed Children, Appointments, and Vaccination Records
        console.log("Creating Children, Appointments, and Vaccination Records...");
        const createdChildren = [];
        const allAppointments = [];
        const allVaccinationRecords = [];

        for (const mother of createdMothers) {
            const numChildren = Math.floor(Math.random() * 2) + 1; // 1 or 2 children per mother
            for (let j = 0; j < numChildren; j++) {
                const dob = new Date(Date.now() - Math.floor(Math.random() * 5 * 365 * 24 * 60 * 60 * 1000)); // 0-5 years old
                const childHospital = hospitals[Math.floor(Math.random() * hospitals.length)]; // Assign to a random hospital

                const child = await Child.create({
                    parent: mother._id,
                    name: `Child ${mother.name.split(' ')[1]}-${j + 1}`,
                    dateOfBirth: dob,
                    gender: Math.random() > 0.5 ? "male" : "female",
                    birthWeight: (Math.random() * 2 + 2.5).toFixed(1), // 2.5 to 4.5 kg
                    birthHeight: (Math.random() * 10 + 45).toFixed(1), // 45 to 55 cm
                    vaccinationStatus: "not-started", // Will be updated by records
                    hospital: childHospital._id
                });
                createdChildren.push(child);

                // Create appointments and records for this child
                for (const vaccine of vaccines) {
                    const scheduledDate = new Date(dob);
                    scheduledDate.setMonth(scheduledDate.getMonth() + vaccine.recommendedAge.months);
                    scheduledDate.setDate(scheduledDate.getDate() + (vaccine.recommendedAge.weeks * 7));

                    let status = "scheduled";
                    let dateGiven = null;
                    if (Math.random() < 0.7) { // 70% chance of being completed
                        status = "completed";
                        dateGiven = new Date(scheduledDate.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)); // within 7 days of scheduled
                    } else if (Math.random() < 0.5) { // 15% chance of being no_show
                        status = "no_show";
                    }

                    const appointment = {
                        hospital: childHospital._id,
                        child: child._id,
                        mother: mother._id,
                        vaccine: vaccine._id,
                        scheduledDate: scheduledDate,
                        scheduledTime: "10:00 AM",
                        status: status,
                        type: "vaccination"
                    };
                    allAppointments.push(appointment);

                    if (status === "completed") {
                        const record = {
                            hospital: childHospital._id,
                            child: child._id,
                            mother: mother._id,
                            vaccine: vaccine._id,
                            vaccineName: vaccine.name,
                            dateGiven: dateGiven,
                            givenBy: hospitalStaffForSeeding[0]._id, // Assign to first hospital staff
                            doseSequence: 1, // Default to 1 for simplicity
                            batchNumber: `BATCH-${Math.floor(Math.random() * 10000)}`,
                            notes: "Seeded vaccination record"
                        };
                        allVaccinationRecords.push(record);
                    }
                }
            }
        }
        await Appointment.insertMany(allAppointments);
        await VaccinationRecord.insertMany(allVaccinationRecords);

        // Seed Vaccine Stock for each hospital
        console.log("Seeding Vaccine Stock...");
        const allVaccineStocks = [];
        for (const hospital of hospitals) {
            for (const vaccine of vaccines) {
                allVaccineStocks.push({
                    hospital: hospital._id,
                    vaccine: vaccine._id,
                    quantity: Math.floor(Math.random() * 500) + 100, // 100-600 doses
                    minimumStock: 150,
                    maximumStock: 700,
                    batchNumber: `H${hospital._id.toString().substring(0, 4)}-V${vaccine._id.toString().substring(0, 4)}-B${Math.floor(Math.random() * 1000)}`,
                    expiryDate: new Date(Date.now() + Math.floor(Math.random() * 365 + 30) * 24 * 60 * 60 * 1000), // 30-395 days from now
                    deliveryDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000), // up to 90 days ago
                    status: "adequate" // Will be dynamically calculated later
                });
            }
        }
        await VaccineStock.insertMany(allVaccineStocks);

        console.log("Hospital Data Seeding Complete!");
        console.log(`Created Mothers: ${createdMothers.length}`);
        console.log(`Created Children: ${createdChildren.length}`);
        console.log(`Created Appointments: ${allAppointments.length}`);
        console.log(`Created Vaccination Records: ${allVaccinationRecords.length}`);
        console.log(`Created Vaccine Stocks: ${allVaccineStocks.length}`);
        
        process.exit(0);

    } catch (error) {
        console.error("Hospital data seeding error:", error);
        process.exit(1);
    }
};

seedHospitalData();
