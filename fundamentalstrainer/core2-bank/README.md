# Core 2 Question Bank Workflow

The live quiz app loads:

```text
fundamentalstrainer/core2-questions.json
```

Do not manually replace the old general bank:

```text
fundamentalstrainer/questions.json
```

That file is preserved for the older larger question set.

## Source files

Add new Core 2 questions to the split source files:

```text
fundamentalstrainer/core2-bank/1-operating-systems.json
fundamentalstrainer/core2-bank/2-security.json
fundamentalstrainer/core2-bank/3-software-troubleshooting.json
fundamentalstrainer/core2-bank/4-operational-procedures.json
```

Each question must use this shape:

```json
{
  "exam": "core-2",
  "objective": "1.0 Operating Systems",
  "category": "windows-tools",
  "difficulty": "easy",
  "question": "Question text here?",
  "answer": "Correct answer",
  "options": [
    "Correct answer",
    "Wrong option",
    "Wrong option",
    "Wrong option"
  ],
  "note": "Short explanation of why the answer is correct."
}
```

The `answer` value must exactly match one value in `options`.

## Build the live bank

After editing any source file, run this from the `fundamentalstrainer` folder:

```bash
node build-core2-bank.mjs
```

That regenerates:

```text
fundamentalstrainer/core2-questions.json
```

Then commit both the changed source file and the regenerated `core2-questions.json`.

## Suggested objective names

Use these objective strings exactly so the app filter stays clean:

```text
1.0 Operating Systems
2.0 Security
3.0 Software Troubleshooting
4.0 Operational Procedures
```
