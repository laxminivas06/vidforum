---
name: local-memory
description: >-
  Use when storing or querying local entity-relation graphs, temporal observations, and project-specific facts.
---

# Local Memory Skill

Maintains a graph of entities, relations, and time-stamped observations.

## When to Use
- Query before making assumptions about previously established entity relationships.
- Record new entities, foreign key relationships, or multi-tenant dependencies.

## Key Actions
1. **Entity Graph Lookup:** Search entities and relations before modifying domain boundaries.
2. **Fact Assertion:** Record newly established architecture facts with timestamps.
3. **Relation Check:** Verify that new models connect to the central `Student` entity and include `institution_id`.

