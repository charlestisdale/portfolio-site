# AI Discovery Review Prompt

You are reviewing a Transcript Intelligence discovery package for a knowledge-first IT learning platform.

You are not generating Transcript Intelligence from scratch. You are not writing Knowledge Objects. You are not recreating the original JSON. Your job is to review the discovered concepts and decide what should happen next.

## Input Metadata
- inputKind: discovery-manifest
- inputFile: data/imports/manifests/03-installing-operating-systems-discovery-manifest.md
- lessonId: 03
- lessonTitle: Installing Operating Systems

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
  "lessonId": "03",
  "lessonTitle": "Installing Operating Systems",
  "sourceReviewInput": "data/imports/manifests/03-installing-operating-systems-discovery-manifest.md",
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
# Discovery Manifest: Installing Operating Systems

This manifest is a review view of a Transcript Intelligence package. It is not canonical knowledge and it is not a draft Knowledge Object export.

## Package Summary

- Source file: `data/imports/pending/03-transcript-intelligence.json`
- Source transcript: `data/transcripts/cleaned/a-plus-220-1202/03-Installing Operating Systems.txt`
- Schema: `pending-transcript-intelligence.v1`
- Certification: `a-plus-220-1202`
- Lesson: `03`
- Concepts discovered: 25
- Knowledge gaps: 5
- Merge recommendations: 2
- Rejected mentions: 5

## Classification Counts

- mentioned-only: 2
- merge-existing: 1
- needs-enrichment: 1
- teachable: 21

## Review Attention

- High-priority concepts: 1
- Weak evidence + high enrichment concepts: 2
- Concepts with merge recommendations: 2

### High-Priority Concepts

- DISC-022: Secure Boot (security.secure-boot)

### Weak Evidence / High Enrichment Concepts

- DISC-022: Secure Boot (security.secure-boot)
- DISC-025: DiskPart utility (windows.diskpart)

## Concepts for Discovery Review

### DISC-001: Bootable USB operating system installation

- Proposed ID: `os-installation.bootable-usb`
- Classification: `teachable`
- Type: `tool`
- Domains: operating-systems, storage
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- One common method is to use a bootable USB drive. — Introduces bootable USB media as an OS installation method.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Bootable USB operating system installation is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- None suggested.

#### Authoring Guidance
- Must cover: purpose of bootable USB media
- Must cover: need for boot support in firmware
- Must cover: common use during OS installation
- Nice to cover: USB creation tools
- Nice to cover: boot order selection

### DISC-002: PXE network boot

- Proposed ID: `networking.pxe-boot`
- Classification: `teachable`
- Type: `protocol`
- Domains: networking, operating-systems
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- This is a network boot that's commonly referred to as Pixie or PXE. This stands for preboot execution environment. — Defines PXE and connects it to network boot installation.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — PXE network boot is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: os-installation.remote-network-installation — PXE is used to boot an installer from the network.

#### Authoring Guidance
- Must cover: PXE purpose
- Must cover: firmware support requirement
- Must cover: PXE server role
- Must cover: network boot use cases
- Nice to cover: DHCP/TFTP relationship as enrichment
- Note: Source says 'Pixie'; canonical title should use PXE.

### DISC-003: ISO image

- Proposed ID: `storage.iso-image`
- Classification: `teachable`
- Type: `file-system`
- Domains: storage, operating-systems, virtualization
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- This ISO image contains everything that would normally be found on that optical disc. — Defines ISO as an optical-disc image used for installation.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — ISO image is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: virtualization.virtual-machine-installation-media — The transcript says ISO booting is common in virtualization software.

#### Authoring Guidance
- Must cover: ISO as disc image
- Must cover: bootable installation media use
- Must cover: virtualization use
- Nice to cover: mounting ISO files

### DISC-004: Internet-based operating system installation

- Proposed ID: `os-installation.internet-based-install`
- Classification: `needs-enrichment`
- Type: `procedure`
- Domains: operating-systems, networking
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Defer or enrich before Knowledge Authoring.**

#### Source Evidence
- Some systems can also boot and install the operating system across the internet. — Introduces internet-based installation and recovery as an installation source.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Internet-based operating system installation is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- None suggested.

