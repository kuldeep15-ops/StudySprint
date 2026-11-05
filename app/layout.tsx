import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudySprint | Your University Study Companion",
  description:
    "StudySprint helps GGSIPU students explore syllabus, unit-wise topics and prepare for university exams.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 py-5 text-center sm:px-6">
            <span className="text-sm font-semibold text-slate-700">
              Designed &amp; Developed by{" "}
              <span className="font-black text-indigo-600">
                Kuldeep Kumar
              </span>
            </span>
            <span className="text-xs text-slate-500">
              StudySprint · Your university study companion
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}