# Relationship Types

Typed relationships make the knowledge base a graph instead of a flat list.

## Allowed relationship types

| Type | Meaning |
|---|---|
| `requires` | Source concept requires understanding target first. |
| `uses` | Source uses or depends on target operationally. |
| `configures` | Source configures target. |
| `manages` | Source manages target. |
| `troubleshoots` | Source helps troubleshoot target. |
| `compares` | Source is commonly compared with target. |
| `contrasts_with` | Source is often confused with target but differs. |
| `supersedes` | Source replaces or modernizes target. |
| `belongs_to` | Source is part of a larger parent concept. |
| `parent_of` | Source contains target. |
| `child_of` | Source is contained by target. |
| `alternative_to` | Source can be used instead of target in some contexts. |
| `precedes` | Source should usually be studied before target. |
| `follows` | Source should usually be studied after target. |
| `appears_in` | Source appears in lesson/objective/certification target. |

## Strength values

- `weak` — useful connection, not essential.
- `medium` — commonly related.
- `strong` — important for troubleshooting/exam reasoning.
- `required` — prerequisite-level relationship.

## Direction

Most edges are `outbound`. A separate reverse edge is not required unless the reverse meaning is different.
