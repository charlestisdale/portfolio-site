# AI Discovery Review Prompt

You are reviewing a Transcript Intelligence discovery package for a knowledge-first IT learning platform.

You are not generating Transcript Intelligence from scratch. You are not writing Knowledge Objects. You are not recreating the original JSON. Your job is to review the discovered concepts and decide what should happen next.

## Input Metadata
- inputKind: discovery-manifest
- inputFile: data/imports/manifests/02-file-systems-discovery-manifest.md
- lessonId: 02
- lessonTitle: File Systems

## Your Role
Act as a curriculum reviewer and knowledge-base gatekeeper.

For each discovered concept, decide whether it should be:

- accepted for Knowledge Authoring
- merged into an existing or proposed concept
- rejected
- deferred
- sent for enrichment before authoring

You should also review knowledge gaps, curriculum placement, relationship suggestions, duplicate risks, and rejected mentions.

## Critical Rules
- Return JSON only. Do not wrap the JSON in markdown.
- Do not recreate the Transcript Intelligence JSON.
- Do not write Knowledge Objects.
- Do not invent missing source evidence.
- Use the manifest/package as the review input.
- Preserve concept IDs and proposedKnowledgeIds when making decisions.
- Be willing to reject or merge concepts that are too broad, too thin, duplicative, or better handled as part of another concept.
- Prefer fewer, stronger Knowledge Authoring targets over many weak objects.
- Mark uncertainty clearly.

## Decision Values
Use one of these values for each concept:

- accept-for-authoring
- merge
- reject
- defer
- needs-enrichment

## Required Output Shape
{
  "schemaVersion": "discovery-review.v1",
  "lessonId": "02",
  "lessonTitle": "File Systems",
  "sourceReviewInput": "data/imports/manifests/02-file-systems-discovery-manifest.md",
  "reviewSummary": {
    "acceptedForAuthoring": 0,
    "merge": 0,
    "rejected": 0,
    "deferred": 0,
    "needsEnrichment": 0,
    "reviewNotes": []
  },
  "conceptDecisions": [
    {
      "conceptId": "DISC-001",
      "title": "Concept title from input",
      "proposedKnowledgeId": "domain.stable-id",
      "decision": "accept-for-authoring | merge | reject | defer | needs-enrichment",
      "targetKnowledgeId": "required when decision is merge, otherwise optional",
      "authoringPriority": "high | normal | low | none",
      "recommendedDepth": "brief | normal | deep | none",
      "reason": "Explain the review decision.",
      "mustCover": [],
      "avoidAuthoringAsStandalone": false,
      "duplicateRisk": "none | low | medium | high",
      "curriculumDecision": {
        "status": "accept | change | reject | defer",
        "curriculumId": "a-plus-220-1202",
        "sectionId": "1.0",
        "moduleId": "module-id",
        "reason": "Explain curriculum decision."
      },
      "relationshipDecision": {
        "status": "accept-some | accept-all | reject-all | defer",
        "accepted": [],
        "rejected": [],
        "notes": []
      },
      "reviewFlags": []
    }
  ],
  "mergePlan": [
    {
      "sourceConceptId": "DISC-000",
      "sourceKnowledgeId": "domain.source-id",
      "targetKnowledgeId": "domain.target-id",
      "reason": "Why this should merge.",
      "preserveAuthoringGuidance": true
    }
  ],
  "authoringQueue": [
    {
      "conceptId": "DISC-000",
      "proposedKnowledgeId": "domain.stable-id",
      "title": "Concept title",
      "priority": "high | normal | low",
      "recommendedDepth": "brief | normal | deep",
      "reason": "Why this should go to Knowledge Author next."
    }
  ],
  "enrichmentQueue": [
    {
      "conceptId": "DISC-000",
      "proposedKnowledgeId": "domain.stable-id",
      "title": "Concept title",
      "neededEvidenceOrContext": [],
      "reason": "Why enrichment is needed before authoring."
    }
  ],
  "rejectedConcepts": [
    {
      "conceptId": "DISC-000",
      "proposedKnowledgeId": "domain.stable-id",
      "title": "Concept title",
      "reason": "Why this should not move forward."
    }
  ],
  "gapReview": [
    {
      "gapId": "GAP-001",
      "decision": "accept | reject | defer | convert-to-authoring-target",
      "relatedConceptIds": [],
      "reason": "Review decision for this gap.",
      "recommendedAction": "What should happen next."
    }
  ],
  "globalReviewNotes": []
}

