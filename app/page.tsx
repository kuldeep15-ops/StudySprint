
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { courses } from "./components/data/courses";

export default function HomePage() {
  const router = useRouter();

  const [courseName, setCourseName] = useState<"B.Tech" | "BCA">("B.Tech");
  const [branchName, setBranchName] = useState("CSE");
  const [semester, setSemester] = useState("1");
  const [search, setSearch] = useState("");
  const [syllabusType, setSyllabusType] =
    useState<"affiliated" | "usict">("affiliated");

  const selectedCourse = courses.find(
    (course) => course.name === courseName
  );

  const branches = selectedCourse?.branches ?? [];

  const selectedBranch =
    branches.find((branch) => branch.name === branchName) ??
    branches[0];

  const semesterData =
    selectedBranch?.semesters.find(
      (item) => item.semester === Number(semester)
    );

  const subjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (semesterData?.subjects ?? []).filter((subject) => {
      return (
        !query ||
        subject.name.toLowerCase().includes(query) ||
        subject.code.toLowerCase().includes(query)
      );
    });
  }, [semesterData, search]);

  function changeCourse(value: "B.Tech" | "BCA") {
    setCourseName(value);
    setBranchName(value === "B.Tech" ? "CSE" : "General");
    setSemester("1");
    setSearch("");
    setSyllabusType("affiliated");
  }

  function openSubject(code: string) {
    router.push(
      `/subjects/${encodeURIComponent(code)}?syllabusType=${syllabusType}`
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 text-left"
            aria-label="StudySprint home"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white">
              S
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight">
                StudySprint
              </span>
              <span className="block text-xs text-slate-500">
                Your university study companion
              </span>
            </span>
          </button>

          <span className="hidden rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 sm:inline-flex">
            GGSIPU / IPU
          </span>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_0.8fr] md:items-center md:py-20">
          <div>
            <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-medium">
              Made for IPU students
            </span>

            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Your syllabus.
              <br />
              Your notes.
              <br />
              Your preparation.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-indigo-100 sm:text-lg">
              Find subjects, explore unit-wise topics and organize your
              university exam preparation in one place.
            </p>

            <a
              href="#explore"
              className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 font-bold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
            >
              Explore syllabus <span className="ml-2">↓</span>
            </a>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-sm sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-100">
              Study smarter
            </p>
            <div className="mt-4 space-y-3">
              {[
                ["01", "Unit-wise syllabus", "Keep topics organized"],
                ["02", "Exam preparation", "Build focused study notes"],
                ["03", "Study resources", "Add notes and PYQs as available"],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-indigo-700">
                    {number}
                  </span>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="mt-1 text-sm text-indigo-100">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="explore" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-7">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            Explore your course
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            Find your subjects
          </h2>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            Select your course, branch and semester to view available subjects.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Course</span>
              <select
                value={courseName}
                onChange={(event) =>
                  changeCourse(event.target.value as "B.Tech" | "BCA")
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="B.Tech">B.Tech</option>
                <option value="BCA">BCA</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">Branch</span>
              <select
                value={selectedBranch?.name ?? ""}
                onChange={(event) => {
                  setBranchName(event.target.value);
                  setSemester("1");
                  setSearch("");
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">Semester</span>
              <select
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                {(selectedBranch?.semesters ?? []).map((item) => (
                  <option key={item.semester} value={item.semester}>
                    Semester {item.semester}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6">
            <span className="mb-3 block text-sm font-bold">
              Syllabus category
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSyllabusType("affiliated")}
                className={`rounded-xl border p-4 text-left transition ${
                  syllabusType === "affiliated"
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                    : "border-slate-200 hover:border-indigo-300"
                }`}
              >
                <span className="block font-bold">Affiliated colleges</span>
                <span className="mt-1 block text-sm text-slate-600">
                  Syllabus for affiliated institutions
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSyllabusType("usict")}
                className={`rounded-xl border p-4 text-left transition ${
                  syllabusType === "usict"
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                    : "border-slate-200 hover:border-indigo-300"
                }`}
              >
                <span className="block font-bold">USICT</span>
                <span className="mt-1 block text-sm text-slate-600">
                  University school syllabus
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-bold" htmlFor="subject-search">
              Search subject
            </label>
            <input
              id="subject-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by subject name or code..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="mb-5 mt-9 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black">
              Semester {semester} subjects
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {courseName} · {selectedBranch?.name ?? "No branch selected"}
            </p>
          </div>
          <span className="rounded-full bg-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700">
            {subjects.length} subjects
          </span>
        </div>

        {subjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <article
                key={`${subject.branch}-${subject.semester}-${subject.code}-${subject.name}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700">
                    {subject.code}
                  </span>

                  {subject.syllabusVerified && (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                      Verified
                    </span>
                  )}
                </div>

                <h4 className="mt-4 text-lg font-bold leading-6">
                  {subject.name}
                </h4>
                <p className="mt-2 text-sm text-slate-500">
                  {subject.branch} · Semester {subject.semester}
                </p>

                <button
                  onClick={() => openSubject(subject.code)}
                  className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white transition hover:bg-indigo-700"
                >
                  Open subject <span className="ml-1">→</span>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              📚
            </div>
            <h4 className="mt-4 text-xl font-black">Subjects not added yet</h4>
            <p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">
              Is branch aur semester ke subjects ka verified data abhi is
              demo database mein nahi hai. Galat subject list dikhane ke
              bajay hum ise verified syllabus data milne par add karenge.
            </p>
          </div>
        )}

        <p className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <strong>Data note:</strong> Har subject ka syllabus official
          academic scheme aur applicable batch se verify karna zaroori hai.
          Sample data ko final university syllabus na samjhein.
        </p>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-7 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
          <span className="font-bold text-slate-700">StudySprint</span>
          <span>Built for organized university exam preparation.</span>
        </div>
      </footer>
    </main>
  );
}
