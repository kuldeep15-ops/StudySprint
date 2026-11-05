
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

export async function POST(request: Request) {
  try {
    // 1. Check API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is missing. Check your environment variables." },
        { status: 500 }
      );
    }

    // 2. Read and validate request
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
          .filter((joke: unknown) => typeof joke === "string")
          .map((joke: string) => joke.trim())
          .filter((joke: string) => joke.length > 0)
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

    // 3. Initialize Gemini
    const ai = new GoogleGenAI({ apiKey });

    // 4. Language instructions
    const languageInstructions =
      language === "Hinglish"
        ? `
Write in natural, easy-to-understand Hinglish.
Use Roman Hindi mixed naturally with English technical terms.
Never use Devanagari Hindi.
Keep all headings, technical terms, formulas and diagram labels in English.
Explain difficult concepts as a patient teacher would explain them to a beginner.
`
        : `
Write in simple, clear and natural English.
Keep technical terminology accurate.
Explain every difficult technical term in student-friendly language.
`;

    // 5. Previous jokes instructions
    const previousJokesInstruction =
      previousJokes.length > 0
        ? `
Previously used jokes (DO NOT REPEAT):
${JSON.stringify(previousJokes)}

Create exactly two completely different jokes.
Do not reuse their punchlines or slightly modified versions.
`
        : `
Create exactly two original, clean, funny and light-hearted jokes.
`;

    // 6. Balanced notes prompt
    const prompt = `
You are an excellent B.Tech engineering professor, patient personal tutor
and university examination guide.

Your job is to TEACH the student, not merely provide information.
Assume the student may be a beginner.
Make the notes academically accurate, structured and useful for university examinations.

==================================================
SUBJECT DETAILS
==================================================

Subject: ${subjectName}
Subject Code: ${subjectCode}
Unit: ${unitTitle}
Topic: ${topic}

==================================================
LANGUAGE
==================================================

${languageInstructions}

Important:
- All main and subheadings must be in English.
- Technical terms and mathematical symbols must remain in English.
- Do not randomly switch languages.
- Keep explanations natural and easy to understand.

==================================================
1. CONTENT DEPTH
==================================================

Target approximately 1200–2000 words for a normal topic.

Adjust length according to actual topic complexity:
- Simple topics may need fewer words.
- Complex topics may need additional explanation.

Rules:
- Do not add meaningless filler.
- Do not repeat explanations unnecessarily.
- Do not skip important concepts.
- Prioritise understanding and academic accuracy.

==================================================
2. TEACHING STYLE
==================================================

Use a balanced combination of:
- Meaningful paragraphs.
- Numbered points.
- Examples.
- Formulas.
- Comparison tables.
- Diagrams wherever useful.

For every important concept explain:
1. What it means.
2. Why it is important.
3. How it works.
4. A relevant example wherever useful.

Do not write everything as short bullet points.
Avoid huge paragraphs without structure.

==================================================
3. STRUCTURE OF STUDY NOTES
==================================================

# Topic Name

## 1. Introduction

Explain:
- What the topic is.
- Why it is studied.
- Where it is used.
- Its importance in engineering.

Start with a meaningful introductory paragraph.

## 2. Basic Concepts and Fundamentals

Explain the prerequisite knowledge required to understand the topic.

For every important term:
- Give its correct definition.
- Explain its meaning in simple language.
- Provide an example wherever useful.

Do not assume the student already understands advanced terminology.

## 3. Detailed Explanation

Divide the topic into logical subtopics.

For each important subtopic use:

### Subtopic Name

**Meaning:**
Explain the concept in simple language.

**Detailed Explanation:**
Explain how and why the concept works.

**Important Points:**
Use numbered points and explain them.

**Example:**
Give a relevant practical or engineering example.

Cover all important subtopics without unnecessary repetition.

## 4. Working Principle / Operation

Wherever applicable, explain the working process step by step.

For each step:
1. Explain what happens.
2. Explain why it happens.
3. Explain what happens next.

For theoretical topics, explain the important mechanism or conceptual process.

## 5. Important Definitions and Key Points

Provide accurate, exam-relevant definitions.
Explain important terms instead of merely listing keywords.

## 6. Formulas and Mathematical Concepts

Include only relevant and verified formulas.

For every important formula:
1. Write it using correct LaTeX.
2. Explain what it calculates.
3. Explain every symbol.
4. Mention units wherever applicable.
5. Explain when it is used.

Use:
Inline: $V = IR$

Display:
$$
V = IR
$$

Never invent a formula.

## 7. Diagrams and Visual Explanation

Include relevant diagrams wherever they improve understanding.

Use:
- Simple labelled text diagrams.
- Flowcharts.
- Clearly structured steps and arrows.
- Mermaid diagrams only when genuinely useful.

Use English labels.

After every diagram, explain its important blocks, direction of operation and working.

Do not force diagrams into topics where they are unnecessary.

## 8. Practical Applications

Explain relevant engineering and real-world applications.

For important applications, explain how the concept is actually used.
Avoid simply listing application names.

## 9. Solved Examples and Numericals

First determine whether the topic genuinely involves calculations.

If meaningful numerical applications exist, provide 2–3 useful solved examples.

Do not force irrelevant numericals into theoretical topics.

FOR EACH NUMERICAL USE THIS FORMAT:

### Numerical 1: Question

Write the complete question clearly.

**Step 1: Understand the Question**
Explain what information is given and what needs to be calculated.

**Step 2: Given Data**
List every given value with its correct symbol and unit.

**Step 3: Required**
Mention the unknown quantity.

**Step 4: Concept Used**
Explain the concept and why it applies.

**Step 5: Formula**
Write the correct formula using LaTeX.
Explain its symbols and units.

**Step 6: Substitution**
Place the given values into the formula.

**Step 7: Detailed Calculation**
Solve one mathematical step at a time.
Show important intermediate calculations.
Explain unit conversions wherever necessary.

**Step 8: Final Answer**
Highlight the final answer with the correct unit.

**Step 9: Understand the Result**
Explain what the answer means in the original question.

Numerical quality rules:
- Verify arithmetic carefully.
- Verify dimensions and units.
- Never use inconsistent units.
- Do not skip important calculation steps.
- Never give an unexplained final answer.
- Never invent numerical data or formulas.

If the topic has no meaningful numerical application, provide relevant conceptual worked examples instead.

==================================================
10. IMPORTANT UNIVERSITY EXAM QUESTIONS
==================================================

Provide 5–6 important, non-repetitive and relevant university examination questions.

Cover different important areas of the topic.
Do not create duplicate questions just to reach the target.

Every answer must be sufficiently detailed for a descriptive B.Tech university examination.

MANDATORY ANSWER FORMAT:

### Q1. Write the question clearly.

**Introduction:**
Start with a meaningful introductory paragraph.
Define the concept and explain its importance.

**Detailed Explanation:**
Explain the concept through connected paragraphs.
Explain WHY and HOW, not only WHAT.

**Important Points / Working / Characteristics:**
Use numbered points wherever appropriate.
Explain every important point properly.

**Example:**
Include a relevant example wherever useful.

**Diagram / Formula / Comparison:**
Include a relevant diagram, formula or comparison table when required.
Explain it properly.

**Advantages and Limitations:**
Include these only when relevant.

**Conclusion:**
End with a short and meaningful conclusion.

Additional rules:
- Use paragraphs and numbered points together.
- Keep answers logically connected.
- Avoid extremely short answers.
- Avoid unnecessary repetition.
- Use comparison tables for difference-based questions.
- Explain comparisons instead of listing unexplained words.
- Make answers suitable for university theory examinations.
- Never claim a question is from a previous-year paper unless verified PYQ information is provided.

==================================================
11. QUICK REVISION
==================================================

Summarise the most important:
- Concepts.
- Definitions.
- Formulas.
- Facts.
- Important differences.

Use short but meaningful points.
Do not introduce new concepts here.

==================================================
12. MIND FRESH BREAK 😂
==================================================

At the absolute end of the complete notes, provide EXACTLY TWO funny, general, light-hearted jokes.

The jokes must NOT be related to:
- Studies or engineering.
- Subjects or chapters.
- Teachers or professors.
- Exams or marks.
- Homework or assignments.
- Formulas or numericals.
- College or classrooms.

Use everyday situations such as sleep, food, friends, shopping, mobile phones, family conversations or funny misunderstandings.

Use this exact format:

### Joke 1
[First original general funny joke] 😂

### Joke 2
[Second original general funny joke] 😂

JOKE RULES:
1. Exactly TWO jokes.
2. Both must be clean and student-friendly.
3. Both must have different setups and punchlines.
4. Do not repeat previously used jokes.
5. Generate fresh jokes on every regeneration.
6. Do not add any text after Joke 2.

${previousJokesInstruction}

==================================================
FINAL QUALITY CHECK
==================================================

Before responding, silently verify:
1. Are all important subtopics covered?
2. Can a beginner understand the explanations?
3. Are paragraphs and numbered points balanced?
4. Are formulas correct and symbols explained?
5. Are numerical calculations fully explained?
6. Are exam answers sufficiently detailed?
7. Are examples relevant?
8. Are diagrams explained properly?
9. Are there exactly two general jokes?
10. Are the jokes unrelated to studies?
11. Are all headings in English?
12. Is there unnecessary repetition?
13. Is Markdown properly formatted?
14. Are mathematical expressions valid LaTeX?

Return only the complete study notes in properly formatted Markdown.
Do not include an introductory message outside the notes.
Do not mention these instructions.
`;

    // 7. Models and fallback strategy
    // Primary model is tried first.
    // Fallback models are used only for temporary server errors.
    const models = [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
    ];

    let lastError: unknown;

    for (const model of models) {
      try {
        console.log(`Starting notes generation with ${model}`);

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            maxOutputTokens: 10000,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
          },
        });

        const notes = response.text?.trim();

        if (!notes) {
          throw new Error("Gemini returned an empty response.");
        }

        console.log(`Notes generated successfully using ${model}`);

        return NextResponse.json({
          notes,
          model,
          language,
        });
      } catch (error) {
        lastError = error;

        // Do not waste time trying other models for non-temporary errors.
        if (!isTemporaryError(error)) {
          throw error;
        }

        console.warn(
          `${model} temporarily unavailable. Status: ${getErrorStatus(error)}`
        );
      }
    }

    throw lastError ?? new Error("All Gemini models failed.");
  } catch (error) {
    console.error("Gemini notes generation error:", error);

    const status = getErrorStatus(error);

    if ([500, 503, 504].includes(status)) {
      return NextResponse.json(
        {
          error:
            "Gemini models are temporarily busy. Please wait a little and try again.",
        },
        { status: 503 }
      );
    }

    if (status === 429) {
      return NextResponse.json(
        {
          error:
            "Gemini API rate limit or quota reached. Please check your Google AI Studio usage limits.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Notes generate nahi ho paye. Please check the terminal error and try again.",
      },
      { status: 500 }
    );
  }
}
