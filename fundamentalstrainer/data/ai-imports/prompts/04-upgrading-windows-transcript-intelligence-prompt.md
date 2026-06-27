# AI Transcript Intelligence Import

You are analyzing instructional IT source text for a knowledge-first learning platform.

This is not a quiz generator, not a transcript summarizer, and not a Knowledge Object authoring step. The source text is evidence. Your job is to act as a curriculum analyst and produce a reviewable discovery package that explains what concepts exist, which ones deserve authoring, which should merge, which are only mentioned, which prerequisites and relationships matter, where concepts belong in the curriculum, and what gaps the lesson reveals.

## Source Metadata
- certificationId: a-plus-220-1202
- lessonId: 04
- lessonTitle: Upgrading Windows
- sourceTranscript: data/transcripts/cleaned/a-plus-220-1202/04-Upgrading Windows.txt
- transcriptInputMode: provided-clean-text

## Required Pipeline
Source text
  ↓
Identify source evidence
  ↓
Discover concepts
  ↓
Classify concepts
  ↓
Identify prerequisites and relationships
  ↓
Suggest curriculum placement
  ↓
Detect merge candidates and duplicate risks
  ↓
Detect knowledge gaps
  ↓
Return Transcript Intelligence JSON
  ↓
Review decides what goes to Knowledge Authoring

## Critical Rules
- Return JSON only. No markdown around the JSON.
- Do not return draft Knowledge Objects in this stage.
- Do not write full learner explanations, full fact lists, flashcards, or quiz questions.
- Do not create concepts merely to satisfy a target count.
- Return every concept that exceeds the minimum teaching threshold.
- Weak mentions should be included in rejectedMentions or classified as mentioned-only.
- Use stable proposed IDs like "windows.task-manager", "networking.dhcp", "security.firewall", "filesystems.ext4".
- Keep curriculum placement separate from graph relationships.
- Mark review-required items clearly.
- Split confidence into topicConfidence, evidenceStrength, enrichmentLevel, and reviewPriority.
- Use basis labels: source-supported, ai-inference, general-it-knowledge, common-practice, exam-knowledge.

## Concept Classification
Use one of:
- teachable
- merge-existing
- mentioned-only
- ignore
- needs-enrichment

## Minimum Teaching Threshold
A concept should move forward when it supports at least two of:
- definition
- purpose
- how it is used
- comparison
- exam relevance
- procedure
- example
- common mistake
- relationship to another taught concept
- curriculum relevance
- prerequisite value
- troubleshooting value

## Curriculum Placement Guidance
Use the current curriculum layer. Suggested sections/modules may include:
- sectionId: "1.0", moduleId: "operating-system-foundations"
- sectionId: "1.0", moduleId: "desktop-operating-systems"
- sectionId: "1.0", moduleId: "mobile-operating-systems"
- sectionId: "1.0", moduleId: "file-systems"
- sectionId: "1.0", moduleId: "os-maintenance-and-lifecycle"
- sectionId: "2.0", moduleId: "security-foundations"
- sectionId: "3.0", moduleId: "software-troubleshooting-foundations"
- sectionId: "4.0", moduleId: "operational-procedures-foundations"

If no existing module fits, propose a new module with proposedModuleTitle and reason. Do not force a bad fit.

