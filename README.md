# userScripts

Small cross-platform utility scripts for local development tasks.

## Requirements

- Node.js installed
- Git installed and available on your PATH

## Scripts

### fetch-child-repos.js

Scans the immediate child directories of the folder it is run from. If a child directory contains a `.git` entry, the script runs `git fetch --all --verbose` in that repository.

The script stores a small state file in the current directory so it only runs once per day by default.

State file:

- `.fetch-child-repos-state.json`

Usage:

```bash
node fetch-child-repos.js
```

Flags:

- `--force` runs even if the script has already run today.
- `--clear` deletes the saved daily run timestamp and exits.
- `--clear --force` deletes the saved timestamp and then runs immediately.

Examples:

```bash
node fetch-child-repos.js
node fetch-child-repos.js --force
node fetch-child-repos.js --clear-timestamp
node fetch-child-repos.js --clear-timestamp --force
```

Behavior:

- Only immediate child directories are checked.
- A repository is considered valid if the child folder contains a `.git` directory or `.git` file.
- The script logs whether updates were fetched for each repository.
- If every fetch succeeds, the script records the current date in the state file.
- If any fetch fails, the timestamp is not updated.

## Notes

- Run scripts from the folder whose child directories you want to inspect.
- This README can be extended as new scripts are added to this directory.