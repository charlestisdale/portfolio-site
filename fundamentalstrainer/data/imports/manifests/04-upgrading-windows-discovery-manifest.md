# Discovery Manifest: Upgrading Windows

This manifest is a review view of a Transcript Intelligence package. It is not canonical knowledge and it is not a draft Knowledge Object export.

## Package Summary

- Source file: `data/imports/pending/04-transcript-intelligence.json`
- Source transcript: `data/transcripts/cleaned/a-plus-220-1202/04-Upgrading Windows.txt`
- Schema: `pending-transcript-intelligence.v1`
- Certification: `a-plus-220-1202`
- Lesson: `04`
- Concepts discovered: 19
- Knowledge gaps: 5
- Merge recommendations: 14
- Rejected mentions: 9

## Classification Counts

- mentioned-only: 1
- merge-existing: 6
- teachable: 12

## Review Attention

- High-priority concepts: 1
- Weak evidence + high enrichment concepts: 1
- Concepts with merge recommendations: 14

### High-Priority Concepts

- DISC-012: Windows 11 System Requirements (windows.windows-11-requirements)

### Weak Evidence / High Enrichment Concepts

- DISC-019: User Preferences Preservation (os.user-preferences-preservation)

## Concepts for Discovery Review

### DISC-001: Operating System Upgrade

- Proposed ID: `os.upgrade`
- Classification: `merge-existing`
- Type: `concept`
- Domains: operating-systems, os-maintenance
- Teaching value: high
- Topic confidence: 0.96
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Review merge target before authoring.**

#### Source Evidence
- Upgrade means that you already have an operating system in place and you'd like to keep all of your applications and all of your files exactly where they are — Defines upgrade as preserving existing apps and files while updating the OS.
- By simply upgrading, you're leaving your configurations in place and all of your user accounts — Shows the purpose and value of upgrades for systems with users and configurations.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle — Upgrade planning belongs with OS maintenance and lifecycle decisions.

#### Merge Review
- os.in-place-upgrade — The source uses upgrade primarily as the broader lead-in to in-place upgrade; avoid creating a duplicate separate object unless the curriculum needs an umbrella concept.
- os.in-place-upgrade — General upgrade is mainly used to introduce in-place upgrade in this source.
- os.in-place-upgrade — The source uses upgrade primarily as the broader lead-in to in-place upgrade; avoid creating a duplicate separate object unless the curriculum needs an umbrella concept.

#### Relationships
- related_to: os.in-place-upgrade — An in-place upgrade is the specific upgrade method described in the lesson.
- contrasts_with: os.clean-install — The lesson contrasts upgrading with starting over through a clean install.

#### Authoring Guidance
- Must cover: Upgrade preserves applications, files, user accounts, and settings.
- Must cover: Use upgrades when preserving existing configuration is important.
- Nice to cover: Risks still require compatibility checking and backups.
- Note: Consider using this as a parent concept only if the graph supports broad umbrella nodes.

### DISC-002: In-Place Upgrade

- Proposed ID: `os.in-place-upgrade`
- Classification: `teachable`
- Type: `concept`
- Domains: operating-systems, windows
- Teaching value: high
- Topic confidence: 0.98
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- An in place upgrade will upgrade the existing operating system, but keep everything in place on your system. — Directly defines the concept.
- It's common to start an in place upgrade by launching the installation process from inside of the existing OS. — Adds procedure-level evidence for how an in-place upgrade commonly begins.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle — This is a core OS maintenance procedure for moving to a newer Windows version while preserving data.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: os.clean-install — The source explicitly compares in-place upgrade and clean install.
- depends_on: windows.pc-health-check — Compatibility checking should occur before upgrading Windows.

#### Authoring Guidance
- Must cover: Preserves applications, documents, settings, local user accounts, and OS context.
- Must cover: Usually launched from inside the existing operating system.
- Must cover: Best when user data, applications, or specialized configuration should remain in place.
- Must cover: Still requires compatibility checks and backup planning.
- Nice to cover: Common Windows upgrade workflow.
- Nice to cover: Risk of incompatible apps or drivers.
- Note: Keep distinct from clean install and repair install.

