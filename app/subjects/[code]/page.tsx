
"use client";

import { Suspense, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { courses } from "../../components/data/courses";
import UnitLearning from "../../components/UnitLearning";

const tabs = ["Theory", "Lab", "Notes", "PYQs", "Books", "Practicals"] as const;
type Tab = (typeof tabs)[number];

function SubjectPageContent() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = decodeURIComponent(params.code ?? "");
  const syllabusType = searchParams.get("syllabusType") ?? "affiliated";

  const [activeTab, setActiveTab] = useState<Tab>("Theory");
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number | null>(null);

  const subject = useMemo(() => {
    for (const course of courses) {
      for (const branch of course.branches) {
        for (const semester of branch.semesters) {
          const match = semester.subjects.find(
            (item) => item.code === code
          );
          if (match) return match;
        }
      }
    }
    return undefined;
  }, [code]);

  if (!subject) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">📘</div>
          <h1 className="mt-4 text-2xl font-black">Subject not found</h1>
          <p className="mt-3 leading-7 text-slate-600">
            Ye subject current demo database mein available nahi hai.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
          >
            Back to homepage
          </button>
        </div>
      </main>
    );
  }

  const selectedUnit =
    selectedUnitIndex === null
      ? null
      : subject.units[selectedUnitIndex] ?? null;

  const detailItems = [
    { label: "Theory Code", value: subject.theoryCode ?? subject.code },
    { label: "Theory Credits", value: subject.theoryCredits ?? subject.credits ?? "—" },
    { label: "Lab Code", value: subject.labCode ?? "—" },
    { label: "Lab Credits", value: subject.labCredits ?? "—" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={() => router.push("/")}
            className="text-left text-xl font-black text-indigo-700"
          >
            StudySprint
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl border px-4 py-2 text-sm font-bold hover:bg-slate-50"
          >
            ← All subjects
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <button
          onClick={() => router.push("/")}
          className="mb-5 text-sm font-semibold text-indigo-700 hover:underline"
        >
          ← Back to courses
        </button>

        <section className="rounded-3xl bg-gradient-to-br from-indigo-700 to-violet-700 p-6 text-white shadow-lg sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-bold">
              {subject.code}
            </span>
            <span className="rounded-lg bg-white/15 px-3 py-1.5 text-sm">
              {subject.branch}
            </span>
            <span className="rounded-lg bg-white/15 px-3 py-1.5 text-sm">
              Semester {subject.semester}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black sm:text-4xl">
            {subject.name}
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-indigo-100">
            Explore unit topics, theory, lab information and exam preparation resources.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {detailItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/15 bg-white/10 p-4"
              >
                <p className="text-xs font-semibold text-indigo-100">
                  {item.label}
                </p>
                <p className="mt-2 break-words text-lg font-black">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
            {subject.syllabusVerified
              ? "Syllabus verified"
              : "Data pending official verification"}
          </div>
        </section>

        {syllabusType === "usict" && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            USICT mode selected. Is subject ka USICT-specific syllabus
            separately verify nahi hua hai. Neeche dikhaya gaya data
            automatically USICT syllabus nahi maana jana chahiye.
          </div>
        )}

        <div className="mt-7 flex gap-2 overflow-x-auto rounded-2xl border bg-white p-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedUnitIndex(null);
              }}
              className={`shrink-0 rounded-xl px-4 py-3 text-sm font-bold transition ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Theory" && (
          <section className="mt-7">
            {selectedUnit ? (
              <UnitLearning
                subjectCode={subject.code}
                subjectName={subject.name}
                unitTitle={selectedUnit.title}
                unitIndex={selectedUnitIndex!}
                topics={selectedUnit.topics}
                onBack={() => setSelectedUnitIndex(null)}
              />
            ) : (
              <>
                <div className="mb-5">
                  <h2 className="text-2xl font-black">Unit-wise theory</h2>
                  <p className="mt-2 leading-7 text-slate-600">
                    Select a unit to view its topics and study material.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {subject.units.map((unit, index) => (
                    <button
                      key={`${subject.code}-${unit.title}-${index}`}
                      onClick={() => setSelectedUnitIndex(index)}
                      className="rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-sm font-bold text-indigo-600">
                            UNIT {index + 1}
                          </span>
                          <h3 className="mt-2 text-xl font-black">
                            {unit.title}
                          </h3>
                        </div>
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 font-black text-indigo-700">
                          →
                        </span>
                      </div>

                      {unit.topics.length > 0 ? (
                        <ul className="mt-4 space-y-2">
                          {unit.topics.slice(0, 4).map((topic) => (
                            <li
                              key={topic}
                              className="flex gap-2 text-sm leading-6 text-slate-600"
                            >
                              <span className="text-indigo-500">•</span>
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-sm leading-6 text-slate-500">
                          Unit topics abhi add nahi kiye gaye hain.
                        </p>
                      )}

                      <p className="mt-5 font-bold text-indigo-700">
                        Open unit →
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "Lab" && (
          <section className="mt-7 rounded-3xl border bg-white p-6 sm:p-9">
            <h2 className="text-2xl font-black">Lab Details</h2>

            {subject.labCode ? (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-500">
                      Lab Code
                    </p>
                    <p className="mt-2 text-xl font-black text-indigo-700">
                      {subject.labCode}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-500">
                      Lab Credits
                    </p>
                    <p className="mt-2 text-xl font-black text-indigo-700">
                      {subject.labCredits ?? "—"}
                    </p>
                  </div>
                </div>

                <p className="mt-5 leading-7 text-slate-600">
                  Lab code aur credits add kar diye gaye hain. Experiments
                  aur practical syllabus milne par yahan add kiye jayenge.
                </p>
              </>
            ) : (
              <p className="mt-3 leading-7 text-slate-600">
                Is subject ke liye lab code aur credits abhi provide nahi kiye gaye hain.
              </p>
            )}
          </section>
        )}

        {activeTab !== "Theory" && activeTab !== "Lab" && (
          <section className="mt-7 rounded-3xl border bg-white p-6 sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
              {activeTab === "Notes"
                ? "📝"
                : activeTab === "PYQs"
                  ? "📄"
                  : activeTab === "Books"
                    ? "📚"
                    : "🧪"}
            </div>

            <h2 className="mt-4 text-2xl font-black">{activeTab}</h2>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              {activeTab === "Notes"
                ? "Unit-wise notes and exam-oriented short and long answers will be added here."
                : activeTab === "PYQs"
                  ? "Previous-year question papers will be listed here after their source and year are checked."
                  : activeTab === "Books"
                    ? "Prescribed and recommended books will be listed here after verification."
                    : "Practical experiments, procedure and viva preparation material will be listed here."}
            </p>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Is section ka material abhi add nahi kiya gaya hai.
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function SubjectPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-8">
          <div className="mx-auto max-w-7xl animate-pulse rounded-2xl bg-white p-8 text-slate-500">
            Loading subject...
          </div>
        </main>
      }
    >
      <SubjectPageContent />
    </Suspense>
  );
}
