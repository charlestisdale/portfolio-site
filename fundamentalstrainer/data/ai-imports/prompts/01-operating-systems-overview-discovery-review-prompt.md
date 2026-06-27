# AI Discovery Review Prompt

You are reviewing a Transcript Intelligence discovery package for a knowledge-first IT learning platform.

You are not generating Transcript Intelligence from scratch. You are not writing Knowledge Objects. You are not recreating the original JSON. Your job is to review the discovered concepts and decide what should happen next.

## Input Metadata
- inputKind: discovery-manifest
- inputFile: data/imports/manifests/01-operating-systems-overview-discovery-manifest.md
- lessonId: 01
- lessonTitle: Operating Systems Overview

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
  "lessonId": "01",
  "lessonTitle": "Operating Systems Overview",
  "sourceReviewInput": "data/imports/manifests/01-operating-systems-overview-discovery-manifest.md",
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
# Discovery Manifest: Operating Systems Overview

This manifest is a review view of a Transcript Intelligence package. It is not canonical knowledge and it is not a draft Knowledge Object export.

## Package Summary

- Source file: `data/imports/pending/01-transcript-intelligence.json`
- Source transcript: `data/transcripts/cleaned/a-plus-220-1202/01-Operating Systems Overview.txt`
- Schema: `pending-transcript-intelligence.v1`
- Certification: `a-plus-220-1202`
- Lesson: `01`
- Concepts discovered: 30
- Knowledge gaps: 6
- Merge recommendations: 4
- Rejected mentions: 16

## Classification Counts

- teachable: 30

## Review Attention

- High-priority concepts: 15
- Weak evidence + high enrichment concepts: 0
- Concepts with merge recommendations: 4

### High-Priority Concepts

- DISC-001: Operating System (os.operating-system)
- DISC-002: Application OS Compatibility (software.application-os-compatibility)
- DISC-004: Memory Management and Swap Files (os.memory-management-swap)
- DISC-007: Microsoft Windows (windows.microsoft-windows)
- DISC-009: Device Drivers (hardware.device-drivers)
- DISC-011: Linux (linux.linux)
- DISC-013: Linux Distributions (linux.distributions)
- DISC-015: Apple macOS (macos.apple-macos)
- DISC-017: Chrome OS (chromeos.chrome-os)
- DISC-018: Cloud-Based and Browser-Based Applications (software.web-application)
- DISC-021: Apple iOS (apple.ios)
- DISC-024: Google Android (android.google-android)
- DISC-026: Operating System End of Life (os.end-of-life)
- DISC-027: Operating System Updates and Security Patches (os.patch-management)
- DISC-028: Cross-Platform Data and File Format Compatibility (software.cross-platform-file-compatibility)

## Concepts for Discovery Review

### DISC-001: Operating System

- Proposed ID: `os.operating-system`
- Classification: `teachable`
- Type: `concept`
- Domains: operating-systems
- Teaching value: high
- Topic confidence: 0.98
- Evidence strength: strong
- Enrichment level: low
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- That link is the operating system. — Defines the OS as the link between hardware and applications.
- software that's running on that computing device that controls all of the interaction between the different hardware components — Supports the OS role as hardware coordinator.
- Your operating system is also the platform used by your application. — Supports the relationship between OS and applications.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — This is the foundation concept for the lesson and all OS comparisons.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: hardware.computing-device — The OS coordinates hardware resources for applications and users.
- used_for: software.application — The OS provides the runtime platform for applications.

#### Authoring Guidance
- Must cover: OS as intermediary between hardware and applications
- Must cover: Resource management
- Must cover: Application platform role
- Must cover: Input/process/output role
- Nice to cover: Kernel vs shell as later enrichment
- Nice to cover: Examples across desktop and mobile OSs
- Note: Do not turn this into a full OS internals object yet; keep it foundational.

### DISC-002: Application OS Compatibility

- Proposed ID: `software.application-os-compatibility`
- Classification: `teachable`
- Type: `concept`
- Domains: operating-systems, software
- Teaching value: high
- Topic confidence: 0.95
- Evidence strength: strong
- Enrichment level: low
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- that application was specifically written to run in that OS — Directly supports application-to-OS compatibility.
- you cannot do in these operating systems is take the executable from Windows and try to run that executable in Linux — Provides a contrast/example for incompatible executables.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Compatibility is a common cross-OS foundation topic.

#### Merge Review
- No merge recommendation.

#### Relationships
- depends_on: os.operating-system — Application compatibility depends on the OS platform.
- related_to: software.executable — Executable files are presented as OS-specific application artifacts.

#### Authoring Guidance
- Must cover: Applications must be written for the OS
- Must cover: Executable portability limits
- Must cover: Difference between app compatibility and data/file compatibility
- Nice to cover: Compatibility layers or virtualization as later topics

### DISC-003: File Management