### DISC-003: Clean Install

- Proposed ID: `os.clean-install`
- Classification: `teachable`
- Type: `concept`
- Domains: operating-systems, windows
- Teaching value: high
- Topic confidence: 0.98
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Installing means you're effectively starting over completely fresh. — Introduces clean installation as a fresh-start installation method.
- This is compared to a clean install which wipes everything on that system. — Shows the major consequence of a clean install.
- You would normally begin a clean install from the boot process of your computer by booting from the installation media. — Provides a procedure-level distinction from in-place upgrades.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle — Clean installation is a core Windows deployment and maintenance decision.

#### Merge Review
- No merge recommendation.

#### Relationships
- contrasts_with: os.in-place-upgrade — Clean install removes existing content while in-place upgrade preserves it.
- used_for: boot.installation-media — The source says clean installs normally begin by booting from installation media.

#### Authoring Guidance
- Must cover: Removes existing OS files, applications, user data, and settings.
- Must cover: Usually starts by booting from installation media.
- Must cover: Requires backup and drive/partition review before proceeding.
- Must cover: Use when a fresh system state is desired.
- Nice to cover: Recovery limits after repartitioning and reformatting.
- Nice to cover: When clean installs are preferred over upgrades.
- Note: Do not turn this into a full Windows install walkthrough unless a separate procedure object exists.

### DISC-004: Backup Before OS Installation

- Proposed ID: `storage.backup-before-os-installation`
- Classification: `merge-existing`
- Type: `troubleshooting-step`
- Domains: storage, operating-systems, operational-procedures
- Teaching value: high
- Topic confidence: 0.95
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Review merge target before authoring.**

#### Source Evidence
- If you're planning this route, it's always a good idea to back up everything that's on the system already. — Establishes backup as a required preparation step for clean installs.
- If you have a backup, you can recover that information relatively easy, even though you did a clean install. — Explains the recovery purpose of backups.

#### Curriculum Placement
- a-plus-220-1202 → 4.0 → operational-procedures-foundations — Backup before destructive changes is an operational procedure and risk-control practice.

#### Merge Review
- storage.backup — This is a contextual use of backup rather than a fundamentally separate concept.
- storage.backup — Backup before OS installation is a contextual application of general backup knowledge.
- storage.backup — This is a contextual use of backup rather than a fundamentally separate concept.

#### Relationships
- used_for: os.clean-install — Backups are emphasized as preparation for clean installation.
- related_to: operational-procedures.change-management — Backing up before destructive work is a safe operational practice.

#### Authoring Guidance
- Must cover: Back up data before clean installation or destructive partition changes.
- Must cover: Backups provide recovery if the user later remembers needed files.
- Nice to cover: Preference capture and application settings export.
- Note: Could be added as an OS-installation use case under a general backup object.

### DISC-005: Partitioning and Formatting During Installation

- Proposed ID: `storage.partition-formatting-during-installation`
- Classification: `merge-existing`
- Type: `concept`
- Domains: storage, operating-systems
- Teaching value: medium
- Topic confidence: 0.91
- Evidence strength: medium
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Review merge target before authoring.**

#### Source Evidence
- check to see if there's any other partitions on this drive that maybe the user is not currently aware of — Highlights partition review as an installation planning task.
- once you repartition and reformat that drive, it's very difficult, if not impossible, to recover that data — Shows the risk associated with partitioning and formatting.
- those features are usually built into the installation process itself — Explains that partitioning and formatting tools are usually included in the OS installer.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → file-systems — Partitioning and formatting bridge storage preparation and OS installation.

#### Merge Review
- storage.partition-formatting — A prior or general partition/formatting object likely already covers this; this lesson adds installation-specific context.
- storage.partition-formatting — Installation partitioning/formatting should enrich the existing partition-formatting object if present.
- storage.partition-formatting — A prior or general partition/formatting object likely already covers this; this lesson adds installation-specific context.

