---
name: git-commit-integrity
description: >-
  Ensures every commit in a series is what it claims to be — a working,
  gate-passing snapshot in isolation, not just a slice of a working directory
  that happened to pass while other changes sat nearby. Covers verifying
  commit history after the fact, designing pre-commit hooks that check the
  commit rather than the working tree, and splitting an already-finished diff
  into multiple logical commits safely. Tech-stack agnostic; applies whether
  or not the project has a pre-commit hook. Use whenever constructing
  multi-commit history from a single body of work, reviewing or writing a
  pre-commit hook, or before telling a user "this commit is clean."
---

# Git Commit Integrity

## Purpose

A commit records a tree snapshot. Nothing about `git commit` — or a hook that
runs during it — guarantees that snapshot builds, lints, or tests cleanly
*on its own*. The only thing most tooling actually checks is "does the
working directory look okay right now", and those two questions are the same
only in the ordinary one-change-at-a-time workflow. They diverge the moment
more than one commit's worth of work exists in the working tree at once —
which is exactly the situation whenever a large, already-finished diff is
being organized into multiple readable commits after the fact.

This skill exists because that divergence is easy to miss: every gate can
report green and the resulting history can still contain commits that don't
build if checked out alone.

## When to Invoke

- Splitting a large, already-complete diff into multiple logical commits
  (a refactor, a big feature, an after-the-fact history cleanup).
- Writing or reviewing a pre-commit / pre-push hook, in any language.
- A user or reviewer asks "is this commit series bisectable?" or "does each
  commit build?"
- Before claiming a multi-commit series is clean, complete, or ready for
  review — verify it, don't infer it from "the hook passed."

## Core Principle: A Commit Is Its Snapshot, Not Your Working Directory

Compilers, linters, and test runners (`cargo`, `go build`, `pytest`, `tsc`,
`eslint`, `rspec`, ...) read the **filesystem**. None of them know git's
index exists. A tool invoked mid-commit checks whatever is on disk at that
moment — staged changes, unstaged changes, and untracked files, all mixed
together indiscriminately. `git status`/`git diff --cached` can tell you what
*will* be committed; it takes a deliberate extra step to make what a tool
*checks* match that.

Two consequences follow directly:

1. **A passing hook is not proof a commit is buildable in isolation** unless
   you know the hook isolates the working tree to the index before running
   anything filesystem-based. Most hand-written hooks don't, because it isn't
   obvious the gap exists until you go looking for it.
2. **Splitting a finished diff into several commits by staging subsets is not,
   by itself, a safe operation.** Each intermediate commit's *actual recorded
   tree* may reference symbols, fields, or files that don't exist yet at that
   point in history, even though the ambient working directory (with later
   batches still sitting unstaged) compiles fine.

## Pattern 1: Verify a Commit Series After the Fact

Whenever a commit series is claimed finished, verify it — don't trust that
the hook (if any) already did, unless you've confirmed it isolates (Pattern
2). Two techniques, in order of preference:

**A. Isolated worktree replay (most reliable, works for any range):**
```bash
git worktree add --detach /tmp/verify-wt <first-sha>
cd /tmp/verify-wt
for sha in <sha1> <sha2> <sha3> ...; do
  git checkout --quiet "$sha"
  <build-command>   # e.g. cargo check --workspace --all-targets, go build ./..., npm run build
  <test-command>    # if fast enough to run per commit
done
cd - && git worktree remove --force /tmp/verify-wt
```
Report the actual pass/fail per commit — don't summarize as "all good" without
having run this. If some commits fail in isolation, say so plainly; whether
that's acceptable depends on whether the series needs to be bisectable (ask,
don't assume).

**B. `git rebase --exec` (fast, but stops at the first failure and needs a
willingness to rewrite history to fix):**
```bash
git rebase -i --exec '<build-command> && <test-command>' <base-sha>
```
Good for enforcing the guarantee going forward once every commit is fixed up;
less good for a first-pass audit since it halts at the first broken commit
rather than reporting the full picture.

Neither technique is language-specific — substitute whatever the project's
real build/lint/test invocation is.

## Pattern 2: Designing a Pre-Commit Hook That Checks the Commit

If a project wants a hook to enforce "every commit builds," the hook must
put the working tree into the state the commit will actually produce before
running anything that reads the filesystem. There are two categories of gate:

