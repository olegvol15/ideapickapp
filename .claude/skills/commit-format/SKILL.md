---
name: commit-format
description: Writes concise, structured git commit messages using Conventional Commits. Use when committing code changes.
---

When writing a git commit message:

1. Run `git diff --cached` to see the changes staged for commit
2. Write a commit message following this format:

<type>(<scope>): <short summary in imperative mood>

## Why
Brief explanation of the motivation behind this change. 

## Context
- Bullet points of specific technical implementation details
- Mention any breaking changes or migration requirements
- Reference issue numbers if applicable (e.g., Refs: #123)

## Impact
Summary of how this affects the system or the end-user