#### Relationships
- part_of: os.clean-install — Partition clearing and formatting are commonly part of a clean install workflow.
- contrasts_with: storage.data-recovery — The source warns recovery after repartitioning/reformatting may be difficult or impossible.

#### Authoring Guidance
- Must cover: Inspect existing data and partitions before deleting or formatting.
- Must cover: OS installers usually include partitioning and formatting options.
- Must cover: Data recovery after repartitioning/reformatting may be very difficult.
- Nice to cover: Difference between deleting a partition and formatting a partition.
- Note: Use as enrichment for existing storage install-prep content.

### DISC-006: OS Hardware Compatibility Check

- Proposed ID: `os.hardware-compatibility-check`
- Classification: `teachable`
- Type: `troubleshooting-step`
- Domains: operating-systems, hardware, windows
- Teaching value: high
- Topic confidence: 0.97
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- check the requirements for that OS. Check to see that your system has enough memory, has enough spare drive space — Identifies the compatibility checks that should occur before upgrade or install.
- Microsoft includes a nice hardware compatibility check that you can run — Shows that vendor tools can validate readiness for Windows upgrades.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle — Hardware compatibility checks are a planning requirement before OS upgrade.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: windows.pc-health-check — PC Health Check is the Windows 11 compatibility tool discussed in the source.
- depends_on: os.in-place-upgrade — Upgrade decisions depend on whether the hardware can run the target OS.

#### Authoring Guidance
- Must cover: Check memory, drive space, processor support, and feature support.
- Must cover: Use vendor documentation and compatibility tools.
- Must cover: Run checks before upgrade or installation.
- Must cover: Incompatibility may require resource upgrades or hardware replacement.
- Nice to cover: Compatibility planning for applications and device drivers.
- Note: Keep OS requirement checking separate from PC Health Check as a specific Windows tool.

### DISC-007: Windows PC Health Check

- Proposed ID: `windows.pc-health-check`
- Classification: `teachable`
- Type: `tool`
- Domains: windows, operating-systems, hardware
- Teaching value: medium
- Topic confidence: 0.96
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- For Windows 11, Microsoft refers to this application as the PC health check for Windows 11. — Names the tool used for Windows 11 upgrade readiness.
- PC health check tells us this PC doesn't currently meet the Windows 11 system requirements. — Shows how the tool reports pass/fail readiness information.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → desktop-operating-systems — This is a Windows-specific readiness tool used during Windows upgrade planning.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: windows.windows-11-requirements — The tool evaluates whether a PC meets Windows 11 system requirements.
- related_to: security.tpm-2-0 — The example output flags TPM 2.0 as a Windows 11 requirement.

#### Authoring Guidance
- Must cover: Purpose: checks Windows 11 readiness.
- Must cover: Reports which requirements are met or not met.
- Must cover: Can identify missing Secure Boot or TPM 2.0 support/enablement.
- Nice to cover: Where to obtain the tool should be verified from current Microsoft documentation before publishing.
- Note: Avoid hardcoding current download steps without checking Microsoft documentation.

### DISC-008: Application and Driver Compatibility

- Proposed ID: `windows.application-driver-compatibility`
- Classification: `teachable`
- Type: `concept`
- Domains: windows, software, hardware
- Teaching value: medium
- Topic confidence: 0.9
- Evidence strength: medium
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- certain applications or certain device drivers will not be compatible in the newer version of the operating system — Identifies compatibility risk when upgrading OS versions.
- check the documentation from all of your app developers and check the details of all of your device drivers — Provides planning guidance for verifying compatibility.

#### Curriculum Placement
- a-plus-220-1202 → 3.0 → software-troubleshooting-foundations — Incompatible apps or drivers are common upgrade-related troubleshooting issues.

#### Merge Review
- No merge recommendation.

