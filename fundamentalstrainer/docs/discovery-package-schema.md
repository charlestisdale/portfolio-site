# Discovery Package Schema

Discovery Packages are the raw research layer between transcripts and Knowledge Objects.

They are not final Knowledge Objects.

They capture what the source lesson actually taught: concepts, evidence, relationships, definitions, examples, comparisons, procedures, rejected mentions, and uncertainty notes.

Pipeline:

Transcript -> Discovery Package -> Human Review -> Knowledge Builder -> Canonical Knowledge Object

Required fields:

- schemaVersion
- certificationId
- lessonId
- lessonTitle
- sourceTranscript
- concepts
- evidence
- relationships
- definitions
- examples
- comparisons
- procedures
- rejectedMentions
- importNotes

Concept records should include discoveryId, name, proposedKnowledgeId, type, domains, aliases, confidence, evidenceIds, and notes.

Evidence records should include evidenceId, quote, type, supports, and notes.

Relationship records should include relationshipId, sourceDiscoveryId, targetDiscoveryId, type, evidenceIds, reason, and confidence.

Rules:

Every concept must link to evidence.

Every relationship must link to evidence.

Discovery should not include polished explanations, quizzes, flashcards, PBQs, or study guides.

Discovery captures facts. The Knowledge Builder authors learning content later.
