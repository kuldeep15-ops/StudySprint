
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";
import { createHash, createHmac, randomUUID } from "crypto";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/app/lib/supabaseServer";

export const maxDuration = 300;

const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const STUDENT_FREE_LIMIT = 7;
const PROMPT_VERSION = "notes-v2";

const MODELS = [
  { name: "gemini-3.5-flash-lite", timeout: 90_000 },
  { name: "gemini-3.6-flash", timeout: 150_000 },
];

function getErrorStatus(error: unknown): number {
  if (typeof error === "object" && error !== null && "status" in error) {
    return Number(error.status) || 0;
  }
  return 0;
}

function isTemporaryError(error: unknown): boolean {
  return [429, 500, 502, 503, 504].includes(getErrorStatus(error));
}

function getHashedIp(request: Request): string | null {
  const secret = process.env.SHARE_RATE_LIMIT_SECRET;
  if (!secret) return null;

  const realIp = request.headers.get("x-real-ip");
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = realIp?.trim() || forwardedFor?.split(",")[0]?.trim();

  if (!ip) return null;

  return createHmac("sha256", secret).update(ip).digest("hex");
}

function getTokenCount(value: number | undefined | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getCacheKey(
  subjectCode: string,
  subjectName: string,
  unitTitle: string,
  topic: string,
  language: string
): string {
  const normalized = [
    PROMPT_VERSION,
    subjectCode,
    subjectName,
    unitTitle,
    topic,
    language,
  ]
    .map((value) => value.trim().toLowerCase())
    .join("|");

  return createHash("sha256").update(normalized).digest("hex");
}

async function getCachedNotes(cacheKey: string): Promise<{
  notes: string;
  model: string | null;
} | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("ai_notes_cache")
      .select("notes, model")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (error) {
      console.error("AI cache lookup failed:", error.message);
      return null;
    }

    if (!data || typeof data.notes !== "string" || !data.notes.trim()) {
      return null;
    }

    return {
      notes: data.notes,
      model: data.model ?? null,
    };
  } catch (error) {
    console.error("AI cache lookup error:", error);
    return null;
  }
}

async function saveCachedNotes(
  cacheKey: string,
  subjectCode: string,
  unitTitle: string,
  topic: string,
  language: string,
  notes: string,
  model: string
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from("ai_notes_cache")
      .upsert(
        {
          cache_key: cacheKey,
          subject_code: subjectCode,
          unit_title: unitTitle,
          topic,
          language,
          notes,
          model,
        },
        { onConflict: "cache_key" }
      );

    if (error) {
      console.error("AI cache save failed:", error.message);
    }
  } catch (error) {
    console.error("AI cache save error:", error);
  }
}

async function updateGenerationLog(
  logId: string | null,
  data: Record<string, unknown>
) {
  if (!logId) return;

  try {
    const safeData = {
      ...data,
      input_tokens:
        typeof data.input_tokens === "number" ? data.input_tokens : 0,
      output_tokens:
        typeof data.output_tokens === "number" ? data.output_tokens : 0,
      total_tokens:
        typeof data.total_tokens === "number" ? data.total_tokens : 0,
    };

    const { error } = await supabaseAdmin
      .from("ai_generation_logs")
      .update(safeData)
      .eq("id", logId);

    if (error) {
      console.error("Generation log update failed:", error.message);
    }
  } catch (error) {
    console.error("Generation log update error:", error);
  }
}

async function insertGenerationLog(
  data: Record<string, unknown>
): Promise<string | null> {
  try {
    const safeData = {
      ...data,
      input_tokens:
        typeof data.input_tokens === "number" ? data.input_tokens : 0,
      output_tokens:
        typeof data.output_tokens === "number" ? data.output_tokens : 0,
      total_tokens:
        typeof data.total_tokens === "number" ? data.total_tokens : 0,
    };

    const { data: result, error } = await supabaseAdmin
      .from("ai_generation_logs")
      .insert(safeData)
      .select("id")
      .single();

    if (error) {
      console.error("Generation log insert failed:", error.message);
      return null;
    }

    return result.id;
  } catch (error) {
    console.error("Generation log insert error:", error);
    return null;
  }
}

