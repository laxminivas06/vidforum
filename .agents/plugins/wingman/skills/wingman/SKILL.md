---
name: wingman
description: >-
  Use before modifying database models, schemas, or API contracts to verify backward compatibility.
---

# Wingman Data-Contract Skill

Guards data contracts and entity integrity across the repository.

## Pre-Edit Verification Checklist
1. **Schema Check:** Does the target entity maintain `institution_id`?
2. **Master Relation:** Does this touch the student master entity? Ensure no duplicate student fields are created.
3. **API Contract:** Will this break existing `/api/v1` route shapes or front-end consumers?

