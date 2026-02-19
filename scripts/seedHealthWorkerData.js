
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from "../models/User.js";
import Child from "../models/Child.js";
import Schedule from "../models/Schedule.js";
import FieldReport from "../models/FieldReport.js";
import Vaccine from "../models/Vaccine.js";

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const seedHealthWorkerData = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/vaccination_tracker";
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");

        // 1. Find or Create the Health Worker
        let chw = await User.findOne({ email: "chw@test.com" });
        if (!chw) {
            console.log("Creating Health Worker...");
            chw = await User.create({
                name: "Sarah CHW",
                username: "sarahchw",
                email: "chw@test.com",
                password: "password123", // Note: In real app this should be hashed if using AuthService/Controller. 
                // But for direct seeding if using User model with pre-save hook it might be hashed.
                // Assuming User model has pre-save hashing.
                role: "health-worker",
                phone: "254700000001",
                isActive: true,
                isVerified: true
            });
        }
        console.log(`Using Health Worker: ${chw.name} (${chw._id})`);

        // 2. Create Assigned Mothers
        const mothersData = [
            { name: "Alice Mama", email: "alice@test.com", phone: "254700000002", village: "Kibera Zone A" },
            { name: "Betty Mama", email: "betty@test.com", phone: "254700000003", village: "Kibera Zone B" },
            { name: "Carol Mama", email: "carol@test.com", phone: "254700000004", village: "Kibera Zone A" },
            { name: "Diana Mama", email: "diana@test.com", phone: "254700000005", village: "Kibera Zone C" },
            { name: "Eve Mama", email: "eve@test.com", phone: "254700000006", village: "Kibera Zone B" },
        ];

        const mothers = [];
        for (const mData of mothersData) {
            let mother = await User.findOne({ email: mData.email });
            if (!mother) {
                mother = await User.create({
                    ...mData,
                    username: mData.name.split(' ')[0].toLowerCase(),
                    password: "password123",
                    role: "mother",
                    assignedCHW: chw._id,
                    isActive: true,
                    isVerified: true
                });
            } else {
                // Ensure assigned to our CHW
                mother.assignedCHW = chw._id;
                await mother.save();
            }
            mothers.push(mother);
        }
        console.log(`Ensured ${mothers.length} assigned mothers.`);

        // 3. Create Children
        // We need vaccines to link if needed, but primarily child age determines status.
        // Let's make:
        // - Child 1 (Alice): Newborn, up to date
        // - Child 2 (Betty): 3 months, defaulting (missed 6 week, 10 week)
        // - Child 3 (Carol): 1 year, fully vaccinating mostly
        // - Child 4 (Diana): 6 weeks, due for vaccination now

        const childrenData = [
            { motherIdx: 0, name: "Baby Alice", ageMonths: 0.5, gender: "female" }, // 2 weeks old
            { motherIdx: 1, name: "Baby Betty", ageMonths: 3, gender: "female" },   // 3 months old
            { motherIdx: 2, name: "Baby Carol", ageMonths: 13, gender: "male" },    // 13 months
            { motherIdx: 3, name: "Baby Diana", ageMonths: 1.5, gender: "female" }, // 6 weeks (1.5 months)
            { motherIdx: 4, name: "Baby Eve", ageMonths: 9, gender: "male" },       // 9 months (Measles due)
        ];

        await Child.deleteMany({ parent: { $in: mothers.map(m => m._id) } }); // Clear their children to avoid dupes

        const createdChildren = [];
        for (const cData of childrenData) {
            const dob = new Date();
            dob.setMonth(dob.getMonth() - cData.ageMonths);

            const child = await Child.create({
                parent: mothers[cData.motherIdx]._id,
                name: cData.name,
                dateOfBirth: dob,
                gender: cData.gender,
                birthWeight: 3.0,
                vaccinationStatus: cData.ageMonths > 0 ? (cData.motherIdx === 1 ? "behind" : "up-to-date") : "not-started"
            });
            createdChildren.push(child);
        }
        console.log(`Created ${createdChildren.length} children.`);

        // 4. Create Schedules
        // Clear existing schedules for this CHW
        await Schedule.deleteMany({ healthWorker: chw._id });

        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

        const schedules = [
            {
                healthWorker: chw._id,
                mother: mothers[3]._id, // Diana (Due for 6 weeks vaccines)
                type: "home_visit",
                scheduledDate: tomorrow,
                scheduledTime: "10:00",
                duration: 60,
                priority: "high",
                status: "scheduled",
                purpose: "6-week Vaccination Reminder",
                location: "Kibera Zone C"
            },
            {
                healthWorker: chw._id,
                mother: mothers[1]._id, // Betty (Defaulting)
                type: "follow_up",
                scheduledDate: today,
                scheduledTime: "14:00",
                duration: 45,
                priority: "high",
                status: "scheduled",
                purpose: "Missed appointment follow-up",
                location: "Kibera Zone B"
            },
            {
                healthWorker: chw._id,
                mother: mothers[0]._id, // Alice
                type: "routine_check",
                scheduledDate: yesterday,
                scheduledTime: "09:00",
                duration: 30,
                priority: "medium",
                status: "completed",
                purpose: "Newborn checkup",
                location: "Kibera Zone A",
                notes: "Child is breastfeeding well."
            }
        ];

        await Schedule.insertMany(schedules);
        console.log(`Created ${schedules.length} schedule entries.`);

        // 5. Create Field Reports
        await FieldReport.deleteMany({ healthWorker: chw._id });

        const reports = [
            {
                healthWorker: chw._id,
                reportDate: yesterday,
                location: { village: "Kibera Zone A", ward: "Sarangombe", subCounty: "Kibra" },
                activities: {
                    mothersVisited: 5,
                    vaccinationsGiven: 2,
                    followUps: 1,
                    referrals: 0
                },
                challenges: "Heavy rains made access difficult.",
                notes: "Distributed 5 mosquito nets.",
                status: "submitted"
            },
            {
                healthWorker: chw._id,
                reportDate: new Date(today.getTime() - 86400000 * 2), // 2 days ago
                location: { village: "Kibera Zone B", ward: "Lindi", subCounty: "Kibra" },
                activities: {
                    mothersVisited: 3,
                    vaccinationsGiven: 0,
                    followUps: 3,
                    referrals: 1
                },
                status: "submitted"
            }
        ];

        await FieldReport.insertMany(reports);
        console.log(`Created ${reports.length} field reports.`);

        console.log("Seeding complete!");
        process.exit(0);

    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedHealthWorkerData();
