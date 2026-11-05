
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";

function getErrorStatus(error: unknown): number {
  if (typeof error === "object" && error !== null && "status" in error) {
    return Number(error.status) || 0;
  }

  return 0;
}

function isTemporaryError(error: unknown): boolean {
  return [500, 503, 504].includes(getErrorStatus(error));
}

function sendEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  data: Record<string, unknown>
) {
  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
  );
}

export async function POST(request: Request) {
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

  const models = [
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let lastError: unknown;

      try {
        for (const model of models) {
          let emittedContent = false;

          try {
            console.log(`Starting streaming notes generation with ${model}`);

            const result = await ai.models.generateContentStream({
              model,
              contents: prompt,
              config: {
                maxOutputTokens: 10000,
                thinkingConfig: {
                  thinkingLevel: ThinkingLevel.LOW,
                },
              },
            });

            for await (const chunk of result) {
              const text = chunk.text ?? "";

              if (!text) continue;

              emittedContent = true;

              sendEvent(controller, encoder, {
                type: "chunk",
                text,
              });
            }

            if (!emittedContent) {
              throw new Error("Gemini returned an empty response.");
            }

            console.log(`Streaming completed successfully using ${model}`);

            sendEvent(controller, encoder, {
              type: "done",
              model,
              language,
            });

            controller.close();
            return;
          } catch (error) {
            lastError = error;

            // Once text has been sent, do not switch models and duplicate it.
            if (emittedContent || !isTemporaryError(error)) {
              throw error;
            }

            console.warn(
              `${model} temporarily unavailable. Status: ${getErrorStatus(error)}`
            );
          }
        }

        throw lastError ?? new Error("All Gemini models failed.");
      } catch (error) {
        console.error("Gemini streaming error:", error);

        const status = getErrorStatus(error);

        let message =
          "Notes generate nahi ho paye. Please try again.";

        if ([500, 503, 504].includes(status)) {
          message =
            "Gemini models are temporarily busy. Please wait and try again.";
        } else if (status === 429) {
          message =
            "Gemini API rate limit or quota reached. Please check your Google AI Studio usage limits.";
        } else if (
          error instanceof Error &&
          error.message === "Gemini returned an empty response."
        ) {
          message = "AI ne empty response diya. Dobara try karo.";
        }

        try {
          sendEvent(controller, encoder, {
            type: "error",
            error: message,
          });

          controller.close();
        } catch {
          // The client may have disconnected.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
