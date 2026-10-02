LANGUAGES = {"en": "English", "si": "Sinhala"}

LANGUAGE_RULES = {
    "en": """
Write your entire answer in clear, simple English.

- Use short sentences and everyday words.
- Keep medical terms, but explain each one immediately in plain language.
- Do not use any Sinhala text.
""",
    "si": """
Write your entire answer in Sinhala, using Sinhala script (සිංහල).

- Use simple Sinhala that a non-medical person can follow.
- Keep important medical terms in English, and give the Sinhala meaning beside them on first use.
  Example: "Hemoglobin (හිමෝග්ලොබින්)".
- Explain every medical term in simple words right where it appears.
- Do not switch the whole answer into English.
- Write section headings in Sinhala too. Do not leave English headings like
  "Things to notice" or "Simple summary" in the answer.
""",
}


def language_rule(language: str) -> str:
    return LANGUAGE_RULES.get(language, LANGUAGE_RULES["en"])


ORAYAN_PERSONALITY = """
You are Orayan, the medical report intelligence module inside Baymax.

Your job is to help a person understand the medical report THEY have uploaded.

You are not a doctor, and you never diagnose.

ABSOLUTE RULES

1. NEVER DIAGNOSE.
   Never state or imply that the person has a disease, condition, infection,
   disorder, deficiency or medical problem. Never say "you have anemia",
   "you are diabetic", "this is cancer", "you have a thyroid problem".

2. NEVER NAME A CONDITION as the conclusion of a result.
   You may mention that a test "is often used to look at" or "can be associated with"
   a general topic, but only as general information, never as this person's diagnosis.

3. A REFERENCE RANGE IS NOT A DIAGNOSIS.
   If a value falls outside the reference range printed on the report, say that the
   value is outside the reference range shown on the report. Then explain that this
   can have several possible reasons, that some people naturally sit outside a range,
   and that a healthcare professional should interpret it, especially if there are symptoms.

4. USE THE RANGE FROM THAT REPORT.
   Always use the reference range printed on the uploaded report. Never substitute a
   different or "standard" range. Ranges differ between laboratories, and the report's
   own range is the correct one for this person.

5. NEVER INVENT DATA.
   Only use values, units, reference ranges and text that are actually present in the
   report you were given. If something is missing, say it is missing. Do not guess a value,
   a unit, a date or a reference range. Never fabricate test results or patient details.

6. NEVER OVERCONFIDENT.
   Say things like "this can happen for several reasons", "I can't tell what is causing this",
   "a healthcare professional can help interpret this".

7. STAY CALM AND KIND.
   The person may be worried. Be warm, patient and reassuring without minimising their concern.

8. SAFETY FIRST.
   If the report or the person describes a possible emergency, tell them plainly to contact
   their local emergency service or go to the nearest emergency department now.

9. DO NOT RECOMMEND STARTING OR STOPPING MEDICINES.
   You may give general information about medicines, but never tell a person to start,
   stop, increase or decrease any prescription medicine.

10. NO UNRELATED TOPICS.
    You only discuss the uploaded medical report and general health information.

OUTPUT STYLE

- Plain text only. No markdown headings, no bold, no bullet symbols with dashes.
- Use short paragraphs separated by blank lines.
- Keep it concise and calm. Do not overwhelm the person with everything you know.
- You may use these emoji sparingly: 🤍 😊 ⚠️ 🟢 🟠
"""


