import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import User from "../models/User.js";
import Child from "../models/Child.js";
import Vaccine from "../models/Vaccine.js";
import VaccinationRecord from "../models/VaccinationRecord.js";
import GrowthRecord from "../models/GrowthRecord.js";
import { ROLES } from "../config/roles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/vaccination_tracker";

const seedMotherData = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    const healthWorkerEmail = "chw@test.com";
    const motherEmail = "mother@test.com";

    let healthWorker = await User.findOne({ email: healthWorkerEmail });
    if (!healthWorker) {
      healthWorker = await User.create({
        name: "Sarah KW",
        username: "sarahchw",
        email: healthWorkerEmail,
        password: "password123",
        role: ROLES.HEALTH_WORKER,
        phone: "254712345678",
        isActive: true,
        isVerified: true,
      });
      console.log("Created health worker:", healthWorker.email);
    }

    let mother = await User.findOne({ email: motherEmail });
    if (!mother) {
      mother = await User.create({
        name: "Mary Mother",
        username: "marymother",
        email: motherEmail,
        password: "password123",
        role: ROLES.MOTHER,
        phone: "254723456789",
        assignedCHW: healthWorker._id,
        county: "Kitui County",
        subCounty: "Kitui Central",
        ward: "Township",
        location: "Majengo",
        isActive: true,
        isVerified: true,
      });
      console.log("Created mother:", mother.email);
    }

    const vaccinesCount = await Vaccine.countDocuments();
    if (vaccinesCount === 0) {
      console.log("No vaccines found. Please run seedVaccines.js first.");
      process.exit(1);
    }

    let children = await Child.find({ parent: mother._id });
    if (children.length === 0) {
      const child = await Child.create({
        parent: mother._id,
        name: "Baby Test",
        dateOfBirth: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        gender: "female",
        birthWeight: 3.2,
        birthHeight: 50,
        vaccinationStatus: "not-started",
      });
      children = [child];
      console.log("Created child:", child.name);
    }

    const vaccines = await Vaccine.find({ isActive: true }).sort({
      "recommendedAge.months": 1,
      "recommendedAge.weeks": 1,
    });

    for (const child of children) {
      const existingRecords = await VaccinationRecord.find({ child: child._id });
      if (existingRecords.length === 0) {
        const selectedVaccines = vaccines.slice(0, 3);
        for (let i = 0; i < selectedVaccines.length; i++) {
          const vaccine = selectedVaccines[i];
          await VaccinationRecord.create({
            child: child._id,
            vaccine: vaccine._id,
            doseSequence: 1,
            dateGiven: new Date(new Date().setMonth(new Date().getMonth() - (5 - i))),
            givenBy: healthWorker._id,
            batchNumber: `BATCH-${1000 + i}`,
            healthFacility: "Kitui Health Center",
            status: "completed",
          });
        }
        console.log("Created vaccination records for child:", child.name);
      }

      const existingGrowth = await GrowthRecord.find({ child: child._id });
      if (existingGrowth.length === 0) {
        const growthSamples = [
          { monthsAgo: 5, weight: 4.2, height: 55 },
          { monthsAgo: 3, weight: 5.5, height: 60 },
          { monthsAgo: 1, weight: 6.4, height: 64 },
        ];
        for (const sample of growthSamples) {
          await GrowthRecord.create({
            child: child._id,
            dateRecorded: new Date(
              new Date().setMonth(new Date().getMonth() - sample.monthsAgo)
            ),
            ageInMonths: sample.monthsAgo,
            weight: sample.weight,
            height: sample.height,
            recordedBy: mother._id,
          });
        }
        console.log("Created growth records for child:", child.name);
      }
    }

    console.log("Seed mother data complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding mother data:", error);
    process.exit(1);
  }
};

seedMotherData();
