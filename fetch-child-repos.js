const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

const rootDirectory = process.cwd();
const stateFilePath = path.join(rootDirectory, '.fetch-child-repos-state.json');
const args = new Set(process.argv.slice(2));

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readState() {
  if (!fs.existsSync(stateFilePath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
  } catch (error) {
    console.error(`Failed to read state file: ${error.message}`);
    return null;
  }
}

function writeState(state) {
  fs.writeFileSync(stateFilePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

function clearLine() {
  if (process.stdout && typeof process.stdout.clearLine === 'function') {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  } else {
    process.stdout.write('\r');
  }
}

function clearTimestamp() {
  if (!fs.existsSync(stateFilePath)) {
    console.log('No timestamp state file found to clear.');
    return true;
  }

  try {
    fs.unlinkSync(stateFilePath);
    console.log('Cleared saved run timestamp.');
    return true;
  } catch (error) {
    console.error(`Failed to clear timestamp state file: ${error.message}`);
    return false;
  }
}

function shouldRunToday(forceRun, lastRunDate, today) {
  if (forceRun) {
    return true;
  }

  return lastRunDate !== today;
}

function runGitCommand(directoryPath, args) {
  return spawnSync('git', args, {
    cwd: directoryPath,
    encoding: 'utf8',
  });
}

function isGitRepository(directoryPath) {
  const gitPath = path.join(directoryPath, '.git');

  if (!fs.existsSync(gitPath)) {
    return false;
  }

  const stats = fs.statSync(gitPath);
  return stats.isDirectory() || stats.isFile();
}

function getRemoteRefs(directoryPath, name) {
  const result = runGitCommand(directoryPath, [
    'for-each-ref',
    'refs/remotes',
    '--format=%(refname):%(objectname)',
  ]);

  if (result.error) {
    console.error(`Failed to inspect remote refs in ${name}: ${result.error.message}`);
    return null;
  }

  if (result.status !== 0) {
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim();

    if (output) {
      console.error(output);
    }

    console.error(`Failed to inspect remote refs in ${name} with exit code ${result.status}`);
    return null;
  }

  return result.stdout.trim();
}

async function fetchRepository(directoryPath) {
  const name = path.basename(directoryPath);

  const refsBeforeFetch = getRemoteRefs(directoryPath, name);

  if (refsBeforeFetch === null) {
    return { success: false, updated: false };
  }

  const frames = ['🤓', '🧐', '🙃', '🙂'];
  let i = 0;
  const spinnerInterval = 100;
  const spinnerActive = !!(process.stdout && process.stdout.isTTY);

  if (spinnerActive) {
    process.stdout.write(`\rFetching ${name}... ${frames[0]}`);
  } else {
    console.log(`Fetching ${name}...`);
  }

  const spinner = spinnerActive
    ? setInterval(() => {
        i += 1;
        process.stdout.write(`\rFetching ${name}... ${frames[i % frames.length]}`);
      }, spinnerInterval)
    : null;

  return new Promise((resolve) => {
    const child = spawn('git', ['fetch', '--all'], {
      cwd: directoryPath,
      stdio: 'ignore',
    });

    child.on('error', (err) => {
      if (spinner) clearInterval(spinner);

      if (spinnerActive) {
        process.stdout.write(`\rFetching ${name}... ❌\n`);
      } else {
        console.log(`Fetching ${name}... ❌`);
      }

      console.error(`Failed to run git in ${name}: ${err.message}`);
      resolve({ success: false, updated: false });
    });

    child.on('close', (code) => {
      if (spinner) clearInterval(spinner);

      if (code !== 0) {
        if (spinnerActive) {
          process.stdout.write(`\rFetching ${name}... ❌\n`);
        } else {
          console.log(`Fetching ${name}... ❌`);
        }

        console.error(`git fetch --all failed in ${name} with exit code ${code}`);
        return resolve({ success: false, updated: false });
      }

      const refsAfterFetch = getRemoteRefs(directoryPath, name);

      if (refsAfterFetch === null) {
        if (spinnerActive) {
          process.stdout.write(`\rFetching ${name}... ❌\n`);
        } else {
          console.log(`Fetching ${name}... ❌`);
        }

        return resolve({ success: false, updated: false });
      }

      const updated = refsBeforeFetch !== refsAfterFetch;

      if (spinnerActive) {
        process.stdout.write(`\rFetching ${name}... ✅\n`);
      } else {
        console.log(`Fetching ${name}... ✅`);
      }

      return resolve({ success: true, updated });
    });
  });
}

async function main() {
  const forceRun = args.has('--force');
  const clearSavedTimestamp = args.has('--clear-timestamp') || args.has('--clear');
  const today = getTodayString();

  if (clearSavedTimestamp && !clearTimestamp()) {
    process.exitCode = 1;
    return;
  }

  if (clearSavedTimestamp && !forceRun) {
    return;
  }

  const state = readState();

  if (state === null) {
    process.exitCode = 1;
    return;
  }

  const lastRunDate = typeof state.lastRunDate === 'string' ? state.lastRunDate : null;

  if (!shouldRunToday(forceRun, lastRunDate, today)) {
    console.log(`Already ran today (${today}). Use --force to run anyway.`);
    return;
  }

  const childDirectories = fs
    .readdirSync(rootDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDirectory, entry.name));

  const repositories = childDirectories.filter(isGitRepository);

  if (repositories.length === 0) {
    console.log('No child Git repositories found.');
    writeState({ lastRunDate: today });
    return;
  }
  let successCount = 0;
  const updatedProjects = [];

  for (const repositoryPath of repositories) {
    const result = await fetchRepository(repositoryPath);
    if (result.success) {
      successCount += 1;
    }
    if (result.updated) {
      updatedProjects.push(path.basename(repositoryPath));
    }
  }

  if (updatedProjects.length > 0) {
    console.log('\nThe following projects need to be pulled and updated:');
    for (const p of updatedProjects) {
      console.log(`- ${p}`);
    }
  } else {
    console.log('\nAll repositories are up to date.');
  }

  if (successCount === repositories.length) {
    writeState({ lastRunDate: today });
  } else {
    console.log('Run timestamp not updated because one or more fetch operations failed.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});