## Review Input
# Discovery Manifest: File Systems

This manifest is a review view of a Transcript Intelligence package. It is not canonical knowledge and it is not a draft Knowledge Object export.

## Package Summary

- Source file: `data/imports/pending/02-transcript-intelligence.json`
- Source transcript: `data/transcripts/cleaned/a-plus-220-1202/02-File Systems.txt`
- Schema: `pending-transcript-intelligence.v1`
- Certification: `a-plus-220-1202`
- Lesson: `02`
- Concepts discovered: 12
- Knowledge gaps: 4
- Merge recommendations: 2
- Rejected mentions: 5

## Classification Counts

- needs-enrichment: 2
- teachable: 10

## Review Attention

- High-priority concepts: 2
- Weak evidence + high enrichment concepts: 0
- Concepts with merge recommendations: 2

### High-Priority Concepts

- DISC-011: File-System Journaling (filesystems.journaling)
- DISC-012: File-System Snapshots (filesystems.snapshots)

## Concepts for Discovery Review

### DISC-001: File System

- Proposed ID: `filesystems.file-system`
- Classification: `teachable`
- Type: `file-system`
- Domains: filesystems, operating-systems
- Teaching value: high
- Topic confidence: 0.97
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- That formatting determines what file system you will use for that specific partition. — The lesson defines the file system as the formatting choice for a partition.
- This file system is important because this is the structure that will be used for all data that is read and written by this operating system. — Shows purpose and OS relationship.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — This is the central concept of the File Systems lesson.

#### Merge Review
- No merge recommendation.

#### Relationships
- depends_on: storage.partitions — A file system is applied to a partition before data storage.
- related_to: operatingsystems.operating-system-basics — Different operating systems commonly use different file systems.

#### Authoring Guidance
- Must cover: Define file systems as data structures used by an OS to read and write files.
- Must cover: Explain formatting a partition as the step that applies a file system.
- Must cover: Compare file-system compatibility across operating systems.
- Nice to cover: Mention common examples: NTFS, FAT32, exFAT, ext4, XFS, APFS, ReFS.

### DISC-002: Partition Formatting

- Proposed ID: `storage.partition-formatting`
- Classification: `teachable`
- Type: `concept`
- Domains: storage, filesystems
- Teaching value: high
- Topic confidence: 0.95
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Before you can store data into that partition, you first must format the partition. — Provides procedure context and prerequisite relationship.
- That formatting determines what file system you will use for that specific partition. — Connects formatting to file-system selection.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: filesystems.file-system — Formatting selects and applies the file system used for storage.

#### Authoring Guidance
- Must cover: Explain that formatting prepares a partition for storing data.
- Must cover: Cover that formatting determines the file system on that partition.
- Nice to cover: Distinguish partition creation from formatting.

### DISC-003: Cross-Platform File-System Compatibility

- Proposed ID: `filesystems.cross-platform-compatibility`
- Classification: `teachable`
- Type: `concept`
- Domains: filesystems, operating-systems
- Teaching value: high
- Topic confidence: 0.93
- Evidence strength: strong
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- There are some file systems that can be used across multiple operating systems. — Introduces cross-platform file-system use.
- FAT32, NTFS, and XFAT are examples of file systems that are compatible across Windows, Linux, and Mac OS. — Names examples and OS compatibility.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

#### Merge Review
- filesystems.file-system-compatibility — If a general compatibility object already exists, merge this cross-platform compatibility discovery rather than creating a duplicate.

#### Relationships
- related_to: filesystems.fat32 — FAT32 is given as a cross-platform example.
- related_to: filesystems.exfat — exFAT is emphasized for removable cross-platform storage.
- related_to: filesystems.ntfs — NTFS is described as broadly readable and sometimes writable across OSs.

#### Authoring Guidance
- Must cover: Explain why compatibility matters when moving storage between systems.
- Must cover: Compare read support vs write support at a high level.
- Nice to cover: Use removable USB storage as a practical example.
- Note: Verify current macOS/Linux NTFS write-support wording during authoring.

### DISC-004: NTFS

