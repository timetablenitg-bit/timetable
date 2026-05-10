import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateRegistrationPDF = (courses, studentInfo = {}) => {
  const doc = new jsPDF();
  const totalCredits = courses.reduce(
    (sum, c) => sum + Number(c.credits || 0),
    0,
  );
  const theoryCount = courses.filter((c) => c.type === "Theory").length;
  const labCount = courses.filter(
    (c) => c.type === "Lab" || c.type === "Project",
  ).length;

  // --- 1. Page Border & Background Decor ---
  doc.setDrawColor(79, 70, 229); // Indigo border
  doc.setLineWidth(0.5);
  doc.rect(5, 5, 200, 287); // Thin outer frame

  // --- 2. Header Section ---
  // Placeholder for a logo (Top Left)
  doc.setFillColor(79, 70, 229);
  doc.rect(14, 15, 10, 10, "F"); // Mini logo square

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // Slate-900
  doc.text("UNIVERSITY ACADEMICS", 28, 23);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Office of the Registrar | Course Enrollment Division", 28, 28);

  // Status Badge (Top Right)
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.roundedRect(150, 15, 45, 12, 2, 2, "F");
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105); // Emerald-600
  doc.setFont("helvetica", "bold");
  doc.text("VERIFIED & ACTIVE", 155, 23);

  // --- 3. Student & Session Details Grid ---
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.line(14, 35, 196, 35); // Divider

  doc.setTextColor(71, 85, 105); // Slate-600
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("STUDENT INFORMATION", 14, 45);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Enrollment ID: ${studentInfo.id || "REG-" + Date.now().toString().slice(-6)}`,
    14,
    52,
  );
  doc.text(
    `Branch/Dept: ${studentInfo.branch || "Computer Science Engineering"}`,
    14,
    57,
  );
  doc.text(`Semester: ${studentInfo.semester || "Spring 2026"}`, 14, 62);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("SESSION DETAILS", 110, 45);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(`Receipt No: ${Math.floor(Math.random() * 1000000)}`, 110, 52);
  doc.text(`Registration Date: ${new Date().toLocaleDateString()}`, 110, 57);
  doc.text(`Academic Year: 2025-2026`, 110, 62);

  // --- 4. The Course Table ---
  autoTable(doc, {
    startY: 72,
    head: [["#", "Code", "Subject Name", "Type", "L-T-P", "Cr.", "Nature"]],
    body: courses.map((c, i) => [
      i + 1,
      c.code || "N/A",
      c.name || "Unnamed",
      c.type || "Theory",
      `${c.L}-${c.T}-${c.P}`,
      c.credits || 0,
      c.nature || "CORE",
    ]),
    styles: { fontSize: 8, cellPadding: 4, font: "helvetica" },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 25, fontStyle: "bold" },
      5: { halign: "center" },
    },
  });

  // --- 5. Summary & Footer Section ---
  const finalY = doc.lastAutoTable.finalY + 15;

  // Summary Card
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.roundedRect(14, finalY, 80, 35, 3, 3, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Registration Stats", 20, finalY + 8);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Registered Subjects: ${courses.length}`, 20, finalY + 16);
  doc.text(`Theory Courses: ${theoryCount}`, 20, finalY + 22);
  doc.text(`Labs / Projects: ${labCount}`, 20, finalY + 28);

  // Credits Circle Display
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1);
  doc.circle(170, finalY + 17, 12, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${totalCredits}`, 170, finalY + 19, { align: "center" });
  doc.setFontSize(7);
  doc.text("TOTAL CREDITS", 170, finalY + 33, { align: "center" });

  // --- 6. Declaration & Signature ---
  doc.setFontSize(8);
  doc.setTextColor(100);
  const declaration =
    "Declaration: I hereby declare that the subjects mentioned above have been selected as per my curriculum requirements and I shall be responsible for any credit mismatches.";
  doc.text(declaration, 14, 260, { maxWidth: 120 });

  doc.line(150, 275, 190, 275); // Signature line
  doc.text("Registrar Signature", 155, 280);

  // Final Save
  doc.save(`Official_Receipt_${studentInfo.id || "Course"}.pdf`);
};
