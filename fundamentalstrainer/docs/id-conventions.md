# ID Conventions

IDs must be stable, readable, lowercase, and safe for filenames/search.

## General rules

- Use lowercase letters, numbers, hyphens, and dots only.
- Do not use spaces, underscores, random numbers, or display names as IDs.
- Once published, never rename an ID. Use aliases or redirects if needed.
- Prefer cross-certification concept IDs when the concept is reusable.

## Entity ID formats

| Entity | Format | Example |
|---|---|---|
| Certification | `{vendor-or-track}-{exam}` | `a-plus-220-1202` |
| Objective | `{certification}.{domain}.{objective}` | `a-plus-220-1202.1.5` |
| Lesson | `{certification}.lesson-{nn}` | `a-plus-220-1202.lesson-11` |
| Knowledge Object | `{domain}.{slug}` | `commands.ipconfig` |
| Relationship | `rel.{sourceId}.{type}.{targetId}` | `rel.commands.ipconfig.uses.networking.dhcp` |
| Assessment | `{certification}.{type}.{slug}.{nnn}` | `a-plus-220-1202.mcq.ipconfig-001` |
| Media | `media.{domain}.{slug}` | `media.commands.ipconfig-output-001` |
| Progress | `progress.{userScope}.{entityId}` | `progress.local.commands.ipconfig` |

## Domain prefixes

Use these for knowledge object IDs:

- `commands.*`
- `windows.*`
- `linux.*`
- `macos.*`
- `networking.*`
- `security.*`
- `hardware.*`
- `storage.*`
- `printers.*`
- `cloud.*`
- `virtualization.*`
- `operational.*`
- `troubleshooting.*`

## Why knowledge IDs are not certification-prefixed

Use `commands.ipconfig`, not `a-plus-220-1202.commands.ipconfig`, because the same concept can appear in A+, Network+, Security+, and later courses. Certification mapping belongs inside the knowledge object and objective manifests.
