
const fs = require("fs");
const path = require("path");

const file = path.join(
  __dirname,
  "../app/components/ipu-syllabus-data.json"
);

const dataset = JSON.parse(fs.readFileSync(file, "utf8"));

console.log("\n========== DATASET STRUCTURE ==========");
console.log("Top-level keys:", Object.keys(dataset));
console.log("Subject count:", Object.keys(dataset.subjects ?? {}).length);
console.log("BTECH branches:", Object.keys(dataset.programs?.BTECH ?? {}));

console.log("\n========== SAMPLE SUBJECT ==========");
const firstSubjectEntry = Object.entries(dataset.subjects ?? {})[0];

if (firstSubjectEntry) {
  console.log("Subject key:", firstSubjectEntry[0]);
  console.log(JSON.stringify(firstSubjectEntry[1], null, 2).slice(0, 5000));
}

console.log("\n========== SAMPLE BTECH MAPPING ==========");
const firstBranch = Object.entries(dataset.programs?.BTECH ?? {})[0];

if (firstBranch) {
  const firstSemester = Object.entries(firstBranch[1])[0];

  console.log("Branch:", firstBranch[0]);
  console.log("Semester:", firstSemester?.[0]);
  console.log(
    JSON.stringify(firstSemester?.[1]?.[0], null, 2)
  );
}

console.log("\n========== TARGET SUBJECT SEARCH ==========");

const targetIds = [
  "65ffa3a45a59ecc450ed9f6c",
  "655b9fd0e0f5a74d26148100",
];

for (const targetId of targetIds) {
  const matches = Object.entries(dataset.subjects ?? {}).filter(
    ([key, subject]) =>
      key === targetId ||
      subject.id === targetId ||
      subject.sourceId === targetId
  );

  console.log("\nTarget:", targetId);
  console.log("Matches:", matches.length);

  for (const [key, subject] of matches) {
    const units = subject.data?.theory ?? subject.data?.units ?? [];

    console.log("Key:", key);
    console.log("Name:", subject.name);
    console.log("Unit count:", units.length);
    console.log("Units:", JSON.stringify(units, null, 2));
  }
}

console.log("\n========== DONE ==========");