#### Relationships
- depends_on: os.in-place-upgrade — Application and driver compatibility can determine whether an upgrade is safe.
- related_to: hardware.device-driver — The source specifically calls out device drivers as a compatibility concern.

#### Authoring Guidance
- Must cover: Apps and device drivers may not support a newer OS version.
- Must cover: Check vendor/developer documentation before upgrading.
- Must cover: Compatibility problems can block or complicate upgrades.
- Nice to cover: Rollback planning and driver updates.
- Note: Needs some enrichment beyond the transcript for practical troubleshooting examples.

### DISC-009: Windows Product Lifecycle

- Proposed ID: `windows.product-lifecycle`
- Classification: `teachable`
- Type: `concept`
- Domains: windows, os-maintenance
- Teaching value: high
- Topic confidence: 0.94
- Evidence strength: strong
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- Most operating system manufacturers will give you a life cycle calendar. — Introduces lifecycle calendars as planning tools.
- This will tell you when this operating system is in support and when this operating system will be retired from support. — Explains the lifecycle calendar's purpose.
- Microsoft refers to this as the modern life cycle policy. — Names the Microsoft-specific lifecycle policy context.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle — Lifecycle planning determines when operating systems should be upgraded or retired.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: os.end-of-life — Lifecycle calendars identify retirement from support/end-of-life timing.
- related_to: os.patch-management — The source connects lifecycle with quality updates, security updates, and bug fixes.

#### Authoring Guidance
- Must cover: Lifecycle calendars show support and retirement dates.
- Must cover: Lifecycle status affects upgrade planning.
- Must cover: Microsoft's Windows lifecycle information is published by Microsoft.
- Must cover: Quality and feature updates are tied to lifecycle support.
- Nice to cover: Terminology such as end of support and end of life.
- Nice to cover: Need to verify current support dates from Microsoft when publishing.
- Note: Do not hardcode current support windows without live vendor verification.

### DISC-010: Quality Updates

- Proposed ID: `windows.quality-updates`
- Classification: `merge-existing`
- Type: `concept`
- Domains: windows, os-maintenance
- Teaching value: medium
- Topic confidence: 0.88
- Evidence strength: medium
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Review merge target before authoring.**

#### Source Evidence
- This life cycle usually starts with quality updates where you get monthly security updates, monthly bug fixes — Defines quality updates in the context of lifecycle maintenance.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle — Quality updates are part of maintaining supported Windows versions.

#### Merge Review
- os.patch-management — The lesson mentions quality updates mainly as part of patch management/lifecycle, not as a deep standalone topic.
- os.patch-management — Quality updates fit under patch/update management unless the curriculum models Windows update types separately.
- os.patch-management — The lesson mentions quality updates mainly as part of patch management/lifecycle, not as a deep standalone topic.

#### Relationships
- part_of: os.patch-management — Monthly security and bug-fix updates are patches.
- part_of: windows.product-lifecycle — The source discusses quality updates as a phase within lifecycle support.

#### Authoring Guidance
- Must cover: Quality updates include regular security and bug-fix updates.
- Nice to cover: Difference from feature updates.
- Note: Better as enrichment under patch management unless Windows update taxonomy is a dedicated module.

### DISC-011: Feature Updates

- Proposed ID: `windows.feature-updates`
- Classification: `merge-existing`
- Type: `concept`
- Domains: windows, os-maintenance
- Teaching value: medium
- Topic confidence: 0.86
- Evidence strength: medium
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Review merge target before authoring.**

#### Source Evidence
- You might also get feature updates. These are usually released with new capabilities in the operating system — Defines feature updates as updates that introduce new OS capabilities.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle — Feature updates are part of OS version maintenance and upgrade planning.

#### Merge Review
- os.patch-management — Feature updates may fit under a broader patch/update management object unless detailed Windows update taxonomy is planned.
- os.patch-management — Feature updates are an OS update type and may belong under broader patch/update management.
- os.patch-management — Feature updates may fit under a broader patch/update management object unless detailed Windows update taxonomy is planned.

