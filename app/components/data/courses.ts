
import syllabusData from "../ipu-syllabus-data.json";
import { extractedBtechPapers } from "./ipu-btech-paper-units";

export type Topic = string;

export type Unit = {
  title: string;
  topics: Topic[];
};

export type SyllabusType = "affiliated" | "usict";

export type Subject = {
  code: string;
  sourceId: string;
  slug: string;
  name: string;
  branch: string;
  course: "B.Tech" | "BCA";
  semester: number;
  academicSession: string;
  syllabusType: SyllabusType;
  credits?: number;
  theoryCode?: string;
  theoryCredits?: number;
  labCode?: string;
  labCredits?: number;
  units: Unit[];
  labExperiments: string[];
  bookId?: string;
  pyqId?: string;
  practicalData?: unknown;
  syllabusVerified: boolean;
};

export type CourseData = {
  name: "B.Tech" | "BCA";
  branches: {
    name: string;
    semesters: {
      semester: number;
      subjects: Subject[];
    }[];
  }[];
};

type DatasetMapping = {
  subjectId: string;
  slug: string;
  name: string;
};

type DatasetSubject = {
  id: string;
  course: "BTECH" | "BCA";
  semester: number;
  slug: string;
  name: string;
  departments: string[];
  data: {
    subject?: string;
    theorypapercode?: string;
    labpapercode?: string | null;
    theorycredits?: number | null;
    labcredits?: number | null;
    theory?: Array<{
      unit: number;
      topics?: string[];
    }>;
    units?: Array<{
      unit: number;
      topics?: string[];
    }>;
    lab?: unknown[];
    book?: string;
    pYq?: string;
    practical?: unknown;
    practicalFile?: unknown;
    [key: string]: unknown;
  };
};

type NormalizedDataset = {
  programs: {
    BTECH: Record<
      string,
      Record<string, DatasetMapping[]>
    >;
    BCA: Record<
      string,
      Record<string, DatasetMapping[]>
    >;
  };
  subjects: Record<string, DatasetSubject>;
};

const dataset = syllabusData as NormalizedDataset;

const ACADEMIC_SESSION = "2025-26";

export const btechBranches = [
  "CSE",
  "IT",
  "CST",
  "ITE",
  "ECE",
  "EE",
  "EEE",
  "ICE",
  "ME",
  "CE",
  "MAE",
];

export const createEmptyUnits = (): Unit[] =>
  [1, 2, 3, 4].map((number) => ({
    title: `Unit ${number}`,
    topics: [],
  }));

const createSemesters = (total: number) =>
  Array.from({ length: total }, (_, index) => ({
    semester: index + 1,
    subjects: [] as Subject[],
  }));

function convertSubject(
  mapping: DatasetMapping,
  branch: string,
  course: "B.Tech" | "BCA",
  semester: number
): Subject | null {
  const record = dataset.subjects[mapping.subjectId];

  if (!record) {
    console.error(
      `Dataset subject missing: ${mapping.subjectId}`
    );
    return null;
  }

  const data = record.data;

  // B.Tech uses "theory"; BCA may use "units".
  const sourceUnits = data.theory ?? data.units ?? [];

  const units: Unit[] = sourceUnits.map((unit, index) => ({
    title: `Unit ${unit.unit ?? index + 1}`,
    topics: Array.isArray(unit.topics)
      ? unit.topics.filter(
          (topic): topic is string => typeof topic === "string"
        )
      : [],
  }));

  const labExperiments = Array.isArray(data.lab)
    ? data.lab
        .map((experiment) => {
          if (typeof experiment === "string") return experiment;

          if (
            experiment &&
            typeof experiment === "object"
          ) {
            const item = experiment as Record<string, unknown>;

            return String(
              item.title ??
                item.name ??
                item.experiment ??
                ""
            );
          }

          return "";
        })
        .filter(Boolean)
    : [];

  const theoryCredits =
    typeof data.theorycredits === "number"
      ? data.theorycredits
      : undefined;

  const labCredits =
    typeof data.labcredits === "number"
      ? data.labcredits
      : undefined;

  const credits =
    theoryCredits !== undefined || labCredits !== undefined
      ? (theoryCredits ?? 0) + (labCredits ?? 0)
      : undefined;

  return {
    code: mapping.subjectId,
    sourceId: record.id,
    slug: record.slug || mapping.slug,
    name: record.name || mapping.name,
    branch,
    course,
    semester,
    academicSession: ACADEMIC_SESSION,
    syllabusType: "affiliated",
    credits,
    theoryCode: data.theorypapercode || undefined,
    theoryCredits,
    labCode: data.labpapercode || undefined,
    labCredits,
    units,
    labExperiments,
    bookId: data.book,
    pyqId: data.pYq,
    practicalData: data.practical ?? data.practicalFile,
    syllabusVerified: false,
  };
}

function getBranchSubjects(
  program: "BTECH" | "BCA",
  branch: string,
  semester: number
): Subject[] {
  const branchData = dataset.programs[program][branch];
  const mappings = branchData?.[String(semester)] ?? [];

  return mappings
    .map((mapping) =>
      convertSubject(
        mapping,
        branch,
        program === "BTECH" ? "B.Tech" : "BCA",
        semester
      )
    )
    .filter((subject): subject is Subject => subject !== null);
}

const btechCourse: CourseData = {
  name: "B.Tech",
  branches: btechBranches.map((branch) => ({
    name: branch,
    semesters: createSemesters(7).map(({ semester }) => ({
      semester,
      subjects: getBranchSubjects("BTECH", branch, semester),
    })),
  })),
};

const bcaCourse: CourseData = {
  name: "BCA",
  branches: [
    {
      name: "General",
      semesters: createSemesters(6).map(({ semester }) => ({
        semester,
        subjects: getBranchSubjects("BCA", "BCA", semester),
      })),
    },
  ],
};

export const courses: CourseData[] = [
  btechCourse,
  bcaCourse,
];

export const extractedSubjects: Subject[] =
  extractedBtechPapers.map((paper) => ({
    code: paper.code,
    sourceId: paper.code,
    slug: paper.code.toLowerCase(),
    name: paper.name,
    branch: "Unmapped",
    course: "B.Tech",
    semester: 1,
    academicSession: ACADEMIC_SESSION,
    syllabusType: "affiliated",
    units: paper.units.slice(0, 4).map((unit, index) => ({
      title: unit.title || `Unit ${index + 1}`,
      topics: unit.topics
        .split(/\n+/)
        .map((topic) => topic.trim())
        .filter(Boolean),
    })),
    labExperiments: [],
    syllabusVerified: false,
  }));