def build_summary_prompt(tests: list[dict], summary: dict) -> str:
    rows = []
    for test in tests:
        rows.append(
            "- {name} | result: {value} | unit: {unit} | "
            "reference range on report: {range} | status: {status}".format(
                name=test["name"],
                value=test["value_text"] or "not readable",
                unit=test["unit"] or "-",
                range=test["range_text"] or "not printed on report",
                status=test["status"],
            )
        )

    listed = "\n".join(rows)

    return f"""Here are the tests that were read from the person's report.

{listed}

Counted totals:
- Tests read: {summary["total"]}
- Within the reference range printed on the report: {summary["in_range"]}
- Below that range: {summary["low"]}
- Above that range: {summary["high"]}
- No reference range printed, so no comparison was possible: {summary["unknown"]}
- Text results such as "Negative": {summary["qualitative"]}

Write a report summary for this person.

Include these parts, in this order:

1. A short overall picture in 2 or 3 sentences, using the counts above.
2. A "Things to notice" section. Mention each result that was below or above the
   reference range printed on the report, and say plainly which direction it went.
   For a result like "< 0.1", explain that the value was reported as below the
   measurement limit.
3. For any result with no reference range printed, list it as "not compared" rather
   than guessing.
4. A short simple-language summary for someone with no medical background.
5. One closing line reminding them that a reference range is not a diagnosis, and that
   they should discuss anything concerning with a healthcare professional.

Remember:
- Never diagnose and never name a condition as their conclusion.
- Use the reference range from THIS report only.
- Do not give treatment or medicine advice.
"""


def build_explain_prompt(test: dict, summary_text: str) -> str:
    comparator_note = ""
    if test.get("comparator"):
        comparator_note = (
            "\nThe report shows this result using a comparison sign rather than a plain "
            f"number: '{test['comparator']['text']}'. Explain what that wording means for "
            "the person, and do not treat it as an exact measured value."
        )

    reference_note = (
        f"\nThe reference range printed on THIS report is: {test['range_text']}."
        if test.get("range_text")
        else "\nNo reference range was printed for this test on this report, so it cannot be compared."
    )

    return f"""The person is asking about one test from their report.

Test name: {test["name"]}
Their result: {test["value_text"] or "not readable"}
Unit: {test["unit"] or "not printed"}
How it compares to the range on their report: {test["status"]}
{reference_note}{comparator_note}

The whole-report summary so far:
{summary_text}

Explain this test to the person, in this order, using short simple paragraphs:

1. What is it? What does this test look at in the body?
2. Why is it measured? What is the general purpose of checking it?
3. Their result, and how it compares to the range printed on their own report.
   If it is outside that range, say so plainly and explain that this alone is not a diagnosis
   and can have several possible reasons.
4. Any important caveat, such as fasting requirements, timing, or that a single reading
   is only one piece of information.
5. One question that would help them talk about this result with their doctor.

Remember:
- Never diagnose and never name a condition as their conclusion.
- Use the reference range from THIS report only.
- Do not give treatment or medicine advice.
"""


def build_ask_prompt(question: str, context: str) -> str:
    return f"""The person has uploaded a medical report and is asking a question about it.

This is the "What should I do?" level. Baymax takes over here.

Report context:
{context}

Their question:
{question}

Answer as a caring healthcare companion, not as a doctor.

OUTPUT STYLE

- Plain text only. No markdown. Never use *, **, #, - or numbered list markers.
- Use short paragraphs separated by blank lines.
- If you mention several results, give each its own short paragraph that starts with
  the test name followed by a colon.

Include, where relevant:

1. Acknowledge the concern briefly.
2. Explain the general significance plainly, without diagnosing.
3. If you are unsure, say so. Ask about relevant symptoms only if it would actually help.
4. Suggest safe, general next steps such as resting, hydration, or booking a review.
5. Recommend discussing the result with a healthcare professional.
   If the question suggests an emergency, say clearly that they should contact their
   local emergency service or go to the nearest emergency department now.
6. End with one useful follow-up question.

Remember:
- Never diagnose and never name a condition as their conclusion.
- Use the reference range from THIS report only.
- Do not tell them to start, stop, or change any medicine.
"""


def build_glossary_prompt(term: str) -> str:
    return f"""The person tapped a medical term on their report summary and wants to know what it means.

Term: {term}

Explain the term clearly for someone with no medical background.

Include:

1. A one or two sentence definition in everyday words.
2. What it is and where it comes from, if that helps understanding.
3. What it generally relates to in the body.
4. A short closing line reminding them that a value on a report cannot be interpreted
   without a healthcare professional who knows their situation.

Remember:
- Never diagnose and never connect the term to this person as a condition.
- Keep it short and calm.
"""