#### Relationships
- contrasts_with: windows.quality-updates — Quality updates fix/security-update the OS, while feature updates add capabilities.
- related_to: windows.product-lifecycle — Feature updates are discussed in the context of lifecycle support timing.

#### Authoring Guidance
- Must cover: Feature updates introduce new operating system capabilities.
- Must cover: They differ from quality updates.
- Nice to cover: Cadence varies by OS/version and should be verified before publishing.
- Note: Use lifecycle content as context.

### DISC-012: Windows 11 System Requirements

- Proposed ID: `windows.windows-11-requirements`
- Classification: `teachable`
- Type: `concept`
- Domains: windows, hardware, security
- Teaching value: high
- Topic confidence: 0.97
- Evidence strength: strong
- Enrichment level: medium
- Review priority: high
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- this PC must support secure boot. TPM2.0 must be supported and enabled — Lists specific Windows 11 requirements from the PC Health Check example.
- This system does meet the requirements for the processor... and there is enough memory — Shows processor and memory as evaluated requirement categories.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → desktop-operating-systems — Windows 11 requirements are Windows-specific OS installation and upgrade knowledge.

#### Merge Review
- No merge recommendation.

#### Relationships
- related_to: windows.pc-health-check — PC Health Check evaluates Windows 11 requirements.
- depends_on: security.tpm-2-0 — The source states Windows 11 requires TPM 2.0 support and enablement.
- depends_on: security.secure-boot — The source states Windows 11 requires Secure Boot.

#### Authoring Guidance
- Must cover: Secure Boot requirement.
- Must cover: TPM 2.0 supported and enabled.
- Must cover: Processor and memory compatibility checks.
- Must cover: Drive space and feature support checks from OS documentation.
- Nice to cover: Current full Windows 11 requirements should be verified from Microsoft before final publication.
- Note: High review priority because exact Windows 11 requirements can change or have edition/version nuance.

### DISC-013: Trusted Platform Module 2.0

- Proposed ID: `security.tpm-2-0`
- Classification: `teachable`
- Type: `security-control`
- Domains: security, hardware, windows
- Teaching value: high
- Topic confidence: 0.98
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- One of the big requirements for Windows 11 is that you have a TPM, a trusted platform module. — Defines TPM as a major Windows 11 requirement.
- This is usually hardware on the motherboard of this system — Identifies TPM as motherboard-related hardware.
- This is cryptographic hardware, and it's important to use this for Bit Locker, Windows Hello — Explains TPM purpose and related Windows features.

#### Curriculum Placement
- a-plus-220-1202 → 2.0 → security-foundations — TPM is a hardware-backed security control used by Windows security features.

#### Merge Review
- No merge recommendation.

#### Relationships
- part_of: windows.windows-11-requirements — TPM 2.0 is a Windows 11 requirement in the lesson.
- used_for: security.bitlocker — The source says TPM is important for BitLocker.
- used_for: identity.windows-hello — The source says TPM is important for Windows Hello.
- related_to: windows.tpm-msc — TPM.MSC is used to check TPM details.

#### Authoring Guidance
- Must cover: TPM is hardware-backed cryptographic capability.
- Must cover: TPM 2.0 or later is required for Windows 11 in this lesson context.
- Must cover: TPM can be used by BitLocker and Windows Hello.
- Must cover: TPM may need to be supported and enabled.
- Nice to cover: Firmware TPM vs discrete TPM if covered later.
- Nice to cover: Where TPM settings may appear in UEFI setup.
- Note: Keep current OS requirement wording verified during authoring.

### DISC-014: TPM Management Console Snap-in

- Proposed ID: `windows.tpm-msc`
- Classification: `teachable`
- Type: `command`
- Domains: windows, security
- Teaching value: medium
- Topic confidence: 0.95
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- you can run the TPM. MSC. This is the Microsoft snap-in for the Microsoft management console — Identifies TPM.MSC as a Windows management console snap-in.
- gives you all of the details about the TPM that's in your system — Explains the purpose of the command/tool.

