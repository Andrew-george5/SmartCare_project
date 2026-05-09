const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageBreak, TabStopType,
  TabStopPosition, LevelFormat, TableOfContents, ImageRun,
  SimpleField
} = require('docx');
const fs = require('fs');

// ── Colours ─────────────────────────────────────────────────────────────────
const NAVY   = "1E3A5F";
const BLUE   = "2563EB";
const LBLUE  = "DBEAFE";
const LGRAY  = "F1F5F9";
const MID    = "475569";
const BORDER = "CBD5E1";
const GREEN  = "D1FAE5";
const TEAL   = "CCFBF1";

// ── Page geometry ─────────────────────────────────────────────────────────────
const PAGE_W  = 11906;  // A4 width  (DXA)
const PAGE_H  = 16838;  // A4 height (DXA)
const MARGIN  = 1134;   // ~2 cm
const CONTENT = PAGE_W - MARGIN * 2;   // 9638 DXA

// ── Borders helper ────────────────────────────────────────────────────────────
const thinBorder = (color = BORDER) => ({
  style: BorderStyle.SINGLE, size: 4, color
});
const allBorders = (color = BORDER) => ({
  top: thinBorder(color), bottom: thinBorder(color),
  left: thinBorder(color), right: thinBorder(color)
});
const noBorder = () => ({
  style: BorderStyle.NONE, size: 0, color: "FFFFFF"
});
const noBorders = () => ({
  top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder()
});

// ── Cell padding ──────────────────────────────────────────────────────────────
const CELL_MARGIN = { top: 80, bottom: 80, left: 110, right: 110 };

// ── Text helpers ──────────────────────────────────────────────────────────────
const run = (text, opts = {}) => new TextRun({ text, font: "Arial", ...opts });
const bold = (text, opts = {}) => run(text, { bold: true, ...opts });
const italic = (text, opts = {}) => run(text, { italics: true, ...opts });

const para = (children, opts = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  ...opts
});
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, font: "Arial", bold: true, color: NAVY })]
});
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, font: "Arial", bold: true, color: NAVY })]
});
const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun({ text, font: "Arial", bold: true, color: MID })]
});
const bodyPara = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, font: "Arial", size: 22 })],
  spacing: { after: 80 },
  ...opts
});
const spacer = (after = 120) => new Paragraph({ spacing: { after }, children: [] });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// ── Cell helper ───────────────────────────────────────────────────────────────
const cell = (paragraphs, width, opts = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  borders: allBorders(),
  margins: CELL_MARGIN,
  ...opts,
  children: Array.isArray(paragraphs) ? paragraphs : [paragraphs]
});

const hCell = (text, width, bg = NAVY) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  borders: allBorders(bg),
  margins: CELL_MARGIN,
  shading: { fill: bg, type: ShadingType.CLEAR },
  children: [new Paragraph({
    children: [new TextRun({ text, font: "Arial", bold: true, color: "FFFFFF", size: 20 })],
    alignment: AlignmentType.CENTER,
  })]
});

const altCell = (paragraphs, width, even) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  borders: allBorders(),
  margins: CELL_MARGIN,
  shading: { fill: even ? LGRAY : "FFFFFF", type: ShadingType.CLEAR },
  children: Array.isArray(paragraphs) ? paragraphs : [paragraphs]
});

const cp = (text, size = 20, color = "1E293B", bold_flag = false) => new Paragraph({
  spacing: { after: 0 },
  children: [new TextRun({ text, font: "Arial", size, color, bold: bold_flag })]
});

// ── Diagram placeholder ───────────────────────────────────────────────────────
const diagramPlaceholder = (label) => [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 80 },
    border: {
      top:    { style: BorderStyle.DASHED, size: 8, color: BLUE },
      bottom: { style: BorderStyle.DASHED, size: 8, color: BLUE },
      left:   { style: BorderStyle.DASHED, size: 8, color: BLUE },
      right:  { style: BorderStyle.DASHED, size: 8, color: BLUE },
    },
    shading: { fill: LGRAY, type: ShadingType.CLEAR },
    children: [
      new TextRun({ text: label, font: "Arial", size: 22, color: "94A3B8", italics: true })
    ]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    border: {
      bottom: { style: BorderStyle.DASHED, size: 8, color: BLUE },
      left:   { style: BorderStyle.DASHED, size: 8, color: BLUE },
      right:  { style: BorderStyle.DASHED, size: 8, color: BLUE },
    },
    shading: { fill: LGRAY, type: ShadingType.CLEAR },
    children: [new TextRun({ text: " ", font: "Arial", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    border: {
      bottom: { style: BorderStyle.DASHED, size: 8, color: BLUE },
      left:   { style: BorderStyle.DASHED, size: 8, color: BLUE },
      right:  { style: BorderStyle.DASHED, size: 8, color: BLUE },
    },
    shading: { fill: LGRAY, type: ShadingType.CLEAR },
    children: [new TextRun({ text: " ", font: "Arial", size: 22 })]
  }),
];

