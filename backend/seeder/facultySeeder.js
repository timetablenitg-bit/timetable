import mongoose from "mongoose";
import { Faculty } from "../src/models/facultyModel.js";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const faculties = [
  // ── APS ──────────────────────────────────────────────────────────────────
  { faculty_code: "LS-APS", name: "Dr. L Shangerganesh", department: "APS" },
  { faculty_code: "RR-APS", name: "Dr. Ravi Ragoju", department: "APS" },
  { faculty_code: "VK-APS", name: "Dr. Velavan Kathirvelu", department: "APS" },
  {
    faculty_code: "GSK-APS",
    name: "Dr. Gundlapally Shiva Kumar Reddy",
    department: "APS",
  },
  { faculty_code: "RKJ-APS", name: "Dr. Ravi Prasad K J", department: "APS" },
  { faculty_code: "SRP-APS", name: "Dr. Saidi Reddy Parne", department: "APS" },
  {
    faculty_code: "KUK-APS",
    name: "Dr. Karuna Umakant Korgaonkar",
    department: "APS",
  },
  { faculty_code: "LP-APS", name: "Dr. Lasitha P", department: "APS" },
  { faculty_code: "NVK-APS", name: "Dr. Najiya V.K.", department: "APS" },

  // ── CSE ──────────────────────────────────────────────────────────────────
  {
    faculty_code: "VNK-CSE",
    name: "Dr. Venkatnareshbabu Kuppili",
    department: "CSE",
  },
  { faculty_code: "SRD-CSE", name: "Ms. Sreedivya", department: "CSE" },
  { faculty_code: "MS-CSE", name: "Dr. Mini S", department: "CSE" },
  {
    faculty_code: "MJP-CSE",
    name: "Mr. Mohd Jehangir Pasha",
    department: "CSE",
  },
  {
    faculty_code: "AD-CSE",
    name: "Ms. Antara Abhay Dessai",
    department: "CSE",
  },
  { faculty_code: "DRE-CSE", name: "Dr. Damodar Reddy E", department: "CSE" },
  { faculty_code: "CNM-CSE", name: "Dr. Chirag N Modi", department: "CSE" },
  { faculty_code: "BNK-CSE", name: "Dr. Keshavamurthy B N", department: "CSE" },
  { faculty_code: "KC-CSE", name: "Dr. Kashinath C", department: "CSE" },
  { faculty_code: "PS-CSE", name: "Dr. Pravati Swain", department: "CSE" },
  { faculty_code: "VT-CSE", name: "Dr. Veena T", department: "CSE" },
  { faculty_code: "MP-CSE", name: "Dr. Meenakshi Panda", department: "CSE" },
  { faculty_code: "CF2-CSE", name: "Contract Faculty 2", department: "CSE" },
  { faculty_code: "CF4-CSE", name: "Contract Faculty 4", department: "CSE" },

  // ── CVE ──────────────────────────────────────────────────────────────────
  { faculty_code: "BM-CVE", name: "Dr. Bapi Mondal", department: "CVE" },
  { faculty_code: "GP-CVE", name: "Dr. Gaurav Patel", department: "CVE" },
  { faculty_code: "KS-CVE", name: "Dr. Kandalai Srikanth", department: "CVE" },
  { faculty_code: "DS-CVE", name: "Dr. Duduku Saidulu", department: "CVE" },
  { faculty_code: "SRM-CVE", name: "Dr. Sathishraj Mani", department: "CVE" },
  { faculty_code: "RNB-CVE", name: "Dr. R N Bhowmik", department: "CVE" },
  { faculty_code: "VM-CVE", name: "Dr. Vinamra Mishra", department: "CVE" },
  { faculty_code: "HKM-CVE", name: "Dr. Harikumar M", department: "CVE" },
  { faculty_code: "RDS-CVE", name: "Dr. Rishi Dipak S", department: "CVE" },
  { faculty_code: "SS-CVE", name: "Dr. S Sethulakshmi", department: "CVE" },

  // ── ECE ──────────────────────────────────────────────────────────────────
  { faculty_code: "LG-ECE", name: "Dr. Lalat Indu Giri", department: "ECE" },
  { faculty_code: "AC-ECE", name: "Dr. Anirban Chatterjee", department: "ECE" },
  {
    faculty_code: "LKB-ECE",
    name: "Dr. Lokesh Kumar Bramhane",
    department: "ECE",
  },
  { faculty_code: "TVK-ECE", name: "Dr. T. Veerakumar", department: "ECE" },
  { faculty_code: "NKYB-ECE", name: "Dr. Nithin Kumar YB", department: "ECE" },
  { faculty_code: "PP-ECE", name: "Dr. Pragati Patel", department: "ECE" },
  {
    faculty_code: "SP-ECE",
    name: "Dr. Shivnarayan Patidar",
    department: "ECE",
  },
  { faculty_code: "PGR-ECE", name: "Dr. Prashanth GR", department: "ECE" },
  { faculty_code: "EM-ECE", name: "Dr. E. Mallikarjun", department: "ECE" },
  { faculty_code: "VMH-ECE", name: "Dr. Vasantha MH", department: "ECE" },
  {
    faculty_code: "TP-ECE",
    name: "Dr. Trilochan Panigrahi",
    department: "ECE",
  },
  { faculty_code: "SK-ECE", name: "Dr. Sidharth Kala", department: "ECE" },

  // ── EEE ──────────────────────────────────────────────────────────────────
  { faculty_code: "SRR-EEE", name: "Dr. Sreeraj", department: "EEE" },
  { faculty_code: "CV-EEE", name: "Dr. C Vyjayanthi", department: "EEE" },
  { faculty_code: "ADR-EEE", name: "Dr. Amol D Rahulkar", department: "EEE" },
  { faculty_code: "GG-EEE", name: "Mr. Goutam Goswami", department: "EEE" },
  { faculty_code: "AMS-EEE", name: "Dr. Amritansh Sagar", department: "EEE" },
  { faculty_code: "SP-EEE", name: "Ms. Shefali Painuli", department: "EEE" },
  {
    faculty_code: "AWS-EEE",
    name: "Dr. Ankeshwarapu Sunil",
    department: "EEE",
  },
  { faculty_code: "SD-EEE", name: "Dr. Soumitra Das", department: "EEE" },
  { faculty_code: "AS-EEE", name: "Dr. Anudevi Samuel", department: "EEE" },
  { faculty_code: "SM-EEE", name: "Dr. Suresh Mikkili", department: "EEE" },
  { faculty_code: "MTT-EEE", name: "Mr. Mahi Teja Talluri", department: "EEE" },
  {
    faculty_code: "SKC-EEE",
    name: "Dr. Sandeep Kumar Chawrasia",
    department: "EEE",
  },

  // ── MCE ──────────────────────────────────────────────────────────────────
  {
    faculty_code: "VKT-MCE",
    name: "Dr. Vinit Kumar Tripathi",
    department: "MCE",
  },
  { faculty_code: "AG-MCE", name: "Dr. Akshay Gaur", department: "MCE" },
  { faculty_code: "BS-MCE", name: "Dr. B Santhi", department: "MCE" },
  {
    faculty_code: "MPB-MCE",
    name: "Dr. Manash Pratim Borthakur",
    department: "MCE",
  },
  { faculty_code: "CV-MCE", name: "Dr. Chaitanya Vundru", department: "MCE" },
  { faculty_code: "SS-MCE", name: "Dr. Samar Singhal", department: "MCE" },
  {
    faculty_code: "DDB-MCE",
    name: "Dr. Darrius Diogo Barreto",
    department: "MCE",
  },
  { faculty_code: "PAP-MCE", name: "Dr. Pravin A Pawar", department: "MCE" },
  { faculty_code: "AS-MCE", name: "Dr. Abhijit Sarkar", department: "MCE" },
  { faculty_code: "PD-MCE", name: "Dr. Prasenjit Dey", department: "MCE" },
  {
    faculty_code: "PKP-MCE",
    name: "Dr. Pramod Kumar Parida",
    department: "MCE",
  },

  // ── HSS ──────────────────────────────────────────────────────────────────
  {
    faculty_code: "SGM-HSS",
    name: "Dr. Sarani Ghoshal Mandal",
    department: "HSS",
  },
  { faculty_code: "SK-HSS", name: "Dr. Sunil Kumar", department: "HSS" },
  { faculty_code: "GS-HSS", name: "Dr. Gopika Sankar U", department: "HSS" },
  { faculty_code: "UKT-HSS", name: "Dr. Unais KT", department: "HSS" },
  { faculty_code: "SKG-HSS", name: "Mr. Sudharsan", department: "HSS" },
  {
    faculty_code: "SKS-HSS",
    name: "Dr. Sanjeev Kumar Singh",
    department: "HSS",
  },
  { faculty_code: "RK-HSS", name: "Dr. Rinu Koshy", department: "HSS" },
  {
    faculty_code: "SS-HSS",
    name: "Mrs. Sanghmitra Samanta",
    department: "HSS",
  },
];

async function seedFaculties() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    await Faculty.deleteMany({});
    console.log("🗑️  Cleared existing faculties");

    const inserted = await Faculty.insertMany(faculties);
    console.log(`🌱 Seeded ${inserted.length} faculties successfully`);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seedFaculties();
