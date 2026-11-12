
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
};

async function getSharedNotes(id: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("shared_notes")
    .select("id, subject_name, unit_title, topic, content, created_at")
    .eq("id", id)
    .single();

  if (error) return null;

  return data;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const notes = await getSharedNotes(id);

  if (!notes) {
    return { title: "Notes not found | StudySprint" };
  }

  return {
    title: `${notes.topic} | StudySprint`,
    description: `${notes.subject_name} - ${notes.unit_title}. Read and study notes on StudySprint.`,
    openGraph: {
      title: `${notes.topic} | StudySprint`,
      description: `${notes.subject_name} - ${notes.unit_title}. Read these notes on StudySprint.`,
      type: "article",
      siteName: "StudySprint",
    },
  };
}

export default async function SharedNotesPage({ params }: Props) {
  const { id } = await params;
  const notes = await getSharedNotes(id);

  if (!notes) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <a
            href="/"
            className="text-2xl font-extrabold tracking-tight text-blue-700"
          >
            StudySprint
          </a>
          <p className="mt-2 text-sm text-slate-500">
            Your learning companion for GGSIPU students
          </p>
        </header>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 border-b border-slate-200 pb-5">
            <p className="mb-2 text-sm font-semibold text-blue-700">
              SHARED STUDY NOTES
            </p>

            <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
              {notes.topic}
            </h1>

            <p className="mt-3 text-sm text-slate-600">
              {notes.subject_name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {notes.unit_title}
            </p>
          </div>

          <div className="text-[15px] leading-7 text-slate-800 break-words
            [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-bold
            [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-bold
            [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold
            [&_p]:mb-4
            [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6
            [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6
            [&_li]:mb-1
            [&_strong]:font-bold [&_strong]:text-slate-900
            [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:text-slate-600
            [&_table]:mb-5 [&_table]:w-full [&_table]:border-collapse
            [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2
            [&_td]:border [&_td]:border-slate-300 [&_td]:p-2
            [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:text-white
            [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1
            [&_hr]:my-6 [&_hr]:border-slate-200
            [&_a]:text-blue-700 [&_a]:underline"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {notes.content}
            </ReactMarkdown>
          </div>
        </article>

        <footer className="mt-8 text-center">
          <p className="mb-3 text-sm text-slate-600">
            Want to generate your own study notes?
          </p>

          <a
            href="/"
            className="inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Explore StudySprint
          </a>

          <p className="mt-5 text-xs text-slate-400">
            Shared using StudySprint
          </p>
        </footer>
      </div>
    </main>
  );
}
