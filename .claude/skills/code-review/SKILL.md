---
name: code-review
description: Performs a rigorous technical review of code changes to identify bugs, smells, or security risks.
---

When reviewing code:

1. Run `git diff main...HEAD` or analyze the provided snippet
2. Provide feedback using this format:

## Summary
A high-level overview of the implementation quality.

## Critical Issues
- Logic bugs or edge cases (e.g., null pointers, race conditions)
- Security vulnerabilities or credential leaks

## Suggestions
- Performance optimizations
- Readability and naming improvements
- Consistency with existing design patterns

## Verdict
[LGTM] / [Needs Work] / [Critical Changes Required]