#### Curriculum Placement
- a-plus-220-1202 → 2.0 → security-foundations — The tool verifies a hardware-backed security feature required by Windows 11.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: security.tpm-2-0 — TPM.MSC checks the TPM present in the system.
- used_for: windows.windows-11-requirements — TPM status matters for Windows 11 upgrade readiness.

#### Authoring Guidance
- Must cover: tpm.msc opens TPM management details.
- Must cover: It is an MMC snap-in.
- Must cover: Use it to verify TPM status and version/readiness.
- Nice to cover: Common output fields should be verified when authoring with screenshots or current Windows behavior.
- Note: Command object should link to TPM concept, not duplicate TPM explanation.

### DISC-015: UEFI Firmware

- Proposed ID: `firmware.uefi`
- Classification: `merge-existing`
- Type: `operating-system`
- Domains: firmware, hardware, windows
- Teaching value: high
- Topic confidence: 0.94
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Review merge target before authoring.**

#### Source Evidence
- Windows 11 also requires a modern version of a BIOS, specifically the UEFI BIOS. — Connects UEFI firmware to Windows 11 support.
- It's one that provides capabilities for secure boot — Identifies Secure Boot capability as a UEFI-related feature.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → operating-system-foundations — UEFI is firmware support required for modern Windows startup and security features.

#### Merge Review
- firmware.uefi — A UEFI Knowledge Object likely already exists from firmware lessons; this source adds Windows 11 upgrade context.
- firmware.uefi — UEFI was likely already authored from firmware lessons; this transcript adds Windows 11 requirement context.
- firmware.uefi — A UEFI Knowledge Object likely already exists from firmware lessons; this source adds Windows 11 upgrade context.

#### Relationships
- used_for: security.secure-boot — The source says UEFI provides capabilities for Secure Boot.
- part_of: windows.windows-11-requirements — The source frames UEFI as a Windows 11 requirement.

#### Authoring Guidance
- Must cover: UEFI is required for Windows 11 in the lesson context.
- Must cover: UEFI enables Secure Boot capability.
- Must cover: Older systems without UEFI may need replacement.
- Nice to cover: Difference from legacy BIOS should remain in the firmware object.
- Note: Use this lesson to enrich UEFI with Windows 11 requirement relationships.

### DISC-016: Secure Boot

- Proposed ID: `security.secure-boot`
- Classification: `teachable`
- Type: `security-control`
- Domains: security, firmware, windows
- Teaching value: high
- Topic confidence: 0.96
- Evidence strength: strong
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- this PC must support secure boot — Identifies Secure Boot as a Windows 11 requirement.
- Windows 11 requires secure boot to operate. — Directly states Secure Boot requirement for Windows 11.
- You can check the status of secure boot on your system by running the system information utility — Adds a verification procedure for Secure Boot status.

#### Curriculum Placement
- a-plus-220-1202 → 2.0 → security-foundations — Secure Boot is a firmware-backed security control and Windows 11 requirement.

#### Merge Review
- No merge recommendation.

#### Relationships
- depends_on: firmware.uefi — The lesson says UEFI provides Secure Boot capability.
- used_for: windows.system-information — System Information can be used to check Secure Boot State.
- part_of: windows.windows-11-requirements — Secure Boot is listed as a Windows 11 requirement.

#### Authoring Guidance
- Must cover: Secure Boot is required for Windows 11 in this lesson context.
- Must cover: Secure Boot is tied to UEFI firmware.
- Must cover: Status can be checked in System Information under System Summary.
- Must cover: Enabled/on status is the desired state for Windows 11 readiness.
- Nice to cover: Why Secure Boot matters should be added from security curriculum context.
- Note: If a Secure Boot object already exists, merge or enrich instead of duplicating.

### DISC-017: Windows System Information Utility

