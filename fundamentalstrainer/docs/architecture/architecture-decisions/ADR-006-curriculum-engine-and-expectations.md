# ADR-006: Curriculum Engine, Knowledge Resolver, and Curriculum Expectations

## Status

Accepted direction / structural design target.

This ADR documents the intended architecture before the remaining large import set is processed. The current implementation may not fully match this target yet.

## Context

The project is a knowledge-first IT learning platform, not a quiz application and not a certification-specific content silo.

The current A+ Core 2 import work revealed that simple curriculum mapping is not enough for the long-term platform.

A concept such as VLANs, DNS, TCP, UEFI, TPM, NTFS, or OSPF can appear in many certifications and courses. A+ may require recognition-level understanding, while CCNA may require configuration and troubleshooting. Creating separate canonical Knowledge Objects for each certification would duplicate knowledge and make the platform hard to maintain.

The existing AI pipeline also has a blind-authoring risk: an AI prompt only sees the current prompt context, not the whole existing knowledge base. Without a resolver stage, the AI may create duplicates because it does not know what already exists.

## Decision

The platform will evolve toward a Curriculum Engine architecture with a Knowledge Resolver and Curriculum Expectations.

The long-term flow is:

```text
Source material
    ↓
Transcript Intelligence
    ↓
Discovery Review
    ↓
Knowledge Resolver
    ↓
Decision
    ├── new-object
    ├── expand-existing-object
    ├── expectation-only
    ├── relationship-only
    ├── duplicate-no-change
    ├── reject
    └── defer
    ↓
Knowledge Author / Knowledge Maintainer
    ↓
Canonical Knowledge Objects
    ↓
Knowledge Graph
    ↓
Curriculum Engine
    ├── Curriculum Plans
    └── Curriculum Expectations
    ↓
Learning Engine
```

## Structural rules

1. Knowledge Objects define reusable concept meaning.
2. The Knowledge Graph defines reusable concept relationships.
3. Curriculum Plans define teaching order and placement.
4. Curriculum Expectations define curriculum-specific depth, skills, included fragments, excluded fragments, objective references, and assessment style.
5. Generated learning experiences consume canonical knowledge plus expectations.
6. The public app must not require live AI to decide what is relevant.
7. AI must receive retrieved existing-platform context before authoring or maintaining knowledge.

## Duplicate policy

```text
Duplicate expectations, not knowledge.
```

Do not create separate canonical concepts such as:

```text
a-plus.vlan
network-plus.vlan
ccna.vlan
security-plus.vlan
```

Use one canonical concept:

```text
networking.vlan
```

Then add curriculum expectations:

```text
a-plus-220-1202/networking.vlan
network-plus/networking.vlan
ccna-200-301/networking.vlan
security-plus/networking.vlan
```

## Knowledge Resolver responsibility

The Knowledge Resolver searches the existing platform before authoring.

It should use:

- canonical IDs
- aliases
- keywords
- tags
- graph relationships
- existing curriculum expectations
- objective mappings
- lesson mappings

It returns candidate matches so the AI and human review process can decide whether the concept is new, already exists, should be expanded, needs only a curriculum expectation, needs only a relationship, or should be rejected/deferred.

## Curriculum Expectation responsibility

A Curriculum Expectation answers:

```text
What does this curriculum require the learner to know or do with this concept?
```

It should be able to define:

- `knowledgeId`
- `curriculumId`
- expected depth
- objective references
- included tags
- excluded tags
- required skills
- assessment styles
- lab or PBQ relevance

## Consequences

### Benefits

- Supports A+ now and future certifications later.
- Prevents one concept from becoming many duplicated certification-specific objects.
- Allows different exams to use the same concept at different depths.
- Keeps the public app deterministic and read-only.
- Makes the AI pipeline maintain existing knowledge instead of blindly creating new knowledge.

### Costs

- Requires a resolver stage before authoring.
- Requires Knowledge Objects to become more fragment/tag friendly.
- Requires new validation rules for expectations and duplicate risks.
- Requires careful curriculum design before large-scale imports.

## Implementation notes

This ADR does not require the entire system to be rewritten immediately.

Near-term implementation should stabilize the data model and documentation before continuing the large import set.

Current A+ Core 2 imports may continue after the structure is clear, but the platform should not scale to the remaining video set or future certifications without a resolver-aware and expectation-aware plan.
