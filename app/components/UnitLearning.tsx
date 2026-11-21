
"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { getSavedNotes, saveNote } from "./savedNotes";

type UnitLearningProps = {
  subjectCode: string;
  subjectName: string;
  unitTitle: string;
  unitIndex: number;
  topics: string[];
  onBack: () => void;
};

type CreditPlan = {
  id: string;
  name: string;
  description: string | null;
  pricePaise: number;
  credits: number;
  validityDays: number;
  isFeatured: boolean;
};

type AICredits = {
  loggedIn: boolean;
  freeLimit: number;
  used: number;
  remaining: number;
  freeRemaining: number;
  paidRemaining: number;
  totalRemaining: number;
  plans: CreditPlan[];
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    email?: string;
  };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, callback: (response: any) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function cleanMarkdown(content: string) {
  return content
    .replace(/\\([#*_\`~>|])/g, "$1")
    .replace(/\r\n/g, "\n")
    .trim();
}

function extractJokes(notes: string): string[] {
  const sectionMatch = notes.match(
    /(?:^|\n)#{1,6}\s*(?:12\.\s*)?MIND FRESH BREAK[^\n]*\n([\s\S]*)$/i
  );

  if (!sectionMatch) return [];

  const matches = [
    ...sectionMatch[1].matchAll(
      /(?:^|\n)#{1,6}\s*Joke\s*[12]\s*\n([\s\S]*?)(?=\n#{1,6}\s*Joke\s*[12]\s*\n|$)/gi
    ),
  ];

  return matches
    .map((match) => match[1].trim())
    .filter(Boolean)
    .slice(0, 2);
}

let razorpayScriptPromise: Promise<boolean> | null = null;

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  if (window.Razorpay) return Promise.resolve(true);

  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      razorpayScriptPromise = null;
      resolve(false);
    };

    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

function GeneratedNotes({
  notes,
  topic,
  onCopy,
  onShare,
  copied,
  isStreaming,
  onSave,
  isSaved,
}: {
  notes: string;
  topic: string;
  onCopy: () => void;
  onShare: () => void;
  copied: boolean;
  isStreaming: boolean;
  onSave: () => void;
  isSaved: boolean;
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
              {isStreaming
                ? "Live AI generation · Notes are appearing as they are created"
                : "Generated notes · Review and prepare"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700">
              {isStreaming ? "Generating" : "AI Generated"}
            </span>

            <button
              onClick={onCopy}
              className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
            >
              {copied ? "✓ Copied" : "Copy notes"}
            </button>

            {!isStreaming && (
              <button
                onClick={onShare}
                className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-bold text-green-700 transition hover:bg-green-100"
              >
                ↗ Share Notes
              </button>
            )}

            {!isStreaming && (
              <button
                onClick={onSave}
                disabled={isSaved}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-default disabled:bg-green-600"
              >
                {isSaved ? "✓ Saved" : "♡ Save Notes"}
              </button>
            )}
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
  const [streamingNotes, setStreamingNotes] = useState("");
  const [notesLoadedKey, setNotesLoadedKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [credits, setCredits] = useState<AICredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [creditsError, setCreditsError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  const activeNotesKeyRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);

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

  async function refreshCredits() {
    try {
      setCreditsError("");

      const response = await fetch("/api/ai-credits", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });

      const data = await response.json();

      if (response.status === 401) {
        setCredits({
          loggedIn: false,
          freeLimit: 7,
          used: 0,
          remaining: 0,
          freeRemaining: 0,
          paidRemaining: 0,
          totalRemaining: 0,
          plans: [],
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Credits load nahi ho paye.");
      }

      setCredits({
        loggedIn: true,
        freeLimit: data.freeLimit,
        used: data.used,
        remaining: data.remaining,
        freeRemaining: data.freeRemaining ?? data.remaining,
        paidRemaining: data.paidRemaining ?? 0,
        totalRemaining:
          data.totalRemaining ??
          (data.freeRemaining ?? data.remaining) + (data.paidRemaining ?? 0),
        plans: Array.isArray(data.plans) ? data.plans : [],
      });
    } catch (error) {
      setCreditsError(
        error instanceof Error
          ? error.message
          : "Credits load nahi ho paye."
      );
    } finally {
      setCreditsLoading(false);
    }
  }

  useEffect(() => {
    void refreshCredits();
  }, []);

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

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    setIsGenerating(false);
    setStreamingNotes("");
    setCopied(false);
    setAiError("");

    try {
      const savedNotes = localStorage.getItem(notesKey);
      setGeneratedNotes(savedNotes || "");

      const savedLibraryNotes = getSavedNotes();
      setIsSaved(savedLibraryNotes.some((item) => item.id === notesKey));
    } catch {
      setGeneratedNotes("");
      setIsSaved(false);
    }

    setNotesLoadedKey(notesKey);

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [notesKey]);

  async function buyCreditPlan(plan: CreditPlan) {
    if (checkoutLoading) return;

    if (!credits?.loggedIn) {
      setAiError("Payment karne ke liye pehle login karo.");
      return;
    }

    setCheckoutLoading(true);
    setPaymentMessage("");
    setAiError("");

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Razorpay Checkout load nahi ho paya. Internet connection check karo."
        );
      }

      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ planId: plan.id }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || "Payment order create nahi hua.");
      }

      const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Padhatoz",
        description: `${orderData.credits} AI Notes generations`,
        order_id: orderData.orderId,
        theme: { color: "#4f46e5" },

        handler: async (paymentResponse) => {
          setCheckoutLoading(true);
          setPaymentMessage("Payment verify ho raha hai...");

          try {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify(paymentResponse),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(
                verifyData.error ||
                  "Payment verification pending hai. Please refresh after some time."
              );
            }

            setPaymentMessage(
              `Payment successful! ${verifyData.creditsAdded} AI generations add ho gayi hain.`
            );

            await refreshCredits();
          } catch (error) {
            setPaymentMessage(
              error instanceof Error
                ? error.message
                : "Payment verify nahi ho paya. Please contact support."
            );

            // Webhook may still activate credits if browser verification fails.
            await refreshCredits();
          } finally {
            setCheckoutLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setCheckoutLoading(false);
            setPaymentMessage("Payment window close kar di gayi.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        setCheckoutLoading(false);
        setPaymentMessage(
          response?.error?.description ||
            "Payment fail ho gaya. Dobara try kar sakte ho."
        );
      });

      razorpay.open();
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Payment start nahi ho paya."
      );
      setCheckoutLoading(false);
    }
  }

  async function generateAINotes() {
    if (!topic.trim() || isGenerating) return;

    if (creditsLoading) {
      setAiError("Please wait, AI credits check ho rahe hain.");
      return;
    }

    if (!credits?.loggedIn) {
      setAiError("AI Notes generate karne ke liye pehle login karo.");
      return;
    }

    if (credits.totalRemaining <= 0) {
      setAiError("Tumhare free aur paid AI credits khatam ho chuke hain.");
      return;
    }

    const requestKey = notesKey;
    const controller = new AbortController();

    abortControllerRef.current = controller;

    setIsGenerating(true);
    setStreamingNotes("");
    setAiError("");
    setCopied(false);

    let accumulatedNotes = "";
    let generationSucceeded = false;

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
          Accept: "text/event-stream",
        },
        signal: controller.signal,
        body: JSON.stringify({
          subjectCode,
          subjectName,
          unitTitle,
          topic,
          language,
          previousJokes: previousJokes.slice(-10),
        }),
      });

      if (!response.ok) {
        let errorMessage = "Notes generate nahi ho paye.";
        let needsPurchase = false;

        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
          needsPurchase = data.needsPurchase === true;
        } catch {
          // Keep default message.
        }

        if (needsPurchase) {
          await refreshCredits();
          setPaymentMessage(
            "Free aur paid credits khatam ho gaye hain. Neeche se plan choose karo."
          );
        }

        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("Streaming response browser mein available nahi hai.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let streamCompleted = false;

      function processEvent(eventBlock: string) {
        const dataLines = eventBlock
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim());

        if (dataLines.length === 0) return;

        const data = JSON.parse(dataLines.join("\n"));

        if (data.type === "chunk" && typeof data.text === "string") {
          accumulatedNotes += data.text;

          if (activeNotesKeyRef.current === requestKey) {
            setStreamingNotes(accumulatedNotes);
          }
        }

        if (data.type === "done") {
          streamCompleted = true;
          generationSucceeded = true;

          if (typeof data.remaining === "number") {
            setCredits((current) =>
              current
                ? {
                    ...current,
                    remaining: data.remaining,
                    freeRemaining:
                      data.creditType === "free"
                        ? data.remaining
                        : current.freeRemaining,
                    used:
                      data.creditType === "free"
                        ? current.freeLimit - data.remaining
                        : current.used,
                  }
                : current
            );
          }

          if (typeof data.paidRemaining === "number") {
            setCredits((current) =>
              current
                ? {
                    ...current,
                    paidRemaining: data.paidRemaining,
                    totalRemaining:
                      current.freeRemaining + data.paidRemaining,
                  }
                : current
            );
          }
        }

        if (data.type === "error") {
          throw new Error(data.error || "Notes generate nahi ho paye.");
        }
      }

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventBlock of events) {
          processEvent(eventBlock);
        }
      }

      buffer += decoder.decode();

      if (buffer.trim()) {
        processEvent(buffer);
      }

      if (!streamCompleted) {
        throw new Error(
          "Streaming beech mein ruk gayi. Please dobara try karo."
        );
      }

      if (!accumulatedNotes.trim()) {
        throw new Error("AI ne empty response diya. Dobara try karo.");
      }

      try {
        localStorage.setItem(requestKey, accumulatedNotes);
      } catch {
        throw new Error(
          "Notes browser mein save nahi ho paye. Browser storage space check karo."
        );
      }

      const newJokes = extractJokes(accumulatedNotes);

      if (newJokes.length > 0) {
        const updatedJokes = [...previousJokes, ...newJokes].slice(-10);

        try {
          localStorage.setItem(jokesKey, JSON.stringify(updatedJokes));
        } catch {
          console.warn("Could not save joke history.");
        }
      }

      if (activeNotesKeyRef.current === requestKey) {
        setGeneratedNotes(accumulatedNotes);
        setStreamingNotes("");
        setNotesLoadedKey(requestKey);
        setIsSaved(
          getSavedNotes().some((item) => item.id === requestKey)
        );
      }

      await refreshCredits();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      if (activeNotesKeyRef.current === requestKey) {
        if (accumulatedNotes.trim()) {
          setStreamingNotes(accumulatedNotes);
        }

        setAiError(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again."
        );
      }
    } finally {
      if (!generationSucceeded) {
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        await refreshCredits();
      }

      if (activeNotesKeyRef.current === requestKey) {
        setIsGenerating(false);
      }

      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }

  function handleSaveNotes() {
    if (!generatedNotes.trim() || isGenerating || isSaved) return;

    const result = saveNote({
      id: notesKey,
      subjectCode,
      subjectName,
      unitTitle,
      topic,
      language,
      notes: generatedNotes,
      savedAt: new Date().toISOString(),
    });

    if (result) {
      setIsSaved(true);
      setAiError("");
    } else {
      const alreadySaved = getSavedNotes().some(
        (item) => item.id === notesKey
      );

      if (alreadySaved) {
        setIsSaved(true);
      } else {
        setAiError(
          "Notes save nahi ho paye. Browser storage space check karo."
        );
      }
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
      setStreamingNotes("");
      setNotesLoadedKey(notesKey);
      setAiError("");
      setCopied(false);
      setIsSaved(false);
    } catch {
      setAiError("Saved notes clear nahi ho paye. Dobara try karo.");
    }
  }

  async function copyGeneratedNotes() {
    const notesToCopy = isGenerating ? streamingNotes : generatedNotes;

    if (!notesToCopy.trim()) return;

    try {
      await navigator.clipboard.writeText(cleanMarkdown(notesToCopy));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setAiError(
        "Notes copy nahi ho paye. Browser clipboard permission check karo."
      );
    }
  }

  async function shareGeneratedNotes() {
    if (!generatedNotes.trim() || isGenerating) return;

    setAiError("");

    try {
      const response = await fetch("/api/share-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectName,
          unitTitle,
          topic,
          content: cleanMarkdown(generatedNotes),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.id) {
        throw new Error(data.error || "Share link create nahi ho paya.");
      }

      const shareUrl = `${window.location.origin}/share/${data.id}`;

      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `${topic} - Padhatoz`,
          text: `${subjectName} | ${unitTitle}\nPadhatoz par ye notes dekho:`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        window.alert(
          "Share link copy ho gaya! Ab WhatsApp par paste karke bhej do."
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      setAiError(
        error instanceof Error
          ? error.message
          : "Share link create nahi ho paya. Dobara try karo."
      );
    }
  }

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
  const displayNotes = isGenerating ? streamingNotes : generatedNotes;

  const canGenerate =
    !creditsLoading &&
    credits?.loggedIn === true &&
    credits.totalRemaining > 0;

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

              {/* CREDIT BALANCE */}
              <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                {creditsLoading ? (
                  <p className="text-sm font-semibold text-indigo-800">
                    Checking your AI credits...
                  </p>
                ) : credits?.loggedIn ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-indigo-950">
                          Your AI generations
                        </p>
                        <p className="mt-1 text-xs text-indigo-700">
                          Free and purchased credits
                        </p>
                      </div>

                      <p className="text-lg font-black text-indigo-800">
                        {credits.totalRemaining} total left
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs font-semibold text-slate-500">
                          Free credits
                        </p>
                        <p className="mt-1 text-xl font-black text-indigo-700">
                          {credits.freeRemaining}/{credits.freeLimit}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs font-semibold text-slate-500">
                          Purchased credits
                        </p>
                        <p className="mt-1 text-xl font-black text-green-700">
                          {credits.paidRemaining}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-indigo-200">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        style={{
                          width: `${
                            credits.freeLimit > 0
                              ? (credits.freeRemaining / credits.freeLimit) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-indigo-700">
                      {credits.used} free generations used ·{" "}
                      {credits.paidRemaining} paid generations available
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-indigo-950">
                      Login to use AI Notes
                    </p>
                    <p className="mt-1 text-sm text-indigo-800">
                      Login karne ke baad tumhe 7 free AI Notes generations
                      milengi.
                    </p>
                    <a
                      href="/auth"
                      className="mt-3 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                    >
                      Login / Sign up
                    </a>
                  </>
                )}

                {creditsError && (
                  <div className="mt-3">
                    <p className="text-xs text-red-700">{creditsError}</p>
                    <button
                      onClick={() => {
                        setCreditsLoading(true);
                        void refreshCredits();
                      }}
                      className="mt-2 text-xs font-bold text-indigo-700 underline"
                    >
                      Retry credits check
                    </button>
                  </div>
                )}
              </div>

              {/* PURCHASE PLANS */}
              {credits?.loggedIn &&
                credits.plans.length > 0 &&
                credits.freeRemaining <= 0 && (
                  <div className="mt-5 rounded-2xl border border-indigo-200 bg-white p-4 sm:p-5">
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                        Padhatoz AI Credits
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-900">
                        Get more AI generations
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Apni requirement ke according credit plan choose karo.
                        Payment successful aur verified hone par credits
                        automatically add ho jayenge.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {credits.plans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`relative rounded-xl border p-4 ${
                            plan.isFeatured
                              ? "border-indigo-400 bg-indigo-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          {plan.isFeatured && (
                            <span className="mb-2 inline-flex rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                              Popular
                            </span>
                          )}

                          <h4 className="text-base font-black text-slate-900">
                            {plan.name}
                          </h4>

                          {plan.description && (
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              {plan.description}
                            </p>
                          )}

                          <p className="mt-3 text-2xl font-black text-indigo-700">
                            ₹{(plan.pricePaise / 100).toFixed(2)}
                          </p>

                          <div className="mt-3 space-y-1 text-sm text-slate-700">
                            <p>
                              <strong>{plan.credits}</strong> AI generations
                            </p>
                            <p>
                              Valid for{" "}
                              <strong>{plan.validityDays} days</strong>
                            </p>
                          </div>

                          <button
                            onClick={() => void buyCreditPlan(plan)}
                            disabled={checkoutLoading}
                            className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {checkoutLoading
                              ? "Please wait..."
                              : "Buy this plan"}
                          </button>
                        </div>
                      ))}
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Payments are processed securely through Razorpay.
                      Purchased credits expire after their plan validity.
                    </p>
                  </div>
                )}

              {credits?.loggedIn &&
                credits.freeRemaining <= 0 &&
                credits.plans.length === 0 && (
                  <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                    <p className="font-bold text-amber-950">
                      Your free generations are used!
                    </p>
                    <p className="mt-1 text-sm text-amber-900">
                      Abhi koi active purchase plan available nahi hai.
                      Please baad mein check karo.
                    </p>
                  </div>
                )}

              {paymentMessage && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                  {paymentMessage}
                  <button
                    onClick={() => {
                      setCreditsLoading(true);
                      void refreshCredits();
                    }}
                    className="ml-2 font-bold underline"
                  >
                    Refresh credits
                  </button>
                </div>
              )}

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
                  disabled={isGenerating || creditsLoading || !canGenerate}
                  className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {isGenerating
                    ? "Generating notes..."
                    : creditsLoading
                      ? "Checking credits..."
                      : !credits?.loggedIn
                        ? "Login to Generate Notes"
                        : credits.totalRemaining <= 0
                          ? "No Credits Available"
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
                      {streamingNotes
                        ? "Notes live generate ho rahe hain. Tum padhna shuru kar sakte ho."
                        : "Gemini se pehla response aa raha hai..."}
                    </p>
                  </div>

                  <p className="mt-2 text-xs text-indigo-600">
                    Naya content automatically neeche appear hota rahega.
                  </p>
                </div>
              )}

              {aiError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <strong>Error:</strong> {aiError}
                </div>
              )}
            </div>

            {displayNotes && (notesAreLoaded || isGenerating) && (
              <GeneratedNotes
                notes={displayNotes}
                topic={topic}
                onCopy={copyGeneratedNotes}
                onShare={shareGeneratedNotes}
                copied={copied}
                isStreaming={isGenerating}
                onSave={handleSaveNotes}
                isSaved={isSaved}
              />
            )}

            {!notesAreLoaded && (
              <div className="rounded-xl border bg-white p-5 text-sm text-slate-500">
                Loading saved notes...
              </div>
            )}

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

              {!generatedNotes && !isGenerating && (
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
              )}
            </div>

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
