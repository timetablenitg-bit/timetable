import mongoose from "mongoose";
import { Batch } from "../src/models/batchModel.js"; // adjust path as needed
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI; // adjust DB name

const batches = [
  // ── Common (Year 1) ──────────────────────────────────────────────────────
  { department: "common", year: 1, semester: 1, batch_name: "1st Sem Sec A" },
  { department: "common", year: 1, semester: 1, batch_name: "1st Sem Sec B" },
  { department: "common", year: 1, semester: 1, batch_name: "1st Sem Sec C" },
  { department: "common", year: 1, semester: 1, batch_name: "1st Sem Sec D" },
  { department: "common", year: 1, semester: 2, batch_name: "1st Sem Sec A" },
  { department: "common", year: 1, semester: 2, batch_name: "1st Sem Sec B" },
  { department: "common", year: 1, semester: 2, batch_name: "1st Sem Sec C" },
  { department: "common", year: 1, semester: 2, batch_name: "1st Sem Sec D" },

  // ── CSE ──────────────────────────────────────────────────────────────────
  { department: "CSE", year: 2, semester: 3, batch_name: "CSE 3rd Sem" },
  { department: "CSE", year: 2, semester: 4, batch_name: "CSE 4th Sem" },
  { department: "CSE", year: 3, semester: 5, batch_name: "CSE 5th Sem" },
  { department: "CSE", year: 3, semester: 5, batch_name: "CSE 5th Sem Minor" },
  { department: "CSE", year: 3, semester: 6, batch_name: "CSE 6th Sem" },
  { department: "CSE", year: 3, semester: 6, batch_name: "CSE 6th Sem Minor" },
  { department: "CSE", year: 4, semester: 7, batch_name: "CSE 7th Sem" },
  { department: "CSE", year: 4, semester: 7, batch_name: "CSE 7th Sem Minor" },
  { department: "CSE", year: 4, semester: 8, batch_name: "CSE 8th Sem" },
  { department: "CSE", year: 4, semester: 8, batch_name: "CSE 8th Sem Minor" },
  { department: "CSE", year: 5, semester: 1, batch_name: "CSE MTech 1st Sem" },
  { department: "CSE", year: 5, semester: 2, batch_name: "CSE MTech 2nd Sem" },

  // ── CVE ──────────────────────────────────────────────────────────────────
  { department: "CVE", year: 2, semester: 3, batch_name: "CVE 3rd Sem" },
  { department: "CVE", year: 2, semester: 4, batch_name: "CVE 4th Sem" },
  { department: "CVE", year: 3, semester: 5, batch_name: "CVE 5th Sem" },
  { department: "CVE", year: 3, semester: 6, batch_name: "CVE 6th Sem" },
  { department: "CVE", year: 4, semester: 7, batch_name: "CVE 7th Sem" },
  { department: "CVE", year: 4, semester: 8, batch_name: "CVE 8th Sem" },

  // ── ECE ──────────────────────────────────────────────────────────────────
  { department: "ECE", year: 2, semester: 3, batch_name: "ECE 3rd Sem" },
  { department: "ECE", year: 2, semester: 4, batch_name: "ECE 4th Sem" },
  { department: "ECE", year: 3, semester: 5, batch_name: "ECE 5th Sem" },
  { department: "ECE", year: 3, semester: 5, batch_name: "ECE 5th Sem Minor" },
  { department: "ECE", year: 3, semester: 6, batch_name: "ECE 6th Sem" },
  { department: "ECE", year: 3, semester: 6, batch_name: "ECE 6th Sem Minor" },
  { department: "ECE", year: 4, semester: 7, batch_name: "ECE 7th Sem" },
  { department: "ECE", year: 4, semester: 7, batch_name: "ECE 7th Sem Minor" },
  { department: "ECE", year: 4, semester: 8, batch_name: "ECE 8th Sem" },
  { department: "ECE", year: 4, semester: 8, batch_name: "ECE 8th Sem Minor" },
  { department: "ECE", year: 5, semester: 1, batch_name: "ECE MTech 1st Sem" },
  { department: "ECE", year: 5, semester: 2, batch_name: "ECE MTech 2nd Sem" },

  // ── EEE ──────────────────────────────────────────────────────────────────
  { department: "EEE", year: 2, semester: 3, batch_name: "EEE 3rd Sem" },
  { department: "EEE", year: 2, semester: 4, batch_name: "EEE 4th Sem" },
  { department: "EEE", year: 3, semester: 5, batch_name: "EEE 5th Sem" },
  { department: "EEE", year: 3, semester: 6, batch_name: "EEE 6th Sem" },
  { department: "EEE", year: 4, semester: 7, batch_name: "EEE 7th Sem" },
  { department: "EEE", year: 4, semester: 8, batch_name: "EEE 8th Sem" },
  { department: "EEE", year: 5, semester: 1, batch_name: "EEE MTech 1st Sem" },
  { department: "EEE", year: 5, semester: 2, batch_name: "EEE MTech 2nd Sem" },

  // ── MCE ──────────────────────────────────────────────────────────────────
  { department: "MCE", year: 2, semester: 3, batch_name: "MCE 3rd Sem" },
  { department: "MCE", year: 2, semester: 4, batch_name: "MCE 4th Sem" },
  { department: "MCE", year: 3, semester: 5, batch_name: "MCE 5th Sem" },
  { department: "MCE", year: 3, semester: 6, batch_name: "MCE 6th Sem" },
  { department: "MCE", year: 4, semester: 7, batch_name: "MCE 7th Sem" },
  { department: "MCE", year: 4, semester: 8, batch_name: "MCE 8th Sem" },
];

async function seedBatches() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Optional: clear existing batches before seeding
    await Batch.deleteMany({});
    console.log("🗑️  Cleared existing batches");

    const inserted = await Batch.insertMany(batches);
    console.log(`🌱 Seeded ${inserted.length} batches successfully`);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seedBatches();
