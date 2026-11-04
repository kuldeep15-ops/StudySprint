
"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type UnitLearningProps = {
  subjectCode: string;
  subjectName: string;
  unitTitle: string;
  unitIndex: number;
  topics: string[];
  onBack: () => void;
};

const analogQuestions = [
  {
    question: "Define an analog signal with an example.",
    answer:
      "An analog signal has an amplitude that varies continuously over a specified range. Examples include microphone voltage and the output of many temperature sensors.",
  },
  {
    question: "What is a digital signal?",
    answer:
      "A digital signal represents information using discrete amplitude levels. In binary systems, these levels represent logic 0 and logic 1.",
  },
  {
    question: "Differentiate between analog and digital signals.",
    answer:
      "Analog signals have continuously varying amplitudes, while digital signals use discrete levels. Digital circuits can regenerate logic levels and process binary information.",
  },
  {
    question: "Explain sampling, quantization and encoding.",
    answer:
      "Sampling measures a signal at discrete time instants. Quantization maps measured amplitudes to allowed levels. Encoding assigns a digital code to each quantized level.",
  },
  {
    question: "How many codes can an 8-bit ADC represent?",
    answer:
      "The number of possible binary codes is 2ⁿ. For n = 8, 2⁸ = 256 distinct codes are possible.",
  },
];