- Proposed ID: `os.file-management`
- Classification: `teachable`
- Type: `concept`
- Domains: operating-systems, storage
- Teaching value: high
- Topic confidence: 0.92
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- One is file management. — Introduces file management as a common OS function.
- store a file, remove a file or change what happens to be on that storage device — Gives examples of file management operations.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — File operations belong near file system and storage concepts.

#### Merge Review
- filesystems.file-system — File management may already be represented under a broader file system concept. Review platform taxonomy before authoring a duplicate.

#### Relationships
- used_for: storage.storage-device — File management controls data on storage devices.

#### Authoring Guidance
- Must cover: Store, delete, and modify files
- Must cover: OS responsibility for storage operations
- Must cover: Relationship to storage devices
- Nice to cover: File systems as the mechanism behind file management
- Note: May merge later with a broader file systems object if the platform already models file management as part of file systems.

### DISC-004: Memory Management and Swap Files

- Proposed ID: `os.memory-management-swap`
- Classification: `teachable`
- Type: `concept`
- Domains: operating-systems, storage
- Teaching value: medium
- Topic confidence: 0.88
- Evidence strength: strong
- Enrichment level: medium
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- There's interaction with the memory inside of that device. — Introduces memory as an OS-managed resource.
- swap file information so you can swap things in and out of memory to the storage device — Directly references swap behavior between memory and storage.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Memory management is a core OS function.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: hardware.ram — Memory management controls what resides in RAM.
- used_for: storage.storage-device — Swap moves data between memory and storage.

#### Authoring Guidance
- Must cover: OS interaction with memory
- Must cover: Swap file as storage-backed memory support
- Must cover: Why applications create overhead
- Nice to cover: Virtual memory terminology
- Nice to cover: Performance impact of excessive swapping
- Note: Transcript mentions swap but does not explain virtual memory deeply; enrichment needed.

### DISC-005: Input and Output Devices

- Proposed ID: `hardware.input-output-devices`
- Classification: `teachable`
- Type: `hardware`
- Domains: hardware, operating-systems
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- some type of input and output from your keyboard and your monitor — Introduces input/output as an OS-mediated function.
- keyboard and a mouse... printer, a display or... separate drive — Lists examples of input and output devices.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — I/O support is introduced as a common OS function.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: os.operating-system — The OS handles input and output interactions.
- part_of: hardware.peripheral-device — Keyboard, mouse, printer, and display are examples of peripherals.

#### Authoring Guidance
- Must cover: Input devices
- Must cover: Output devices
- Must cover: OS role in I/O
- Nice to cover: Drivers as the OS-to-hardware support layer
- Note: May be a supporting concept rather than a full standalone object if hardware/peripherals already exist.

### DISC-006: Operating System Utilities

- Proposed ID: `os.system-utilities`
- Classification: `teachable`
- Type: `tool`
- Domains: operating-systems
- Teaching value: medium
- Topic confidence: 0.86
- Evidence strength: medium
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- the OS also includes its own set of utilities that keeps that system running at peak efficiency — Introduces built-in OS utilities and their purpose.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle — Utilities belong with OS management and maintenance topics.

#### Merge Review
- No merge recommendation.

#### Relationships
- part_of: os.operating-system — System utilities are included with the OS.
- used_for: os.maintenance — Utilities support OS maintenance and efficiency.

#### Authoring Guidance
- Must cover: OS includes utilities
- Must cover: Utilities help manage and maintain the OS
- Nice to cover: Examples should be added in later lessons such as Task Manager, Disk Management, Activity Monitor, or logs
- Note: Source does not name specific utilities, so this should stay broad or needs enrichment.

### DISC-007: Microsoft Windows

- Proposed ID: `windows.microsoft-windows`
- Classification: `teachable`
- Type: `operating-system`
- Domains: windows, operating-systems
- Teaching value: high
- Topic confidence: 0.96
- Evidence strength: strong
- Enrichment level: low
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- One of the most popular operating systems in the world is Microsoft Windows. — Identifies Windows as a major OS family.
- Windows 10, Windows 11, Windows Server — Gives examples of Windows versions/editions.
- very large industry support — Supports Windows ecosystem and support advantages.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → desktop-operating-systems — Windows is a primary desktop OS covered by A+ Core 2.

#### Merge Review
- No merge recommendation.

#### Relationships
- part_of: os.operating-system — Windows is a desktop/server OS family.
- related_to: security.malware-targeting — Popularity makes Windows a larger target for attackers.

#### Authoring Guidance
- Must cover: Windows as a major desktop/server OS
- Must cover: Versions such as Windows 10, Windows 11, Windows Server
- Must cover: Industry support and software ecosystem
- Must cover: Security and driver tradeoffs
- Nice to cover: Client vs server editions
- Nice to cover: Enterprise administration context

### DISC-008: Windows Security Exposure from Popularity