- Proposed ID: `windows.system-information`
- Classification: `teachable`
- Type: `tool`
- Domains: windows, hardware, security
- Teaching value: medium
- Topic confidence: 0.91
- Evidence strength: medium
- Enrichment level: low
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- You can check the status of secure boot on your system by running the system information utility — Identifies the utility as the method for checking Secure Boot status.
- under the system summary section... the one you're looking for is the one that says secure boot state — Provides exact location of the relevant field.

#### Curriculum Placement
- a-plus-220-1202 → 1.0 → desktop-operating-systems — System Information is a Windows utility used for hardware/security readiness checks.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: security.secure-boot — System Information is used to check Secure Boot State.
- used_for: windows.windows-11-requirements — Secure Boot status helps determine Windows 11 readiness.

#### Authoring Guidance
- Must cover: System Information can be used to inspect System Summary details.
- Must cover: Secure Boot State is checked there.
- Must cover: Secure Boot should be on for Windows 11 readiness.
- Nice to cover: The command name msinfo32 may be useful enrichment.
- Note: The transcript does not name msinfo32 directly; include only if allowed as general Windows knowledge.

### DISC-018: Installation Planning Questions

- Proposed ID: `os.installation-planning`
- Classification: `teachable`
- Type: `troubleshooting-step`
- Domains: operating-systems, operational-procedures
- Teaching value: medium
- Topic confidence: 0.89
- Evidence strength: medium
- Enrichment level: medium
- Review priority: normal
- Recommendation: **Candidate for Knowledge Authoring after discovery review.**

#### Source Evidence
- you need to know what drive you're going to install this operating system on — Identifies drive selection as a pre-install planning question.
- what type of configuration you're going to use for the partitions — Identifies partition configuration as a planning question.
- you might also want to have any necessary license keys available — Identifies licensing information as a preparation item.

#### Curriculum Placement
- a-plus-220-1202 → 4.0 → operational-procedures-foundations — This is a checklist-style procedure for reducing risk before OS installation or upgrade.

#### Merge Review
- No merge recommendation.

#### Relationships
- used_for: os.clean-install — Drive, partition, and licensing decisions are needed before installation.
- used_for: os.in-place-upgrade — Upgrade preparation also requires requirements and compatibility planning.

#### Authoring Guidance
- Must cover: Confirm target drive.
- Must cover: Plan partition configuration.
- Must cover: Have license keys available.
- Must cover: Check data, partitions, backups, requirements, apps, and drivers before proceeding.
- Nice to cover: Use as a procedural checklist rather than a conceptual lesson.
- Note: Good candidate for a study guide/checklist artifact later.

### DISC-019: User Preferences Preservation

- Proposed ID: `os.user-preferences-preservation`
- Classification: `mentioned-only`
- Type: `concept`
- Domains: operating-systems, operational-procedures
- Teaching value: low
- Topic confidence: 0.78
- Evidence strength: weak
- Enrichment level: high
- Review priority: low
- Recommendation: **Reject or keep as mention.**

#### Source Evidence
- It might also be a good idea to save any user preferences — Mentions preserving user preferences before installation.

#### Curriculum Placement
- a-plus-220-1202 → 4.0 → operational-procedures-foundations — Saving preferences is a preparation step before disruptive system work.

#### Merge Review
- storage.backup — Mention is too thin for standalone authoring; merge as a note into backup or installation planning.
- storage.backup — User preference preservation is a weak mention best handled as backup/install-planning enrichment.
- storage.backup — Mention is too thin for standalone authoring; merge as a note into backup or installation planning.

#### Relationships
- related_to: os.clean-install — Preferences may need to be restored after a clean install.

#### Authoring Guidance
- Nice to cover: Export or document application settings before reinstalling when possible.
- Note: Only one weak source mention.

## Knowledge Gaps

### GAP-001: Installation Media Details Are Assumed

- Severity: medium
- Basis: ai-inference
- Related concepts: os.clean-install, boot.installation-media
- Description: The lesson says clean installs normally begin by booting from installation media, but does not explain how installation media is created, selected, or booted.
- Recommendation: Link to or create a supporting installation media concept/procedure.

