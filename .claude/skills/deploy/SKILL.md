---
name: deploy
description: Stage all changes, commit with a message, and push to main. Use when the user wants to deploy, push, or ship their changes.
disable-model-invocation: true
argument-hint: [commit message]
allowed-tools: Bash(git *)
---

# Deploy to Main

Automate the full deploy workflow: stage → commit → push to `main`.

## Steps

1. Run `git status` to review current changes (never use `-uall` flag)
2. Run `git diff` and `git diff --cached` to review what will be committed
3. Stage all changes with `git add -A`
4. Commit with the provided message: `$ARGUMENTS`
   - If no message was provided, generate a concise commit message based on the diff
   - Always append the co-author trailer:
     ```
     Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
     ```
   - Use a HEREDOC to pass the commit message to `git commit -m`
5. Push to remote: `git push origin main`

## Rules

- If there are no changes to commit, inform the user and stop
- Never use `--force` or `--no-verify`
- Always show the user the summary of staged changes before committing
- If the push fails, report the error — do not retry automatically