#### Authoring Guidance
- Must cover: internet install as installation source
- Must cover: examples: Linux minimal installers, macOS recovery, Windows update/reset paths
- Nice to cover: network requirements
- Note: Needs verification/enrichment by OS family before authoring.

### DISC-005: Multiboot systems

- Proposed ID: `os-installation.multiboot`
- Classification: `teachable`
- Type: `concept`
- Domains: operating-systems, storage
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- You could have Windows and Linux on the same physical device... This is often referred to as a multioot system. — Shows the concept of multiple operating systems on one device.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Multiboot systems is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- None suggested.

#### Authoring Guidance
- Must cover: what multiboot means
- Must cover: choosing an OS during startup
- Must cover: partition planning
- Nice to cover: bootloader considerations
- Note: Source typo 'multioot' should be normalized to multiboot.

### DISC-006: Clean install

- Proposed ID: `os-installation.clean-install`
- Classification: `teachable`
- Type: `procedure`
- Domains: operating-systems
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- This means we're going to wipe everything in that partition and we're going to completely reinstall the operating system. — Defines clean install and its destructive effect on existing data.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Clean install is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- depends_on: backup.data-backup — Clean installs delete previous files, so backup awareness is prerequisite.

#### Authoring Guidance
- Must cover: clean install definition
- Must cover: data loss risk
- Must cover: when it is used
- Nice to cover: backup before install

### DISC-007: In-place upgrade

- Proposed ID: `os-installation.in-place-upgrade`
- Classification: `teachable`
- Type: `procedure`
- Domains: operating-systems
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- install a newer version of the operating system and keep all of your applications and all of your data in place — Defines in-place upgrade by contrast with clean install.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — In-place upgrade is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: os-installation.clean-install — The transcript contrasts preserving apps/data with wiping a partition.

#### Authoring Guidance
- Must cover: purpose
- Must cover: what is preserved
- Must cover: contrast with clean install
- Nice to cover: compatibility checks

### DISC-008: Image deployment

- Proposed ID: `os-deployment.image-deployment`
- Classification: `teachable`
- Type: `procedure`
- Domains: operating-systems, enterprise-it
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- create an image of that system and simply install the image on all of the other computers — Explains image deployment as standardized OS/app/config rollout.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Image deployment is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: os-deployment.zero-touch-deployment — Both are organization-scale deployment methods.

#### Authoring Guidance
- Must cover: golden/reference image concept
- Must cover: standard apps and configurations
- Must cover: organizational deployment use
- Nice to cover: sysprep or imaging tools as enrichment

### DISC-009: Zero-touch deployment

- Proposed ID: `os-deployment.zero-touch-deployment`
- Classification: `teachable`
- Type: `procedure`
- Domains: operating-systems, enterprise-it
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Generally, we would perform a zeroouch deployment... with little or no prompts — Defines zero-touch deployment as highly automated installation and configuration.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Zero-touch deployment is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: automation.unattended-installation — Zero-touch is a form of unattended or minimally attended deployment.

#### Authoring Guidance
- Must cover: automation goal
- Must cover: little/no user prompts
- Must cover: corporate configuration
- Must cover: domain/email settings
- Nice to cover: Autopilot/MDT/SCCM examples if appropriate
- Note: Potential duplicate with unattended installation; review taxonomy.

### DISC-010: Remote network installation from local share

- Proposed ID: `os-installation.remote-network-installation`
- Classification: `teachable`
- Type: `procedure`
- Domains: operating-systems, networking
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- put all of your install files on a separate network drive... begin a remote network installation from that local server or that local share drive — Introduces installation files hosted on a local server/share.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Remote network installation from local share is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- None suggested.

#### Authoring Guidance
- Must cover: installing from local server/share
- Must cover: benefit of avoiding local media
- Must cover: relationship to PXE/network boot

### DISC-011: Recovery partition

- Proposed ID: `os-installation.recovery-partition`
- Classification: `teachable`
- Type: `concept`
- Domains: operating-systems, storage
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Most modern operating systems will also install a recovery partition. This is commonly installed as a hidden partition. — Defines recovery partition and its hidden nature.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Recovery partition is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- part_of: storage.disk-partition — A recovery partition is a logical partition on the storage drive.

#### Authoring Guidance
- Must cover: hidden partition
- Must cover: contains recovery/install files
- Must cover: troubleshooting use
- Nice to cover: vendor recovery environments