## Required JSON Shape
{
  "schemaVersion": "transcript-intelligence.v1",
  "certificationId": "a-plus-220-1202",
  "lessonId": "04",
  "lessonTitle": "Upgrading Windows",
  "sourceTranscript": "data/transcripts/cleaned/a-plus-220-1202/04-Upgrading Windows.txt",
  "transcriptInputMode": "provided-clean-text",
  "analysisQuality": {
    "isStarterAnalysis": false,
    "fixedCandidateTargetUsed": false,
    "conceptCountPolicy": "Return every concept above the minimum teaching threshold. Do not invent concepts to hit a number.",
    "gapsIncluded": true,
    "mergeDetectionIncluded": true,
    "curriculumPlacementIncluded": true,
    "relationshipDiscoveryIncluded": true,
    "richnessNotes": "Explain source limitations, uncertainty, or unusual concept counts."
  },
  "conceptsDiscovered": [
    {
      "conceptId": "DISC-001",
      "title": "Human readable concept title",
      "proposedKnowledgeId": "domain.stable-slug",
      "type": "concept | tool | command | protocol | operating-system | service | security-control | file-system | hardware | troubleshooting-step",
      "domains": ["domain"],
      "aliases": ["optional alias"],
      "classification": "teachable | merge-existing | mentioned-only | ignore | needs-enrichment",
      "teachingValue": "high | medium | low",
      "topicConfidence": 0.0,
      "evidenceStrength": "strong | medium | weak",
      "enrichmentLevel": "none | low | medium | high",
      "reviewPriority": "low | normal | high",
      "sourceEvidence": [
        {
          "evidenceId": "EVID-001",
          "quote": "Short source quote or close excerpt that triggered this topic.",
          "reason": "Why this quote makes the topic relevant.",
          "evidenceType": "definition | example | comparison | relationship | procedure | exam-note | mention",
          "supports": "topic-trigger | prerequisite | relationship | curriculum-placement | gap"
        }
      ],
      "prerequisites": [
        {
          "proposedKnowledgeId": "domain.prerequisite-id",
          "reason": "Why this should be understood first.",
          "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
          "requiresReview": true
        }
      ],
      "relationshipSuggestions": [
        {
          "targetKnowledgeId": "domain.related-id",
          "type": "related_to | depends_on | prerequisite_of | contrasts_with | part_of | used_for",
          "reason": "Why these concepts are related.",
          "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
          "requiresReview": true,
          "evidenceIds": ["EVID-001"]
        }
      ],
      "curriculumPlacementSuggestions": [
        {
          "curriculumId": "a-plus-220-1202",
          "sectionId": "1.0",
          "moduleId": "operating-system-foundations",
          "proposedModuleTitle": "Optional only when proposing a new module",
          "reason": "Why this concept belongs in this curriculum location.",
          "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
          "requiresReview": true,
          "evidenceIds": ["EVID-001"]
        }
      ],
      "mergeRecommendation": {
        "shouldMerge": false,
        "targetKnowledgeId": "existing.id-if-known",
        "reason": "Why this should merge instead of becoming a new object.",
        "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
        "requiresReview": true
      },
      "authoringGuidance": {
        "shouldAuthor": true,
        "recommendedDepth": "brief | normal | deep",
        "mustCover": ["Important points the Knowledge Author should cover later."],
        "niceToCover": ["Optional points."],
        "avoidCreatingDuplicateOf": ["existing.knowledge-id"],
        "notes": ["Authoring warnings or enrichment needs."]
      },
      "reviewNotes": ""
    }
  ],
  "mergeRecommendations": [
    {
      "sourceConceptId": "DISC-001",
      "targetKnowledgeId": "existing.knowledge-id",
      "reason": "Why these should merge.",
      "basis": "ai-inference",
      "requiresReview": true
    }
  ],
  "relationshipSuggestions": [
    {
      "sourceConceptId": "DISC-001",
      "sourceKnowledgeId": "domain.source-id",
      "targetKnowledgeId": "domain.target-id",
      "type": "related_to | depends_on | prerequisite_of | contrasts_with | part_of | used_for",
      "reason": "Relationship reason.",
      "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
      "requiresReview": true,
      "evidenceIds": ["EVID-001"]
    }
  ],
  "curriculumPlacementSuggestions": [
    {
      "conceptId": "DISC-001",
      "proposedKnowledgeId": "domain.stable-slug",
      "curriculumId": "a-plus-220-1202",
      "sectionId": "1.0",
      "moduleId": "operating-system-foundations",
      "proposedModuleTitle": "Optional only when proposing a new module",
      "reason": "Top-level curriculum placement suggestion.",
      "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
      "requiresReview": true,
      "evidenceIds": ["EVID-001"]
    }
  ],
  "knowledgeGaps": [
    {
      "gapId": "GAP-001",
      "title": "Missing prerequisite or assumed knowledge",
      "description": "What the lesson assumes, skips, or mentions too weakly.",
      "relatedConceptIds": ["domain.related-id"],
      "recommendation": "Create, enrich, or link a supporting concept/module.",
      "severity": "low | medium | high",
      "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
      "requiresReview": true,
      "evidenceIds": ["EVID-001"]
    }
  ],
  "rejectedMentions": [
    {
      "title": "Mentioned but not imported",
      "classification": "mentioned-only | too-vague | duplicate | out-of-scope | not-technical",
      "reason": "Why this should not become a Knowledge Object.",
      "basis": "source-supported | ai-inference",
      "sourceEvidence": "Optional short quote or phrase that triggered rejection."
    }
  ],
  "importNotes": ["Any uncertainty, source limitation, duplicate concern, enrichment warning, or curriculum-placement warning."]
}

## Source Text
When you're installing an operating system, you often have a choice.

You can upgrade or you can install.

Upgrade means that you already have an operating system in place and you'd like to keep all of your applications and all of your files exactly where they are and then simply update the operating system around them.

Installing means you're effectively starting over completely fresh.

So, if you have any data on that drive, you're going to delete all of that and perform a fresh installation.

Upgrading may be a good choice if you have many different local user accounts on this system, which means many different people are using this computer, or you may have some specialized configurations and you don't want to lose those configs.

By simply upgrading, you're leaving your configurations in place and all of your user accounts and you're simply upgrading the operating system files associated with that computer.

This can obviously save you a lot of time.

You don't have to reinstall any applications.

This also keeps all of your user data in place, so you don't have to back up everything and then restore it after you're done.

This keeps all of your user settings, so all of the configurations that you've created for your user account on that system.

And that ultimately means that upgrading will probably be a much faster way to get that operating system up to date.

It's important that you understand the differences between an in place upgrade and a clean install.

Neither one is better than the other, but you should use the right one for your specific circumstance.

An in place upgrade will upgrade the existing operating system, but keep everything in place on your system.