### GAP-002: Backup Scope and Verification Are Not Explained

- Severity: medium
- Basis: ai-inference
- Related concepts: storage.backup, storage.backup-before-os-installation, os.user-preferences-preservation
- Description: The source strongly recommends backup but does not explain what should be backed up, how to verify recoverability, or how to handle user profiles and application settings.
- Recommendation: Enrich the backup concept with OS installation scenarios, verification, user data scope, and preference capture.

### GAP-003: Current Windows 11 Requirements Require Vendor Verification

- Severity: high
- Basis: ai-inference
- Related concepts: windows.windows-11-requirements, windows.pc-health-check
- Description: The transcript provides examples of Secure Boot, TPM 2.0, processor, and memory checks, but exact Windows 11 requirements are vendor-maintained and may change or contain edition/version nuance.
- Recommendation: During Knowledge Authoring, verify exact Windows 11 requirements against current Microsoft documentation.

### GAP-004: TPM Purpose Is Brief

- Severity: medium
- Basis: ai-inference
- Related concepts: security.tpm-2-0, security.bitlocker, identity.windows-hello
- Description: The source identifies TPM as cryptographic hardware and links it to BitLocker and Windows Hello, but does not explain hardware root of trust, key protection, or enablement locations.
- Recommendation: Author TPM as a normal-depth security concept and link to BitLocker and Windows Hello rather than expanding those features here.

### GAP-005: Lifecycle Policy Timing Should Not Be Hardcoded From Transcript

- Severity: medium
- Basis: ai-inference
- Related concepts: windows.product-lifecycle, os.end-of-life
- Description: The transcript gives general support-duration ranges, but current support dates and lifecycle policy details should be confirmed with Microsoft.
- Recommendation: Use the transcript for concept discovery, but verify exact lifecycle dates and policy terminology before final authoring.

## Rejected Mentions

- **Local User Accounts** (mentioned-only): Mentioned as a reason to prefer an upgrade, but not explained enough to become a Knowledge Object here.
- **License Keys** (mentioned-only): Mentioned as an installation preparation item but not explained technically.
- **Processor Requirement** (mentioned-only): Processor compatibility is listed as one PC Health Check result but lacks enough detail for a standalone object.
- **Memory Requirement** (mentioned-only): Memory is listed as a requirement check but the lesson does not teach memory concepts.
- **Drive Space Requirement** (mentioned-only): Spare drive space is mentioned as part of OS requirement checking without enough detail for standalone authoring.
- **BitLocker** (mentioned-only): Referenced as a TPM use case, but not explained in this lesson.
- **Windows Hello** (mentioned-only): Referenced as a TPM use case, but not explained in this lesson.
- **Microsoft Website** (not-technical): Referenced as a location for lifecycle information, but not a curriculum concept.
- **Application Developers** (not-technical): Mentioned as documentation sources for compatibility checks, not as a technical concept.

## Import Notes

- This file is a Transcript Intelligence discovery package, not a draft Knowledge Object package.
- Discovery review decides which concepts move to Knowledge Authoring.
- Curriculum placement and relationship suggestions are reviewable metadata until promoted through the proper workflow.
- This lesson primarily supports upgrade-versus-clean-install decision-making and Windows 11 readiness checks.
- Several topics should merge into existing concepts if already authored: backup, partition/formatting, UEFI, patch management, and end-of-life/lifecycle.
- Windows 11 requirements and Microsoft lifecycle policy should be verified against current Microsoft documentation during Knowledge Authoring.
- The source gives procedure-level clues but not a full installation walkthrough; avoid over-authoring step-by-step install content from this transcript alone.
- The lesson uses 'UEFI BIOS' wording; normalize carefully to the platform's firmware terminology.

## Next Step

Use this manifest as the input context for AI-assisted Discovery Review. The review output should decide which concepts are accepted, merged, deferred, rejected, or sent to Knowledge Authoring.
