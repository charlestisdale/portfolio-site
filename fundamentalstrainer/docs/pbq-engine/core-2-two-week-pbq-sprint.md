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

## Current Terminal PBQ Coverage

The terminal PBQ data file is:

```text
fundamentalstrainer/pbq-engine/data/core2/terminal.json
```

Current terminal PBQs:

1. DNS name resolution troubleshooting
2. Windows system file corruption repair with `sfc` and `DISM`
3. Group Policy update and verification with `gpupdate` and `gpresult`
4. Suspicious listening process investigation with `netstat`, `tasklist`, and `taskkill`

## Validation Commands

From the repository root:

```bash
node fundamentalstrainer/pbq-engine/tools/validate-ticket-data.mjs
node fundamentalstrainer/pbq-engine/tools/validate-terminal-data.mjs
```

If already inside `fundamentalstrainer/`:

```bash
node pbq-engine/tools/validate-ticket-data.mjs
node pbq-engine/tools/validate-terminal-data.mjs
```

Run these after adding or editing PBQ data.

## Study-First Development Rules

Until the exam is passed:

1. Prefer new PBQ content over runtime refactors.
2. Prefer high-yield Core 2 commands over rare edge cases.
3. Keep scenarios short enough to repeat quickly.
4. Every PBQ should require documentation.
5. Every PBQ should include at least one bad-but-plausible action or command.
6. Every PBQ should grade required outcomes, not just command memorization.
7. Do not break existing Ticket or Terminal scenarios.

## High-Yield PBQ Targets

### Terminal PBQs

Add scenarios for:

- `chkdsk`
- `diskpart`
- `bootrec`
- `shutdown`
- `robocopy`
- `xcopy`
- `net use`
- `net user`
- `net localgroup`
- `tracert`
- `pathping`
- `ping`
- `ipconfig`
- `nslookup`
- `sfc`
- `DISM`
- `gpupdate`
- `gpresult`
- Linux commands such as `ls`, `cd`, `grep`, `chmod`, `chown`, `ps`, `kill`, `ip`, and `dig`

### Ticket PBQs

Add scenarios for:

- malware removal process
- browser redirect or pop-up infection
- user profile corruption
- BitLocker recovery key request
- failed Windows Update
- printer spooler failure
- backup restore decision
- accidental file deletion
- permissions or access denied
- mobile email sync issue
- social engineering report
- change request with rollback plan

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

- fewer than 10 Core 2 PBQs are available
- validation scripts are failing
- existing PBQs are broken in the browser
- the work does not directly help exam readiness

## Next Recommended Content Batch

Add ticket scenarios for:

1. Malware browser redirect remediation
2. Failed Windows Update repair
3. Printer spooler troubleshooting
4. User cannot access a shared folder
5. Backup restore after accidental deletion

Add terminal scenarios for:

1. `bootrec` startup repair
2. `chkdsk` disk error workflow
3. `net use` drive mapping troubleshooting
4. Linux permissions with `chmod` and `chown`
5. Network path troubleshooting with `tracert` and `pathping`