- Proposed ID: `windows.security-exposure`
- Classification: `teachable`
- Type: `security-control`
- Domains: windows, security
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: strong
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- This makes a very big target for anyone who's trying to gain access to data that might be stored inside of a Windows OS. — Connects Windows popularity to attacker focus.

#### Curriculum Placement
- a-plus-220-1202 → 2.0 → security-foundations — The source frames OS popularity as a security concern.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: windows.microsoft-windows — Windows popularity increases its exposure to attacks.
- related_to: security.patch-management — Security patches later connect to reducing OS risk.

#### Authoring Guidance
- Must cover: Popular platforms attract more attackers
- Must cover: Security professionals defend Windows systems
- Must cover: Popularity does not mean inherently insecure
- Nice to cover: Attack surface and patching as later concepts
- Note: Avoid overclaiming that Windows is less secure; source only supports popularity-based targeting.

### DISC-009: Device Drivers

- Proposed ID: `hardware.device-drivers`
- Classification: `teachable`
- Type: `concept`
- Domains: hardware, operating-systems
- Teaching value: high
- Topic confidence: 0.92
- Evidence strength: strong
- Enrichment level: medium
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- hardware manufacturer to write driver software that will work properly with this operating system — Defines responsibility and OS relationship for drivers.
- challenges when you're trying to integrate new hardware into your system — Connects drivers to hardware integration issues.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Drivers are foundational for OS-to-hardware interaction.

#### Merge Review
- No merge recommendation.

#### Relationships
- depends_on: os.operating-system — Drivers allow the OS to work with hardware.
- used_for: hardware.hardware-component — Drivers support hardware integration.

#### Authoring Guidance
- Must cover: Driver software purpose
- Must cover: Manufacturer responsibility
- Must cover: Compatibility and long-term support challenges
- Nice to cover: Signed drivers
- Nice to cover: Device Manager later for Windows troubleshooting

### DISC-010: Desktop User Interface Common Elements

- Proposed ID: `os.desktop-user-interface`
- Classification: `teachable`
- Type: `concept`
- Domains: operating-systems
- Teaching value: medium
- Topic confidence: 0.86
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- there are consistencies that you will begin to see across these different OSS — Introduces shared desktop UI patterns.
- bar at the bottom... status information... recycle bin... icons — Provides Windows UI examples.
- similar to a Windows or a Linux desktop... workspace... bar at the bottom... icons and buttons — Compares macOS desktop elements with other OSs.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → desktop-operating-systems — Desktop UI patterns belong with desktop OS comparison.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: windows.microsoft-windows — Windows desktop examples illustrate common UI patterns.
- related_to: macos.apple-macos — macOS desktop examples illustrate common UI patterns.
- related_to: linux.linux — Linux desktop examples illustrate common UI patterns.

#### Authoring Guidance
- Must cover: Desktop workspace
- Must cover: Taskbar/dock/panels
- Must cover: Icons/status/search similarities across OSs
- Nice to cover: Desktop environment vs OS for Linux
- Note: Keep as UI comparison; do not over-expand into GUI history.

### DISC-011: Linux

- Proposed ID: `linux.linux`
- Classification: `teachable`
- Type: `operating-system`
- Domains: linux, operating-systems
- Teaching value: high
- Topic confidence: 0.96
- Evidence strength: strong
- Enrichment level: low
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Linux is an operating system that is absolutely free. — Introduces Linux and cost characteristic.
- open-source software that is created and maintained by thousands of individuals — Introduces Linux open-source/community nature.
- there are different distributions of Linux — Introduces Linux distributions.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → desktop-operating-systems — Linux is a major desktop/admin OS for Core 2.

#### Merge Review
- No merge recommendation.

#### Relationships
- part_of: opensource.open-source-software — Linux is described as open-source software.
- part_of: linux.distributions — Linux is distributed through different distributions.

#### Authoring Guidance
- Must cover: Linux as an OS
- Must cover: Open-source/community model
- Must cover: Cost advantages
- Must cover: Distribution model
- Must cover: Hardware compatibility and support tradeoffs
- Nice to cover: Kernel vs distribution distinction

### DISC-012: Open-Source Software

- Proposed ID: `opensource.open-source-software`
- Classification: `teachable`
- Type: `concept`
- Domains: software, operating-systems
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: strong
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- open-source software that is created and maintained by thousands of individuals — Defines Linux as open-source and community maintained.
- Unlike Linux, which is an open-source operating system, all of the Apple operating systems are closed source. — Contrasts open source with closed source.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Open source affects OS support, compatibility, and development model.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: linux.linux — Linux is an example of open-source software.
- contrasts_with: software.closed-source-software — The transcript contrasts Linux open source with Apple closed source OSs.

#### Authoring Guidance
- Must cover: Source code availability
- Must cover: Community maintenance
- Must cover: Contrast with closed source
- Nice to cover: Licensing should be addressed carefully in a later enrichment object
- Note: The source does not define licensing, so avoid legal detail unless enriched.

### DISC-013: Linux Distributions