### DISC-012: Repair installation

- Proposed ID: `os-installation.repair-installation`
- Classification: `teachable`
- Type: `procedure`
- Domains: operating-systems, troubleshooting
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- This is referred to as a repair installation... overwrite all of your operating system files, but it will leave all of your user files and documents in place. — Defines repair installation and what it preserves.

#### Curriculum Placement
- a-plus-220-1202 → 3.0 → software-troubleshooting-foundations — Repair installation is an OS troubleshooting recovery method.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: troubleshooting.os-corruption — The source frames repair installation as a fix for major OS problems.

#### Authoring Guidance
- Must cover: what it overwrites
- Must cover: what user data it preserves
- Must cover: when to use
- Nice to cover: backup caution

### DISC-013: Third-party driver loading during OS installation

- Proposed ID: `os-installation.third-party-driver-loading`
- Classification: `teachable`
- Type: `procedure`
- Domains: operating-systems, hardware
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- you may have to load third-party drivers to connect to a storage device or to a network connection — Explains why installer drivers may be required.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Third-party driver loading during OS installation is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- depends_on: hardware.device-driver — This concept depends on understanding device drivers.

#### Authoring Guidance
- Must cover: installer may not recognize hardware
- Must cover: storage/network driver examples
- Must cover: driver prompt during installation

### DISC-014: Disk partition

- Proposed ID: `storage.disk-partition`
- Classification: `teachable`
- Type: `concept`
- Domains: storage, operating-systems
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- we need to create a logical section of your storage drive... referred to as a disk partition — Defines partition as logical section of storage.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Disk partition is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- None suggested.

#### Authoring Guidance
- Must cover: partition definition
- Must cover: role before formatting/installing
- Must cover: separating OS/data/recovery/multiboot
- Nice to cover: partition deletion risk

### DISC-015: Windows volume

- Proposed ID: `storage.windows-volume`
- Classification: `teachable`
- Type: `concept`
- Domains: storage, windows
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Microsoft refers to these as volumes... a volume is simply a formatted partition. — Defines Windows volume terminology.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Windows volume is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: storage.disk-partition — A Windows volume is a formatted partition in this lesson context.

#### Authoring Guidance
- Must cover: Windows terminology
- Must cover: formatted partition meaning
- Nice to cover: volume vs partition nuance
- Note: Likely merge or link with broader partition/formatting content.

### DISC-016: GPT partition style

- Proposed ID: `storage.gpt-partition-style`
- Classification: `teachable`
- Type: `concept`
- Domains: storage, firmware
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- One of these styles is a GPT partition style... globally unique identifier... configure up to 128 partitions — Defines GPT and gives key capabilities.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — GPT partition style is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: storage.mbr-partition-style — The transcript compares GPT with MBR capacity and partition limits.

#### Authoring Guidance
- Must cover: GPT meaning
- Must cover: UEFI relationship
- Must cover: 128 partition support
- Must cover: large drive support
- Must cover: contrast with MBR
- Nice to cover: GUID terminology correction
- Note: Source says 'GID'; should be reviewed/corrected to GUID.

### DISC-017: UEFI firmware

- Proposed ID: `firmware.uefi`
- Classification: `teachable`
- Type: `concept`
- Domains: firmware, operating-systems
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- To be able to use this GID partition table style, you will need a BIOS that is a UEFI BIOS. — Shows UEFI as firmware prerequisite for GPT in the lesson.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — UEFI firmware is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: security.secure-boot — The lesson discusses compatibility mode disabling Secure Boot.

#### Authoring Guidance
- Must cover: UEFI role in modern installs
- Must cover: relationship to GPT
- Must cover: relationship to Secure Boot/compatibility mode
- Note: Use firmware terminology carefully; avoid saying UEFI is literally BIOS except as exam wording.

### DISC-018: MBR partition style

- Proposed ID: `storage.mbr-partition-style`
- Classification: `teachable`
- Type: `concept`
- Domains: storage, firmware
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Before there was the GPT partition style... we were using the MBR partition style or master boot record. — Defines MBR as legacy partition style.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — MBR partition style is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: storage.gpt-partition-style — Source contrasts MBR with GPT limits and partition types.