**Index-native checks** — no isolation needed. These read staged blobs
directly and are naturally correct regardless of what else is unstaged:
- `git diff --cached` (content/whitespace/conflict-marker scans)
- `git grep --cached` (pattern scans across staged content)
- `git cat-file -s :<path>` (staged blob size)
- `git diff --cached --name-only` (which files are actually part of this commit)

**Filesystem-native checks** — need isolation. Anything that shells out to a
real toolchain has no concept of "staged": `cargo`/`go`/`pytest`/`tsc`/
`eslint`/`rubocop`/`golangci-lint`/`semgrep`, and any full-codebase `grep`
over the source tree rather than over `git grep --cached`.

**The isolation algorithm** (verified against a reproducible bug in the
naive alternative — see Anti-Pattern below):
1. Diff the index against the working tree for tracked files:
   `git diff-index --binary -r --no-color <tree-from-git-write-tree>`.
2. Save that diff as a patch file; reset the differing tracked paths to the
   index's content: `git checkout-index -f -- <paths-from-diff-index-name-only>`.
3. Move untracked files to a temp directory (`git ls-files --others
   --exclude-standard` for the list).
4. Run every filesystem-native gate now — the working tree exactly matches
   what the commit will record.
5. Restore unconditionally on exit (`trap ... EXIT`, not just at the happy
   path's end): `git apply` the saved patch back, move untracked files back,
   clean up temp files.

This works identically regardless of language — the isolation step operates
on git plumbing, not on the project's build tool.

**Design checklist for the rest of the hook, independent of language:**
- One gate that can never be skipped (secrets/credential scanning). Every
  other gate may have a documented, explicit skip mechanism, but skipping
  must never be silent or the default.
- Fast, index-native checks first; slow, filesystem-native checks (build,
  full test suite, SAST) last, so a trivial mistake fails in milliseconds
  rather than after a multi-minute compile.
- A toolchain/marker that's absent should report **skipped**, not failed and
  not silently passed — so the hook works on day one of a project and grows
  as new tech stacks are added, without needing a rewrite.
- If the project also has CI, treat the hook as the fast local signal and CI
  as the authoritative one — CI running per-commit (a matrix job over the
  commit range, or `git rebase --exec` in a CI step) is the only mechanism
  that catches history-construction mistakes a local hook's working-tree
  isolation might still miss (e.g. isolation itself disabled via an escape
  hatch, or the hook not installed on a contributor's machine). See the
  `ci-cd` skill for wiring that up.

## Pattern 3: Splitting an Already-Finished Diff Into Logical Commits

When a large, complete change needs to become a readable series of commits
(rather than one large commit):

1. **Group by concern, not by file count.** Read enough of each file's diff
   to know what it's actually doing before assigning it to a group — a file
   touched by three different concerns should go with whichever concern
   dominates its diff, and the commit message should say so honestly rather
   than implying the commit is narrower than it is.
2. **Stage and commit incrementally**, writing a substantial message per
   commit that explains what and why, matching the project's established
   commit-message conventions.
3. **Verify with Pattern 1 before calling the series done.** Do not assume
   intermediate commits build just because the final state does, and do not
   assume a passing hook proves it either unless you've confirmed the hook
   isolates (Pattern 2). If intermediate commits don't build in isolation,
   surface that explicitly and let the user decide whether it matters for
   their use case (no CI / no bisecting need vs. a project that relies on
   `git bisect`).
4. **Prefer fixing forward over hiding the gap.** If a commit needs to be
   independently buildable, the fix is usually moving a small piece (a
   struct field, an enum variant) earlier via interactive rebase — not
   disabling the hook or skipping verification.

## Anti-Patterns

- **`git commit --no-verify`** to skip a hook that's "probably fine to skip
  this once." If a hook is wrong, fix the hook; if it's right, don't bypass
  it.
- **`git stash --keep-index --include-untracked` as an isolation mechanism.**
  Reproducible bug (confirmed on git 2.43): when a tracked file has both a
  staged change and a further unstaged edit on top of it — ordinary partial
  staging — popping the stash produces a spurious merge conflict, even
  though the two changes don't overlap. This is the exact scenario the
  isolation exists to support, so the failure mode defeats the purpose. Use
  the diff/patch approach in Pattern 2 instead; it never invokes a 3-way
  merge, so it has no conflict surface.
- **Treating "the hook passed" as proof of per-commit integrity** without
  having checked whether the hook isolates the working tree at all. Most
  hand-written hooks don't, until someone goes looking.
- **Assuming a big refactor's intermediate commits are fine because the
  final commit compiles.** They are two different claims; only verify
  the one you're actually about to assert.