async function updateStudentUsage(
  usageId: number | string | null,
  status: "completed" | "failed"
): Promise<boolean> {
  if (usageId === null) return false;

  try {
    const { error } = await supabaseAdmin
      .from("student_ai_usage")
      .update({ status })
      .eq("id", usageId)
      .eq("status", "reserved");

    if (error) {
      console.error("Student AI usage update failed:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Student AI usage update error:", error);
    return false;
  }
}

// Only count free generations. Paid generations are stored separately.
async function getStudentRemainingCredits(studentId: string): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from("student_ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("feature", "ai_notes")
      .is("paid_credit_lot_id", null)
      .in("status", ["reserved", "completed"]);

    if (error) {
      console.error("Free credit count failed:", error.message);
      return 0;
    }

    return Math.max(0, STUDENT_FREE_LIMIT - (count ?? 0));
  } catch (error) {
    console.error("Free credit count error:", error);
    return 0;
  }
}

async function getStudentPaidRemainingCredits(
  studentId: string
): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from("student_paid_credit_lots")
      .select("remaining_credits")
      .eq("student_id", studentId)
      .gt("remaining_credits", 0)
      .gt("expires_at", new Date().toISOString());

    if (error) {
      console.error("Paid credit count failed:", error.message);
      return 0;
    }

    return (data ?? []).reduce(
      (total, lot) => total + Number(lot.remaining_credits || 0),
      0
    );
  } catch (error) {
    console.error("Paid credit count error:", error);
    return 0;
  }
}

async function getAIControls(): Promise<{
  enabled: boolean;
  hourlyLimit: number;
} | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_settings")
      .select("key, value")
      .in("key", ["ai_enabled", "ai_hourly_limit"]);

    if (error) {
      console.error("AI settings fetch failed:", error.message);
      return null;
    }

    const enabled = data?.find((item) => item.key === "ai_enabled")?.value;
    const hourlyLimit = data?.find(
      (item) => item.key === "ai_hourly_limit"
    )?.value;

    if (
      typeof enabled !== "boolean" ||
      typeof hourlyLimit !== "number" ||
      !Number.isInteger(hourlyLimit) ||
      hourlyLimit < 1 ||
      hourlyLimit > 100
    ) {
      console.error("AI settings are missing or invalid.");
      return null;
    }

    return { enabled, hourlyLimit };
  } catch (error) {
    console.error("AI settings fetch error:", error);
    return null;
  }
}

async function checkGenerationRateLimit(
  ipHash: string,
  hourlyLimit: number
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: string;
} | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc(
      "check_ai_generation_rate_limit",
      {
        p_ip_hash: ipHash,
        p_limit: hourlyLimit,
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
      }
    );

    if (error) {
      console.error("AI rate limit check failed:", error.message);
      return null;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (
      !result ||
      typeof result.allowed !== "boolean" ||
      typeof result.remaining !== "number" ||
      typeof result.reset_at !== "string"
    ) {
      console.error("AI rate limit returned invalid data.");
      return null;
    }

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.reset_at,
    };
  } catch (error) {
    console.error("AI rate limit error:", error);
    return null;
  }
}

