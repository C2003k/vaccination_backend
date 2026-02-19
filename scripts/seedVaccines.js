
import mongoose from "mongoose";
import dotenv from "dotenv";
import Vaccine from "../models/Vaccine.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const vaccines = [
    {
        name: "BCG",
        code: "BCG",
        description: "Bacillus Calmette-Guérin vaccine against Tuberculosis",
        protectsAgainst: ["Tuberculosis"],
        dueAtBirth: true,
        recommendedAge: { months: 0, weeks: 0 },
        dosage: "0.05ml",
        route: "Intradermal",
        site: "Left upper arm",
        isActive: true
    },
    {
        name: "Oral Polio Vaccine 0",
        code: "OPV0",
        description: "Zero dose of Oral Polio Vaccine",
        protectsAgainst: ["Polio"],
        dueAtBirth: true,
        recommendedAge: { months: 0, weeks: 0 },
        dosage: "2 drops",
        route: "Oral",
        site: "Mouth",
        isActive: true
    },
    {
        name: "Oral Polio Vaccine 1",
        code: "OPV1",
        description: "First dose of Oral Polio Vaccine",
        protectsAgainst: ["Polio"],
        dueAtBirth: false,
        recommendedAge: { months: 0, weeks: 6 },
        dosage: "2 drops",
        route: "Oral",
        site: "Mouth",
        isActive: true
    },
    {
        name: "Pentavalent 1",
        code: "PENTA1",
        description: "Diphtheria, Pertussis, Tetanus, Hepatitis B, and Haemophilus Influenzae type b",
        protectsAgainst: ["Diphtheria", "Pertussis", "Tetanus", "Hepatitis B", "Haemophilus Influenzae type b"],
        dueAtBirth: false,
        recommendedAge: { months: 0, weeks: 6 },
        dosage: "0.5ml",
        route: "Intramuscular",
        site: "Left outer thigh",
        isActive: true
    },
    {
        name: "Pneumococcal Conjugate Vaccine 1",
        code: "PCV1",
        description: "First dose against Pneumonia",
        protectsAgainst: ["Pneumonia"],
        dueAtBirth: false,
        recommendedAge: { months: 0, weeks: 6 },
        dosage: "0.5ml",
        route: "Intramuscular",
        site: "Right outer thigh",
        isActive: true
    },
    {
        name: "Rotavirus 1",
        code: "ROTA1",
        description: "First dose against Rotavirus",
        protectsAgainst: ["Rotavirus"],
        dueAtBirth: false,
        recommendedAge: { months: 0, weeks: 6 },
        dosage: "1.5ml",
        route: "Oral",
        site: "Mouth",
        isActive: true
    },
    {
        name: "Oral Polio Vaccine 2",
        code: "OPV2",
        description: "Second dose of Oral Polio Vaccine",
        protectsAgainst: ["Polio"],
        dueAtBirth: false,
        recommendedAge: { months: 0, weeks: 10 },
        dosage: "2 drops",
        route: "Oral",
        site: "Mouth",
        isActive: true
    },
    {
        name: "Pentavalent 2",
        code: "PENTA2",
        description: "Second dose of Pentavalent",
        protectsAgainst: ["Diphtheria", "Pertussis", "Tetanus", "Hepatitis B", "Haemophilus Influenzae type b"],
        dueAtBirth: false,
        recommendedAge: { months: 0, weeks: 10 },
        dosage: "0.5ml",
        route: "Intramuscular",
        site: "Left outer thigh",
        isActive: true
    },
    {
        name: "Pneumococcal Conjugate Vaccine 2",
        code: "PCV2",
        description: "Second dose against Pneumonia",
        protectsAgainst: ["Pneumonia"],
        dueAtBirth: false,
        recommendedAge: { months: 0, weeks: 10 },
        dosage: "0.5ml",
        route: "Intramuscular",
        site: "Right outer thigh",
        isActive: true
    },
    {
        name: "Rotavirus 2",
        code: "ROTA2",
        description: "Second dose against Rotavirus",
        protectsAgainst: ["Rotavirus"],
        dueAtBirth: false,
        recommendedAge: { months: 0, weeks: 10 },
        dosage: "1.5ml",
        route: "Oral",
        site: "Mouth",
        isActive: true
    },
    {
        name: "Oral Polio Vaccine 3",
        code: "OPV3",
        description: "Third dose of Oral Polio Vaccine",
        protectsAgainst: ["Polio"],
        dueAtBirth: false,
        recommendedAge: { months: 0, weeks: 14 },
        dosage: "2 drops",
        route: "Oral",
        site: "Mouth",
        isActive: true
    },
    {
        name: "Pentavalent 3",
        code: "PENTA3",
        description: "Third dose of Pentavalent",
        protectsAgainst: ["Diphtheria", "Pertussis", "Tetanus", "Hepatitis B", "Haemophilus Influenzae type b"],
        dueAtBirth: false,
        recommendedAge: { months: 0, weeks: 14 },
        dosage: "0.5ml",
        route: "Intramuscular",
        site: "Left outer thigh",
        isActive: true
    },
    {
        name: "Pneumococcal Conjugate Vaccine 3",
        code: "PCV3",
        description: "Third dose against Pneumonia",
        protectsAgainst: ["Pneumonia"],
        dueAtBirth: false,
        recommendedAge: { months: 0, weeks: 14 },
        dosage: "0.5ml",
        route: "Intramuscular",
        site: "Right outer thigh",
        isActive: true
    },
    {
        name: "Inactivated Polio Vaccine",
        code: "IPV",
        description: "Inactivated Polio Vaccine",
        protectsAgainst: ["Polio"],
        dueAtBirth: false,
        recommendedAge: { months: 0, weeks: 14 },
        dosage: "0.5ml",
        route: "Intramuscular",
        site: "Left outer thigh",
        isActive: true
    },
    {
        name: "Measles Rubella 1",
        code: "MR1",
        description: "First dose of Measles Rubella",
        protectsAgainst: ["Measles", "Rubella"],
        dueAtBirth: false,
        recommendedAge: { months: 9, weeks: 0 },
        dosage: "0.5ml",
        route: "Subcutaneous",
        site: "Right upper arm",
        isActive: true
    },
    {
        name: "Yellow Fever",
        code: "YF",
        description: "Yellow Fever Vaccine",
        protectsAgainst: ["Yellow Fever"],
        dueAtBirth: false,
        recommendedAge: { months: 9, weeks: 0 },
        dosage: "0.5ml",
        route: "Subcutaneous",
        site: "Left upper arm",
        isActive: true
    },
    {
        name: "Measles Rubella 2",
        code: "MR2",
        description: "Second dose of Measles Rubella",
        protectsAgainst: ["Measles", "Rubella"],
        dueAtBirth: false,
        recommendedAge: { months: 18, weeks: 0 },
        dosage: "0.5ml",
        route: "Subcutaneous",
        site: "Right upper arm",
        isActive: true
    }
];

const seedVaccines = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/vaccination_tracker";
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");

        // Clear existing vaccines
        await Vaccine.deleteMany({});
        console.log("Cleared existing vaccines");

        // Insert new vaccines
        await Vaccine.insertMany(vaccines);
        console.log("Vaccines seeded successfully");

        process.exit(0);
    } catch (error) {
        console.error("Error seeding vaccines:", error);
        process.exit(1);
    }
};

seedVaccines();
