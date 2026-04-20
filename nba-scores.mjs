#!/usr/bin/env node

/**
 * NBA Scores & Box Scores via ESPN unofficial API
 * Usage:
 *   node nba-scores.mjs              -> all games today (scores only)
 *   node nba-scores.mjs --box        -> include box scores
 *   node nba-scores.mjs lakers       -> filter to a specific team (scores only)
 *   node nba-scores.mjs --box lakers -> include box scores for team
 */

// Simple CLI args: optionally `--box` or `-b` to include box scores, and an optional team filter.
const args = process.argv.slice(2);
let includeBox = false;
let teamFilter = '';
for (const a of args) {
  if (a === '--box' || a === '-b') includeBox = true;
  else if (!teamFilter) teamFilter = a.toLowerCase().trim();
}

// Colour helpers (no deps needed)
const R = '\x1b[0m';
const bold   = s => `\x1b[1m${s}${R}`;
const dim    = s => `\x1b[2m${s}${R}`;
const green  = s => `\x1b[32m${s}${R}`;
const yellow = s => `\x1b[33m${s}${R}`;
const cyan   = s => `\x1b[36m${s}${R}`;
const red    = s => `\x1b[31m${s}${R}`;

// ESPN uses ET dates. AU is +10/+11 so "today" can span two ET dates.
// Fetch yesterday + today (UTC) to ensure live games always appear.
function espnDateStrings() {
  const now = new Date();
  return [-1, 0].map(offset => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const y   = d.getUTCFullYear();
    const mon = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}${mon}${day}`;
  });
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchScoreboard(dateStr) {
  return fetchJSON(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}&limit=20`
  );
}

async function fetchBoxScore(gameId) {
  return fetchJSON(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`
  );
}

function teamMatchesFilter(team, filter) {
  if (!filter) return true;
  const name = (team.displayName || team.name || '').toLowerCase();
  const abbr = (team.abbreviation || '').toLowerCase();
  const slug = (team.slug || '').toLowerCase();
  return name.includes(filter) || abbr.includes(filter) || slug.includes(filter);
}

function gameMatchesFilter(event, filter) {
  if (!filter) return true;
  const competitors = event.competitions?.[0]?.competitors ?? [];
  return competitors.some(comp => teamMatchesFilter(comp.team, filter));
}

function statusLabel(event) {
  const type = event.status?.type;
  if (type?.completed)        return red('FINAL');
  if (type?.state === 'in')   return green(`LIVE  ${event.status.displayClock}  ${type.shortDetail}`);
  const d = new Date(event.date);
  const t = d.toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'short', hour: '2-digit', minute: '2-digit'
  });
  return dim(`Tip-off ${t} AEST`);
}

function printScore(event) {
  const comps = event.competitions?.[0]?.competitors ?? [];
  const home  = comps.find(c => c.homeAway === 'home');
  const away  = comps.find(c => c.homeAway === 'away');

  const homeName  = home?.team?.displayName ?? '?';
  const awayName  = away?.team?.displayName ?? '?';
  const homeScore = home?.score ?? '-';
  const awayScore = away?.score ?? '-';

  const type  = event.status?.type;
  const live  = type?.state === 'in';
  const done  = type?.completed;
  const score = (live || done) ? `${bold(awayScore)}  –  ${bold(homeScore)}` : 'vs';

  console.log(`\n${cyan('━'.repeat(64))}`);
  console.log(`  ${bold(awayName)}  ${score}  ${bold(homeName)}`);
  console.log(`  ${statusLabel(event)}`);
}

function printBoxScore(summary, event) {
  const box    = summary.boxscore;
  const teams  = box?.teams ?? [];
  const type   = event.status?.type;
  const live   = type?.state === 'in';
  const done   = type?.completed;

  if (!live && !done) {
    console.log(dim('  (Box score not yet available)'));
    return;
  }

  for (const teamData of teams) {
    const teamName = teamData.team?.displayName ?? 'Unknown';
    const stats    = teamData.statistics ?? [];
    const getStat  = name => stats.find(s => s.name === name)?.displayValue ?? '-';

    console.log(`\n  ${bold(yellow(teamName))}`);
    console.log(
      `  ${dim('FG')} ${getStat('fieldGoalsMade')}-${getStat('fieldGoalsAttempted')}` +
      `  ${dim('3P')} ${getStat('threePointFieldGoalsMade')}-${getStat('threePointFieldGoalsAttempted')}` +
      `  ${dim('FT')} ${getStat('freeThrowsMade')}-${getStat('freeThrowsAttempted')}` +
      `  ${dim('REB')} ${getStat('totalRebounds')}` +
      `  ${dim('AST')} ${getStat('assists')}` +
      `  ${dim('STL')} ${getStat('steals')}` +
      `  ${dim('BLK')} ${getStat('blocks')}` +
      `  ${dim('TO')} ${getStat('turnovers')}`
    );

    const playerSection = box?.players?.find(p => p.team?.id === teamData.team?.id)?.statistics?.[0];
    if (!playerSection) continue;

    const headers = playerSection.names ?? [];
    const NW = 24;
    const CW = 12;

    console.log('');
    console.log(dim('  ' + 'PLAYER'.padEnd(NW) + headers.map(h => h.toUpperCase().padStart(CW)).join('')));
    console.log(dim('  ' + '─'.repeat(NW + headers.length * CW)));

    for (const athlete of playerSection.athletes ?? []) {
      const name     = (athlete.athlete?.displayName ?? '?').substring(0, NW - 1);
      const vals     = athlete.stats ?? [];
      const isDNP    = vals.length === 0 || vals[0] === 'DNP';
      const notStart = !athlete.starter ? dim(' ·') : '';

      if (isDNP) {
        console.log(`  ${name.padEnd(NW)}${dim('DNP')}`);
      } else {
        console.log('  ' + name.padEnd(NW) + vals.map(v => String(v).padStart(CW)).join('') + notStart);
      }
    }
  }
}

async function main() {
  const dates  = espnDateStrings();
  const boards = await Promise.all(dates.map(fetchScoreboard));

  // Deduplicate by game ID
  const seen   = new Set();
  const events = [];
  for (const board of boards) {
    for (const ev of board.events ?? []) {
      if (!seen.has(ev.id)) { seen.add(ev.id); events.push(ev); }
    }
  }

  // Sort: live first, then upcoming, then finished
  const rank = ev => ({ in: 0, pre: 1 }[ev.status?.type?.state] ?? 2);
  events.sort((a, b) => rank(a) - rank(b));

  const filtered = events.filter(ev => gameMatchesFilter(ev, teamFilter));

  if (filtered.length === 0) {
    console.log(yellow(teamFilter
      ? `No NBA games today for "${teamFilter}".`
      : 'No NBA games found for today.'));
    process.exit(0);
  }

  const title = teamFilter
    ? `NBA  —  Games featuring "${teamFilter.toUpperCase()}"`
    : 'NBA  —  All Games Today';
  console.log(`\n${bold(cyan(title))}`);
  console.log(dim(`Found ${filtered.length} game(s)\n`));

  for (const event of filtered) {
    printScore(event);
    if (includeBox) {
      try {
        const summary = await fetchBoxScore(event.id);
        printBoxScore(summary, event);
      } catch (err) {
        console.log(dim(`  (Box score unavailable: ${err.message})`));
      }
    }
  }

  console.log(`\n${cyan('━'.repeat(64))}\n`);
}

main().catch(err => {
  console.error(red(`\nError: ${err.message}`));
  process.exit(1);
});
