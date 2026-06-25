# Transcript Intelligence

Transcript Intelligence is the first AI analysis stage in the ingestion pipeline.

It turns instructional source evidence into a reviewable curriculum-discovery package. It does not create final Knowledge Objects.

## Pipeline position

```text
Transcript
↓
Evidence
↓
Transcript Intelligence
↓
Discovery Review
↓
Knowledge Author
↓
Draft Knowledge Objects
↓
Promotion Review
↓
Canonical Knowledge Objects
```

## Purpose

Transcript Intelligence answers:

```text
What concepts are present?
Which concepts deserve objects?
Which concepts should merge?
Which concepts are only mentioned?
Which prerequisites are assumed?
Where do concepts belong in the curriculum?
What gaps does the lesson reveal?
```

## Output

A Transcript Intelligence package should include discovered concepts, classifications, evidence, confidence metadata, enrichment needs, curriculum placement suggestions, relationship suggestions, merge recommendations, knowledge gaps, rejected mentions, and authoring guidance.

## Confidence metadata

Use separate review signals instead of one generic confidence value:

```text
topicConfidence
evidenceStrength
enrichmentLevel
reviewPriority
```

## Basis labels

Use these basis labels when possible:

```text
source-supported
ai-inference
general-it-knowledge
common-practice
exam-knowledge
```

## Candidate classifications

```text
teachable
merge-existing
mentioned-only
ignore
needs-enrichment
```

## Permanent rule

Transcript Intelligence decides what deserves authoring. Knowledge Authoring writes draft Knowledge Objects only after that decision is made.
