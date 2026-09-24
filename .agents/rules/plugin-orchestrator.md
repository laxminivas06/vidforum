---
name: plugin-orchestrator
description: >-
  Orchestrates the 28 installed plugins across Memory, Code Quality, Testing, Security, SDLC, Git, and Optimization.
always_on: true
---

# Plugin Orchestration Rules

The repository has 28 installed plugins in `.agents/plugins/`. Apply them systematically according to the current task phase:

## 1. Memory Phase (Start of Session & Pre-Edit)
- **Honcho (`honcho-memory`)**: Check durable user preferences and past conclusions before making assumptions.
- **Wingman (`wingman`)**: Verify database and API contracts before touching schema or models. Every tenant model must contain `institution_id`; `Student` must remain a unified master entity.
- **Unforgit (`unforgit`)**: Check `docs/DECISIONS.md` for prior architectural decisions and known gotchas.

## 2. Planning & SDLC Phase
- **Spec-Driven Development (`spec-driven`)**: Verify user requirements and acceptance criteria before writing code.
- **AI-Native SDLC (`ai-native-sdlc`)**: Enforce human approval gates after major milestones (PRD/Spec, Scaffold, Feature Groups).
- **debt-ops (`debt-ops`)**: No silent `TODO` comments. If a capability is deferred to a future phase, explicitly track it in `docs/TASKS.md` or `docs/DECISIONS.md`.

## 3. Implementation & Testing Phase
- **Dev Skills (`dev-skills`)**: Implement minimal, high-quality code with TDD principles.
- **Tailtest (`tailtest`)**: Target test runs to files modified in the current change.
- **Falsegreen (`falsegreen`)**: Ensure tests have meaningful, fail-capable assertions; eliminate tautological `assert True`.
- **Test Gap (`test-gap`)**: Verify that newly authored lines in the diff have unit or integration coverage.

## 4. Code Quality & Review Phase
- **Brooks Lint (`brooks-lint`)**: Assess conceptual integrity, avoid over-engineering, and enforce clean domain boundaries.
- **River Review (`river-review`)**: Evaluate diffs through 4 lenses: Security, Performance, Architecture, and Testing.
- **Codex Reviewer (`codex-reviewer`)**: Fresh-eyes second-pass review of complex logic before presenting to the user.
- **MegaLinter (`megalinter`)**: Run type-checking (`tsc`, `mypy`) and formatting (`ruff`, `eslint`, `prettier`).

## 5. Security & Git Phase
- **Secret Guard (`secret-guard`) & Agent Guard (`agent-guard`)**: Block hardcoded secrets, API keys, and sensitive tokens. Ensure `.env` is never committed.
- **Commit Narrator (`commit-narrator`)**: Author conventional, semantic git commits explaining both the change and the architectural rationale (*why*).
- **Docflow (`docflow`)**: Ensure `docs/TASKS.md`, `docs/TECH_SPEC.md`, and `docs/PRD.md` remain accurate and synchronized.

## 6. Token & Output Optimization
- **Token Optimizer (`token-optimizer`)**: Use line ranges when reading files, focused searches, and surgical edits.
- **Espresso (`espresso`)**: Provide clear, concise, high-signal responses without unnecessary fluff.
