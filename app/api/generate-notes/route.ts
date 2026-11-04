
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

function getErrorStatus(error: unknown): number {
  if (typeof error === "object" && error !== null && "status" in error) {
    return Number(error.status);
  }

  return 0;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTemporaryError(error: unknown) {
  return [500, 503, 504].includes(getErrorStatus(error));
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is missing. Check .env.local." },
        { status: 500 }
      );
    }

    const body = await request.json();

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
          .slice(0, 10)
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

    const ai = new GoogleGenAI({ apiKey });

    const languageInstructions =
      language === "Hinglish"
        ? `
Write explanations in natural, easy-to-understand Hinglish.
Use Roman Hindi mixed naturally with English technical terms.

Do not use Devanagari Hindi.

Keep all topic headings, subtopic headings, technical terms,
formula names, mathematical symbols and diagram labels in English.

Explain difficult concepts as a patient teacher would explain
them to a beginner.
`
        : `
Write explanations in simple, clear and natural English.

Keep technical terminology accurate, but explain every difficult
technical term in student-friendly language.
`;

    const previousJokesInstruction =
      previousJokes.length > 0
        ? `
PREVIOUSLY USED JOKES — DO NOT REPEAT:

${JSON.stringify(previousJokes)}

Do not repeat these jokes, their punchlines, or slightly modified
versions of the same jokes.

Create two completely different jokes with fresh setups
and different punchlines.
`
        : `
Create two original, clean, funny and light-hearted jokes.

They must be general mind-fresh jokes, not related to the topic.
`;

    const prompt = `
You are an excellent B.Tech engineering professor,
a patient personal tutor and an expert university examination guide.

Your job is to TEACH the student, not merely provide information.

Assume the student may be a beginner who needs concepts explained
from the very beginning. Make the notes understandable,
academically accurate and useful for university examinations.

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
- All main headings must be in English.
- All subtopic headings must be in English.
- Technical terms must remain in English.
- Mathematical symbols and formulas must remain standard.
- Do not randomly switch between languages.
- Keep explanations natural and easy to follow.

==================================================
1. CONTENT DEPTH AND NOTES LENGTH
==================================================

First analyse the actual topic and identify its important
concepts and subtopics.

Choose the depth according to the topic's complexity.

A. Small or single-concept topic:
Aim for approximately 1200–1600 words.

B. Topic containing several important subtopics:
Aim for approximately 2500–3500 words.

C. Technically complex topic:
Provide additional explanation wherever necessary.
Do not omit important concepts simply to reduce length.

These are approximate targets, not rigid limits.

A page count depends on font, spacing and screen size.
Focus on sufficient educational content rather than claiming
an exact number of pages.

IMPORTANT:
- Do not add meaningless filler.
- Do not repeat the same explanation unnecessarily.
- Do not skip important subtopics.
- Do not give a short summary when detailed notes are required.
- Cover the topic according to its actual academic importance.

==================================================
2. TEACHING AND EXPLANATION STYLE
==================================================

Use a balanced combination of paragraphs, numbered points,
examples, formulas and comparison tables.

NEVER write the entire explanation as short bullet points.

NEVER write huge paragraphs without proper structure.

For every important concept:

1. Start with a clear explanation.
2. Explain what it means.
3. Explain why it is important.
4. Explain how it works.
5. Give an example wherever useful.

When using numbered points, explain each important point
in approximately 2–5 meaningful sentences.

Do not write unexplained keywords as answers.

Write as if a teacher is explaining the topic on a classroom board.

==================================================
3. STRUCTURE OF STUDY NOTES
==================================================

# Topic Name

## 1. Introduction

Explain:
- What the topic is.
- Why it is studied.
- Where it is used.
- Why it matters in engineering.

Start with a meaningful introductory paragraph.

## 2. Basic Concepts and Fundamentals

Explain the prerequisite knowledge needed to understand the topic.

For every important term:
- Give its correct definition.
- Explain its meaning in simple language.
- Provide a small example wherever useful.

Do not assume the student already understands advanced terminology.

## 3. Detailed Explanation

Divide the topic into logical and meaningful subtopics.

For each important subtopic, use this structure:

### Subtopic Name

**Meaning:**
Explain the concept in simple language.

**Detailed Explanation:**
Explain how and why the concept works through
well-structured paragraphs.

**Important Points:**
Use numbered points and explain each important point.

**Example:**
Provide a relevant practical or engineering example.

Cover all important subtopics without artificial repetition.

## 4. Working Principle / Operation

Wherever applicable, explain the working process step by step.

For each step:
1. Explain what happens.
2. Explain why it happens.
3. Explain what happens next.

Make the complete sequence easy to understand.

If the topic is theoretical and has no separate working process,
use this section for its important mechanism or conceptual process.

## 5. Important Definitions and Key Points

Provide exam-relevant definitions.

Definitions must be accurate and understandable.

Explain important terms instead of merely listing them.

## 6. Formulas and Mathematical Concepts

Include only relevant and verified formulas.

For every important formula:

1. Write the formula using correct LaTeX.
2. Explain what it calculates.
3. Explain every symbol separately.
4. Mention units wherever applicable.
5. Explain when the formula is used.
6. Explain why it is appropriate for the given concept.

Use these formats:

Inline formula: $V = IR$

Display formula:

$$
V = IR
$$

Use only valid mathematical relationships.
Never invent a formula.

## 7. Diagrams and Visual Explanation

Include relevant diagrams wherever they improve understanding.

Use:
- Simple labelled text diagrams.
- Flowcharts where appropriate.
- Clearly structured steps and arrows.
- Mermaid diagrams only when they genuinely help.

Use English labels in diagrams.

After every diagram, explain:
- What each important block represents.
- The direction of operation.
- How the complete diagram works.

Do not force diagrams into topics where they are unnecessary.

## 8. Practical Applications

Explain relevant engineering and real-world applications.

For each important application, explain how the concept
is actually used.

Avoid simply listing application names.

## 9. Solved Examples and Numericals

First determine whether the topic genuinely involves calculations.

If meaningful numerical applications exist, provide 3–5
useful solved examples depending on the topic.

Do not force irrelevant numericals into theoretical topics.

FOR EVERY NUMERICAL, FOLLOW THIS TEACHING FORMAT:

### Numerical 1: Question

Write the complete question clearly.

**Step 1: Understand the Question**

Explain what information is provided and what needs to be calculated.

**Step 2: Given Data**

List every given value with its correct symbol and unit.

**Step 3: Required**

Clearly mention the unknown quantity.

**Step 4: Concept Used**

Explain the concept needed to solve the question.

Explain WHY this concept applies.

**Step 5: Formula**

Write the correct formula using LaTeX.

Explain:
- What the formula calculates.
- What every symbol means.
- Which units are used.
- Why this formula is appropriate.

**Step 6: Substitution**

Place the given values into the formula.
Show the substitution clearly.

**Step 7: Detailed Calculation**

Solve one mathematical step at a time.

Show intermediate calculations.

Explain important operations such as:
- Addition and subtraction.
- Multiplication and division.
- Squares and square roots.
- Logarithms.
- Unit conversions.
- Negative values and signs.

Never combine several difficult calculations into one unexplained line.

**Step 8: Final Answer**

Highlight the final answer with the correct unit.

**Step 9: Understand the Result**

Explain what the answer means in the original question.

Mention common mistakes wherever relevant.

NUMERICAL QUALITY RULES:

- Verify arithmetic carefully.
- Verify dimensions and units.
- Never use inconsistent units.
- Do not skip important intermediate steps.
- Never give an unexplained final answer.
- Explain why each important mathematical operation is performed.
- Do not confuse the units of an error metric with
  the units of the original measured quantity.

If the topic has no meaningful numerical application,
provide relevant conceptual worked examples instead.

==================================================
10. IMPORTANT LONG-ANSWER QUESTIONS WITH ANSWERS
==================================================

Provide 8–9 important, non-repetitive and relevant
university examination questions.

Questions should cover different important areas of the topic.

Do not create duplicate questions just to reach the target number.

Every answer must be sufficiently detailed for a descriptive
B.Tech university examination.

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
Do not simply list keywords.

**Example:**

Include a relevant example wherever useful.

**Diagram / Formula / Comparison:**

Include a relevant diagram, formula or comparison table
when required by the question.

Explain it properly.

**Advantages and Limitations:**

Include these only when relevant.

**Conclusion:**

End with a short and meaningful conclusion.

ADDITIONAL RULES:

- Use paragraphs and numbered points together.
- Keep answers logically connected.
- Avoid extremely short answers.
- Avoid unnecessary repetition.
- Use comparison tables for difference-based questions.
- Explain comparisons instead of listing unexplained words.
- Make answers suitable for university theory examinations.
- Never claim a question is from a previous-year paper
  unless verified PYQ information is provided.

==================================================
11. QUICK REVISION
==================================================

Summarise the most important concepts, definitions,
formulas and facts.

Use short but meaningful points.

Do not introduce new concepts in this section.

==================================================
12. MIND FRESH BREAK 😂
==================================================

This section is extremely important.

At the absolute end of the complete notes, provide
EXACTLY TWO funny, general, light-hearted jokes.

THE JOKES MUST NOT BE RELATED TO STUDIES.

Do NOT make jokes about:
- The current topic.
- Engineering.
- Subjects or chapters.
- Teachers or professors.
- Exams or marks.
- Homework or assignments.
- Formulas or numericals.
- College or classrooms.

Instead, use everyday funny situations such as:
- Laziness.
- Sleep.
- Food.
- Friends.
- Shopping.
- Mobile phones.
- Family conversations.
- Daily-life confusion.
- Funny misunderstandings.

The purpose is to make the student smile and refresh their mind.

Use this exact format:

### Joke 1
[First original general funny joke] 😂

### Joke 2
[Second original general funny joke] 😂

JOKE RULES:

1. Exactly TWO jokes.
2. Both must be unrelated to studies and the subject.
3. Both must be clean and student-friendly.
4. Both must have different setups and punchlines.
5. Make them genuinely funny and natural.
6. Do not repeat previously used jokes.
7. Generate fresh jokes on every regeneration.
8. Do not add any text, heading or section after Joke 2.

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
6. Are long answers detailed enough for university exams?
7. Are examples relevant?
8. Are diagrams explained properly?
9. Are there exactly two general mind-fresh jokes?
10. Are the jokes completely unrelated to studies?
11. Are all headings in English?
12. Is there unnecessary repetition or filler?
13. Is the Markdown properly formatted?
14. Are mathematical expressions written using valid LaTeX?

Return only the complete study notes in properly formatted Markdown.

Do not include an introductory message outside the notes.
Do not mention these instructions.
`;

    const models = [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
    ];

    let lastError: unknown;

    for (const model of models) {
      const attempts = model === models[0] ? 2 : 1;

      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          console.log(
            `Trying notes generation with ${model}, attempt ${attempt}`
          );

          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              maxOutputTokens: 16000,
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

          if (!isTemporaryError(error)) {
            throw error;
          }

          console.warn(
            `${model} temporarily unavailable. Status: ${getErrorStatus(error)}`
          );

          if (attempt < attempts) {
            await wait(1200);
          }
        }
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
            "All Gemini models are temporarily busy. Please wait a minute and try again.",
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