#### Authoring Guidance
- Must cover: MBR legacy role
- Must cover: 2 TB limit
- Must cover: primary/extended/logical partitions
- Must cover: four primary partition limit
- Must cover: active partition

### DISC-019: Primary, extended, and logical partitions

- Proposed ID: `storage.mbr-partition-types`
- Classification: `teachable`
- Type: `concept`
- Domains: storage
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- With the MBR partition style, you have two types of partitions. There's a primary partition and an extended partition... logical partitions are not bootable. — Explains MBR partition types and bootability.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Primary, extended, and logical partitions is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- None suggested.

#### Authoring Guidance
- Must cover: primary partitions
- Must cover: extended partition
- Must cover: logical partitions
- Must cover: bootability limits
- Note: May merge into MBR if curriculum prefers fewer objects.

### DISC-020: Active bootable partition

- Proposed ID: `storage.active-partition`
- Classification: `merge-existing`
- Type: `concept`
- Domains: storage, firmware
- Teaching value: low
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Review merge target before authoring.**

#### Source Evidence
- only one of those partitions can be marked as the active bootable partition on that drive — Identifies active partition selection in MBR booting.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Active bootable partition is part of operating system installation foundations.

#### Merge Review
- storage.mbr-partition-style — Active partition is best authored as part of MBR boot behavior unless deeper bootloader coverage exists.
- storage.mbr-partition-style — Active partition is best authored as part of MBR boot behavior unless deeper bootloader coverage exists.
- storage.mbr-partition-style — Active partition is best authored as part of MBR boot behavior unless deeper bootloader coverage exists.

#### Relationships
- None suggested.

#### Authoring Guidance
- Nice to cover: active partition boot selection
- Note: Treat as subtopic of MBR.

### DISC-021: BIOS compatibility mode

- Proposed ID: `firmware.bios-compatibility-mode`
- Classification: `teachable`
- Type: `concept`
- Domains: firmware, operating-systems
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- If you enable the BIOS compatibility mode, it disables the ability to secure boot — Connects compatibility mode with loss of Secure Boot support.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — BIOS compatibility mode is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: security.secure-boot — Compatibility mode disables Secure Boot according to the transcript.

#### Authoring Guidance
- Must cover: legacy BIOS compatibility purpose
- Must cover: transition from BIOS to UEFI
- Must cover: Secure Boot limitation
- Nice to cover: CSM terminology

### DISC-022: Secure Boot

- Proposed ID: `security.secure-boot`
- Classification: `mentioned-only`
- Type: `security-control`
- Domains: security, firmware
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: weak
- Enrichment level: high
- Review priority: high
- Recommendation: **Reject or keep as mention.**

#### Source Evidence
- it disables the ability to secure boot, which means that many of your newer operating systems will not work — Mentions Secure Boot as a modern OS install requirement/constraint.

#### Curriculum Placement
- a-plus-220-1202 → 2.0 → security-foundations — Secure Boot is a firmware security control only briefly referenced here.

#### Merge Review
- No merge recommendation.

#### Relationships
- None suggested.

#### Authoring Guidance
- Note: Mention is not enough here for full authoring, but it should link to an existing Secure Boot concept.

### DISC-023: Quick format

- Proposed ID: `storage.quick-format`
- Classification: `teachable`
- Type: `procedure`
- Domains: storage, operating-systems
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- The quick format... is creating a file table... not performing any physical checks — Defines quick format behavior and limitations.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Quick format is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: storage.full-format — The lesson contrasts quick format with full format for speed and security.

#### Authoring Guidance
- Must cover: creates/erases file table
- Must cover: does not physically check drive
- Must cover: data recoverability risk
- Must cover: Windows install default
- Nice to cover: security implications

### DISC-024: Full format

- Proposed ID: `storage.full-format`
- Classification: `teachable`
- Type: `procedure`
- Domains: storage, operating-systems
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- A full format... is going to write zeros across the entire disc — Defines full format behavior and security tradeoff.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Full format is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: storage.quick-format — The transcript compares full format against quick format.

#### Authoring Guidance
- Must cover: writes zeros across disk
- Must cover: more secure than quick format
- Must cover: time cost
- Must cover: use case
- Nice to cover: SSD caveats as enrichment
- Note: Review modern Windows/SSD behavior before deep authoring.

### DISC-025: DiskPart utility

