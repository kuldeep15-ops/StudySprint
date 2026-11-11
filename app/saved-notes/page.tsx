"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import {
  getSavedNotes,
  deleteSavedNote,
  type SavedNote,
} from "../components/savedNotes";

export default function SavedNotesPage() {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [search, setSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState<SavedNote | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setNotes(getSavedNotes());
    setLoaded(true);
  }, []);

  const filteredNotes = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return notes;

    return notes.filter((note) =>
      [
        note.subjectName,
        note.subjectCode,
        note.unitTitle,
        note.topic,
        note.language,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [notes, search]);

  function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Kya tum is saved note ko delete karna chahte ho?"
    );

    if (!confirmed) return;

    deleteSavedNote(id);

    setNotes((previous) => previous.filter((note) => note.id !== id));

    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 text-center dark:bg-gray-950">
        Loading saved notes...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-950 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold text-blue-600">
            StudySprint
          </Link>

          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            ← Home
          </Link>
        </header>

        {selectedNote ? (
          <section>
            <button
              onClick={() => setSelectedNote(null)}
              className="mb-5 text-sm font-medium text-blue-600 hover:underline"
            >
              ← Back to Saved Notes
            </button>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    {selectedNote.subjectCode}
                  </p>

                  <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedNote.topic}
                  </h1>

                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {selectedNote.subjectName} · {selectedNote.unitTitle}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {selectedNote.language} · Saved on{" "}
                    {new Date(selectedNote.savedAt).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(selectedNote.id)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                >
                  Delete
                </button>
              </div>

              <div className="prose prose-sm max-w-none break-words dark:prose-invert sm:prose-base">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {selectedNote.notes}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        ) : (
          <>
            <div className="mb-7">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Saved Notes
              </h1>

              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Tumhare save kiye hue AI notes yahan milenge.
              </p>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject, topic or unit..."
              className="mb-6 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />

            {filteredNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-14 text-center dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-3 text-4xl">📚</div>

                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {notes.length === 0
                    ? "No Saved Notes Yet"
                    : "No Notes Found"}
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {notes.length === 0
                    ? "AI notes generate karne ke baad Save Notes button dabao."
                    : "Koi doosra subject ya topic search karo."}
                </p>

                {notes.length === 0 && (
                  <Link
                    href="/"
                    className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Explore Subjects
                  </Link>
                )}
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  {filteredNotes.length} saved{" "}
                  {filteredNotes.length === 1 ? "note" : "notes"}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredNotes.map((note) => (
                    <article
                      key={note.id}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        {note.subjectCode}
                      </p>

                      <h2 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                        {note.topic}
                      </h2>

                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {note.subjectName}
                      </p>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {note.unitTitle}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-400">
                          {note.language} ·{" "}
                          {new Date(note.savedAt).toLocaleDateString()}
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                          >
                            Delete
                          </button>

                          <button
                            onClick={() => setSelectedNote(note)}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Open Notes
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}