function AnalogDigitalNotes() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">
          Study notes · Topic explanation
        </p>

        <h2 className="mt-2 text-2xl font-black text-slate-900">
          Analog and Digital Signals
        </h2>

        <h3 className="mb-2 mt-6 text-lg font-bold text-slate-900">
          1. Introduction
        </h3>

        <p className="leading-7 text-slate-700">
          A signal is a physical quantity that carries information. In
          electronics, it is often represented by voltage or current that
          changes with time. Signals are used in communication systems,
          sensors, audio devices and control systems.
        </p>

        <h3 className="mb-2 mt-6 text-lg font-bold text-slate-900">
          2. Analog signal
        </h3>

        <p className="leading-7 text-slate-700">
          An analog signal can vary continuously over a specified range.
          A sinusoidal signal may be represented as
          x(t) = A sin(2πft + φ), where A is amplitude, f is frequency,
          t is time and φ is phase.
        </p>

        <div className="mt-4 rounded-xl border bg-slate-50 p-4">
          <svg
            viewBox="0 0 320 150"
            role="img"
            aria-label="Conceptual analog sine waveform"
            className="block h-auto w-full max-w-full"
          >
            <line
              x1="20"
              y1="75"
              x2="305"
              y2="75"
              stroke="currentColor"
              strokeOpacity=".45"
            />
            <line
              x1="35"
              y1="12"
              x2="35"
              y2="138"
              stroke="currentColor"
              strokeOpacity=".45"
            />
            <path
              d="M35 75 C50 15 80 15 95 75 S140 135 155 75 S200 15 215 75 S260 135 275 75"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="3"
            />
            <text x="8" y="16" fontSize="10" fill="currentColor">
              Amplitude
            </text>
            <text x="294" y="91" fontSize="10" fill="currentColor">
              t
            </text>
          </svg>

          <p className="text-sm text-slate-600">
            Conceptual analog waveform; not to scale.
          </p>
        </div>

        <h3 className="mb-2 mt-6 text-lg font-bold text-slate-900">
          3. Digital signal
        </h3>

        <p className="leading-7 text-slate-700">
          A digital signal represents information using discrete levels.
          A binary digital system uses two logical states, commonly called
          0 and 1. The actual voltage ranges depend on the circuit technology.
        </p>

        <div className="mt-4 rounded-xl border bg-slate-50 p-4">
          <svg
            viewBox="0 0 320 150"
            role="img"
            aria-label="Conceptual binary digital waveform"
            className="block h-auto w-full max-w-full"
          >
            <line
              x1="20"
              y1="120"
              x2="305"
              y2="120"
              stroke="currentColor"
              strokeOpacity=".45"
            />
            <line
              x1="35"
              y1="12"
              x2="35"
              y2="138"
              stroke="currentColor"
              strokeOpacity=".45"
            />
            <path
              d="M35 120 H75 V40 H115 V120 H155 V40 H215 V120 H255 V40 H295 V120"
              fill="none"
              stroke="#16a34a"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <text x="12" y="43" fontSize="10" fill="currentColor">
              1
            </text>
            <text x="12" y="124" fontSize="10" fill="currentColor">
              0
            </text>
            <text x="294" y="140" fontSize="10" fill="currentColor">
              t
            </text>
          </svg>

          <p className="text-sm text-slate-600">
            Conceptual binary waveform; logic voltages depend on hardware.
          </p>
        </div>

        <h3 className="mb-2 mt-6 text-lg font-bold text-slate-900">
          4. Difference between analog and digital signals
        </h3>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-3">Basis</th>
                <th className="border p-3">Analog</th>
                <th className="border p-3">Digital</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Amplitude", "Continuous", "Discrete levels"],
                ["Representation", "Continuously varying", "Often binary 0 and 1"],
                ["Processing", "Analog circuits", "Digital logic and processors"],
                ["Example", "Microphone output", "Binary processor data"],
              ].map(([basis, analog, digital]) => (
                <tr key={basis}>
                  <td className="border p-3 font-semibold">{basis}</td>
                  <td className="border p-3">{analog}</td>
                  <td className="border p-3">{digital}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mb-2 mt-6 text-lg font-bold text-slate-900">
          5. Analog-to-digital conversion
        </h3>

        <p className="leading-7 text-slate-700">
          An analog-to-digital converter (ADC) converts an analog input into
          a digital representation. Its main conceptual stages are sampling,
          quantization and encoding.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-xl bg-indigo-50 p-4 text-center text-sm font-bold">
          <span className="rounded-lg border bg-white p-3">Analog input</span>
          <span>→</span>
          <span className="rounded-lg border bg-white p-3">Sampling</span>
          <span>→</span>
          <span className="rounded-lg border bg-white p-3">Quantization</span>
          <span>→</span>
          <span className="rounded-lg border bg-white p-3">Encoding</span>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <h3 className="text-xl font-black text-slate-900">Solved examples</h3>

        <div className="mt-5 space-y-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <h4 className="font-bold">Example 1: Sampling interval</h4>

            <p className="mt-2 leading-7">
              <strong>Question:</strong> A signal is sampled at 8,000 Hz.
              Find the time interval between consecutive samples.
            </p>

            <p className="mt-2 leading-7">
              Formula: Ts = 1 / fs
              <br />
              Ts = 1 / 8000 seconds
              <br />
              Ts = 0.000125 seconds
            </p>

            <p className="mt-2 font-bold text-green-700">
              Answer: Ts = 125 microseconds.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <h4 className="font-bold">Example 2: Number of ADC codes</h4>

            <p className="mt-2 leading-7">
              <strong>Question:</strong> How many codes can an ideal 8-bit
              ADC represent?
            </p>

            <p className="mt-2 leading-7">
              Formula: Number of codes = 2ⁿ
              <br />
              For n = 8: 2⁸ = 256
            </p>

            <p className="mt-2 font-bold text-green-700">
              Answer: 256 distinct codes.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <h3 className="text-xl font-black text-slate-900">
          Important practice questions
        </h3>

        <div className="mt-4 space-y-5">
          {analogQuestions.map((item, index) => (
            <div key={item.question} className="border-b pb-4 last:border-0">
              <h4 className="font-bold text-slate-900">
                Q{index + 1}. {item.question}
              </h4>

              <p className="mt-2 leading-7 text-slate-700">{item.answer}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-sm text-slate-500">
          These are practice questions, not verified previous-year questions.
        </p>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="font-black text-amber-950">
          Exam preparation reminder
        </h3>

        <p className="mt-2 leading-7 text-amber-900">
          Use these notes as learning material only. Verify topic coverage
          against the official syllabus for your applicable university batch.
        </p>
      </section>
    </div>
  );
}

function cleanMarkdown(content: string) {
  return content
    .replace(/\\([#*_`~>|])/g, "$1")
    .replace(/\r\n/g, "\n")
    .trim();
}

function extractJokes(notes: string): string[] {
  const sectionMatch = notes.match(
    /(?:mind[\s-]?fresh|funny\s+break|jokes?)[^\n]*\n([\s\S]*)$/i
  );

  if (!sectionMatch) return [];

  const section = sectionMatch[1];

  const matches = [
    ...section.matchAll(
      /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\*\*)?Joke\s*[12](?:\*\*)?\s*[:\-—]?\s*([\s\S]*?)(?=\n\s*(?:#{1,6}\s*)?(?:\*\*)?Joke\s*[12](?:\*\*)?\s*[:\-—]?|$)/gi
    ),
  ];

  return matches
    .map((match) => match[1].trim())
    .filter(Boolean)
    .slice(0, 2);
}

function GeneratedNotes({
  notes,
  topic,
  onCopy,
  copied,
}: {
  notes: string;
  topic: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const formattedNotes = cleanMarkdown(notes);

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
      <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-4 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white">
                ✨
              </span>

              <p className="text-sm font-bold text-indigo-700">
                AI Study Material
              </p>
            </div>

            <h2 className="mt-3 break-words text-xl font-black text-slate-900 sm:text-2xl">
              {topic}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Generated notes · Review and prepare
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700">
              AI Generated
            </span>

            <button
              onClick={onCopy}
              className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
            >
              {copied ? "✓ Copied" : "Copy notes"}
            </button>
          </div>
        </div>
      </div>

      <div className="min-w-0 max-w-full p-4 sm:p-7">
        <div
          className="
            min-w-0 max-w-full overflow-hidden break-words text-[15px] leading-8 text-slate-700
            [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:border-b [&_h1]:border-indigo-100 [&_h1]:pb-3 [&_h1]:text-2xl [&_h1]:font-black [&_h1]:leading-tight [&_h1]:text-slate-950
            [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:rounded-xl [&_h2]:border-l-4 [&_h2]:border-indigo-500 [&_h2]:bg-indigo-50 [&_h2]:px-4 [&_h2]:py-3 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:leading-snug [&_h2]:text-indigo-950
            [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900
            [&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:font-bold [&_h4]:text-slate-900
            [&_p]:mb-4 [&_p]:leading-8
            [&_strong]:font-extrabold [&_strong]:text-slate-950
            [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6
            [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6
            [&_li]:pl-1 [&_li]:leading-7
            [&_blockquote]:my-5 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-amber-950
            [&_hr]:my-7 [&_hr]:border-slate-200
            [&_a]:font-semibold [&_a]:text-indigo-700 [&_a]:underline
            [&_code]:rounded-md [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-1 [&_code]:font-mono [&_code]:text-sm [&_code]:text-indigo-800
            [&_pre]:my-5 [&_pre]:box-border [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:leading-6 [&_pre]:text-slate-100
            [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-slate-100
            [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm
            [&_thead]:bg-indigo-50
            [&_th]:border [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-3 [&_th]:font-bold [&_th]:text-slate-900
            [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-3 [&_td]:align-top
            [&_tr:nth-child(even)]:bg-slate-50
            [&_.katex-display]:my-6 [&_.katex-display]:max-w-full [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-2
            [&_svg]:block [&_svg]:h-auto [&_svg]:max-w-full
            [&_img]:block [&_img]:h-auto [&_img]:max-w-full
          "
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              table: ({ children }) => (
                <div className="my-5 max-w-full overflow-x-auto rounded-xl border border-slate-200">
                  <table>{children}</table>
                </div>
              ),
            }}
          >
            {formattedNotes}
          </ReactMarkdown>
        </div>

        <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">📌</span>

            <div>
              <h3 className="font-bold text-amber-950">
                Important exam reminder
              </h3>

              <p className="mt-1 text-sm leading-6 text-amber-900">
                AI-generated content ko official university syllabus,
                prescribed textbooks aur class notes se verify zaroor karna.
                Generated questions verified previous-year questions nahi hain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function UnitLearning({
  subjectCode,
  subjectName,
  unitTitle,
  unitIndex,
  topics,
  onBack,
}: UnitLearningProps) {
  const [selectedTopic, setSelectedTopic] = useState(0);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);

  const [language, setLanguage] = useState<"English" | "Hinglish">("Hinglish");
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [notesLoadedKey, setNotesLoadedKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copied, setCopied] = useState(false);

  const topic = topics[selectedTopic] ?? "";

  const progressKey = `studysprint-progress-${subjectCode}-${unitIndex}`;

  const notesKey = [
    "studysprint-notes-v2",
    encodeURIComponent(subjectCode),
    unitIndex,
    selectedTopic,
    encodeURIComponent(topic),
    language,
  ].join("-");

  const jokesKey = `${notesKey}-jokes`;

  const activeNotesKeyRef = useRef(notesKey);

  useEffect(() => {
    setSelectedTopic(0);
    setProgressLoaded(false);

    try {
      const saved = localStorage.getItem(progressKey);
      setCompletedTopics(saved ? JSON.parse(saved) : []);
    } catch {
      setCompletedTopics([]);
    }

    setProgressLoaded(true);
  }, [subjectCode, unitIndex, unitTitle, progressKey]);

  useEffect(() => {
    if (!progressLoaded) return;

    try {
      localStorage.setItem(progressKey, JSON.stringify(completedTopics));
    } catch {
      console.error("Could not save topic progress.");
    }
  }, [completedTopics, progressKey, progressLoaded]);

  useEffect(() => {
    activeNotesKeyRef.current = notesKey;

    try {
      const savedNotes = localStorage.getItem(notesKey);
      setGeneratedNotes(savedNotes || "");
    } catch {
      setGeneratedNotes("");
    }

    setNotesLoadedKey(notesKey);
    setAiError("");
    setCopied(false);
  }, [notesKey]);

  async function generateAINotes() {
    if (!topic.trim() || isGenerating) return;

    const requestKey = notesKey;

    setIsGenerating(true);
    setAiError("");
    setCopied(false);

    try {
      let previousJokes: string[] = [];

      try {
        const savedJokes = localStorage.getItem(jokesKey);
        previousJokes = savedJokes ? JSON.parse(savedJokes) : [];
      } catch {
        previousJokes = [];
      }

      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectCode,
          subjectName,
          unitTitle,
          topic,
          language,
          previousJokes: previousJokes.slice(-10),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Notes generate nahi ho paye.");
      }

      if (!data.notes || typeof data.notes !== "string") {
        throw new Error("AI ne empty response diya. Dobara try karo.");
      }

      try {
        localStorage.setItem(requestKey, data.notes);
      } catch {
        throw new Error(
          "Notes browser mein save nahi ho paye. Browser storage space check karo."
        );
      }

      const newJokes = extractJokes(data.notes);

      if (newJokes.length > 0) {
        const updatedJokes = [...previousJokes, ...newJokes].slice(-10);

        try {
          localStorage.setItem(jokesKey, JSON.stringify(updatedJokes));
        } catch {
          console.warn("Could not save joke history.");
        }
      }

      if (activeNotesKeyRef.current === requestKey) {
        setGeneratedNotes(data.notes);
        setNotesLoadedKey(requestKey);
      }
    } catch (error) {
      if (activeNotesKeyRef.current === requestKey) {
        setAiError(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again."
        );
      }
    } finally {
      setIsGenerating(false);
    }
  }

  function clearCurrentNotes() {
    const confirmed = window.confirm(
      "Kya tum is topic ke saved notes delete karna chahte ho?"
    );

    if (!confirmed) return;

    try {
      localStorage.removeItem(notesKey);
      setGeneratedNotes("");
      setNotesLoadedKey(notesKey);
      setAiError("");
      setCopied(false);
    } catch {
      setAiError("Saved notes clear nahi ho paye. Dobara try karo.");
    }
  }

  async function copyGeneratedNotes() {
    try {
      await navigator.clipboard.writeText(cleanMarkdown(generatedNotes));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setAiError(
        "Notes copy nahi ho paye. Browser clipboard permission check karo."
      );
    }
  }

  const isAnalogNotes =
    subjectCode === "EC301" &&
    topic.trim().toLowerCase() === "analog and digital signals";

  const currentTopicKey = `${selectedTopic}-${topic}`;
  const isCompleted = completedTopics.includes(currentTopicKey);

  const completedCount = topics.filter((item, index) =>
    completedTopics.includes(`${index}-${item}`)
  ).length;

  const progressPercentage =
    topics.length > 0
      ? Math.round((completedCount / topics.length) * 100)
      : 0;

  function toggleTopicCompletion() {
    setCompletedTopics((current) =>
      current.includes(currentTopicKey)
        ? current.filter((item) => item !== currentTopicKey)
        : [...current, currentTopicKey]
    );
  }

  const notesAreLoaded = notesLoadedKey === notesKey;

  return (
    <main className="min-w-0 py-2">
      <button
        onClick={onBack}
        className="mb-5 rounded-xl border bg-white px-4 py-2 text-sm font-bold transition hover:bg-slate-100"
      >
        ← Back to Units
      </button>

      <header className="mb-6 rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <p className="text-sm font-bold text-indigo-600">
          {subjectCode} · Unit {unitIndex + 1}
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-900">
          {unitTitle}
        </h1>

        <p className="mt-2 text-slate-600">{subjectName}</p>

        <div className="mt-5 rounded-xl bg-indigo-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-indigo-900">
              Your unit progress
            </span>

            <span className="font-black text-indigo-700">
              {completedCount}/{topics.length} completed · {progressPercentage}%
            </span>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-indigo-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          Learning material is subject to verification against the official
          syllabus before final exam preparation.
        </p>
      </header>

      {topics.length === 0 ? (
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-black">Topics not added yet</h2>

          <p className="mt-2 leading-7 text-slate-600">
            Is unit ke topics abhi available nahi hain. Verified syllabus
            data add hone ke baad yahan topic-wise material dikhega.
          </p>
        </section>
      ) : (
        <div className="grid min-w-0 gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit min-w-0 rounded-2xl border bg-white p-4 md:sticky md:top-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-black text-slate-900">
                Topics in this Unit
              </h2>

              <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                {completedCount}/{topics.length}
              </span>
            </div>

            <div className="space-y-2">
              {topics.map((item, index) => {
                const done = completedTopics.includes(`${index}-${item}`);

                return (
                  <button
                    key={`${index}-${item}`}
                    onClick={() => setSelectedTopic(index)}
                    className={`w-full rounded-xl p-3 text-left text-sm transition ${
                      selectedTopic === index
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-50 text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <span className="mr-2 font-bold">
                      {done ? "✓" : `${index + 1}.`}
                    </span>
                    {item}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="min-w-0 space-y-5">
            <div className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-lg">
                  ✨
                </span>

                <p className="text-sm font-bold text-indigo-600">
                  AI Study Assistant
                </p>
              </div>

              <h2 className="mt-3 text-xl font-black text-slate-900">
                Generate notes for this topic
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Detailed explanations, important definitions, diagrams,
                comparison tables, step-by-step solved examples, exam
                questions and revision points.
              </p>

              <div className="mt-5">
                <label
                  htmlFor="notes-language"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Notes language
                </label>

                <select
                  id="notes-language"
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value as "English" | "Hinglish")
                  }
                  disabled={isGenerating}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 sm:w-64"
                >
                  <option value="Hinglish">Hinglish</option>
                  <option value="English">English</option>
                </select>

                <p className="mt-1 text-xs text-slate-500">
                  Topic headings English mein rahengi; explanation selected
                  language mein generate hogi.
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Selected topic
                </p>

                <p className="mt-1 break-words font-bold text-slate-900">
                  {topic}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={generateAINotes}
                  disabled={isGenerating}
                  className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isGenerating
                    ? "Generating notes..."
                    : generatedNotes && notesAreLoaded
                      ? "↻ Regenerate AI Notes"
                      : "✨ Generate AI Notes"}
                </button>

                {generatedNotes && notesAreLoaded && (
                  <button
                    onClick={clearCurrentNotes}
                    disabled={isGenerating}
                    className="w-full rounded-xl border border-red-200 bg-white px-5 py-3 font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 sm:w-auto"
                  >
                    Clear Notes
                  </button>
                )}
              </div>

              {isGenerating && (
                <div className="mt-4 rounded-xl bg-indigo-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />

                    <p className="text-sm font-semibold text-indigo-800">
                      Gemini tumhare topic ke notes prepare kar raha hai...
                    </p>
                  </div>

                  <p className="mt-2 text-xs text-indigo-600">
                    Ismein thoda samay lag sakta hai. Please wait.
                  </p>
                </div>
              )}

              {aiError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <strong>Error:</strong> {aiError}
                </div>
              )}
            </div>

            {generatedNotes && notesAreLoaded && (
              <GeneratedNotes
                notes={generatedNotes}
                topic={topic}
                onCopy={copyGeneratedNotes}
                copied={copied}
              />
            )}

            {!notesAreLoaded && (
              <div className="rounded-xl border bg-white p-5 text-sm text-slate-500">
                Loading saved notes...
              </div>
            )}

            {isAnalogNotes ? (
              <AnalogDigitalNotes />
            ) : (
              <div className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
                <p className="text-sm font-bold text-indigo-600">
                  Topic {selectedTopic + 1} of {topics.length}
                </p>

                <h2 className="mt-2 break-words text-2xl font-black text-slate-900">
                  {topic}
                </h2>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <h3 className="font-bold text-slate-900">What to prepare</h3>

                  <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-slate-700">
                    <li>Definition and basic concept.</li>
                    <li>Working principle and key points.</li>
                    <li>Relevant labelled diagram, if applicable.</li>
                    <li>Short-answer and long-answer practice.</li>
                    <li>Numericals or solved examples, where applicable.</li>
                  </ul>
                </div>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="font-bold text-amber-950">
                    Detailed notes not added yet
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-amber-900">
                    This topic currently has a preparation checklist, not
                    complete notes. Generate AI notes above to create
                    topic-specific learning material.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900">
                    Topic completion
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Apni preparation complete hone par mark karo.
                  </p>
                </div>

                <button
                  onClick={toggleTopicCompletion}
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                    isCompleted
                      ? "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {isCompleted ? "✓ Completed" : "Mark as completed"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3">
              <button
                disabled={selectedTopic === 0}
                onClick={() =>
                  setSelectedTopic((current) => Math.max(0, current - 1))
                }
                className="rounded-xl border bg-white px-4 py-3 font-bold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous Topic
              </button>

              <button
                disabled={selectedTopic >= topics.length - 1}
                onClick={() =>
                  setSelectedTopic((current) =>
                    Math.min(topics.length - 1, current + 1)
                  )
                }
                className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next Topic →
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