- Proposed ID: `windows.diskpart`
- Classification: `mentioned-only`
- Type: `command`
- Domains: windows, storage
- Teaching value: low
- Topic confidence: 0.9
- Evidence strength: weak
- Enrichment level: high
- Review priority: normal
- Recommendation: **Reject or keep as mention.**

#### Source Evidence
- If you wanted to perform a full format, you could change that in the disk part utility. — Mentions DiskPart as the tool for changing format behavior.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — DiskPart utility is part of operating system installation foundations.

#### Merge Review
- No merge recommendation.

#### Relationships
- None suggested.

#### Authoring Guidance
- Note: Only mentioned as a utility; author separately only if command-line storage tools are in scope.

## Knowledge Gaps

### GAP-001: Boot process prerequisites are assumed

- Severity: medium
- Basis: ai-inference
- Related concepts: os-installation.bootable-usb, networking.pxe-boot, firmware.uefi
- Description: The lesson references booting from USB, PXE, local partitions, ISO images, and firmware settings without fully teaching boot order, firmware setup access, or bootloader behavior.
- Recommendation: Create or link a supporting boot process/firmware boot order concept before installation media topics.

### GAP-002: PXE dependencies are not explained

- Severity: medium
- Basis: ai-inference
- Related concepts: networking.pxe-boot
- Description: PXE is introduced, but DHCP/TFTP or boot image/service dependencies are not explained.
- Recommendation: Enrich PXE authoring with network service dependencies at an A+ appropriate depth.

### GAP-003: Data backup risk before destructive installation is implicit

- Severity: high
- Basis: ai-inference
- Related concepts: os-installation.clean-install, storage.disk-partition, storage.quick-format, storage.full-format
- Description: Clean installs, repartitioning, and formatting can delete data, but backup procedure and verification are not taught as separate prerequisites.
- Recommendation: Link to backup and data preservation concepts before destructive install operations.

### GAP-004: Modern partition terminology needs review

- Severity: medium
- Basis: ai-inference
- Related concepts: storage.gpt-partition-style
- Description: The transcript uses 'GID partition table' wording where GUID/GPT terminology should be normalized before authoring.
- Recommendation: Review and normalize GPT/GUID terminology in authoring output.

### GAP-005: Format behavior varies by storage type and OS version

- Severity: medium
- Basis: ai-inference
- Related concepts: storage.quick-format, storage.full-format
- Description: The quick/full format comparison is exam-relevant, but modern SSD behavior, TRIM, and OS-version differences may need careful enrichment to avoid overgeneralization.
- Recommendation: Keep A+ baseline clear while adding reviewed caveats if the platform supports deeper notes.

## Rejected Mentions

- **CD-ROM and DVD-ROM media** (mentioned-only): Optical media is only used as historical context for ISO images and does not exceed the teaching threshold in this lesson.
- **External hot-swappable drives** (mentioned-only): Mentioned as possible installation media, but not enough detail is provided beyond media portability.
- **Email server settings** (out-of-scope): Used only as an example of corporate configuration in zero-touch deployment, not as an email concept lesson.
- **Domain connections** (mentioned-only): Mentioned as part of deployment automation, but domain join/identity is not taught here.
- **Windows Updates OS installation** (too-vague): The source mentions Windows Updates as an internet source without enough detail to classify the exact Windows installation/reset/update mechanism.

## Import Notes

- This file is a Transcript Intelligence discovery package, not a draft Knowledge Object package.
- Discovery review decides which concepts move to Knowledge Authoring.
- Curriculum placement and relationship suggestions are reviewable metadata until promoted through the proper workflow.
- This output intentionally stays at transcript-intelligence/discovery level and does not create Knowledge Objects.
- Several concepts likely already exist from lesson 02 file-system/storage work, especially partition, volume, GPT, MBR, quick format, and full format; review for merge before authoring.
- Normalize transcript typos before authoring: PXE not Pixie, multiboot not multioot, zero-touch not zeroouch, reimaging not reiming, GUID not GID.
- Secure Boot and DiskPart should probably link to existing concepts rather than be authored from this transcript alone.

## Next Step

Use this manifest as the input context for AI-assisted Discovery Review. The review output should decide which concepts are accepted, merged, deferred, rejected, or sent to Knowledge Authoring.
