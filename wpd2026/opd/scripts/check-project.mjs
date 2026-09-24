import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "index.html",
  "src/app.js",
  "src/styles.css",
  "data/departments.json",
  "assets/images/awwab-poster.svg",
  "assets/icons/favicon.svg",
];

const missing = requiredFiles.filter((file) => !existsSync(file));

if (missing.length > 0) {
  console.error(`Missing required files: ${missing.join(", ")}`);
  process.exit(1);
}

const data = JSON.parse(readFileSync("data/departments.json", "utf8"));
const firstDepartment = data.departments?.[0];

if (!firstDepartment || firstDepartment.id !== "opd") {
  console.error("The first department must be OPD.");
  process.exit(1);
}

const app = readFileSync("src/app.js", "utf8");

for (const phrase of ["refer to a doctor", "speak directly with a pharmacist", "Virtual Intelligence Pharmacist"]) {
  if (!JSON.stringify(data).includes(phrase) && !app.includes(phrase)) {
    console.error(`Missing boundary phrase: ${phrase}`);
    process.exit(1);
  }
}

console.log("Project checks passed.");
