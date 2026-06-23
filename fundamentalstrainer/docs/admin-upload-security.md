# Admin Upload and Import Security Boundary

## Public learner boundary

The public portfolio version of Fundamentalstrainer must remain read-only for platform content.

Public learners may:

- view learning content
- search knowledge objects
- generate practice assessments
- save local browser progress
- save local browser assessment history

Public learners must not be able to:

- upload transcripts, videos, notes, or files into the real knowledge base
- create or modify knowledge objects
- write directly to repository files
- trigger trusted merge/write jobs
- access raw imported source material
- access private source provenance records

## Admin-only import boundary

Any future upload or import workflow belongs behind an authenticated admin/backend boundary. The public static site should not expose upload controls that write to trusted content.

A safe import workflow should use this model:

```text
Authenticated admin
  -> upload validation
  -> content scanning
  -> candidate extraction
  -> duplicate detection
  -> human review
  -> merge plan
  -> dry run
  -> controlled write or pull request
  -> validation
```

## Required backend controls

A production upload/import system should include:

- authentication
- authorization
- file type allowlists
- file size limits
- rate limiting
- malware/content scanning where practical
- audit logs
- review status tracking
- dry-run support before writes
- controlled write or pull request flow
- validation before merge

## Source provenance policy

Public-facing content should use generic source wording, such as:

- reviewed source material
- imported study material
- training source reference
- transcript reference

Avoid exposing exact third-party source names, course names, video titles, raw transcript text, or provider-specific labels in the public learner UI unless the material is owned, licensed, or explicitly approved for that use.

Specific provenance can be kept in private/admin-only records when needed for review and audit purposes.

## Public UI rule

The public learner UI must not render fields that expose source provenance, including:

- `sources.transcripts`
- `sources.videos`
- raw transcript filenames
- provider names
- video titles
- private review notes that identify source material

Learner-facing pages should show quality and review status only. Source provenance belongs in private/admin tooling.

## Repository cleanup rule

Before treating the public repository as polished portfolio material, remove or generalize source-specific provenance inside public JSON content files. Existing sample content may still contain legacy provenance metadata from early development, but the learner UI should not expose it.

Preferred public JSON shape:

```json
"sources": {
  "references": []
}
```

Private/admin records may keep detailed provenance separately.

## Current implementation note

The current static portfolio app should continue to treat `content/` as read-only learner content. Import tooling may exist for local development, but it should not become a public upload feature without the backend controls described above.
