# Core 2 Two-Week PBQ Sprint

## Purpose

For the next two weeks, PBQ Engine work should prioritize passing CompTIA A+ Core 2 over deeper platform architecture.

Architecture work can continue only when it directly supports faster Core 2 practice content creation, validation, or review.

## Current Priority

Build and stabilize Core 2 practice around:

- Windows command-line troubleshooting
- software troubleshooting methodology
- malware symptoms and remediation flow
- security and social engineering scenarios
- backup and recovery decisions
- change management and documentation
- operational procedure tickets

## Current PBQ Inventory

Current browser-loaded scenario counts after the sprint content batch:

```text
Ticket PBQs:   13
Terminal PBQs: 8
Total PBQs:    21
```

This clears the short-term 20+ PBQ milestone while staying in exam-focused content mode.

## Current Data Files

The PBQ runtime currently loads:

```text
fundamentalstrainer/pbq-engine/data/core2/tickets.json
fundamentalstrainer/pbq-engine/data/core2/tickets-sprint.json
fundamentalstrainer/pbq-engine/data/core2/terminal.json
fundamentalstrainer/pbq-engine/data/core2/terminal-sprint.json
```

The sprint files keep new exam-focused content separate from the original baseline data files.

## Current Ticket PBQ Coverage

Implemented ticket PBQs:

1. Slow Windows PC
2. Browser hijacker / malware removal flow
3. Domain password reset
4. Printer spooler troubleshooting
5. Secure website certificate warning
6. BitLocker recovery
7. Black screen after Windows update
8. Mobile email sync after password change
9. Shared folder permissions
10. Backup restore after accidental deletion
11. VPN cannot connect / MFA registration issue
12. Social engineering / vishing incident report
13. Failed Windows Update with low disk space

## Current Terminal PBQ Coverage

Implemented terminal PBQs:

1. DNS name resolution troubleshooting with `ipconfig`, `ping`, `nslookup`, and `ipconfig /flushdns`
2. Windows system file corruption repair with `sfc`, `DISM`, and `shutdown`
3. Group Policy update and verification with `gpupdate` and `gpresult`
4. Suspicious listening process investigation with `netstat`, `tasklist`, and `taskkill`
5. Windows startup repair with `bootrec`
6. File-system repair with `chkdsk`
7. Mapped drive troubleshooting with `net use`
8. Linux permissions with `ls`, `chown`, and `chmod`

## Validation Commands

Run both baseline files and sprint files after adding or editing PBQ data.

From the repository root:

```bash
node fundamentalstrainer/pbq-engine/tools/validate-ticket-data.mjs
node fundamentalstrainer/pbq-engine/tools/validate-ticket-data.mjs --data=fundamentalstrainer/pbq-engine/data/core2/tickets-sprint.json
node fundamentalstrainer/pbq-engine/tools/validate-terminal-data.mjs
node fundamentalstrainer/pbq-engine/tools/validate-terminal-data.mjs --data=fundamentalstrainer/pbq-engine/data/core2/terminal-sprint.json
```

If already inside `fundamentalstrainer/`:

```bash
node pbq-engine/tools/validate-ticket-data.mjs
node pbq-engine/tools/validate-ticket-data.mjs --data=pbq-engine/data/core2/tickets-sprint.json
node pbq-engine/tools/validate-terminal-data.mjs
node pbq-engine/tools/validate-terminal-data.mjs --data=pbq-engine/data/core2/terminal-sprint.json
```

## Study-First Development Rules

Until the exam is passed:

1. Prefer new PBQ content over runtime refactors.
2. Prefer high-yield Core 2 commands over rare edge cases.
3. Keep scenarios short enough to repeat quickly.
4. Every PBQ should require documentation.
5. Every PBQ should include at least one bad-but-plausible action or command.
6. Every PBQ should grade required outcomes, not just command memorization.
7. Do not break existing Ticket or Terminal scenarios.
8. Do not start new architecture work unless it directly improves exam readiness.

## High-Yield PBQ Targets

### Already represented well enough for the first sprint milestone

- malware removal process
- browser redirect or pop-up infection
- failed Windows Update
- printer spooler failure
- shared folder permissions
- backup restore decision
- accidental file deletion
- BitLocker recovery key request
- password reset
- VPN issue
- slow PC
- social engineering report
- `sfc`
- `DISM`
- `shutdown`
- `gpupdate`
- `gpresult`
- `netstat`
- `tasklist`
- `taskkill`
- `bootrec`
- `chkdsk`
- `net use`
- Linux `ls`, `chown`, and `chmod`

### Remaining useful terminal targets

Add scenarios for:

- `diskpart`
- `robocopy`
- `xcopy`
- `net user`
- `net localgroup`
- `tracert`
- `pathping`
- Linux process management with `ps` and `kill`
- Linux networking with `ip` and `dig`

### Remaining useful ticket targets

Add scenarios for:

- Outlook profile or cached-credential issue
- user profile corruption
- change request with rollback plan
- software installation blocked by policy
- mobile app permissions/privacy issue

## Two-Week Practice Cadence

### Daily Minimum

- 20–30 minutes command review
- 20–30 minutes PBQs
- 30–45 minutes mixed Core 2 quiz questions
- 10 minutes writing documentation summaries for PBQs

### Every Other Day

Run a timed mixed review:

- 20 multiple-choice questions
- 2 PBQs
- review every missed question immediately

### Final Three Days

Focus on:

- troubleshooting methodology
- malware removal order
- Windows tools and commands
- security/social engineering terms
- backup types
- change management
- documentation and professionalism

## Stop Conditions For Architecture Work

Pause architecture work if any of the following are true:

- validation scripts are failing
- existing PBQs are broken in the browser
- the work does not directly help exam readiness

The previous minimum content milestone was 20 Core 2 PBQs. The project now has 21 browser-loaded Core 2 PBQs, so the next sprint priority is stability, browser testing, and filling remaining command gaps rather than runtime migration.

## Next Recommended Content Batch

Add terminal scenarios for:

1. `tracert` and `pathping` network path troubleshooting
2. `diskpart` partition/volume inspection
3. `robocopy` backup/copy workflow
4. `xcopy` copy workflow
5. `net user` and `net localgroup` local account/group management

Add ticket scenarios for:

1. Outlook profile or cached credential issue
2. User profile corruption
3. Change request with rollback plan

## Short-Term Goal

The 20+ validated/browser-loaded PBQ milestone is reached in content count.

Before returning to architecture work, confirm:

```text
Ticket PBQs:   13
Terminal PBQs: 8
Total PBQs:    21
```

Then run the validation commands and test the new sprint scenarios in the browser dropdown.