The applications, the documents, and the settings all remain the same.

It's common to start an in place upgrade by launching the installation process from inside of the existing OS.

This is compared to a clean install which wipes everything on that system.

All of the applications, all of the user data, and all of the existing operating system files.

Everything is removed, and you're installing it as if it is a brand new installation.

If you're planning this route, it's always a good idea to back up everything that's on the system already.

People will tell you, "Yes, you can delete everything on that computer." And then when you delete it, they'll realize, "Oh, wait.

There's this one file I need." If you have a backup, you can recover that information relatively easy, even though you did a clean install.

You would normally begin a clean install from the boot process of your computer by booting from the installation media.

Before you begin the installation, it's always a good idea to check the drive you're performing the installation on.

Is there any data on that drive currently?

Has the drive recently been formatted?

You might also want to check to see if there's any other partitions on this drive that maybe the user is not currently aware of.

And as we've already mentioned, once you repartition and reformat that drive, it's very difficult, if not impossible, to recover that data.

So, it's always a good idea to get a backup even if the user thinks that perhaps they won't need any of this data in the future.

By taking that backup, you can now recover if anybody needs any of this data in the future.

It might also be a good idea to save any user preferences so that when the system is restarted, you might be able to copy those back over to the appropriate application.

Usually, you don't need a third party application to do any type of partitioning or formatting of the drive because those features are usually built into the installation process itself.

You're able to start the install, clear out any existing partitions, or reformat over the partitions that currently exist.

If you're moving from one operating system version to another, it might be a good idea to check the requirements for that OS.

Check to see that your system has enough memory, has enough spare drive space, and is able to support all of the features of that new operating system.

There's usually a list of recommended requirements in the operating system documentation.

Microsoft includes a nice hardware compatibility check that you can run to see if your system can support the version of Windows that you'd like to install.

You would usually run this before performing the upgrade and you'd get all the feedback you need on whether this system can support the new operating system or if you need to improve some of those resources.

For Windows 11, Microsoft refers to this application as the PC health check for Windows 11.

You also might want to make sure that you have an answer to any of these questions that commonly appear during the installation process.

For example, you need to know what drive you're going to install this operating system on, what type of configuration you're going to use for the partitions, and you might also want to have any necessary license keys available for the installation process.

Sometimes you'll find that certain applications or certain device drivers will not be compatible in the newer version of the operating system.

So, check the documentation from all of your app developers and check the details of all of your device drivers and make sure they're compatible with the new version of the operating system that you're installing.

Here's the PC health check program for Windows 11.

And it tells you what your system is currently configured with.

And it says introducing Windows 11.

And we can click the check now button to see if it meets the system requirements.

This takes a few minutes to run.

And on this computer, PC health check tells us this PC doesn't currently meet the Windows 11 system requirements.

Then it gives you a list of the things that do and don't meet the requirements.

It says that this PC must support secure boot.

TPM2.0 must be supported and enabled on this PC.

Neither one of those meets the minimum requirements of Windows 11.

This system does meet the requirements for the processor.

tells us that the processor is supported for Windows 11 and there is enough memory in the system to be able to run Windows 11.

Most operating system manufacturers will give you a life cycle calendar.

This will tell you when this operating system is in support and when this operating system will be retired from support.

This life cycle usually starts with quality updates where you get monthly security updates, monthly bug fixes, and it keeps the system updated every month of the year.

You might also get feature updates.

These are usually released with new capabilities in the operating system and these are often updated every 6 months or every year.

We usually see most operating systems supported anywhere from 18 to 36 months.

And this will depend on the type of Windows operating system and the version that you happen to be using.

If you'd like more information on the Windows product life cycle, Microsoft refers to this as the modern life cycle policy.

And all of these details are available on the Microsoft website.

As we've seen, there may be cases where you can't simply install Windows 11 on a machine that's currently running Windows 10.

You might want to look at the additional requirements and know exactly what you might want to change to be able to upgrade this system.

One of the big requirements for Windows 11 is that you have a TPM, a trusted platform module.

This is usually hardware on the motherboard of this system, and it has to be compatible with a more recent version of TPM, specifically TPM 2.0 or later.

This is cryptographic hardware, and it's important to use this for Bit Locker, Windows Hello, and a number of other Windows features.

If you'd like to check the details of your TPM, you can run the TPM.

MSC.

This is the Microsoft snap-in for the Microsoft management console that gives you all of the details about the TPM that's in your system.

Windows 11 also requires a modern version of a BIOS, specifically the UEFI BIOS.

It's one that provides capabilities for secure boot and Windows 11 requires secure boot to operate.

You can check the status of secure boot on your system by running the system information utility and check in the section titled system summary.

If you have a much older computer, you may find that it does not have a UEFI BIOS and you may need to physically replace that computer in order to support Windows 11.

This is the Windows system information utility.

And under the system summary section, there are a lot of details.

And the one you're looking for is the one that says secure boot state.

And ideally, it should be turned on.

Once you check the requirements for your operating system and your applications, you'll be ready to upgrade to the latest version of Windows.