// ── FR Table builder ──────────────────────────────────────────────────────────
// Cols: ID | Actor | Requirement | Use Case
const FR_COLS = [700, 1400, 5738, 1000];  // sum = 8838
const frHeader = () => new TableRow({
  tableHeader: true,
  children: [
    hCell("ID",          FR_COLS[0]),
    hCell("Actor",       FR_COLS[1]),
    hCell("Requirement", FR_COLS[2]),
    hCell("Use Case",    FR_COLS[3]),
  ]
});
const frRow = (id, actor, req, uc, even, isNew = false) => new TableRow({
  children: [
    altCell(cp(id, 20, NAVY, true),  FR_COLS[0], even),
    altCell(cp(actor, 20),           FR_COLS[1], even),
    altCell([
      cp(req, 20),
      ...(isNew ? [new Paragraph({ spacing:{after:0}, children:[new TextRun({ text: "★ New in v2.0", font:"Arial", size:18, color:"16A34A", bold:true })] })] : [])
    ], FR_COLS[2], even),
    altCell(cp(uc, 20, BLUE, false), FR_COLS[3], even),
  ]
});
const frTable = (rows) => new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: FR_COLS,
  rows: [frHeader(), ...rows]
});

// ── UC Table builder ──────────────────────────────────────────────────────────
const UC_COLS = [700, 2800, 2200, 3138];
const ucHeader = () => new TableRow({
  tableHeader: true,
  children: [
    hCell("UC ID",       UC_COLS[0]),
    hCell("Use Case",    UC_COLS[1]),
    hCell("Actor(s)",    UC_COLS[2]),
    hCell("Related FRs", UC_COLS[3]),
  ]
});
const ucRow = (id, name, actors, frs, even) => new TableRow({
  children: [
    altCell(cp(id, 20, NAVY, true),  UC_COLS[0], even),
    altCell(cp(name, 20),            UC_COLS[1], even),
    altCell(cp(actors, 20),          UC_COLS[2], even),
    altCell(cp(frs, 20, BLUE),       UC_COLS[3], even),
  ]
});
const ucTable = (rows) => new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: UC_COLS,
  rows: [ucHeader(), ...rows]
});

// ── NFR Table builder ─────────────────────────────────────────────────────────
const NFR_COLS = [700, 1600, 5238, 1300];
const nfrHeader = () => new TableRow({
  tableHeader: true,
  children: [
    hCell("ID",           NFR_COLS[0]),
    hCell("Category",     NFR_COLS[1]),
    hCell("Requirement",  NFR_COLS[2]),
    hCell("Priority",     NFR_COLS[3]),
  ]
});
const nfrRow = (id, cat, req, pri, even) => new TableRow({
  children: [
    altCell(cp(id, 20, NAVY, true), NFR_COLS[0], even),
    altCell(cp(cat, 20),            NFR_COLS[1], even),
    altCell(cp(req, 20),            NFR_COLS[2], even),
    altCell(cp(pri, 20, "DC2626"),  NFR_COLS[3], even),
  ]
});
const nfrTable = (rows) => new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: NFR_COLS,
  rows: [nfrHeader(), ...rows]
});

// ─────────────────────────────────────────────────────────────────────────────
//  TEAM TABLE
// ─────────────────────────────────────────────────────────────────────────────
const TEAM_COLS = [2200, 1600, 5038];
const teamTable = () => new Table({
  width: { size: CONTENT, type: WidthType.DXA },
  columnWidths: TEAM_COLS,
  rows: [
    new TableRow({ tableHeader:true, children:[
      hCell("Name", TEAM_COLS[0]), hCell("ID", TEAM_COLS[1]), hCell("Contributions", TEAM_COLS[2])
    ]}),
    ...([
      ["Andrew George",              "222351015", "Back-end development and testing"],
      ["Abdel Rahman Mohamed Fadel", "222351085", "Use Case diagram"],
      ["Ahmed Reda Abdullah",        "222351071", "Database design"],
      ["Jonathan Rafik",             "222351056", "Class Diagram, Sequence Diagram"],
      ["Mohamed Ibrahim Mohamed",    "222400033", "DevOps, Database implementation"],
      ["Mohamed Fathi Shafik Tolba", "222351012", "Front-end development and testing"],
      ["Moustafa Hassan Ramadan",    "222351020", "Documentation, UML Diagram generation scripts"],
    ].map(([name, id, contrib], i) => new TableRow({ children:[
      altCell(cp(name, 20, "1E293B", true), TEAM_COLS[0], i%2===0),
      altCell(cp(id,   20),                 TEAM_COLS[1], i%2===0),
      altCell(cp(contrib, 20),              TEAM_COLS[2], i%2===0),
    ]})))
  ]
});

