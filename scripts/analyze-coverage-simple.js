const fs = require("fs");
const path = require("path");

const lcovPath = path.join(process.cwd(), "coverage/lcov.info");

if (!fs.existsSync(lcovPath)) {
  console.log("No coverage file found.");
  process.exit(1);
}

const content = fs.readFileSync(lcovPath, "utf8");
const records = [];
let currentRecord = null;

content.split("\n").forEach(line => {
  if (line.startsWith("SF:")) {
    currentRecord = {
      file: line.replace("SF:", ""),
      linesFound: 0,
      linesHit: 0,
    };
  } else if (line.startsWith("LF:")) {
    if (currentRecord)
      currentRecord.linesFound = parseInt(line.replace("LF:", ""), 10);
  } else if (line.startsWith("LH:")) {
    if (currentRecord)
      currentRecord.linesHit = parseInt(line.replace("LH:", ""), 10);
  } else if (line === "end_of_record") {
    if (currentRecord) {
      records.push(currentRecord);
      currentRecord = null;
    }
  }
});

const relativeRecords = records
  .map(r => {
    const relativePath = path.relative(process.cwd(), r.file);
    return { ...r, file: relativePath };
  })
  .filter(r => !r.file.includes("node_modules") && !r.file.includes("tests/"));

const sorted = relativeRecords.sort((a, b) => {
  // Sort by number of missed lines (descending)
  const aMissed = a.linesFound - a.linesHit;
  const bMissed = b.linesFound - b.linesHit;
  return bMissed - aMissed;
});

console.log("Top files with most missed lines:");
sorted.slice(0, 15).forEach(r => {
  const missed = r.linesFound - r.linesHit;
  const percent = ((r.linesHit / r.linesFound) * 100).toFixed(2);
  console.log(`${r.file}: ${missed} missed lines (${percent}% covered)`);
});
