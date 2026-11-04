
const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "../app/components/ipu-syllabus-data.json"
);

const dataset = JSON.parse(fs.readFileSync(filePath, "utf8"));

const report = {
  totalUniqueSubjects: Object.keys(dataset.subjects || {}).length,
  programs: {},
  missingSubjectIds: [],
  duplicateMappings: [],
  subjectsWithoutUnits: [],
  subjectsWithUnexpectedUnitCount: [],
  subjectsWithoutTopics: [],
  duplicateSubjectNames: [],
};

for (const program of ["BTECH", "BCA"]) {
  const branches = dataset.programs?.[program] || {};
  const programReport = {};

  for (const [branch, semesters] of Object.entries(branches)) {
    programReport[branch] = {};

    for (const [semester, mappings] of Object.entries(semesters)) {
      const ids = mappings.map((item) => item.subjectId);
      const duplicateIds = ids.filter(
        (id, index) => ids.indexOf(id) !== index
      );

      const subjects = mappings
        .map((mapping) => dataset.subjects?.[mapping.subjectId])
        .filter(Boolean);

      const missingIds = mappings
        .filter((mapping) => !dataset.subjects?.[mapping.subjectId])
        .map((mapping) => mapping.subjectId);

      const unitIssues = [];

      for (const subject of subjects) {
        const units =
          subject.data?.theory ??
          subject.data?.units ??
          [];

        if (!units.length) {
          report.subjectsWithoutUnits.push({
            id: subject.id,
            name: subject.name,
            branch,
            semester,
          });
        }

        if (units.length !== 4) {
          unitIssues.push({
            id: subject.id,
            name: subject.name,
            unitCount: units.length,
          });

          report.subjectsWithUnexpectedUnitCount.push({
            id: subject.id,
            name: subject.name,
            branch,
            semester,
            unitCount: units.length,
          });
        }

        if (
          units.some(
            (unit) =>
              !Array.isArray(unit.topics) ||
              unit.topics.length === 0
          )
        ) {
          report.subjectsWithoutTopics.push({
            id: subject.id,
            name: subject.name,
            branch,
            semester,
          });
        }
      }

      missingIds.forEach((id) =>
        report.missingSubjectIds.push({
          id,
          branch,
          semester,
        })
      );

      duplicateIds.forEach((id) =>
        report.duplicateMappings.push({
          id,
          branch,
          semester,
        })
      );

      programReport[branch][semester] = {
        subjectCount: mappings.length,
        missingSubjectCount: missingIds.length,
        duplicateMappingCount: duplicateIds.length,
        subjectsWithUnitIssues: unitIssues.length,
      };
    }
  }

  report.programs[program] = programReport;
}

const nameGroups = {};

for (const subject of Object.values(dataset.subjects || {})) {
  const key = String(subject.name || "").trim().toLowerCase();

  if (!key) continue;

  nameGroups[key] ??= [];
  nameGroups[key].push({
    id: subject.id,
    name: subject.name,
    course: subject.course,
    semester: subject.semester,
    departments: subject.departments,
  });
}

report.duplicateSubjectNames = Object.values(nameGroups).filter(
  (items) => items.length > 1
);

const outputPath = path.join(__dirname, "syllabus-audit-report.json");

fs.writeFileSync(
  outputPath,
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("AUDIT COMPLETED");
console.log("Unique subjects:", report.totalUniqueSubjects);
console.log("Missing subject IDs:", report.missingSubjectIds.length);
console.log("Duplicate mappings:", report.duplicateMappings.length);
console.log("Subjects without units:", report.subjectsWithoutUnits.length);
console.log(
  "Subjects with unit count other than 4:",
  report.subjectsWithUnexpectedUnitCount.length
);
console.log("Subjects with empty/missing topics:", report.subjectsWithoutTopics.length);
console.log("Repeated subject names:", report.duplicateSubjectNames.length);
console.log("Report saved at:", outputPath);