- Proposed ID: `linux.distributions`
- Classification: `teachable`
- Type: `concept`
- Domains: linux, operating-systems
- Teaching value: high
- Topic confidence: 0.94
- Evidence strength: strong
- Enrichment level: low
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- there are different distributions of Linux — Introduces distributions as a key Linux distinction.
- focused on performing a set of very specific tasks... designed for general use — Shows distributions differ by purpose.
- install the Linux distribution that fit best with your needs — Gives selection purpose.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → desktop-operating-systems — Linux distributions are essential to desktop OS selection.

#### Merge Review
- No merge recommendation.

#### Relationships
- part_of: linux.linux — Distributions are variants/packages of Linux-based OSs.
- related_to: hardware.device-drivers — Different distributions may vary in hardware support.

#### Authoring Guidance
- Must cover: What a distribution is
- Must cover: Task-specific vs general-purpose distributions
- Must cover: Choosing a distribution based on needs
- Must cover: Support and compatibility implications
- Nice to cover: Examples such as Ubuntu, Fedora, Debian, Kali if later evidence supports them

### DISC-014: Linux Hardware Compatibility and Community Support

- Proposed ID: `linux.hardware-support`
- Classification: `teachable`
- Type: `concept`
- Domains: linux, hardware, support
- Teaching value: medium
- Topic confidence: 0.88
- Evidence strength: strong
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- newer hardware or newer laptops may not be 100% compatible with the Linux distribution — Supports compatibility limitations.
- there's no one Linux company you would go to... You would need to use this community — Supports Linux community support model.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → desktop-operating-systems — This belongs with Linux pros/cons and support considerations.

#### Merge Review
- No merge recommendation.

#### Relationships
- depends_on: hardware.device-drivers — Linux hardware compatibility often depends on driver availability.
- related_to: support.community-support — Linux support is framed as community-based.

#### Authoring Guidance
- Must cover: Hardware compatibility may vary
- Must cover: Drivers can be a challenge
- Must cover: Community support model
- Nice to cover: Vendor-supported enterprise Linux as nuance
- Note: Requires nuance: some Linux distributions and vendors provide strong commercial support, though the transcript simplifies this.

### DISC-015: Apple macOS

- Proposed ID: `macos.apple-macos`
- Classification: `teachable`
- Type: `operating-system`
- Domains: macos, operating-systems
- Teaching value: high
- Topic confidence: 0.95
- Evidence strength: strong
- Enrichment level: low
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Apple's Mac OS... runs on Apple hardware exclusively — Introduces macOS and hardware exclusivity.
- well known for its user interface and overall usability — Supports macOS usability reputation.
- Apple manufactures the hardware and then writes the operating system for that same hardware — Explains integration and compatibility.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → desktop-operating-systems — macOS is a major desktop OS in the lesson.

#### Merge Review
- No merge recommendation.

#### Relationships
- depends_on: hardware.apple-hardware — macOS is described as running only on Apple hardware.
- related_to: software.closed-source-software — Apple OSs are later described as closed source.

#### Authoring Guidance
- Must cover: macOS as Apple desktop OS
- Must cover: Apple hardware exclusivity
- Must cover: Usability/UI reputation
- Must cover: Hardware/software integration
- Must cover: Cost and support tradeoffs
- Nice to cover: Mac administration basics in later lessons
- Note: Normalize spelling to macOS even though transcript says Mac OS/MacOss.

### DISC-016: Apple Hardware and OS Integration

- Proposed ID: `apple.hardware-os-integration`
- Classification: `teachable`
- Type: `concept`
- Domains: macos, hardware
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: strong
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Apple manufactures the hardware and then writes the operating system for that same hardware, the entire system is very compatible — Directly supports the integration concept.
- You're not able to run Mac OS on other non-Apple hardware devices. — Shows exclusivity downside.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → desktop-operating-systems — This supports macOS platform comparison.

#### Merge Review
- macos.apple-macos — Apple hardware/OS integration may be best authored as a section inside the macOS object rather than a standalone object.

#### Relationships
- related_to: macos.apple-macos — macOS compatibility is linked to Apple controlling hardware and software.
- depends_on: hardware.apple-hardware — macOS depends on Apple hardware in the transcript.

#### Authoring Guidance
- Must cover: Apple controls hardware and OS
- Must cover: Compatibility benefit
- Must cover: Hardware exclusivity and cost tradeoff
- Nice to cover: Avoid Hackintosh as an exam focus unless relevant elsewhere
- Note: Could be merged into macOS if the platform prefers one object per OS family.

### DISC-017: Chrome OS

