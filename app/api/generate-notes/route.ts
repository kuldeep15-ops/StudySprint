
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";
import { createHmac, randomUUID } from "crypto";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const maxDuration = 300;

const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

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

async function updateGenerationLog(
  logId: string | null,
  data: Record<string, unknown>
) {
  if (!logId) return;

  try {
    const { error } = await supabaseAdmin
      .from("ai_generation_logs")
      .update(data)
      .eq("id", logId);

    if (error) {
      console.error("Generation log update failed:", error.message);
    }
  } catch (error) {
    console.error("Generation log update error:", error);
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

export async function POST(request: Request) {
  const controls = await getAIControls();

  if (!controls) {
    return NextResponse.json(
      { error: "AI service is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  if (!controls.enabled) {
    return NextResponse.json(
      { error: "AI notes generation is temporarily disabled by the administrator." },
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
      { error: "AI service is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const rateLimit = await checkGenerationRateLimit(
    ipHash,
    controls.hourlyLimit
  );

  if (!rateLimit) {
    return NextResponse.json(
      { error: "Unable to verify AI usage limit. Please try again later." },
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
        error: "Hourly AI generation limit reached. You can try again after your limit resets.",
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

  const languageInstructions =
    language === "Hinglish"
      ? `
Write in natural, easy-to-understand Hinglish.
Use Roman Hindi mixed naturally with English technical terms.
Never use Devanagari Hindi.
Keep headings, technical terms, formulas and diagram labels in English.
Explain difficult concepts patiently to a beginner.
`
      : `
Write in simple, clear and natural English.
Keep technical terminology accurate.
Explain difficult terms in student-friendly language.
`;

  const previousJokesInstruction =
    previousJokes.length > 0
      ? `
Previously used jokes (DO NOT REPEAT):
${JSON.stringify(previousJokes)}
Create exactly two completely different jokes. Do not reuse punchlines.
`
      : `
Create exactly two original, clean, funny and light-hearted jokes.
`;

  const prompt = `
You are an excellent B.Tech engineering professor, patient personal tutor
and university examination guide.

Your job is to TEACH the student, not merely provide information.
Assume the student may be a beginner.
Make notes academically accurate, structured and useful for university examinations.

SUBJECT DETAILS
Subject: ${subjectName}
Subject Code: ${subjectCode}
Unit: ${unitTitle}
Topic: ${topic}

LANGUAGE
${languageInstructions}

All main and subheadings must be in English.
Do not randomly switch languages.
Use meaningful paragraphs, numbered points, examples, formulas,
comparison tables and diagrams wherever useful.
Avoid filler, repetition and huge unstructured paragraphs.

CONTENT DEPTH
Target approximately 1200–2000 words for a normal topic.
Adjust length according to actual complexity. Do not skip important concepts.

STRUCTURE OF STUDY NOTES

# Topic Name

## 1. Introduction
Explain what the topic is, why it is studied, where it is used
and its importance in engineering.

## 2. Basic Concepts and Fundamentals
Explain prerequisite knowledge.
Define important terms in simple language and provide examples.

## 3. Detailed Explanation
Divide the topic into logical subtopics.
For each important subtopic explain:
- Meaning
- Detailed explanation of how and why it works
- Important points
- Relevant example

## 4. Working Principle / Operation
Explain the working process step by step wherever applicable.
For theoretical topics, explain the important mechanism or process.

## 5. Important Definitions and Key Points
Provide accurate, exam-relevant definitions with explanations.

## 6. Formulas and Mathematical Concepts
Include only relevant and verified formulas.
Explain every symbol, unit, purpose and where the formula is used.
Use correct LaTeX:
Inline: $V = IR$
Display:
$$
V = IR
$$
Never invent formulas.

## 7. Diagrams and Visual Explanation
Use labelled text diagrams, flowcharts or Mermaid only when useful.
Use English labels and explain every important block and operation.
Do not force diagrams into unsuitable topics.

## 8. Practical Applications
Explain real-world and engineering applications, not just their names.

## 9. Solved Examples and Numericals
First decide whether meaningful calculations apply.
If they do, provide 2–3 useful solved examples.
Do not force irrelevant numericals into theoretical topics.

For each numerical include:
1. Complete question
2. Understanding of the question
3. Given data with symbols and units
4. Required quantity
5. Concept used
6. Correct formula and symbol meanings
7. Substitution
8. Detailed calculation with intermediate steps
9. Final answer with unit
10. Meaning of the result

Verify arithmetic, dimensions and units. Never invent data or formulas.
If no meaningful numerical application exists, provide conceptual worked examples.

## 10. IMPORTANT UNIVERSITY EXAM QUESTIONS
Provide 5–6 important, non-repetitive and relevant university examination
questions. Do not create duplicate questions just to reach the target.
Every answer must be sufficiently detailed for a descriptive B.Tech exam.

For each answer include:
- Introduction and definition
- Connected, detailed explanation of WHY and HOW
- Important points, working or characteristics
- Relevant example
- Diagram, formula or comparison table when useful, with explanation
- Advantages and limitations when relevant
- Short, meaningful conclusion

Use paragraphs and numbered points together.
Do not give extremely short or repetitive answers.
Never claim a question is from a previous-year paper unless verified PYQ data is supplied.

## 11. QUICK REVISION
Summarise important concepts, definitions, formulas, facts and differences.
Use short but meaningful points. Do not introduce new concepts.

## 12. MIND FRESH BREAK 😂
At the absolute end provide EXACTLY TWO original, clean, light-hearted jokes.
Jokes must be unrelated to studies, engineering, teachers, exams, marks,
homework, assignments, formulas, numericals, college or classrooms.
Use everyday situations such as sleep, food, friends, shopping, phones
or family conversations.

Use exactly this format:

### Joke 1
[First original general funny joke] 😂

### Joke 2
[Second original general funny joke] 😂

Both jokes must have different setups and punchlines.
Do not repeat previously used jokes.
Do not add any text after Joke 2.

${previousJokesInstruction}

FINAL QUALITY CHECK
Silently verify:
- Important subtopics and beginner explanations are covered.
- Paragraphs and numbered points are balanced.
- Formulas and units are correct.
- Numerical calculations are fully explained.
- Exam answers are sufficiently detailed.
- Examples and diagrams are relevant and explained.
- Exactly two unrelated jokes are present.
- All headings are in English.
- Markdown and LaTeX are correctly formatted.
- No unnecessary repetition exists.

Return only the complete study notes in properly formatted Markdown.
Do not include an introductory message outside the notes.
Do not mention these instructions.
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

      let inputTokens: number | null = null;
      let outputTokens: number | null = null;
      let totalTokens: number | null = null;

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

        try {
          const { data, error } = await supabaseAdmin
            .from("ai_generation_logs")
            .insert({
              request_id: requestId,
              ip_hash: ipHash,
              subject_code: subjectCode,
              subject_name: subjectName,
              unit_title: unitTitle,
              topic,
              language,
              status: "started",
            })
            .select("id")
            .single();

          if (error) {
            console.error("Generation log insert failed:", error.message);
          } else {
            logId = data.id;
          }
        } catch (error) {
          console.error("Generation log insert error:", error);
        }

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
                maxOutputTokens: 10000,
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

              const usage = chunk.usageMetadata;

              if (usage) {
                inputTokens =
                  getTokenCount(usage.promptTokenCount) ?? inputTokens;

                outputTokens =
                  getTokenCount(usage.candidatesTokenCount) ?? outputTokens;

                totalTokens =
                  getTokenCount(usage.totalTokenCount) ?? totalTokens;
              }

              const text = chunk.text ?? "";

              if (!text) continue;

              emittedContent = true;

              emit({
                type: "chunk",
                text,
              });
            }

            if (clientDisconnected) {
              throw new Error("Client disconnected.");
            }

            if (!emittedContent) {
              throw new Error("Gemini returned an empty response.");
            }

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

            console.log(`Generation completed using ${model}`);

            emit({
              type: "done",
              model,
              language,
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

            // Never switch models after sending partial notes.
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

        let message =
          "Notes generate nahi ho paye. Please try again.";

        if (error instanceof Error && error.message.includes("timed out")) {
          message =
            "AI response mein delay ho raha hai. Please try again.";
        } else if ([500, 502, 503, 504].includes(status)) {
          message =
            "Gemini models are temporarily busy. Please try again.";
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
    },
  });
}