- Proposed ID: `filesystems.ntfs`
- Classification: `teachable`
- Type: `file-system`
- Domains: filesystems, windows
- Teaching value: high
- Topic confidence: 0.96
- Evidence strength: strong
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- If you're using Windows, then the file system that you're probably using is the NTFS or NT file system. — Identifies NTFS as a common Windows file system.
- There were a number of new features added within TFS, including things like compression, file encryption. You have quotas, and other management features built into the file system itself. — Lists feature areas that justify teaching value.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: filesystems.fat32 — NTFS is described as an upgrade to FAT32.
- used_for: filesystems.file-encryption — The lesson names file encryption as an NTFS feature.
- used_for: filesystems.disk-quotas — The lesson names quotas as an NTFS management feature.

#### Authoring Guidance
- Must cover: Identify NTFS as the common Windows file system.
- Must cover: Cover NTFS features named in the source: compression, encryption, quotas, management features.
- Must cover: Contrast NTFS with FAT32 and ReFS.
- Note: Source transcript likely has a speech-to-text typo “TFS” where NTFS is intended.

### DISC-005: ReFS

- Proposed ID: `filesystems.refs`
- Classification: `teachable`
- Type: `file-system`
- Domains: filesystems, windows, server
- Teaching value: high
- Topic confidence: 0.93
- Evidence strength: strong
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Microsoft is working on the next generation of file systems with the resilient file system or REFS. — Introduces ReFS and full name.
- There is an emphasis in resiliency. This operating system is able to repair itself and it's constantly checking itself for integrity. — Provides key purpose/features.
- There's also some RAID type functionality built into RIFFS so that you can build out redundant file systems with redundant storage. — Relates ReFS to redundancy/storage resiliency.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: filesystems.ntfs — ReFS is described as an upgrade to NTFS.
- related_to: storage.raid — The source mentions RAID-type redundancy in ReFS.
- used_for: storage.data-integrity — ReFS is presented around integrity checking and resiliency.

#### Authoring Guidance
- Must cover: Define ReFS as Microsoft’s Resilient File System.
- Must cover: Cover resiliency, integrity checking, large data support, and limited adoption/support.
- Must cover: Explain relationship to NTFS and server/storage environments.
- Nice to cover: Mention Windows Server 2012 and later integration at a high level.
- Note: Review exact support limits on current Windows desktop/server versions before authoring.

### DISC-006: FAT32

- Proposed ID: `filesystems.fat32`
- Classification: `teachable`
- Type: `file-system`
- Domains: filesystems
- Teaching value: high
- Topic confidence: 0.96
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- A file system that's been around for a very long time and one that has supported many different operating systems is the file allocation table or FAT. — Introduces FAT family and compatibility.
- FAT32 allows you to have volume sizes of 2 terb with a maximum file size of 4 GB in that partition. — Gives limits that are exam-relevant.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: filesystems.exfat — exFAT is described as overcoming FAT32 file-size limitations.
- contrasts_with: filesystems.ntfs — NTFS is described as an upgrade to FAT32.

#### Authoring Guidance
- Must cover: Identify FAT32 as a widely compatible FAT-family file system.
- Must cover: Cover the source-stated 2 TB volume and 4 GB file-size limits.
- Must cover: Explain why larger modern storage often uses another file system.

### DISC-007: exFAT

- Proposed ID: `filesystems.exfat`
- Classification: `teachable`
- Type: `file-system`
- Domains: filesystems
- Teaching value: high
- Topic confidence: 0.96
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- This stands for extended file allocation table. And this was created by Microsoft specifically for flash drive storage. — Defines exFAT and primary use case.
- XFAT allows you to have files much larger than 4 GB, exceeding the maximum in FAT32. — Shows contrast with FAT32.
- You can save something on your flash drive on Windows and then take it to your Linux or Mac OS system. — Shows cross-platform removable-storage scenario.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: filesystems.fat32 — exFAT supports files larger than FAT32’s 4 GB limit.
- used_for: filesystems.cross-platform-compatibility — The source presents exFAT as useful across Windows, Linux, and macOS.

#### Authoring Guidance
- Must cover: Define exFAT as Extended File Allocation Table.
- Must cover: Cover flash-drive/removable-storage use case.
- Must cover: Contrast with FAT32 file-size limitations.
- Must cover: Cover cross-platform portability.

### DISC-008: ext4