- Proposed ID: `chromeos.chrome-os`
- Classification: `teachable`
- Type: `operating-system`
- Domains: chromeos, operating-systems
- Teaching value: high
- Topic confidence: 0.94
- Evidence strength: strong
- Enrichment level: low
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Chrome OS was created by Google and although it's based on the Linux kernel — Introduces Chrome OS origin and Linux kernel basis.
- most of the operating system revolve around the browser itself — Defines browser-centered design.
- applications... inside of that browser — Explains how applications are commonly used.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → desktop-operating-systems — Chrome OS is a desktop/laptop OS covered in the overview.

#### Merge Review
- No merge recommendation.

#### Relationships
- depends_on: linux.linux-kernel — Chrome OS is described as based on the Linux kernel.
- used_for: software.web-application — Chrome OS is presented as centered on browser-based applications.

#### Authoring Guidance
- Must cover: Google-created OS
- Must cover: Linux kernel basis
- Must cover: Browser-centered application model
- Must cover: Low overhead design
- Must cover: Cloud/network dependency
- Nice to cover: Chromebook hardware

### DISC-018: Cloud-Based and Browser-Based Applications

- Proposed ID: `software.web-application`
- Classification: `teachable`
- Type: `concept`
- Domains: software, cloud, operating-systems
- Teaching value: high
- Topic confidence: 0.92
- Evidence strength: strong
- Enrichment level: low
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- applications that you will use in Chrome OS are inside of that browser — Introduces browser-based applications.
- connection to the cloud to be able to run these cloud-based applications — Connects web/cloud apps to network requirements.
- many applications have become web-based... run them in any browser regardless of the operating system — Shows cross-OS benefit of web apps.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Web apps are used to explain cross-platform compatibility.

#### Merge Review
- No merge recommendation.

#### Relationships
- depends_on: networking.network-connectivity — Cloud/browser apps can depend on network connectivity.
- contrasts_with: software.application-os-compatibility — Web apps reduce OS-specific executable compatibility issues.

#### Authoring Guidance
- Must cover: Browser-based applications
- Must cover: Cloud connectivity requirement
- Must cover: Cross-platform browser access
- Must cover: Offline limitation
- Nice to cover: SaaS can be introduced later if supported
- Note: Do not over-expand into full cloud service models from this transcript alone.

### DISC-019: Network Connectivity Requirement

- Proposed ID: `networking.network-connectivity`
- Classification: `teachable`
- Type: `concept`
- Domains: networking, cloud, operating-systems
- Teaching value: medium
- Topic confidence: 0.86
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- there is a significant network connectivity requirement — Explicitly identifies connectivity requirement for Chrome OS/cloud apps.
- if you don't have connectivity, you're not able to use those apps — Explains practical impact of lost connectivity.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Connectivity is an OS/application usage consideration in this lesson.

#### Merge Review
- networking.internet-connectivity — Network connectivity requirement may duplicate a broader networking prerequisite concept if it already exists.

#### Relationships
- depends_on: software.web-application — Some web/cloud apps depend on network connectivity.
- related_to: chromeos.chrome-os — Chrome OS is used as the main example of network-dependent apps.

#### Authoring Guidance
- Must cover: Network connectivity can be required for cloud apps
- Must cover: Loss of connectivity affects application access
- Nice to cover: Offline-capable apps as nuance
- Note: May be merged with a broader networking prerequisite object.

### DISC-020: Apple iPadOS

- Proposed ID: `ios.ipados`
- Classification: `teachable`
- Type: `operating-system`
- Domains: mobile-operating-systems, apple
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- iPad OS includes a desktop browser, specifically Safari — Introduces iPadOS capabilities.
- support a second monitor... Sidecar... keyboard support, multitasking — Shows iPadOS feature set tied to hardware support.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → mobile-operating-systems — iPadOS belongs in mobile/tablet OS coverage.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: apple.ios — The source distinguishes iPadOS from iOS.
- related_to: apple.sidecar — Sidecar is named as an iPadOS feature.

#### Authoring Guidance
- Must cover: iPadOS as Apple tablet OS
- Must cover: Desktop Safari browser
- Must cover: Second monitor/Sidecar mention
- Must cover: Keyboard and multitasking support
- Nice to cover: Differences from iOS
- Note: Sidecar may stay a mention unless later lessons teach it.

### DISC-021: Apple iOS

- Proposed ID: `apple.ios`
- Classification: `teachable`
- Type: `operating-system`
- Domains: mobile-operating-systems, apple
- Teaching value: high
- Topic confidence: 0.94
- Evidence strength: strong
- Enrichment level: low
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- operating system that runs on Apple's iPhones... Apple iOS — Defines iOS as iPhone OS.
- all of the Apple operating systems are closed source — Identifies Apple mobile OS source model.
- iOS is an operating system that will only run on Apple hardware — Identifies hardware exclusivity.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → mobile-operating-systems — iOS is a major mobile OS.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: software.closed-source-software — iOS is described as closed source.
- depends_on: hardware.apple-hardware — iOS is described as running only on Apple hardware.
- related_to: ios.ipados — iOS and iPadOS are related but distinct Apple OSs.