function createNotesStream(
  notes: string,
  model: string,
  language: string,
  remaining: number,
  paidRemaining: number,
  headers: Record<string, string> = {}
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const chunkSize = 1500;

        for (let i = 0; i < notes.length; i += chunkSize) {
          send({
            type: "chunk",
            text: notes.slice(i, i + chunkSize),
          });
        }

        send({
          type: "done",
          model,
          language,
          freeLimit: STUDENT_FREE_LIMIT,
          remaining,
          paidRemaining,
          cached: true,
        });

        controller.close();
      } catch (error) {
        console.error("Cached notes stream failed:", error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...headers,
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "AI Notes generate karne ke liye login required hai." },
      { status: 401 }
    );
  }

  const controls = await getAIControls();

  if (!controls) {
    return NextResponse.json(
      {
        error:
          "AI service is temporarily unavailable. Please try again later.",
      },
      { status: 503 }
    );
  }

  if (!controls.enabled) {
    return NextResponse.json(
      {
        error:
          "AI notes generation is temporarily disabled by the administrator.",
      },
      { status: 503 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is missing. Check your environment variables." },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request data." },
      { status: 400 }
    );
  }

  const subjectCode = String(body.subjectCode ?? "").trim();
  const subjectName = String(body.subjectName ?? "").trim();
  const unitTitle = String(body.unitTitle ?? "").trim();
  const topic = String(body.topic ?? "").trim();

  const requestedLanguage = String(body.language ?? "English").trim();
  const language =
    requestedLanguage === "Hinglish" ? "Hinglish" : "English";

  const previousJokes = Array.isArray(body.previousJokes)
    ? body.previousJokes
        .filter((joke): joke is string => typeof joke === "string")
        .map((joke) => joke.trim())
        .filter(Boolean)
        .slice(-10)
    : [];

  if (!subjectCode || !subjectName || !unitTitle || !topic) {
    return NextResponse.json(
      { error: "Subject, unit and topic details are required." },
      { status: 400 }
    );
  }

  if (
    subjectCode.length > 50 ||
    subjectName.length > 200 ||
    unitTitle.length > 300 ||
    topic.length > 500
  ) {
    return NextResponse.json(
      { error: "Input is too long." },
      { status: 400 }
    );
  }

  const ipHash = getHashedIp(request);

  if (!ipHash) {
    return NextResponse.json(
      {
        error:
          "AI service is temporarily unavailable. Please try again later.",
      },
      { status: 503 }
    );
  }

  const rateLimit = await checkGenerationRateLimit(
    ipHash,
    controls.hourlyLimit
  );

  if (!rateLimit) {
    return NextResponse.json(
      {
        error: "Unable to verify AI usage limit. Please try again later.",
      },
      { status: 503 }
    );
  }

  if (!rateLimit.allowed) {
    const resetTimestamp = new Date(rateLimit.resetAt).getTime();

    const retryAfter = Number.isFinite(resetTimestamp)
      ? Math.max(1, Math.ceil((resetTimestamp - Date.now()) / 1000))
      : RATE_LIMIT_WINDOW_SECONDS;

    return NextResponse.json(
      {
        error:
          "Hourly AI generation limit reached. You can try again after your limit resets.",
        limit: controls.hourlyLimit,
        remaining: 0,
        resetAt: rateLimit.resetAt,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(controls.hourlyLimit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Cache lookup happens before any credit reservation.
  const cacheKey = getCacheKey(
    subjectCode,
    subjectName,
    unitTitle,
    topic,
    language
  );

  const cached = await getCachedNotes(cacheKey);

  if (cached) {
    const [freeRemaining, paidRemaining] = await Promise.all([
      getStudentRemainingCredits(user.id),
      getStudentPaidRemainingCredits(user.id),
    ]);

    const requestId = randomUUID();

    await insertGenerationLog({
      request_id: requestId,
      user_id: user.id,
      ip_hash: ipHash,
      subject_code: subjectCode,
      subject_name: subjectName,
      unit_title: unitTitle,
      topic,
      language,
      model: cached.model ?? "cache",
      status: "success",
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      estimated_cost_usd: 0,
      duration_ms: 0,
    });

    return createNotesStream(
      cached.notes,
      cached.model ?? "cache",
      language,
      freeRemaining,
      paidRemaining,
      {
        "X-RateLimit-Limit": String(controls.hourlyLimit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-Free-Generations-Limit": String(STUDENT_FREE_LIMIT),
        "X-Free-Generations-Remaining": String(freeRemaining),
        "X-Paid-Generations-Remaining": String(paidRemaining),
      }
    );
  }

  // First reserve a free generation.
  const { data: freeUsageData, error: freeUsageError } =
    await supabaseAdmin.rpc("reserve_student_ai_generation", {
      p_student_id: user.id,
      p_limit: STUDENT_FREE_LIMIT,
    });

  const freeUsage = Array.isArray(freeUsageData)
    ? freeUsageData[0]
    : freeUsageData;

  if (
    freeUsageError ||
    !freeUsage ||
    typeof freeUsage.allowed !== "boolean" ||
    typeof freeUsage.remaining !== "number" ||
    typeof freeUsage.used !== "number"
  ) {
    console.error(
      "Free AI usage reservation failed:",
      freeUsageError?.message
    );

    return NextResponse.json(
      {
        error:
          "Unable to verify your free AI generations. Please try again.",
      },
      { status: 503 }
    );
  }

  let studentUsageId: number | string | null = null;
  let creditType: "free" | "paid" | null = null;
  let freeRemaining = freeUsage.remaining;
  let paidRemaining = await getStudentPaidRemainingCredits(user.id);

  if (freeUsage.allowed) {
    studentUsageId = freeUsage.usage_id;
    creditType = "free";
  } else {
    // Free credits exhausted: try reserving a purchased credit.
    const { data: paidUsageData, error: paidUsageError } =
      await supabaseAdmin.rpc("reserve_student_paid_ai_credit", {
        p_student_id: user.id,
      });

    const paidUsage = Array.isArray(paidUsageData)
      ? paidUsageData[0]
      : paidUsageData;

    if (
      paidUsageError ||
      !paidUsage ||
      typeof paidUsage.allowed !== "boolean" ||
      typeof paidUsage.remaining !== "number"
    ) {
      console.error(
        "Paid AI credit reservation failed:",
        paidUsageError?.message
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify your purchased AI credits. Please try again.",
        },
        { status: 503 }
      );
    }

    if (!paidUsage.allowed) {
      return NextResponse.json(
        {
          error:
            "Your 7 free AI Notes generations have been used and you have no active paid credits. Please purchase an AI Notes plan to continue.",
          freeLimit: STUDENT_FREE_LIMIT,
          used: freeUsage.used,
          remaining: 0,
          paidRemaining: 0,
          needsPurchase: true,
        },
        {
          status: 429,
          headers: {
            "X-Free-Generations-Limit": String(STUDENT_FREE_LIMIT),
            "X-Free-Generations-Remaining": "0",
            "X-Paid-Generations-Remaining": "0",
          },
        }
      );
    }

    studentUsageId = paidUsage.usage_id;
    creditType = "paid";
    freeRemaining = 0;
    paidRemaining = paidUsage.remaining;
  }

  if (studentUsageId === null || studentUsageId === undefined) {
    console.error("Student AI usage reservation returned no usage ID.");

    return NextResponse.json(
      {
        error: "Unable to reserve your generation. Please try again.",
      },
      { status: 503 }
    );
  }

  const languageInstructions =
    language === "Hinglish"
      ? "Write natural Roman Hindi mixed with English technical terms. Never use Devanagari. Keep headings, technical terms, formulas and diagram labels in English. Explain concepts simply."
      : "Write in simple, clear English. Keep technical terminology accurate and explain difficult concepts simply.";

  const previousJokesInstruction =
    previousJokes.length > 0
      ? `Avoid repeating these previous jokes and punchlines: ${JSON.stringify(previousJokes)}.`
      : "Create two original jokes.";

  const prompt = `
You are an expert B.Tech engineering professor and student-friendly tutor.

Generate accurate, detailed, exam-oriented study notes. Teach beginners clearly without filler or repetition.

SUBJECT: ${subjectName}
CODE: ${subjectCode}
UNIT: ${unitTitle}
TOPIC: ${topic}

LANGUAGE:
${languageInstructions}

RULES:
- Use English headings.
- Cover the important concepts and relevant subtopics.
- Explain WHY and HOW, not just definitions.
- Use clear paragraphs and numbered points.
- Use tables, formulas, examples and diagrams only when useful.
- Never invent facts, formulas, PYQs or numerical data.
- Adjust detail to the topic; avoid unnecessary length.

NOTES FORMAT:

# Topic Name

## 1. Introduction
Meaning, importance and engineering relevance.

## 2. Basic Concepts
Prerequisites, fundamentals and important definitions.

## 3. Detailed Explanation
Explain all important subtopics, mechanisms, working principles and processes step by step.

## 4. Formulas
Relevant formulas, symbol meanings and units. Use correct LaTeX. Do not force formulas into theoretical topics.

## 5. Diagrams
Useful labelled diagrams or flowcharts, with explanations. Do not force diagrams where unsuitable.

## 6. Practical Applications
Explain relevant real-world and engineering applications.

## 7. Solved Examples
Provide 1–2 solved numericals if calculations are relevant. Show given data, formula, substitution, calculation and final answer with units. Otherwise give conceptual examples.

## 8. Important University Exam Questions
Provide 4 relevant descriptive questions with sufficiently detailed answers. Explain WHY and HOW, important points and examples. Include diagrams, formulas or comparisons when useful. Never claim a question is from a previous-year paper without verified data.

## 9. Quick Revision
Summarise key definitions, concepts, differences and formulas.

## 10. MIND FRESH BREAK 😂
Provide exactly two original, clean jokes unrelated to studies, engineering, exams or college. Use everyday situations.

### Joke 1
[First joke] 😂

### Joke 2
[Second different joke] 😂

${previousJokesInstruction}

FINAL CHECK:
- Important concepts are covered accurately.
- Formulas, calculations and units are correct.
- Exam answers are sufficiently detailed.
- No unnecessary repetition.
- Exactly two unrelated jokes.
- Return only complete Markdown notes.
`;

  const ai = new GoogleGenAI({ apiKey });
  const encoder = new TextEncoder();
  const requestId = randomUUID();
  const startedAt = Date.now();

  let clientDisconnected = false;
  let streamClosed = false;
  let activeAbortController: AbortController | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let logId: string | null = null;
      let activeModel: string | null = null;
      let lastError: unknown = null;
      let usageCompleted = false;

      let inputTokens: number | null = null;
      let outputTokens: number | null = null;
      let totalTokens: number | null = null;
      let fullNotes = "";

      const emit = (data: Record<string, unknown>) => {
        if (clientDisconnected || streamClosed) return;

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch (error) {
          clientDisconnected = true;
          activeAbortController?.abort();
          console.warn("Client stream disconnected:", error);
        }
      };

      const closeStream = () => {
        if (clientDisconnected || streamClosed) return;

        try {
          controller.close();
          streamClosed = true;
        } catch {
          streamClosed = true;
        }
      };

      const handleDisconnect = () => {
        clientDisconnected = true;
        activeAbortController?.abort();
      };

      request.signal.addEventListener("abort", handleDisconnect, {
        once: true,
      });

      try {
        if (request.signal.aborted) {
          handleDisconnect();
          return;
        }

        logId = await insertGenerationLog({
          request_id: requestId,
          user_id: user.id,
          ip_hash: ipHash,
          subject_code: subjectCode,
          subject_name: subjectName,
          unit_title: unitTitle,
          topic,
          language,
          status: "started",
        });

        if (clientDisconnected) {
          await updateGenerationLog(logId, {
            status: "failed",
            duration_ms: Date.now() - startedAt,
            error_message: "Client disconnected before generation.",
          });
          return;
        }

        for (const modelConfig of MODELS) {
          if (clientDisconnected) break;

          const model = modelConfig.name;
          const timeoutMs = modelConfig.timeout;

          let emittedContent = false;
          let timedOut = false;

          activeModel = model;

          const modelAbortController = new AbortController();
          activeAbortController = modelAbortController;

          const timeout = setTimeout(() => {
            timedOut = true;
            modelAbortController.abort();
            console.warn(`${model} timed out after ${timeoutMs}ms`);
          }, timeoutMs);

          try {
            console.log(`Starting notes generation with ${model}`);

            const result = await ai.models.generateContentStream({
              model,
              contents: prompt,
              config: {
                maxOutputTokens: 6000,
                thinkingConfig: {
                  thinkingLevel: ThinkingLevel.LOW,
                },
                abortSignal: modelAbortController.signal,
              },
            });

            for await (const chunk of result) {
              if (clientDisconnected) {
                throw new Error("Client disconnected.");
              }

              if (timedOut) {
                throw new Error("Gemini model timed out.");
              }

              const usageMetadata = chunk.usageMetadata;

              if (usageMetadata) {
                inputTokens =
                  getTokenCount(usageMetadata.promptTokenCount) ??
                  inputTokens;

                outputTokens =
                  getTokenCount(usageMetadata.candidatesTokenCount) ??
                  outputTokens;

                totalTokens =
                  getTokenCount(usageMetadata.totalTokenCount) ??
                  totalTokens;
              }

              const text = chunk.text ?? "";

              if (!text) continue;

              emittedContent = true;
              fullNotes += text;

              emit({
                type: "chunk",
                text,
              });
            }

            if (clientDisconnected) {
              throw new Error("Client disconnected.");
            }

            if (!emittedContent || !fullNotes.trim()) {
              throw new Error("Gemini returned an empty response.");
            }

            await saveCachedNotes(
              cacheKey,
              subjectCode,
              unitTitle,
              topic,
              language,
              fullNotes,
              model
            );

            await updateGenerationLog(logId, {
              model,
              status: "success",
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              total_tokens: totalTokens,
              duration_ms: Date.now() - startedAt,
              error_status: null,
              error_message: null,
            });

            usageCompleted = await updateStudentUsage(
              studentUsageId,
              "completed"
            );

            if (!usageCompleted) {
              throw new Error("Unable to finalize AI credit usage.");
            }

            console.log(
              `Generation completed using ${model}. Credit type: ${creditType}`
            );

            emit({
              type: "done",
              model,
              language,
              freeLimit: STUDENT_FREE_LIMIT,
              remaining: freeRemaining,
              paidRemaining,
              creditType,
              cached: false,
            });

            closeStream();
            return;
          } catch (error) {
            lastError = timedOut
              ? new Error(`Gemini model timed out after ${timeoutMs}ms.`)
              : error;

            if (clientDisconnected) {
              break;
            }

            // Do not switch models after partial notes have been sent.
            if (emittedContent) {
              throw lastError;
            }

            const canTryNextModel =
              timedOut ||
              isTemporaryError(error) ||
              (error instanceof Error &&
                error.message === "Gemini returned an empty response.");

            if (!canTryNextModel) {
              throw lastError;
            }

            console.warn(
              `${model} failed before producing text. Trying next model.`,
              lastError
            );
          } finally {
            clearTimeout(timeout);

            if (activeAbortController === modelAbortController) {
              activeAbortController = null;
            }
          }
        }

        if (clientDisconnected) {
          await updateGenerationLog(logId, {
            model: activeModel,
            status: "failed",
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_tokens: totalTokens,
            duration_ms: Date.now() - startedAt,
            error_message: "Client disconnected during generation.",
          });
          return;
        }

        throw lastError ?? new Error("All Gemini models failed.");
      } catch (error) {
        if (clientDisconnected) {
          await updateGenerationLog(logId, {
            model: activeModel,
            status: "failed",
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_tokens: totalTokens,
            duration_ms: Date.now() - startedAt,
            error_message: "Client disconnected during generation.",
          });
          return;
        }

        console.error("Gemini streaming error:", error);

        const status = getErrorStatus(error);

        let message = "Notes generate nahi ho paye. Please try again.";

        if (error instanceof Error && error.message.includes("timed out")) {
          message = "AI response mein delay ho raha hai. Please try again.";
        } else if ([500, 502, 503, 504].includes(status)) {
          message = "Gemini models are temporarily busy. Please try again.";
        } else if (status === 429) {
          message =
            "Gemini API rate limit or quota reached. Please check your Google AI Studio usage limits.";
        } else if (
          error instanceof Error &&
          error.message === "Gemini returned an empty response."
        ) {
          message = "AI ne empty response diya. Dobara try karo.";
        }

        await updateGenerationLog(logId, {
          model: activeModel,
          status: "failed",
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: totalTokens,
          duration_ms: Date.now() - startedAt,
          error_status: status || null,
          error_message:
            error instanceof Error
              ? error.message.slice(0, 1000)
              : "Unknown generation error",
        });

        emit({
          type: "error",
          error: message,
        });

        closeStream();
      } finally {
        if (!usageCompleted) {
          if (creditType === "paid") {
            // Refund paid credit only if its usage is still reserved.
            const { error } = await supabaseAdmin.rpc(
              "release_student_paid_ai_credit",
              {
                p_usage_id: studentUsageId,
                p_student_id: user.id,
              }
            );

            if (error) {
              console.error("Paid AI credit refund failed:", error.message);
            }
          } else if (creditType === "free") {
            await updateStudentUsage(studentUsageId, "failed");
          }
        }

        request.signal.removeEventListener("abort", handleDisconnect);
      }
    },

    cancel() {
      clientDisconnected = true;
      activeAbortController?.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-RateLimit-Limit": String(controls.hourlyLimit),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-Free-Generations-Limit": String(STUDENT_FREE_LIMIT),
      "X-Free-Generations-Remaining": String(freeRemaining),
      "X-Paid-Generations-Remaining": String(paidRemaining),
    },
  });
}
