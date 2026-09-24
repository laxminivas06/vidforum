---
name: flaky-detector
description: >-
  Use to detect test nondeterminism, timing dependencies, and race conditions by running tests iteratively.
---

# Flaky Detector Skill

Stress-tests test reliability.

## Instructions
- Run suspect test commands in a loop (e.g. 5x) to identify flaky tests.
- Check for shared mutable test state, asynchronous race conditions, or unseeded random generators.