#### Authoring Guidance
- Must cover: iOS as iPhone OS
- Must cover: Closed-source model
- Must cover: Apple hardware exclusivity
- Must cover: Relationship to iPadOS
- Nice to cover: App Store approval process

### DISC-022: Closed-Source Software

- Proposed ID: `software.closed-source-software`
- Classification: `teachable`
- Type: `concept`
- Domains: software, operating-systems
- Teaching value: medium
- Topic confidence: 0.86
- Evidence strength: medium
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- all of the Apple operating systems are closed source. You do not have access to the source code of iOS. — Defines closed-source concept through Apple OS example.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Open vs closed source affects OS comparison.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: opensource.open-source-software — The source contrasts Apple closed-source OSs with Linux open source.
- related_to: apple.ios — iOS is presented as closed source.

#### Authoring Guidance
- Must cover: No public access to source code
- Must cover: Contrast with open source
- Must cover: Apple OSs as examples in this lesson
- Nice to cover: Licensing and vendor control as later enrichment

### DISC-023: Apple App Development and App Store Approval

- Proposed ID: `apple.app-development-app-store`
- Classification: `teachable`
- Type: `concept`
- Domains: mobile-operating-systems, software-development
- Teaching value: medium
- Topic confidence: 0.88
- Evidence strength: strong
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- develop applications for iPad OS, iOS, or even Mac OS... use Apple's software developers kit — Introduces Apple development tooling requirement.
- tested and approved by Apple directly... available in the App Store — Introduces app approval and distribution model.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → mobile-operating-systems — Mobile OS coverage includes app development and store distribution differences.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: apple.ios — Apple app development targets iOS/iPadOS/macOS.
- part_of: software.application-distribution — App Store approval is a software distribution process.

#### Authoring Guidance
- Must cover: Apple SDK requirement
- Must cover: Development on macOS
- Must cover: Apple testing/approval before App Store release
- Nice to cover: Developer accounts and certificates only if future evidence supports
- Note: Could be lower priority for A+ unless app store/security model is emphasized.

### DISC-024: Google Android

- Proposed ID: `android.google-android`
- Classification: `teachable`
- Type: `operating-system`
- Domains: mobile-operating-systems, android
- Teaching value: high
- Topic confidence: 0.95
- Evidence strength: strong
- Enrichment level: low
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Google Android is maintained by a consortium of companies known as the Open Handset Alliance. — Introduces Android governance/support context.
- Android itself is an open-source operating system that's based on Linux. — Defines Android source model and Linux basis.
- supported by many different manufacturers and there are many different types of hardware — Contrasts Android hardware ecosystem with Apple.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → mobile-operating-systems — Android is a major mobile OS.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: opensource.open-source-software — Android is described as open source.
- related_to: linux.linux — Android is described as Linux-based.
- contrasts_with: apple.ios — Android supports many manufacturers, unlike Apple iOS/iPadOS hardware exclusivity.

#### Authoring Guidance
- Must cover: Android as Google-associated mobile OS
- Must cover: Open Handset Alliance mention
- Must cover: Open-source/Linux basis
- Must cover: Multi-manufacturer hardware ecosystem
- Must cover: App development and distribution options
- Nice to cover: AOSP vs Google Mobile Services only if later evidence supports

### DISC-025: Android App Development and Distribution

- Proposed ID: `android.app-development-distribution`
- Classification: `teachable`
- Type: `concept`
- Domains: mobile-operating-systems, software-development
- Teaching value: medium
- Topic confidence: 0.88
- Evidence strength: strong
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- develop apps for Google Android using Windows, Mac OS and Linux using Android software developers kit — Introduces Android SDK and cross-platform development environment.
- available from the Google Play Store and a number of thirdparty sites — Introduces Android distribution paths.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → mobile-operating-systems — Mobile OS coverage includes app development/distribution differences.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: android.google-android — Android development targets Android devices.
- contrasts_with: apple.app-development-app-store — Android distribution is presented as more varied than Apple App Store approval.

#### Authoring Guidance
- Must cover: Android SDK
- Must cover: Development from Windows/macOS/Linux
- Must cover: Google Play and third-party distribution
- Nice to cover: Security implications of third-party app stores later

### DISC-026: Operating System End of Life

- Proposed ID: `os.end-of-life`
- Classification: `teachable`
- Type: `concept`
- Domains: operating-systems, operations, security
- Teaching value: high
- Topic confidence: 0.92
- Evidence strength: strong
- Enrichment level: medium
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- end of life is something we should always be aware of when using an operating system — Introduces EOL as an OS lifecycle concern.
- different companies will set different standards for end of life — Explains vendor-specific EOL differences.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle — EOL belongs in OS maintenance and lifecycle.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: os.patch-management — EOL affects update and support expectations.
- part_of: operational.vendor-support-lifecycle — EOL is part of deployment and support requirements.

