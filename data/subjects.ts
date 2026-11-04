
export type Subject = {
  code: string;
  name: string;
  course: "B.Tech" | "BCA";
  branch: string;
  semester: number;
};

export const subjects: Subject[] = [
  {
    code: "EC301",
    name: "Digital Electronics",
    course: "B.Tech",
    branch: "ECE",
    semester: 3,
  },
  {
    code: "EC302",
    name: "Signals & Systems",
    course: "B.Tech",
    branch: "ECE",
    semester: 3,
  },
];