- Proposed ID: `filesystems.ext4`
- Classification: `teachable`
- Type: `file-system`
- Domains: filesystems, linux, android
- Teaching value: medium
- Topic confidence: 0.92
- Evidence strength: medium
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Another popular file system you might run into is ext4. — Introduces ext4 as a relevant file system.
- This is the fourth version or fourth iteration of the extended file system that you would commonly find in things like Linux or Android. — Defines ext4 by lineage and OS usage.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: operatingsystems.linux — The source says ext4 is commonly found in Linux.
- used_for: operatingsystems.android — The source says Android commonly uses ext4.

#### Authoring Guidance
- Must cover: Identify ext4 as a Linux/Android file system.
- Must cover: Explain that it is the fourth iteration of the extended file system family.
- Nice to cover: Contrast with XFS for high-performance Linux/data-center use.
- Note: Source provides limited feature detail; enrichment will be needed.

### DISC-009: XFS

- Proposed ID: `filesystems.xfs`
- Classification: `teachable`
- Type: `file-system`
- Domains: filesystems, linux, server
- Teaching value: high
- Topic confidence: 0.94
- Evidence strength: strong
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- This would be the extended file system or XFS. — Introduces XFS in Linux data-center context.
- XFS supports a very large file system size so we can store massive amounts of data on these systems. — Gives scalability purpose.
- This also includes journaling which helps minimize any cases of corruption if any of this reading or writing of data happens to be interrupted. — Introduces journaling and corruption protection.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: filesystems.journaling — The source says XFS includes journaling to reduce corruption from interrupted writes.
- related_to: filesystems.fragmentation — The source links XFS with low fragmentation and performance.
- contrasts_with: filesystems.ext4 — Both are Linux file systems, but XFS is emphasized for high-performance/data-center workloads.

#### Authoring Guidance
- Must cover: Identify XFS as a Linux file system for high-performance or large data workloads.
- Must cover: Cover large file-system support, journaling, and low fragmentation.
- Must cover: Relate XFS to data-center use cases.

### DISC-010: APFS

- Proposed ID: `filesystems.apfs`
- Classification: `teachable`
- Type: `file-system`
- Domains: filesystems, macos, ios
- Teaching value: high
- Topic confidence: 0.95
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Apple also has their own file system with the Apple file system or APFS. — Introduces APFS and full name.
- This is also a file system available in your iOS and iPad OS devices. — Shows Apple ecosystem usage.
- This file system was written to optimize data on SSDs or solidstate drives. — Gives purpose/optimization.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: hardware.ssd — APFS is optimized for SSD storage.
- used_for: filesystems.snapshots — APFS includes snapshot support according to the source.
- used_for: security.encryption — APFS includes encryption according to the source.

#### Authoring Guidance
- Must cover: Define APFS as Apple File System.
- Must cover: Cover macOS, iOS, and iPadOS association.
- Must cover: Cover SSD optimization, encryption, snapshots, and data integrity.

### DISC-011: File-System Journaling

- Proposed ID: `filesystems.journaling`
- Classification: `needs-enrichment`
- Type: `concept`
- Domains: filesystems, storage
- Teaching value: medium
- Topic confidence: 0.82
- Evidence strength: medium
- Enrichment level: medium
- Review priority: high
- Recommendation: **Defer or enrich before Knowledge Authoring.**

#### Source Evidence
- This also includes journaling which helps minimize any cases of corruption if any of this reading or writing of data happens to be interrupted. — Directly defines why journaling matters, but only in XFS context.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

#### Merge Review
- storage.data-integrity — Journaling may belong under an existing data-integrity or file-system reliability concept if one already exists.

#### Relationships
- part_of: filesystems.xfs — The source specifically identifies journaling as an XFS feature.
- used_for: storage.data-integrity — Journaling helps reduce corruption after interrupted operations.

#### Authoring Guidance
- Must cover: Define journaling as a file-system feature related to tracking changes and reducing corruption risk.
- Must cover: Connect it to XFS as the source example.
- Nice to cover: Mention that other file systems may also journal, but verify before adding.
- Note: Only briefly covered; authoring should enrich carefully without over-expanding beyond the lesson.

### DISC-012: File-System Snapshots