#### Authoring Guidance
- Must cover: Meaning of end of life
- Must cover: Vendor differences
- Must cover: Why administrators must track EOL
- Must cover: Security/support implications
- Nice to cover: Difference between EOL and end of support
- Note: Transcript does not provide actual dates; do not include version-specific EOL dates without fresh source verification.

### DISC-027: Operating System Updates and Security Patches

- Proposed ID: `os.patch-management`
- Classification: `teachable`
- Type: `concept`
- Domains: operating-systems, security, operations
- Teaching value: high
- Topic confidence: 0.96
- Evidence strength: strong
- Enrichment level: low
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- requirement to keep these OSS updated with the latest version of software — Introduces update requirement across OSs.
- ensures the operating system will run at peak efficiency... security patches are always updated — Explains performance and security purpose of updates.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle — OS updates are a lifecycle/maintenance function.

#### Merge Review
- security.patch-management — OS patching may overlap with a general security patch-management object; choose whether to model as OS-specific or shared security concept.

#### Relationships
- related_to: security.patch-management — OS updates include security patches.
- related_to: os.end-of-life — EOL affects update and patch availability.

#### Authoring Guidance
- Must cover: Keep OS updated
- Must cover: Updates support efficiency/stability
- Must cover: Security patches reduce risk
- Must cover: Applies across OS vendors
- Nice to cover: Patch testing and rollback as operational procedures
- Note: If a general security.patch-management object exists, this may become an OS-specific facet.

### DISC-028: Cross-Platform Data and File Format Compatibility

- Proposed ID: `software.cross-platform-file-compatibility`
- Classification: `teachable`
- Type: `concept`
- Domains: software, operating-systems
- Teaching value: high
- Topic confidence: 0.92
- Evidence strength: strong
- Enrichment level: low
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- create documents, spreadsheets, media, and other types of data and use those also in other operating systems — Introduces cross-platform data compatibility.
- standard file format that they can move between different operating systems — Explains file format portability.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — Cross-platform compatibility is a foundation concept in OS comparison.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: software.application-os-compatibility — File/data compatibility can exist even when executables are OS-specific.
- related_to: software.web-application — Web apps provide another cross-platform compatibility path.

#### Authoring Guidance
- Must cover: Documents/media can move across OSs
- Must cover: Standard file formats
- Must cover: Distinguish file compatibility from executable compatibility
- Nice to cover: Examples such as PDF, JPG, CSV only if enriched

### DISC-029: Hardware Platform Differences Across Operating Systems

- Proposed ID: `os.hardware-platform-compatibility`
- Classification: `teachable`
- Type: `concept`
- Domains: operating-systems, hardware
- Teaching value: medium
- Topic confidence: 0.88
- Evidence strength: strong
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- different operating systems run on different hardware and the operating systems are written by different organizations — Introduces OS/hardware/vendor differences.
- not able to run Mac OS on other non-Apple hardware devices — Gives a specific example of hardware platform limitation.
- Android is supported by many different manufacturers — Gives a contrasting multi-manufacturer example.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — OS selection depends partly on supported hardware platforms.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: macos.apple-macos — macOS is presented as Apple-hardware-specific.
- contrasts_with: android.google-android — Android is presented as multi-manufacturer.
- related_to: hardware.device-drivers — Drivers also affect OS/hardware support.

#### Authoring Guidance
- Must cover: OSs vary by hardware support
- Must cover: Vendor control affects compatibility
- Must cover: Examples: macOS vs Android/Windows/Linux
- Nice to cover: CPU architecture as later enrichment

### DISC-030: OS Deployment and Support Requirements

- Proposed ID: `operational.os-deployment-support`
- Classification: `teachable`
- Type: `concept`
- Domains: operations, operating-systems
- Teaching value: medium
- Topic confidence: 0.84
- Evidence strength: medium
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- different deployment and support requirements — Introduces deployment/support as an administrative concern.
- different companies will set different standards for end of life — Provides example of vendor-specific support requirements.

#### Curriculum Placement
- a-plus-220-1202 → 4.0 → operational-procedures-foundations — Deployment/support awareness is an operational procedure concern.

#### Merge Review
- No merge recommendation.

#### Relationships
- part_of: os.end-of-life — EOL is one support requirement to track.
- related_to: os.patch-management — Support requirements influence updates and patches.

#### Authoring Guidance
- Must cover: OS vendors differ in deployment/support rules
- Must cover: Administrators must track support lifecycle
- Must cover: EOL as a specific support concern
- Nice to cover: Documentation and change management in later modules
- Note: May be a bridge concept between OS foundations and operational procedures.

## Knowledge Gaps

### GAP-001: Kernel concept is assumed but not explained

- Severity: medium
- Basis: ai-inference
- Related concepts: chromeos.chrome-os, linux.linux, linux.linux-kernel
- Description: Chrome OS is described as based on the Linux kernel, but the transcript does not define what a kernel is or how it differs from an operating system/distribution.
- Recommendation: Create or link a brief prerequisite concept for operating system kernel before deeper Chrome OS/Linux coverage.

