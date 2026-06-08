# AGENTS.md - Project Memory for AI Assistants

These instructions are mandatory for every AI assistant working on this repository.

## Communication

- Reply to the user in Thai.
- If a fact is uncertain, say that it is uncertain and verify before acting.
- Follow this work rhythm every time:
  1. Plan: summarize the task, break it into steps, and ask only if something is truly unclear.
  2. Execute: do the work and give short progress updates.
  3. Verify: run the appropriate checks and fix issues before reporting.
  4. Report: summarize the result, risks, and the next recommended step.

## Cross-Machine Git Rules

This project is developed from at least two machines. Treat GitHub as the source of truth before starting any new work.

Before editing files:

```powershell
git status --short --branch
git fetch origin
git status --short --branch
git log -1 --oneline
git log --oneline HEAD..origin/main
```

If local `main` is behind `origin/main` and the working tree is clean:

```powershell
git pull --ff-only origin main
```

If there are local changes before pulling:

```powershell
git stash push -u -m "work before pull"
git pull --ff-only origin main
```

Do not discard or overwrite local changes unless the user explicitly asks.
If a stash is created, report its name to the user.

Before pushing:

```powershell
npm.cmd run check:encoding
npm.cmd run lint
npm.cmd run build
git status --short --branch
```

Only push after the checks pass and the intended files are committed.

## Known Windows Git Problem

This office/workspace machine has repeatedly had `.git/index` write problems, including:

- `fatal: unable to write new index file`
- `git add` or `git pull` failing even though the working tree files changed
- stale local history after GitHub already has newer commits

Likely cause: Windows file ownership or sandbox permissions on `.git`, sometimes mixed with network instability.

Preferred permanent fix:

1. Use a clean clone in a normal user-owned folder, for example:

```powershell
cd C:\Dev
git clone https://github.com/Jenovic-th/monopoly-chonburi-game.git
cd monopoly-chonburi-game
npm.cmd install
```

2. Avoid copying the project folder including `.git` between machines.
3. Avoid keeping the repository inside OneDrive, Google Drive, Dropbox, or other synced folders.
4. Avoid running Git alternately as Administrator, a normal user, and a sandbox user against the same clone.

If this existing clone hits `.git/index` write errors again, do not keep retrying blindly.
Use `git status`, preserve local work with `git stash push -u`, then recommend a clean clone or repair file ownership.

## Project Entry Points

Read these files before significant work:

- `HANDOFF.md` - current project map, systems, preferences, and next steps.
- `DEVLOG.md` - chronological implementation history.
- `TODO.md` - done list, pending work, and design questions.
- `src/App.tsx` - main game state and gameplay flow.
- `src/boardData.ts` - board tile data.
- `src/businessData.ts` - business card and income data.
- `src/App.css` - board, modal, responsive, and visual styling.

## Current Product Preferences

- Keep the game fast.
- Avoid annoying floating popups.
- Prefer Turn Log and board highlights for optional detail.
- Keep the board prominent and uncluttered.
- Large money values are preferred over tiny Monopoly-like amounts.
- Land buying should feel like late-game strategy after business cashflow is established.
- AI should not buy land too early.
- Business stall slots are exclusive: one slot, one owner.
- Full land trading, auction, and negotiation systems should wait until later.