- Proposed ID: `filesystems.snapshots`
- Classification: `needs-enrichment`
- Type: `concept`
- Domains: filesystems, storage
- Teaching value: medium
- Topic confidence: 0.78
- Evidence strength: weak
- Enrichment level: medium
- Review priority: high
- Recommendation: **Defer or enrich before Knowledge Authoring.**

#### Source Evidence
- Has the ability to quickly save and restore from a snapshot. — Mentions snapshots as an APFS capability.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

#### Merge Review
- No merge recommendation.

#### Relationships
- part_of: filesystems.apfs — The source lists snapshots as an APFS feature.

#### Authoring Guidance
- Must cover: Explain snapshots as a restore/checkpoint capability at a high level.
- Must cover: Keep tied to APFS unless broader coverage is intended.
- Note: Source only mentions snapshots briefly; needs enrichment and review.

## Knowledge Gaps

### GAP-001: Partitioning vs formatting distinction

- Severity: medium
- Basis: ai-inference
- Related concepts: storage.partitions, storage.partition-formatting, filesystems.file-system
- Description: The lesson assumes learners understand that creating a partition and formatting it are separate storage-preparation steps.
- Recommendation: Create or link a prerequisite concept that clearly separates partition creation from formatting and file-system selection.

### GAP-002: Read support vs write support for file systems

- Severity: medium
- Basis: ai-inference
- Related concepts: filesystems.ntfs, filesystems.cross-platform-compatibility
- Description: The transcript mentions that some operating systems can read NTFS but may not write to it, but it does not fully explain read-only vs read-write compatibility.
- Recommendation: Add enrichment explaining read-only versus read-write support when using a file system across operating systems.

### GAP-003: File-system feature vocabulary

- Severity: high
- Basis: ai-inference
- Related concepts: filesystems.ntfs, filesystems.refs, filesystems.xfs, filesystems.apfs, filesystems.journaling, filesystems.snapshots
- Description: The lesson names compression, encryption, quotas, resiliency, integrity checking, snapshots, journaling, and fragmentation, but several are not defined in depth.
- Recommendation: Create or link short supporting concepts for file-system features that are important for comparison and exam readiness.

### GAP-004: Current operating-system support needs verification

- Severity: medium
- Basis: ai-inference
- Related concepts: filesystems.ntfs, filesystems.refs, filesystems.apfs, filesystems.ext4
- Description: The lesson includes support statements for NTFS, ReFS, APFS, Linux, macOS, iOS, iPadOS, and Android. Some support details may change by OS version and should be verified in authoring.
- Recommendation: Require review before publishing OS support tables or exact version claims.

## Rejected Mentions

- **Windows Server 2012** (mentioned-only): Used only as a support/version example for ReFS and does not meet the teaching threshold as its own concept in this lesson.
- **Check Disk** (mentioned-only): Mentioned only as a comparison to ReFS self-repair/integrity checking; insufficient procedural detail for a separate tool object in this discovery package.
- **USB flash drive** (mentioned-only): Used as an example scenario for exFAT rather than taught as a hardware concept.
- **macOS version 10.12.4** (mentioned-only): Version detail supports APFS context but should not become its own Knowledge Object.
- **Solid-state drives** (mentioned-only): SSDs are relevant as APFS optimization context but storage-media teaching is outside the direct lesson scope unless linked as a prerequisite.

## Import Notes

- This file is a Transcript Intelligence discovery package, not a draft Knowledge Object package.
- Discovery review decides which concepts move to Knowledge Authoring.
- Curriculum placement and relationship suggestions are reviewable metadata until promoted through the proper workflow.
- Speech-to-text inconsistencies appear in the source: XFAT should likely be exFAT, TFS likely means NTFS, RFS/RIFFS likely means ReFS, and “terb” likely means TB. These should be normalized during authoring while preserving source evidence notes.
- The strongest authoring candidates are file system, partition formatting, NTFS, ReFS, FAT32, exFAT, ext4, XFS, and APFS.
- Feature-level topics such as journaling and snapshots are valid discoveries but need enrichment because the transcript only mentions them briefly.
- No draft Knowledge Objects, quiz questions, flashcards, or full learner explanations are included; this is a discovery package only.

## Next Step

Use this manifest as the input context for AI-assisted Discovery Review. The review output should decide which concepts are accepted, merged, deferred, rejected, or sent to Knowledge Authoring.