### GAP-002: Source code concept is assumed

- Severity: low
- Basis: ai-inference
- Related concepts: opensource.open-source-software, software.closed-source-software
- Description: Open-source and closed-source operating systems are contrasted, but source code itself is not defined.
- Recommendation: Create or link a small supporting concept explaining source code access in software models.

### GAP-003: Security patching lacks vulnerability context

- Severity: medium
- Basis: ai-inference
- Related concepts: os.patch-management, security.vulnerability
- Description: The transcript says updates keep security patches current, but it does not explain vulnerabilities, exploits, or why unpatched systems are risky.
- Recommendation: Enrich the patch-management authoring stage with vulnerability and risk context.

### GAP-004: Driver troubleshooting is mentioned but not procedural

- Severity: medium
- Basis: ai-inference
- Related concepts: hardware.device-drivers, linux.hardware-support, windows.microsoft-windows
- Description: Driver quality and hardware integration challenges are discussed, but no troubleshooting process is provided.
- Recommendation: Link later troubleshooting lessons to driver installation, update, rollback, and compatibility checks.

### GAP-005: OS version lifecycle needs authoritative dates later

- Severity: medium
- Basis: ai-inference
- Related concepts: os.end-of-life, os.patch-management
- Description: End of life is introduced, but no version-specific support dates are provided and those dates change over time.
- Recommendation: Keep this transcript intelligence generic; require fresh vendor-source enrichment when authoring version-specific EOL details.

### GAP-006: Application compatibility exceptions are not covered

- Severity: low
- Basis: ai-inference
- Related concepts: software.application-os-compatibility, software.web-application
- Description: The transcript correctly states that a Windows executable cannot simply run in Linux, but does not discuss compatibility layers, virtualization, or web apps until later at a high level.
- Recommendation: Author the core rule now and optionally link later concepts for compatibility layers, virtualization, containers, or browser-based apps.

## Rejected Mentions

- **Desktop computer** (mentioned-only): Used only as an example of a computing device; does not exceed the teaching threshold in this lesson.
- **Laptop computer** (mentioned-only): Used as an example device and in hardware compatibility context, but not taught as a standalone concept here.
- **Tablet** (mentioned-only): Mentioned as a computing device category; iPadOS is the teachable concept instead.
- **Mobile phone** (mentioned-only): Mentioned as a computing device category; iOS/Android are the teachable concepts instead.
- **Keyboard** (mentioned-only): Serves as an input-device example, but does not warrant a separate object from this evidence.
- **Mouse** (mentioned-only): Serves as an input-device example only.
- **Printer** (mentioned-only): Serves as an output-device example only; printer concepts should come from printer-specific lessons.
- **Display or monitor** (mentioned-only): Used only as an output example and desktop screenshot reference.
- **Recycle Bin** (mentioned-only): Mentioned as a Windows desktop icon, but not explained sufficiently for authoring.
- **Taskbar** (mentioned-only): Used as a UI comparison example but not taught procedurally.
- **Safari** (mentioned-only): Named as iPadOS browser, but browser specifics are not taught.
- **Sidecar** (mentioned-only): Named as an iPadOS feature but not explained enough for standalone authoring.
- **Google Chrome browser** (mentioned-only): Referenced to explain Chrome OS naming and browser-centered design; web/browser-based applications are the broader teachable concept.
- **Open Handset Alliance** (mentioned-only): Named as Android maintainer consortium, but not explained enough for standalone object.
- **Google Play Store** (mentioned-only): Mentioned as a distribution path; included under Android app distribution rather than separate object.
- **Documents, spreadsheets, and media** (mentioned-only): Examples of portable data types; the teachable concept is cross-platform file format compatibility.

## Import Notes

- This file is a Transcript Intelligence discovery package, not a draft Knowledge Object package.
- Discovery review decides which concepts move to Knowledge Authoring.
- Curriculum placement and relationship suggestions are reviewable metadata until promoted through the proper workflow.
- This output intentionally does not create Knowledge Objects; it is a reviewable curriculum discovery package.
- Version-specific lifecycle dates for Windows, macOS, iOS, Android, or Chrome OS should not be authored from this transcript alone because they change and require vendor-source verification.
- Several OS-family concepts may become deep canonical objects, while lower-level support concepts such as Sidecar, Safari, Recycle Bin, and taskbar should remain mentions unless later evidence teaches them directly.
- Potential duplicate risks exist around file management vs file systems, OS patching vs security patch management, and web applications vs cloud/SaaS concepts.
- Spelling normalized in proposed IDs and titles where the transcript contains variants such as MacOss, OSS, laptopbased, and thirdparty.

## Next Step

Use this manifest as the input context for AI-assisted Discovery Review. The review output should decide which concepts are accepted, merged, deferred, rejected, or sent to Knowledge Authoring.