// ─────────────────────────────────────────────────────────────────────────────
//  COVER PAGE
// ─────────────────────────────────────────────────────────────────────────────
const coverPage = () => [
  // Banner
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 0 },
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    border: {
      top:    { style: BorderStyle.SINGLE, size: 12, color: BLUE },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: BLUE },
      left:   { style: BorderStyle.SINGLE, size: 12, color: BLUE },
      right:  { style: BorderStyle.SINGLE, size: 12, color: BLUE },
    },
    children: [new TextRun({ text: "SmartCare", font:"Arial", size:72, bold:true, color:"FFFFFF" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 480 },
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    children: [new TextRun({ text:"Hospital Management System", font:"Arial", size:36, color:"93C5FD" })]
  }),
  // SRS title
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text:"Software Requirements Specification (SRS)", font:"Arial", size:36, bold:true, color: NAVY })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 480 },
    children: [new TextRun({ text:"Version 2.0", font:"Arial", size:24, color: MID, italics:true })]
  }),
  // Info block
  ...[
    ["University",      "Helwan University"],
    ["Faculty",         "Faculty of Engineering"],
    ["Department",      "Communication and Information Engineering"],
    ["Academic Level",  "Year 3  |  Semester 2  |  2025/2026"],
    ["Course",          "Software Engineering"],
    ["Instructor",      "Dr. Samar Ashraf"],
    ["Group",           "TEAM 8"],
  ].map(([k, v]) => new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${k}:  `, font:"Arial", size:22, bold:true, color: NAVY }),
      new TextRun({ text: v, font:"Arial", size:22, color:"1E293B" }),
    ]
  })),
  spacer(360),
  // Team table
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text:"Project Team", font:"Arial", size:24, bold:true, color: NAVY })]
  }),
  teamTable(),
  spacer(240),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text:"May 2026", font:"Arial", size:22, italics:true, color: MID })]
  }),
  pageBreak(),
];

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 1 — INTRODUCTION
// ─────────────────────────────────────────────────────────────────────────────
const section1 = () => [
  h1("1. Introduction"),
  h2("1.1 Purpose"),
  bodyPara("This document defines the consolidated Software Requirements Specification (SRS) for SmartCare, a web-based Hospital Management System. It serves as the authoritative reference for developers, testers, and stakeholders involved in design, implementation, and validation. Version 2.0 supersedes SRS v1.0 and incorporates all features added during the second development phase, including clinic room management, doctor scheduling, drug catalogue, extended prescription handling, and extended user profile management by administrators."),
  spacer(),
  h2("1.2 Project Overview"),
  bodyPara("SmartCare is a comprehensive, web-based platform designed to streamline healthcare operations by centralising appointments, medical records, prescriptions, billing, and clinic scheduling into a single accessible interface. It serves three primary user roles — Administrators, Doctors, and Patients — and provides analytics dashboards to help hospital staff monitor and improve service quality. The system is backed by a PostgreSQL 15+ relational database comprising 16 tables across five functional domains."),
  spacer(),
  h2("1.3 Scope"),
  bodyPara("The system covers the following functional areas:"),
  ...["User account management and authentication (including extended profile fields managed by Admin)",
      "Appointment scheduling and management",
      "Clinic room management and doctor scheduling",
      "Patient medical records and history",
      "Prescription management (multi-drug, header + detail model)",
      "Drug catalogue management",
      "Billing and payment processing",
      "Notification and alert system",
      "Analytics and reporting dashboard",
  ].map(item => new Paragraph({
    numbering: { reference:"bullets", level:0 },
    spacing: { after: 60 },
    children: [new TextRun({ text: item, font:"Arial", size:22 })]
  })),
  spacer(),
  h2("1.4 Definitions and Acronyms"),
  new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [2200, 6638],
    rows: [
      new TableRow({ tableHeader:true, children:[hCell("Term / Acronym", 2200), hCell("Definition", 6638)] }),
      ...([
        ["HMS / SRS",   "Hospital Management System / Software Requirements Specification"],
        ["EHR / EMR",   "Electronic Health Record / Electronic Medical Record"],
        ["Admin",       "Hospital Administrator — manages system-level operations"],
        ["HTTPS/TLS",   "Secure communication protocol used between client and server"],
        ["UC / FR / NFR","Use Case / Functional Requirement / Non-Functional Requirement"],
        ["HIPAA",       "Health Insurance Portability and Accountability Act (or equivalent local regulation)"],
        ["DDL",         "Data Definition Language — SQL statements used to define the database schema"],
        ["EXCLUDE",     "PostgreSQL constraint preventing overlapping range values (used for clinic scheduling)"],
        ["RBAC",        "Role-Based Access Control"],
        ["JWT",         "JSON Web Token — used for stateless session authentication"],
      ].map(([t,d], i) => new TableRow({ children:[
        altCell(cp(t, 20, NAVY, true), 2200, i%2===0),
        altCell(cp(d, 20),             6638, i%2===0),
      ]})))
    ]
  }),
  spacer(),
  pageBreak(),
];

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 2 — STAKEHOLDERS
// ─────────────────────────────────────────────────────────────────────────────
const section2 = () => [
  h1("2. Stakeholders and User Roles"),
  bodyPara("SmartCare involves the following stakeholders:"),
  spacer(),
  new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [1400, 3200, 5038],
    rows: [
      new TableRow({ tableHeader:true, children:[
        hCell("Role",                 1400),
        hCell("Description",          3200),
        hCell("Key Responsibilities", 5038),
      ]}),
      ...([
        ["Administrator","Hospital staff with full system access",
         "Manage users (including extended profile fields for doctors and patients), view analytics, configure settings, manage billing, manage clinics and drug catalogue"],
        ["Doctor",       "Medical professional registered in the system",
         "View/update patient records, manage appointments, issue prescriptions, reserve clinic slots"],
        ["Patient",      "Registered hospital patient",
         "Book appointments, view records/prescriptions, make payments, receive notifications"],
        ["System",       "The SmartCare platform (automated actor)",
         "Send notifications, generate invoices, enforce access control, run backups, prevent scheduling conflicts"],
      ].map(([role, desc, resp], i) => new TableRow({ children:[
        altCell(cp(role, 20, NAVY, true), 1400, i%2===0),
        altCell(cp(desc, 20),             3200, i%2===0),
        altCell(cp(resp, 20),             5038, i%2===0),
      ]})))
    ]
  }),
  spacer(),
  pageBreak(),
];

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 3 — FUNCTIONAL REQUIREMENTS  (corrected numbering)
// ─────────────────────────────────────────────────────────────────────────────
const section3 = () => [
  h1("3. Functional Requirements"),
  bodyPara("Requirements have been consolidated and updated. Items marked ★ are new in v2.0."),
  spacer(),

  // 3.1 Auth
  h2("3.1 Authentication & Account Management"),
  frTable([
    frRow("FR-01","All Users","Users shall register with name, email, password, and role (Patient). An optional phone number may be provided at registration.","UC-01",true),
    frRow("FR-02","All Users","Users shall log in using their registered email and password. Upon successful authentication the system shall redirect each user to their role-specific dashboard (Admin, Doctor, or Patient).","UC-02",false),
    frRow("FR-03","All Users","Users shall be able to reset their password either by providing their current password (when logged in), or by requesting a password-reset link sent to their registered email address.","UC-03",true),
    frRow("FR-04","Admin","Administrators shall create user accounts and manage inactive session timeouts.","UC-04",false),
    frRow("FR-05","Admin","Administrators shall set and update extended profile attributes: phone number for all users; date of birth, gender, address, and blood type for patients; specialty and licence number for doctors. These fields may not be self-modified by users.","UC-04",true,true),
  ]),
  spacer(),

  // 3.2 Appointments
  h2("3.2 Appointment Management"),
  frTable([
    frRow("FR-06","Patient","Patients shall search for doctors by name or specialty, then book, reschedule, or cancel appointments. The system shall reject any appointment booked for a past date/time.","UC-05",true),
    frRow("FR-07","Doctor / Admin","Doctors shall view their daily and weekly schedule and confirm, reschedule, or cancel appointments. Admins shall oversee all hospital appointments.","UC-06",false),
    frRow("FR-08","System","The system shall send automated reminders to patients 24 hours before their appointments.","UC-05, UC-06",true),
  ]),
  spacer(),

  // 3.3 Clinic Rooms
  h2("3.3 Clinic Room Management"),
  new Paragraph({ spacing:{after:80}, children:[run("New functional area introduced in v2.0.", { italics:true, color:"16A34A" })] }),
  frTable([
    frRow("FR-09","Admin","Administrators shall create and manage clinic rooms, assigning each a type (e.g. Outpatient, Emergency, ICU). Clinic rooms serve as the physical anchors for doctor scheduling.","UC-16",true,true),
    frRow("FR-10","Doctor / Admin","Doctors shall be assigned to clinic rooms for specific dates and time slots. The system shall prevent scheduling conflicts: no two doctors may occupy the same room at overlapping times, and a single doctor may not be assigned to two clinics simultaneously. Reservation end time must be later than start time.","UC-17",false,true),
  ]),
  spacer(),

  // 3.4 Medical Records
  h2("3.4 Medical Records Management"),
  frTable([
    frRow("FR-11","Doctor","Doctors shall create and update a patient's medical record after each visit. A medical record may optionally be linked to an appointment; walk-in or emergency records may exist without a linked appointment.","UC-08",true),
    frRow("FR-12","Doctor / Patient","Doctors shall view a patient's full medical history. Patients shall view their own records and lab reports. Records shall be accessible only to authorised users.","UC-07",false),
  ]),
  spacer(),

  // 3.5 Prescription
  h2("3.5 Prescription Management"),
  frTable([
    frRow("FR-13","Doctor","Doctors shall create digital prescriptions linked to a patient visit (medical record). Each prescription shall support multiple drug lines, where each line specifies the drug name, dosage, frequency, and duration.","UC-09",true),
    frRow("FR-14","Patient / System","Patients shall view active and past prescriptions. The system shall notify patients when a new prescription is issued.","UC-10",false),
    frRow("FR-15","Admin","Administrators shall manage a master drug catalogue containing drug names and their active ingredients. Doctors shall select drugs from this catalogue when issuing prescriptions.","UC-18",true,true),
  ]),
  spacer(),

  // 3.6 Billing
  h2("3.6 Billing & Payment"),
  frTable([
    frRow("FR-16","System / Admin","The system shall automatically generate an invoice upon appointment completion. An invoice cannot be created for pending, confirmed, or cancelled appointments. Admins shall manage billing records and process refunds.","UC-11, UC-13",true),
    frRow("FR-17","Patient","Patients shall view their billing history and pay pending invoices via card or digital wallet. Inserting a payment record shall automatically mark the linked invoice as paid.","UC-12",false),
  ]),
  spacer(),

  // 3.7 Notifications
  h2("3.7 Notifications"),
  frTable([
    frRow("FR-18","System","The system shall send in-app notifications for appointments, prescriptions, and billing events. Admins shall receive alerts for critical system errors.","UC-14",true),
  ]),
  spacer(),

  // 3.8 Analytics
  h2("3.8 Analytics & Reporting"),
  frTable([
    frRow("FR-19","Admin","Administrators shall access a real-time dashboard showing KPIs: total appointments, revenue, active patients, and doctor utilisation.","UC-15",true),
  ]),
  spacer(),
  pageBreak(),
];

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 4 — NON-FUNCTIONAL REQUIREMENTS
// ─────────────────────────────────────────────────────────────────────────────
const section4 = () => [
  h1("4. Non-Functional Requirements"),
  spacer(60),
  nfrTable([
    nfrRow("NFR-01","Performance","Any page shall load within 3 seconds under normal conditions; appointment booking shall complete within 2 seconds of confirmation.","High",true),
    nfrRow("NFR-02","Performance","The system shall support at least 500 concurrent users without performance degradation.","High",false),
    nfrRow("NFR-03","Security","Passwords shall be stored using a strong hashing algorithm (bcrypt). All client-server communication shall be encrypted via HTTPS/TLS.","High",true),
    nfrRow("NFR-04","Security","Role-based access control (RBAC) shall prevent unauthorised data access. Doctors may only access records of patients assigned to them. Database-level triggers enforce role correctness on all critical tables.","High",false),
    nfrRow("NFR-05","Availability","The system shall maintain 99.5% uptime. Planned maintenance shall not exceed 4 hours per month, scheduled outside clinic hours.","High",true),
    nfrRow("NFR-06","Usability","The interface shall be responsive across desktop, tablet, and mobile. New users shall complete core tasks within 5 minutes without prior training.","Medium",false),
    nfrRow("NFR-07","Scalability","The architecture shall support horizontal scaling to accommodate hospital growth.","Medium",true),
    nfrRow("NFR-08","Maintainability","The codebase shall follow modular design principles to facilitate future enhancements.","Medium",false),
    nfrRow("NFR-09","Compliance","The system shall comply with applicable healthcare data privacy regulations (e.g. HIPAA or equivalent).","High",true),
    nfrRow("NFR-10","Reliability","The system shall perform automated daily backups of all patient data.","High",false),
    nfrRow("NFR-11","Data Integrity","★ The database shall enforce scheduling conflict prevention via EXCLUDE constraints on clinic reservations, role-check triggers on all user-typed foreign keys, and CHECK constraints ensuring valid amounts and time ranges.","High",true),
  ]),
  spacer(),
  pageBreak(),
];

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 5 — SYSTEM ARCHITECTURE
// ─────────────────────────────────────────────────────────────────────────────
const section5 = () => [
  h1("5. System Architecture"),
  bodyPara("SmartCare follows a three-tier Client-Server Architecture. The database tier uses PostgreSQL 15+, enabling advanced features such as ENUM types, custom range types (timerange), EXCLUDE constraints, and PL/pgSQL triggers for business-rule enforcement."),
  spacer(),
  new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [2400, 6438],
    rows:[
      new TableRow({ tableHeader:true, children:[hCell("Layer",2400), hCell("Description",6438)] }),
      ...([
        ["Presentation Layer","Web browser interface (Chrome, Firefox, Edge, Safari) with distinct, responsive dashboards for each user role (Patient, Doctor, Admin)."],
        ["Application Layer","Server-side business logic including appointment scheduling, clinic reservation management, billing calculations, notification triggers, and access control enforcement."],
        ["Data Layer","Centralised relational database — PostgreSQL 15+ — storing 16 tables across five domains: Identity & Roles, Clinic & Scheduling, Clinical Records, Billing, and Notifications & Reporting."],
      ].map(([l,d],i) => new TableRow({ children:[
        altCell(cp(l,20,NAVY,true),2400,i%2===0),
        altCell(cp(d,20),6438,i%2===0),
      ]})))
    ]
  }),
  spacer(),

  h2("5.1 Database Domain Summary"),
  new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [2000, 3400, 4038],
    rows:[
      new TableRow({ tableHeader:true, children:[hCell("Domain",2000),hCell("Tables",3400),hCell("Purpose",4038)] }),
      ...([
        ["Identity & Roles","app_user, patient, doctor","Manages all user accounts and role-based profiles. Admin can set phone number, DOB, gender, address, blood type (patient) and specialty, licence number (doctor)."],
        ["Clinic & Scheduling","clinic, clinic_reservation, appointment","Controls room availability, doctor shift scheduling, and appointment booking."],
        ["Clinical Records","medicalrecord, prescription, drug, drug_details, prescription_details","Tracks diagnoses, multi-drug prescriptions, and the drug master catalogue."],
        ["Billing","invoice, payment","Handles invoice auto-generation and payment settlement."],
        ["Notifications & Reporting","notification, notificationpreference","Stores in-app notifications and user-level channel/event preferences."],
      ].map(([d,t,p],i) => new TableRow({ children:[
        altCell(cp(d,20,NAVY,true),2000,i%2===0),
        altCell(cp(t,20),3400,i%2===0),
        altCell(cp(p,20),4038,i%2===0),
      ]})))
    ]
  }),
  spacer(),

  h2("5.2 Class Diagram"),
  bodyPara("The following class diagram illustrates the structural relationships between the primary entities in the SmartCare database schema."),
  spacer(60),
  ...diagramPlaceholder("[ Insert Class Diagram here ]"),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 240 },
    children: [new TextRun({ text: "Figure 1: SmartCare Class Diagram", font:"Arial", size:20, italics:true, color: MID })]
  }),
  pageBreak(),
];

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 6 — USE CASE OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────
const section6 = () => [
  h1("6. Use Case Overview"),

  h2("6.1 Use Case Summary"),
  spacer(60),
  ucTable([
    ucRow("UC-01","Register Account",         "Patient",               "FR-01",             true),
    ucRow("UC-02","Login to System",           "All Users",             "FR-02",             false),
    ucRow("UC-03","Reset Password",            "All Users",             "FR-03",             true),
    ucRow("UC-04","Manage User Accounts & Profiles","Administrator",    "FR-04, FR-05",      false),
    ucRow("UC-05","Book Appointment",          "Patient, Admin",        "FR-06, FR-08",      true),
    ucRow("UC-06","Manage Appointment",        "Doctor, Admin",         "FR-07, FR-08",      false),
    ucRow("UC-07","View Medical Records",      "Doctor, Patient",       "FR-12",             true),
    ucRow("UC-08","Update Medical Records",    "Doctor",                "FR-11",             false),
    ucRow("UC-09","Issue Prescription",        "Doctor",                "FR-13, FR-14",      true),
    ucRow("UC-10","View Prescription",         "All Users",             "FR-14",             false),
    ucRow("UC-11","Generate Invoice",          "System",                "FR-16",             true),
    ucRow("UC-12","Process Payment",           "Patient",               "FR-17",             false),
    ucRow("UC-13","Manage Billing Records",    "Administrator",         "FR-16",             true),
    ucRow("UC-14","Send Notification",         "System",                "FR-18",             false),
    ucRow("UC-15","View Analytics Dashboard",  "Administrator",         "FR-19",             true),
    ucRow("UC-16","Manage Clinic Rooms",       "Administrator",         "FR-09",             false),
    ucRow("UC-17","Reserve Clinic / Schedule Doctor","Doctor, Admin",   "FR-10",             true),
    ucRow("UC-18","Manage Drug Catalogue",     "Administrator, Doctor", "FR-15",             false),
  ]),
  spacer(),

  h2("6.2 Use Case Diagram"),
  bodyPara("The following diagram illustrates all actors and their interactions with the system use cases."),
  spacer(60),
  ...diagramPlaceholder("[ Insert Use Case Diagram here ]"),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 240 },
    children: [new TextRun({ text: "Figure 2: SmartCare Use Case Diagram", font:"Arial", size:20, italics:true, color: MID })]
  }),
  pageBreak(),
];

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 7 — CONSTRAINTS & ASSUMPTIONS
// ─────────────────────────────────────────────────────────────────────────────
const section7 = () => [
  h1("7. System Constraints and Assumptions"),

  h2("7.1 Constraints"),
  ...[
    "The system must be web-based and accessible via modern browsers (Chrome, Firefox, Edge, Safari).",
    "All client-server communication must use HTTPS/TLS encryption.",
    "Patient data must be stored securely in compliance with applicable data protection regulations.",
    "The system must remain functional during partial server failures via graceful degradation.",
    "The database must be PostgreSQL 15+ to support EXCLUDE constraints, custom ENUM types, custom range types, and PL/pgSQL triggers.",
    "Clinic reservations must not overlap: the same room cannot host two doctors simultaneously, and a single doctor cannot occupy two rooms at the same time.",
    "Only Administrators may create, edit, or deactivate user accounts and update extended profile fields.",
  ].map(item => new Paragraph({
    numbering: { reference:"bullets", level:0 },
    spacing: { after: 60 },
    children: [new TextRun({ text: item, font:"Arial", size:22 })]
  })),
  spacer(),

  h2("7.2 Assumptions"),
  ...[
    "All users have internet access and a modern web browser.",
    "Hospital billing rates, clinic room definitions, and doctor schedules are configured by the Administrator before system use.",
    "An email service is available for notifications and password-reset links.",
    "A payment gateway integration is available for online transactions.",
    "The drug catalogue is pre-populated by Administrators before doctors begin issuing prescriptions.",
    "Extended profile information for doctors (specialty, licence number) and patients (DOB, gender, address, blood type, phone) is entered by the Administrator when creating or editing accounts.",
  ].map(item => new Paragraph({
    numbering: { reference:"bullets", level:0 },
    spacing: { after: 60 },
    children: [new TextRun({ text: item, font:"Arial", size:22 })]
  })),
  spacer(),
  pageBreak(),
];

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 8 — TIME PLAN
// ─────────────────────────────────────────────────────────────────────────────
const section8 = () => [
  h1("8. Time Plan"),
  spacer(60),
  new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [2600, 5038, 1800],
    rows:[
      new TableRow({ tableHeader:true, children:[
        hCell("Phase",2600), hCell("Activities",5038), hCell("Timeline",1800)
      ]}),
      ...([
        ["Phase 1: Requirements & Analysis","Gather requirements, define stakeholders, review SRS","Week 1"],
        ["Phase 2: System Design & UML Modelling","Architecture design, database schema design, UML diagrams (use case, class, sequence, activity, ER)","Week 2"],
        ["Phase 3: Implementation / Prototyping","Frontend & backend development, module integration (clinic scheduling, drug catalogue, multi-drug prescriptions, admin profile management)","Week 3"],
        ["Phase 4: Testing & Validation","Unit testing, system testing, trigger/constraint validation, bug fixes","Week 4"],
        ["Phase 5: Documentation & Presentation","Final documentation (SRS v2.0, DB report), presentation preparation","Week 5"],
      ].map(([p,a,t],i) => new TableRow({ children:[
        altCell(cp(p,20,NAVY,true),2600,i%2===0),
        altCell(cp(a,20),5038,i%2===0),
        altCell(cp(t,20,MID,false),1800,i%2===0),
      ]})))
    ]
  }),
  spacer(),
  pageBreak(),
];

// ─────────────────────────────────────────────────────────────────────────────
//  APPENDIX A — ACTIVITY DIAGRAMS
// ─────────────────────────────────────────────────────────────────────────────
const appendixA = () => {
  const ucList = [
    ["UC-01","Register Account"],
    ["UC-02","Login to System"],
    ["UC-03","Reset Password"],
    ["UC-04","Manage User Accounts & Profiles"],
    ["UC-05","Book Appointment"],
    ["UC-06","Manage Appointment"],
    ["UC-07","View Medical Records"],
    ["UC-08","Update Medical Records"],
    ["UC-09","Issue Prescription"],
    ["UC-10","View Prescription"],
    ["UC-11","Generate Invoice"],
    ["UC-12","Process Payment"],
    ["UC-13","Manage Billing Records"],
    ["UC-14","Send Notification"],
    ["UC-15","View Analytics Dashboard"],
    ["UC-16","Manage Clinic Rooms"],
    ["UC-17","Reserve Clinic / Schedule Doctor"],
    ["UC-18","Manage Drug Catalogue"],
  ];
  const out = [
    h1("Appendix A: Activity Diagrams"),
    bodyPara("The following activity diagrams were auto-generated using generate_activity_diagrams.py and illustrate the step-by-step workflows for each use case."),
    spacer(),
  ];
  ucList.forEach(([ucId, ucName], idx) => {
    out.push(
      h3(`${ucId} — ${ucName}`),
      spacer(60),
      ...diagramPlaceholder(`[ Insert Activity Diagram — ${ucId}: ${ucName} ]`),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 300 },
        children: [new TextRun({ text:`Figure A.${idx+1}: Activity Diagram — ${ucId} ${ucName}`, font:"Arial", size:20, italics:true, color: MID })]
      }),
      ...(idx < ucList.length - 1 ? [spacer(120)] : []),
    );
  });
  out.push(pageBreak());
  return out;
};

// ─────────────────────────────────────────────────────────────────────────────
//  APPENDIX B — SEQUENCE DIAGRAMS
// ─────────────────────────────────────────────────────────────────────────────
const appendixB = () => {
  const ucList = [
    ["UC-01","Register Account"],
    ["UC-02","Login to System"],
    ["UC-03","Reset Password"],
    ["UC-04","Manage User Accounts & Profiles"],
    ["UC-05","Book Appointment"],
    ["UC-06","Manage Appointment"],
    ["UC-07","View Medical Records"],
    ["UC-08","Update Medical Records"],
    ["UC-09","Issue Prescription"],
    ["UC-10","View Prescription"],
    ["UC-11","Generate Invoice"],
    ["UC-12","Process Payment"],
    ["UC-13","Manage Billing Records"],
    ["UC-14","Send Notification"],
    ["UC-15","View Analytics Dashboard"],
    ["UC-16","Manage Clinic Rooms"],
    ["UC-17","Reserve Clinic / Schedule Doctor"],
    ["UC-18","Manage Drug Catalogue"],
  ];
  const out = [
    h1("Appendix B: Sequence Diagrams"),
    bodyPara("The following sequence diagrams were auto-generated using generate_sequence_diagrams.py and illustrate the message flows between actors, the browser, the API server, the database, and external services for each use case."),
    spacer(),
  ];
  ucList.forEach(([ucId, ucName], idx) => {
    out.push(
      h3(`${ucId} — ${ucName}`),
      spacer(60),
      ...diagramPlaceholder(`[ Insert Sequence Diagram — ${ucId}: ${ucName} ]`),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 300 },
        children: [new TextRun({ text:`Figure B.${idx+1}: Sequence Diagram — ${ucId} ${ucName}`, font:"Arial", size:20, italics:true, color: MID })]
      }),
      ...(idx < ucList.length - 1 ? [spacer(120)] : []),
    );
  });
  return out;
};

// ─────────────────────────────────────────────────────────────────────────────
//  HEADER / FOOTER
// ─────────────────────────────────────────────────────────────────────────────
const docHeader = () => new Header({
  children: [new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
    spacing: { after: 80 },
    children: [
      new TextRun({ text: "SmartCare HMS  ·  SRS v2.0", font:"Arial", size:18, bold:true, color: NAVY }),
      new TextRun({ text: "  |  Helwan University — Team 8  |  May 2026", font:"Arial", size:18, color: MID }),
    ]
  })]
});
const docFooter = () => new Footer({
  children: [new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
    spacing: { before: 80 },
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT }],
    children: [
      new TextRun({ text: "SmartCare — Confidential", font:"Arial", size:16, color: MID }),
      new TextRun({ text: "\tPage ", font:"Arial", size:16, color: MID }),
      new SimpleField("PAGE"),
    ]
  })]
});

// ─────────────────────────────────────────────────────────────────────────────
//  ASSEMBLE DOCUMENT
// ─────────────────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level:0, format:LevelFormat.BULLET, text:"•", alignment:AlignmentType.LEFT,
        style:{ paragraph:{ indent:{ left:440, hanging:220 } } } }]
    }]
  },
  styles: {
    default: { document: { run: { font:"Arial", size:22 } } },
    paragraphStyles: [
      { id:"Heading1", name:"Heading 1", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:36, bold:true, font:"Arial", color: NAVY },
        paragraph:{ spacing:{ before:360, after:180 }, outlineLevel:0,
          border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color: BLUE, space:1 } } } },
      { id:"Heading2", name:"Heading 2", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:28, bold:true, font:"Arial", color: NAVY },
        paragraph:{ spacing:{ before:240, after:120 }, outlineLevel:1 } },
      { id:"Heading3", name:"Heading 3", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:24, bold:true, font:"Arial", color: MID },
        paragraph:{ spacing:{ before:180, after:80 }, outlineLevel:2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size:   { width: PAGE_W, height: PAGE_H },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
      }
    },
    headers: { default: docHeader() },
    footers: { default: docFooter() },
    children: [
      ...coverPage(),
      ...section1(),
      ...section2(),
      ...section3(),
      ...section4(),
      ...section5(),
      ...section6(),
      ...section7(),
      ...section8(),
      ...appendixA(),
      ...appendixB(),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("SmartCare_SRS_v2_1.docx", buf); 
  console.log("✓ SmartCare_SRS_v2_1.docx written to current folder");
}).catch(e => { console.error(e); process.exit(1); });