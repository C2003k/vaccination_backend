import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import User from "../models/User.js";
import Child from "../models/Child.js";
import Vaccine from "../models/Vaccine.js";
import VaccinationRecord from "../models/VaccinationRecord.js";
import Schedule from "../models/Schedule.js";
import FieldReport from "../models/FieldReport.js";
import { ROLES } from "../config/roles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/vaccination_tracker";

const seedHealthWorkerData = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    let healthWorker = await User.findOne({ email: "chw@test.com" });
    if (!healthWorker) {
      healthWorker = await User.create({
        name: "Sarah KW",
        username: "sarahchw",
        email: "chw@test.com",
        password: "password123",
        role: ROLES.HEALTH_WORKER,
        phone: "254712345678",
        isActive: true,
        isVerified: true,
      });
      console.log("Created health worker:", healthWorker.email);
    }

    const vaccines = await Vaccine.find({ isActive: true }).sort({
      "recommendedAge.months": 1,
      "recommendedAge.weeks": 1,
    });

    if (vaccines.length === 0) {
      console.log("No vaccines found. Please run seedVaccines.js first.");
      process.exit(1);
    }

    const motherTemplates = [
      {
        name: "Grace Mwende",
        username: "gracemwende",
        email: "grace.mwende@test.com",
        phone: "254701234567",
        subCounty: "Kitui Central",
        ward: "Township",
        location: "Majengo",
      },
      {
        name: "Janet Kilonzo",
        username: "janetkilonzo",
        email: "janet.kilonzo@test.com",
        phone: "254702345678",
        subCounty: "Kitui West",
        ward: "Kisasi",
        location: "Kwa Mutonga",
      },
      {
        name: "Mercy Mutua",
        username: "mercymutua",
        email: "mercy.mutua@test.com",
        phone: "254703456789",
        subCounty: "Mwingi Central",
        ward: "Nuu",
        location: "Nuu Village",
      },
    ];

    const mothers = [];
    for (const template of motherTemplates) {
      let mother = await User.findOne({ email: template.email });
      if (!mother) {
        mother = await User.create({
          name: template.name,
          username: template.username,
          email: template.email,
          password: "password123",
          role: ROLES.MOTHER,
          phone: template.phone,
          assignedCHW: healthWorker._id,
          county: "Kitui County",
          subCounty: template.subCounty,
          ward: template.ward,
          location: template.location,
          isActive: true,
          isVerified: true,
        });
        console.log("Created mother:", mother.email);
      } else {
        await User.findByIdAndUpdate(mother._id, { assignedCHW: healthWorker._id });
      }
      mothers.push(mother);
    }

    const children = [];
    for (const mother of mothers) {
      const existing = await Child.find({ parent: mother._id });
      if (existing.length > 0) {
        children.push(...existing);
        continue;
      }

      const child = await Child.create({
        parent: mother._id,
        name: `Baby ${mother.name.split(" ")[0]}`,
        dateOfBirth: new Date(new Date().setMonth(new Date().getMonth() - 8)),
        gender: Math.random() > 0.5 ? "male" : "female",
        birthWeight: 3.4,
        birthHeight: 51,
        vaccinationStatus: "not-started",
      });
      children.push(child);
      console.log("Created child:", child.name);
    }

    for (const child of children) {
      const existingRecords = await VaccinationRecord.find({ child: child._id });
      if (existingRecords.length === 0) {
        const selectedVaccines = vaccines.slice(0, 4);
        for (let i = 0; i < selectedVaccines.length; i++) {
          const vaccine = selectedVaccines[i];
          await VaccinationRecord.create({
            child: child._id,
            vaccine: vaccine._id,
            doseSequence: 1,
            dateGiven: new Date(new Date().setMonth(new Date().getMonth() - (6 - i))),
            givenBy: healthWorker._id,
            batchNumber: `BATCH-${2000 + i}`,
            healthFacility: "Kitui Health Center",
            status: "completed",
          });
        }
      }
    }

    const existingSchedule = await Schedule.find({ healthWorker: healthWorker._id });
    if (existingSchedule.length === 0) {
      const visits = [];
      for (const mother of mothers) {
        visits.push({
          healthWorker: healthWorker._id,
          mother: mother._id,
          type: "home_visit",
          scheduledDate: new Date(),
          scheduledTime: "09:00",
          duration: 45,
          purpose: "Follow-up visit",
          priority: "medium",
          location: { village: mother.location, ward: mother.ward, subCounty: mother.subCounty },
          status: "scheduled",
        });
      }
      await Schedule.insertMany(visits);
      console.log("Created schedule visits:", visits.length);
    }

    const existingReports = await FieldReport.find({ healthWorker: healthWorker._id });
    if (existingReports.length === 0) {
      await FieldReport.create({
        healthWorker: healthWorker._id,
        reportDate: new Date(),
        location: {
          subCounty: "Kitui Central",
          ward: "Township",
          village: "Majengo",
        },
        activities: {
          mothersVisited: 5,
          vaccinationsGiven: 8,
          followUps: 3,
        },
        challenges: "Long distances between households",
        notes: "Good turnout at outreach clinic",
        status: "submitted",
      });
      console.log("Created field report");
    }

    console.log("Seed health worker data complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding health worker data:", error);
    process.exit(1);
  }
};

seedHealthWorkerData();
