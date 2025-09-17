const NAV_ITEMS = [
  { key: 'squad', label: 'Squad', icon: '🧑‍🤝‍🧑' },
  { key: 'match', label: 'Match', icon: '⚽' },
  { key: 'summary', label: 'Weekly', icon: '🗞️' },
  { key: 'league', label: 'League', icon: '🏆' },
  { key: 'finances', label: 'Finance', icon: '💰' },
  { key: 'transfers', label: 'Transfers', icon: '🔁' },
  { key: 'training', label: 'Training', icon: '📈' },
  { key: 'manager', label: 'Manager', icon: '🧑‍💼' }
];

const PYTHON_FILES = [
  './python/lib/__init__.py',
  './python/lib/constants.py',
  './python/lib/helpers.py',
  './python/lib/Division.py',
  './python/lib/Game.py',
  './python/lib/Manager.py',
  './python/lib/Match.py',
  './python/lib/News.py',
  './python/lib/Player.py',
  './python/lib/Team.py',
  './python/lib/db/__init__.py',
  './python/lib/db/names.py',
  './python/webapp_bridge.py'
];

const state = {
  pyodide: null,
  metadata: null,
  currentView: 'loading',
  currentNav: 'squad',
  dashboard: null,
  squad: null,
  transferMarket: null,
  roster: null,
  training: null,
  league: null,
  manager: null,
  match: null,
  matchEvents: [],
  matchPlaying: false,
  matchInterval: null,
  summary: null,
  saves: {},
  swapSelection: { out: null, in: null },
};

const views = {
  loading: document.getElementById('loading'),
  start: document.getElementById('start-view'),
  newGame: document.getElementById('new-game-view'),
  loadGame: document.getElementById('load-game-view'),
  game: document.getElementById('game-view'),
};

const contentEl = document.getElementById('content');
const navEl = document.getElementById('bottom-nav');
const badgeEl = document.getElementById('club-badge');
const clubNameEl = document.getElementById('club-name');
const clubDetailsEl = document.getElementById('club-details');

const teamSelectEl = document.getElementById('team-select');
const newTeamFieldsEl = document.getElementById('new-team-fields');
const newGameForm = document.getElementById('new-game-form');
const savedGamesContainer = document.getElementById('saved-games');
const noSavesEl = document.getElementById('no-saves');

const SAVE_KEY = 'simplefm_web_saves';

function showView(name) {
  Object.values(views).forEach((view) => view && view.classList.add('hidden'));
  const view = views[name];
  if (view) {
    view.classList.remove('hidden');
    state.currentView = name;
  }
}

function escapeForPython(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function callBridge(fn, params = {}) {
  const jsonArgs = JSON.stringify(params ?? {});
  const escaped = escapeForPython(jsonArgs);
  const code = `import json\nimport webapp_bridge\nargs = json.loads('${escaped}')\nresult = webapp_bridge.${fn}(**args)\njson.dumps(result)`;
  const result = await state.pyodide.runPythonAsync(code);
  return result ? JSON.parse(result) : null;
}

async function loadEngine() {
  state.pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' });
  await mountPythonFiles();
  await state.pyodide.runPythonAsync('import sys; sys.path.insert(0, "/python")');
  await state.pyodide.runPythonAsync('import webapp_bridge');
}

async function mountPythonFiles() {
  for (const file of PYTHON_FILES) {
    const response = await fetch(file);
    if (!response.ok) {
      throw new Error(`Failed to load ${file}`);
    }
    const text = await response.text();
    const targetPath = '/' + file.replace('./', '');
    const dir = targetPath.split('/').slice(0, -1).join('/');
    try {
      state.pyodide.FS.analyzePath(dir);
    } catch (err) {
      state.pyodide.FS.mkdirTree(dir);
    }
    state.pyodide.FS.writeFile(targetPath, text, { encoding: 'utf8' });
  }
}

function loadSaves() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.warn('Failed to parse saves', err);
    return {};
  }
}

function persistSaves() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state.saves));
}

function renderSavedGames() {
  savedGamesContainer.innerHTML = '';
  const entries = Object.values(state.saves).sort((a, b) => b.timestamp - a.timestamp);
  if (!entries.length) {
    noSavesEl.classList.remove('hidden');
    return;
  }
  noSavesEl.classList.add('hidden');
  entries.forEach((entry) => {
    const article = document.createElement('article');
    article.innerHTML = `
      <header>
        <h3>${entry.name}</h3>
        <span class="chip">${entry.meta.team}</span>
      </header>
      <p>${entry.meta.division} • Week ${entry.meta.week} • ${entry.meta.year}</p>
      <div class="inline-actions">
        <button class="primary" data-action="load" data-key="${entry.name}">Resume</button>
        <button class="secondary" data-action="delete" data-key="${entry.name}">Delete</button>
      </div>
    `;
    savedGamesContainer.appendChild(article);
  });
}

function populateNewGameForm() {
  const { teams, colors, countries, defaultPrevDiv, defaultPrevPos, maxDiv, maxPos } = state.metadata;
  teamSelectEl.innerHTML = '';
  const choose = document.createElement('option');
  choose.value = '';
  choose.textContent = 'Pick a club';
  teamSelectEl.appendChild(choose);
  const newOption = document.createElement('option');
  newOption.value = 'create-new';
  newOption.textContent = 'Create custom club';
  teamSelectEl.appendChild(newOption);
  teams.forEach((team) => {
    const opt = document.createElement('option');
    opt.value = team;
    opt.textContent = team;
    teamSelectEl.appendChild(opt);
  });

  const divisionSelect = document.getElementById('new-team-division');
  divisionSelect.innerHTML = '';
  for (let i = 1; i <= maxDiv; i += 1) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Division ${i}`;
    if (i === defaultPrevDiv) opt.selected = true;
    divisionSelect.appendChild(opt);
  }

  const positionSelect = document.getElementById('new-team-position');
  positionSelect.innerHTML = '';
  for (let i = 1; i <= maxPos; i += 1) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${i}${ordinalSuffix(i)}`;
    if (i === defaultPrevPos) opt.selected = true;
    positionSelect.appendChild(opt);
  }

  const colorSelect = document.getElementById('new-team-color');
  colorSelect.innerHTML = '';
  colors.forEach((color) => {
    const opt = document.createElement('option');
    opt.value = color.name;
    opt.textContent = color.name;
    opt.style.background = color.hex;
    colorSelect.appendChild(opt);
  });

  const countrySelect = document.getElementById('new-team-country');
  countrySelect.innerHTML = '';
  countries.forEach((country) => {
    const opt = document.createElement('option');
    opt.value = country.name;
    opt.textContent = country.name;
    countrySelect.appendChild(opt);
  });
}

function toggleNewTeamFields() {
  if (teamSelectEl.value === 'create-new') {
    newTeamFieldsEl.classList.add('open');
  } else {
    newTeamFieldsEl.classList.remove('open');
  }
}

function formatMoney(value) {
  if (value === null || value === undefined) return '-';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 10_000_000) return `${sign}${Math.round(abs / 1_000_000)}M`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 100_000) return `${sign}${Math.round(abs / 1_000)}k`;
  if (abs >= 10_000) return `${sign}${(abs / 1_000).toFixed(1)}k`;
  return `${sign}${abs.toLocaleString()}`;
}

function ordinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lighten(hex, amount = 0.2) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (channel) => Math.round(channel + (255 - channel) * amount);
  return `rgba(${mix(r)}, ${mix(g)}, ${mix(b)}, 0.92)`;
}

function hexToRgb(hex) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

async function refreshGameState(options = {}) {
  const [dashboard, squad, transferMarket, roster, training, league, manager] = await Promise.all([
    callBridge('get_dashboard'),
    callBridge('get_squad_view'),
    callBridge('get_transfer_market'),
    callBridge('get_roster'),
    callBridge('get_training_report'),
    callBridge('get_league_data'),
    callBridge('get_manager_stats'),
  ]);

  state.dashboard = dashboard;
  state.squad = squad;
  state.transferMarket = transferMarket;
  state.roster = roster;
  state.training = training;
  state.league = league;
  state.manager = manager;
  if (!options.keepSummary) {
    state.summary = null;
  }
  state.swapSelection = { out: null, in: null };
  renderHeader();
}

function renderHeader() {
  if (!state.dashboard || !state.dashboard.team) return;
  const { team, gameName } = state.dashboard;
  clubNameEl.textContent = team.name;
  const details = [team.division, `Week ${team.week}/${team.maxWeeks}`, team.year];
  clubDetailsEl.textContent = details.join(' • ');
  const initials = team.name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
  badgeEl.textContent = initials || 'SF';
  badgeEl.style.background = lighten(team.colorHex || '#3dd68c', 0.2);
  badgeEl.style.borderColor = team.colorHex || '#3dd68c';
}

function renderNav() {
  navEl.innerHTML = '';
  NAV_ITEMS.forEach((item) => {
    const button = document.createElement('button');
    button.className = 'nav-chip';
    if (item.key === state.currentNav) button.classList.add('active');
    button.dataset.key = item.key;
    button.innerHTML = `<span class="icon">${item.icon}</span>${item.label}`;
    button.addEventListener('click', () => setNav(item.key));
    navEl.appendChild(button);
  });
}

async function setNav(key) {
  state.currentNav = key;
  document.querySelectorAll('.nav-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.key === key);
  });
  await renderContent();
}

async function renderContent() {
  switch (state.currentNav) {
    case 'squad':
      renderSquad();
      break;
    case 'match':
      await renderMatch();
      break;
    case 'summary':
      renderSummary();
      break;
    case 'league':
      renderLeague();
      break;
    case 'finances':
      renderFinances();
      break;
    case 'transfers':
      renderTransfers();
      break;
    case 'training':
      renderTraining();
      break;
    case 'manager':
      renderManager();
      break;
    default:
      contentEl.innerHTML = '';
  }
}

function renderSquad() {
  if (!state.squad) {
    contentEl.innerHTML = '<p class="empty">Loading squad…</p>';
    return;
  }
  const { players, currentTactic, allowedTactics, upcomingMatch } = state.squad;
  const starters = players.filter((p) => p.status === 'starter');
  const bench = players.filter((p) => p.status === 'bench');
  const reserves = players.filter((p) => p.status === 'reserve');

  const tacticOptions = [`<option value="top">Top skill</option>`]
    .concat(
      allowedTactics.map(
        (tac) => `<option value="${tac}" ${tac === currentTactic ? 'selected' : ''}>${tac}</option>`
      )
    )
    .join('');

  const matchCard = upcomingMatch
    ? `
      <div class="card">
        <h2>Next opponent</h2>
        <div class="match-scoreboard">
          <div class="team">
            <span>${upcomingMatch.home}</span>
            <small>Home</small>
          </div>
          <div>
            <h2>${upcomingMatch.score[0]} - ${upcomingMatch.score[1]}</h2>
            <small>Week ${upcomingMatch.matchWeek}</small>
          </div>
          <div class="team">
            <span>${upcomingMatch.away}</span>
            <small>Away</small>
          </div>
        </div>
        <p class="stat-row"><span>Opponent tactic</span><strong>${upcomingMatch.opponentTactic || '—'}</strong></p>
        <p class="stat-row"><span>Opponent skill</span><strong>${Math.round(
          upcomingMatch.opponentSkill || 0
        )}</strong></p>
        <button class="primary full" id="go-to-match">Go to match</button>
      </div>
    `
    : '';

  contentEl.innerHTML = `
    <div class="card">
      <div class="field-group">
        <span>Playing tactic</span>
        <select id="tactic-select">${tacticOptions}</select>
      </div>
      <div class="inline-actions">
        <button class="secondary" id="swap-reset">Reset selection</button>
        <button class="primary" id="swap-confirm" disabled>Swap players</button>
      </div>
    </div>
    ${matchCard}
    ${renderPlayerSection('Starting XI', starters)}
    ${renderPlayerSection('Bench', bench)}
    ${renderPlayerSection('Reserves', reserves)}
  `;

  const tacticSelect = document.getElementById('tactic-select');
  tacticSelect.addEventListener('change', async () => {
    const value = tacticSelect.value === 'top' ? 'top skill' : tacticSelect.value;
    state.squad = await callBridge('set_tactic', { tactic: value });
    state.swapSelection = { out: null, in: null };
    renderSquad();
  });

  document.querySelectorAll('.player-card').forEach((card) => {
    card.addEventListener('click', () => onPlayerCardClick(card));
  });

  document.getElementById('swap-reset').addEventListener('click', () => {
    state.swapSelection = { out: null, in: null };
    updateSwapButtons();
    document.querySelectorAll('.player-card').forEach((card) => card.classList.remove('selected'));
  });

  document.getElementById('swap-confirm').addEventListener('click', async () => {
    if (!state.swapSelection.out || !state.swapSelection.in) return;
    state.squad = await callBridge('swap_players', {
      player_out_id: state.swapSelection.out,
      player_in_id: state.swapSelection.in,
    });
    state.swapSelection = { out: null, in: null };
    renderSquad();
  });

  const goToMatch = document.getElementById('go-to-match');
  if (goToMatch) {
    goToMatch.addEventListener('click', () => setNav('match'));
  }
  updateSwapButtons();
}

function renderPlayerSection(title, players) {
  if (!players.length) return '';
  const cards = players
    .map((player) => {
      const percent = clamp((player.skill / 20) * 100, 5, 100);
      const badges = [];
      if (player.injury) badges.push(`<span class="chip">Injured ${player.injury}'</span>`);
      if (player.wantsNewContract) badges.push('<span class="chip">Contract!</span>');
      if (!player.matchAvailable) badges.push('<span class="chip">Unavailable</span>');
      return `
        <article class="player-card" data-player-id="${player.id}" data-status="${player.status}">
          <span class="status ${player.status}">${player.status}</span>
          <span class="tag">${player.position}</span>
          <h3>${player.name}</h3>
          <div class="meta">
            <span>${player.age} yrs</span>
            <span>Skill ${Math.round(player.skill)}</span>
          </div>
          <div class="stat-bar"><span style="width:${percent}%"></span></div>
          <div class="meta">
            <span>${formatMoney(player.salary)} salary</span>
            <span>${formatMoney(player.value)}</span>
          </div>
          <div class="tag-list">${badges.join('')}</div>
        </article>
      `;
    })
    .join('');
  return `
    <section class="section">
      <h2>${title}</h2>
      <div class="grid">${cards}</div>
    </section>
  `;
}

function onPlayerCardClick(card) {
  const id = Number(card.dataset.playerId);
  const status = card.dataset.status;
  if (status === 'starter') {
    state.swapSelection.out = state.swapSelection.out === id ? null : id;
  } else {
    state.swapSelection.in = state.swapSelection.in === id ? null : id;
  }
  document.querySelectorAll('.player-card').forEach((el) => {
    const pid = Number(el.dataset.playerId);
    const st = el.dataset.status;
    const selected = (st === 'starter' && pid === state.swapSelection.out) ||
      (st !== 'starter' && pid === state.swapSelection.in);
    el.classList.toggle('selected', selected);
  });
  updateSwapButtons();
}

function updateSwapButtons() {
  const button = document.getElementById('swap-confirm');
  if (button) {
    const enabled = Boolean(state.swapSelection.out && state.swapSelection.in);
    button.disabled = !enabled;
  }
}

async function renderMatch() {
  if (!state.match) {
    state.match = await callBridge('prepare_match');
    state.matchEvents = [];
    state.matchPlaying = false;
    if (!state.match) {
      contentEl.innerHTML = '<p class="empty">No fixture scheduled for this week.</p>';
      return;
    }
  }
  const match = state.match;
  const humanIndex = match.humanIndex || 0;
  const subsLeft = 3 - match.substitutions[humanIndex];

  const playerOptions = (filterStatus) =>
    match.team.players
      .filter((p) => (filterStatus === 'out' ? p.status === 'starter' : p.status !== 'starter'))
      .map((p) => `<option value="${p.id}">${p.position} ${p.name} (${Math.round(p.skill)})</option>`) //
      .join('');

  contentEl.innerHTML = `
    <div class="card">
      <div class="match-scoreboard">
        <div class="team">
          <span>${match.home.name}</span>
          <small>Home</small>
        </div>
        <div>
          <h2>${match.score[0]} - ${match.score[1]}</h2>
          <small>${match.minute}'</small>
        </div>
        <div class="team">
          <span>${match.away.name}</span>
          <small>Away</small>
        </div>
      </div>
      <div class="possession-bar">
        <span style="width:${match.possession[0]}%;background:${match.home.color};"></span>
        <span style="width:${match.possession[1]}%;background:${match.away.color};"></span>
      </div>
      <div class="inline-actions">
        <button class="primary" id="btn-play">${state.matchPlaying ? 'Pause' : 'Play'}</button>
        <button class="secondary" id="btn-step">+1'</button>
        <button class="secondary" id="btn-skip">Skip to FT</button>
      </div>
    </div>
    <div class="card">
      <h2>Substitutions</h2>
      <p class="stat-row"><span>Substitutions left</span><strong>${subsLeft}</strong></p>
      <label><span>Player out</span><select id="sub-out"><option value="">Select</option>${playerOptions('out')}</select></label>
      <label><span>Player in</span><select id="sub-in"><option value="">Select</option>${playerOptions('in')}</select></label>
      <div class="inline-actions">
        <button class="primary full" id="btn-sub">Confirm substitution</button>
      </div>
      ${match.injuredPlayerId ? '<p class="alert warning">You must replace the injured player.</p>' : ''}
    </div>
    <div class="card">
      <h2>Match log</h2>
      <div class="timeline" id="match-events"></div>
    </div>
    ${match.finished ? '<button class="primary full" id="btn-continue">Continue</button>' : ''}
  `;

  renderMatchEvents();

  document.getElementById('btn-play').addEventListener('click', toggleMatchPlay);
  document.getElementById('btn-step').addEventListener('click', async () => {
    await stepMatch();
  });
  document.getElementById('btn-skip').addEventListener('click', async () => {
    await autoPlayToEnd();
  });
  document.getElementById('btn-sub').addEventListener('click', async () => {
    const out = Number(document.getElementById('sub-out').value);
    const inbound = Number(document.getElementById('sub-in').value);
    if (!out || !inbound) return;
    state.match = await callBridge('make_substitution', {
      player_out_id: out,
      player_in_id: inbound,
    });
    state.matchEvents.push({ type: 'note', minute: state.match.minute, text: 'Substitution made.' });
    renderMatch();
  });

  const continueBtn = document.getElementById('btn-continue');
  if (continueBtn) {
    continueBtn.addEventListener('click', async () => {
      await finishMatchWeek();
    });
  }
}

function renderMatchEvents() {
  const eventsEl = document.getElementById('match-events');
  if (!eventsEl) return;
  const allEvents = state.matchEvents;
  if (!allEvents.length) {
    eventsEl.innerHTML = '<p class="empty">No events yet.</p>';
    return;
  }
  eventsEl.innerHTML = allEvents
    .map((event) => {
      if (event.type === 'goal') {
        return `<div class="timeline-item goal"><span class="minute">${event.minute}'</span><strong>${event.player}</strong><span>${event.team === 0 ? state.match.home.name : state.match.away.name}</span></div>`;
      }
      if (event.type === 'injury') {
        return `<div class="timeline-item injury"><span class="minute">${event.minute}'</span><strong>${event.player}</strong><span>Injury</span></div>`;
      }
      return `<div class="timeline-item"><span class="minute">${event.minute}'</span><span>${event.text}</span></div>`;
    })
    .join('');
}

async function toggleMatchPlay() {
  state.matchPlaying = !state.matchPlaying;
  if (state.matchPlaying) {
    state.matchInterval = setInterval(async () => {
      await stepMatch();
      if (state.match.finished) {
        clearInterval(state.matchInterval);
        state.matchPlaying = false;
        renderMatch();
      }
    }, 600);
  } else if (state.matchInterval) {
    clearInterval(state.matchInterval);
  }
  renderMatch();
}

async function stepMatch() {
  if (state.match.finished) return;
  const updated = await callBridge('simulate_minutes', { minutes: 1 });
  if (updated?.events?.length) {
    updated.events.forEach((event) => state.matchEvents.push(event));
  }
  state.match = updated;
  if (state.match.finished && state.matchInterval) {
    clearInterval(state.matchInterval);
    state.matchPlaying = false;
  }
  renderMatch();
}

async function autoPlayToEnd() {
  const updated = await callBridge('auto_play_match');
  if (updated?.events?.length) {
    updated.events.forEach((event) => state.matchEvents.push(event));
  }
  state.match = updated;
  if (state.matchInterval) clearInterval(state.matchInterval);
  state.matchPlaying = false;
  renderMatch();
}

async function finishMatchWeek() {
  const result = await callBridge('complete_match');
  const summary = result?.summary;
  await refreshGameState({ keepSummary: true });
  state.summary = summary;
  state.match = null;
  state.matchEvents = [];
  state.matchPlaying = false;
  await autoSaveGame();
  if (summary?.gameEnded) {
    await infoDialog('Season over', 'Your board has decided to part ways. Returning to the main menu.');
    showView('start');
    return;
  }
  setNav('summary');
}

function renderSummary() {
  if (!state.summary) {
    contentEl.innerHTML = '<p class="empty">Play your next match to receive weekly information.</p>';
    return;
  }
  const { weeklyResults, divisionTable, finances, fanHappiness, weeklyNews, seasonEnded } = state.summary;
  const resultRows = weeklyResults
    .map(
      (match) => `
        <div class="list-item">
          <span>${match.home} vs ${match.away}</span>
          <strong>${match.finished ? `${match.homeGoals} - ${match.awayGoals}` : 'vs'}</strong>
        </div>
      `
    )
    .join('');
  const newsItems = weeklyNews.length
    ? weeklyNews.map((n) => `<li>${n}</li>`).join('')
    : '<li>No major news this week.</li>';

  contentEl.innerHTML = `
    <div class="card">
      <h2>Results</h2>
      <div class="list">${resultRows}</div>
    </div>
    <div class="card">
      <h2>Finances</h2>
      <div class="finances-grid">
        <div class="metric-card"><span class="label">Weekly balance</span><strong>${formatMoney(
          finances.balanceWeekly
        )}</strong></div>
        <div class="metric-card"><span class="label">Yearly balance</span><strong>${formatMoney(
          finances.balanceYearly
        )}</strong></div>
        <div class="metric-card"><span class="label">Club funds</span><strong>${formatMoney(
          finances.money
        )}</strong></div>
      </div>
      <div class="stat-row"><span>Sponsors</span><strong>${formatMoney(finances.weekly['Sponsors'])}</strong></div>
      <div class="stat-row"><span>Salaries</span><strong>${formatMoney(finances.weekly['Salaries'])}</strong></div>
    </div>
    <div class="card">
      <h2>Fan happiness</h2>
      <div class="fan-meter"><span style="width:${clamp(fanHappiness, 0, 100)}%"></span></div>
    </div>
    <div class="card">
      <h2>Weekly news</h2>
      <ul>${newsItems}</ul>
    </div>
    <div class="card">
      <h2>League table</h2>
      ${renderTable(divisionTable)}
    </div>
    <div class="card">
      <h2>Training summary</h2>
      ${renderTrainingList(state.summary.training)}
    </div>
    ${seasonEnded ? '<button class="primary full" id="btn-new-season">Start new season</button>' : '<button class="secondary full" id="btn-back-team">Back to squad</button>'}
  `;

  const newSeasonBtn = document.getElementById('btn-new-season');
  if (newSeasonBtn) {
    newSeasonBtn.addEventListener('click', async () => {
      await callBridge('progress_new_season');
      await refreshGameState();
      state.summary = null;
      await autoSaveGame();
      setNav('squad');
    });
  }
  const backBtn = document.getElementById('btn-back-team');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      state.summary = null;
      setNav('squad');
    });
  }
}

function renderTable(table) {
  if (!table?.length) return '<p class="empty">No standings yet.</p>';
  const rows = table
    .map((row) => {
      const highlight = state.dashboard?.team?.name === row.team ? ' class="highlight"' : '';
      return `
        <tr${highlight}>
          <td>${row.position}</td>
          <td>${row.team}</td>
          <td>${row.wins}</td>
          <td>${row.draws}</td>
          <td>${row.losses}</td>
          <td>${row.goalsFor}:${row.goalsAgainst}</td>
          <td>${row.goalDifference >= 0 ? '+' : ''}${row.goalDifference}</td>
          <td>${row.points}</td>
        </tr>
      `;
    })
    .join('');
  return `
    <table class="table">
      <thead><tr><th>#</th><th>Team</th><th>W</th><th>D</th><th>L</th><th>GF:GA</th><th>GD</th><th>Pts</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderTrainingList(list) {
  if (!list?.length) return '<p class="empty">No training notes.</p>';
  return `
    <div class="list">
      ${list
        .map((item) => `
          <div class="list-item">
            <span>${item.position} ${item.name}</span>
            <strong>${formatTrainingChange(item)}</strong>
          </div>
        `)
        .join('')}
    </div>
  `;
}

function formatTrainingChange(item) {
  const change = item.skillChange;
  if (change > 0) return `+${change}`;
  if (change < 0) return `${change}`;
  const training = item.weeklyTraining;
  if (training >= 0.03) return '++';
  if (training >= 0.015) return '+';
  if (training <= -0.03) return '--';
  if (training <= -0.015) return '-';
  return '·';
}

function renderLeague() {
  if (!state.league) {
    contentEl.innerHTML = '<p class="empty">Loading league data…</p>';
    return;
  }
  const table = renderTable(state.league.table);
  const fixtures = state.league.fixtures
    .map((match) => `
      <div class="list-item">
        <span>Week ${match.week} — ${match.home} vs ${match.away}</span>
        <strong>${match.finished ? `${match.homeGoals} - ${match.awayGoals}` : 'vs'}</strong>
      </div>
    `)
    .join('');
  contentEl.innerHTML = `
    <div class="card">
      <h2>Standings</h2>
      ${table}
    </div>
    <div class="card">
      <h2>Season fixtures</h2>
      <div class="list">${fixtures}</div>
    </div>
  `;
}

function renderFinances() {
  if (!state.dashboard) {
    contentEl.innerHTML = '';
    return;
  }
  const summary = state.summary?.finances;
  const teamFinances = state.dashboard.team || {};
  const finances = summary || {
    weekly: teamFinances.weeklyFinances || {},
    yearly: teamFinances.yearlyFinances || {},
    balanceWeekly: (teamFinances.weeklyFinances?.Sponsors || 0) -
      Math.abs(teamFinances.weeklyFinances?.Salaries || 0),
    balanceYearly: 0,
    money: teamFinances.money || 0,
  };
  contentEl.innerHTML = `
    <div class="card">
      <h2>Financial snapshot</h2>
      <div class="finances-grid">
        <div class="metric-card"><span class="label">Weekly balance</span><strong>${formatMoney(
          finances.balanceWeekly
        )}</strong></div>
        <div class="metric-card"><span class="label">Yearly balance</span><strong>${formatMoney(
          finances.balanceYearly
        )}</strong></div>
        <div class="metric-card"><span class="label">Club funds</span><strong>${formatMoney(
          finances.money
        )}</strong></div>
      </div>
      <div class="stat-row"><span>Sponsors</span><strong>${formatMoney(finances.weekly?.Sponsors || 0)}</strong></div>
      <div class="stat-row"><span>Salaries</span><strong>${formatMoney(finances.weekly?.Salaries || 0)}</strong></div>
      <div class="stat-row"><span>Prize money</span><strong>${formatMoney(
        finances.weekly?.['Prize Money'] || 0
      )}</strong></div>
    </div>
  `;
}

function renderTransfers() {
  const marketList = state.transferMarket?.players || [];
  const rosterList = state.roster?.players || [];
  const marketCards = marketList.length
    ? marketList
        .map(
          (player) => `
            <article class="player-card" data-player-id="${player.id}">
              <span class="tag">${player.position}</span>
              <h3>${player.name}</h3>
              <div class="meta"><span>${player.age} yrs</span><span>Skill ${Math.round(player.skill)}</span></div>
              <div class="meta"><span>Salary ${formatMoney(player.salary)}</span><span>Value ${formatMoney(
            player.value
          )}</span></div>
              <button class="primary full" data-action="buy" data-id="${player.id}">Bid ${formatMoney(
            player.value
          )}</button>
            </article>
          `
        )
        .join('')
    : '<p class="empty">No players available in the market right now.</p>';

  const rosterCards = rosterList
    .map((player) => {
      const actions = [];
      if (player.contract <= 0 || player.wantsNewContract) {
        actions.push(`<button class="primary" data-action="renew" data-id="${player.id}">Renew</button>`);
      }
      actions.push(`<button class="secondary" data-action="sell" data-id="${player.id}">Sell</button>`);
      return `
        <article class="player-card" data-player-id="${player.id}">
          <span class="tag">${player.position}</span>
          <h3>${player.name}</h3>
          <div class="meta"><span>${player.age} yrs</span><span>Skill ${Math.round(player.skill)}</span></div>
          <div class="meta"><span>Contract ${player.contract || 0}</span><span>${formatMoney(
            player.salary
          )}/w</span></div>
          <div class="inline-actions">${actions.join('')}</div>
        </article>
      `;
    })
    .join('');

  contentEl.innerHTML = `
    <div class="card">
      <h2>Transfer market</h2>
      <div class="grid">${marketCards}</div>
    </div>
    <div class="card">
      <h2>Your squad</h2>
      <div class="grid">${rosterCards}</div>
    </div>
  `;

  contentEl.querySelectorAll('button[data-action="buy"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const confirmed = await confirmAction('Sign player', 'Do you want to make this transfer?');
      if (!confirmed) return;
      state.transferMarket = await callBridge('buy_player', { player_id: id });
      state.roster = await callBridge('get_roster');
      await refreshGameState({ keepSummary: true });
      renderTransfers();
      await autoSaveGame();
    });
  });

  contentEl.querySelectorAll('button[data-action="sell"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const confirmed = await confirmAction('Sell player', 'Are you sure you want to sell this player?');
      if (!confirmed) return;
      state.roster = await callBridge('sell_player', { player_id: id });
      state.transferMarket = await callBridge('get_transfer_market');
      await refreshGameState({ keepSummary: true });
      renderTransfers();
      await autoSaveGame();
    });
  });

  contentEl.querySelectorAll('button[data-action="renew"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const confirmed = await confirmAction('Renew contract', 'Offer a new contract to this player?');
      if (!confirmed) return;
      state.roster = await callBridge('renew_contract', { player_id: id });
      await refreshGameState({ keepSummary: true });
      renderTransfers();
      await autoSaveGame();
    });
  });
}

function renderTraining() {
  const list = state.training || [];
  contentEl.innerHTML = `
    <div class="card">
      <h2>Weekly training</h2>
      ${renderTrainingList(list)}
    </div>
  `;
}

function renderManager() {
  if (!state.manager) {
    contentEl.innerHTML = '<p class="empty">Loading manager profile…</p>';
    return;
  }
  const career = Object.entries(state.manager.career)
    .map((entry) => `<div class="stat-row"><span>${entry[0]}</span><strong>${entry[1]}</strong></div>`)
    .join('');
  const yearly = state.manager.yearly
    .map(
      (year) => `
        <div class="list-item">
          <span>${year.year} — ${year.division}</span>
          <strong>${year.position}º • ${year.points} pts</strong>
        </div>
      `
    )
    .join('');
  contentEl.innerHTML = `
    <div class="card">
      <h2>${state.manager.name}</h2>
      <p class="stat-row"><span>Total points</span><strong>${state.manager.points}</strong></p>
      ${career}
    </div>
    <div class="card">
      <h2>Season history</h2>
      <div class="list">${yearly}</div>
    </div>
  `;
}

async function autoSaveGame() {
  if (!state.dashboard?.gameName) return;
  const blob = await callBridge('serialize_current_game');
  if (!blob) return;
  const team = state.dashboard.team;
  state.saves[state.dashboard.gameName] = {
    name: state.dashboard.gameName,
    blob,
    meta: {
      team: team.name,
      division: team.division,
      position: team.position,
      week: team.week,
      year: team.year,
      colorHex: team.colorHex,
      manager: team.manager,
    },
    timestamp: Date.now(),
  };
  persistSaves();
  renderSavedGames();
}

async function handleNewGameSubmit(event) {
  event.preventDefault();
  const formData = new FormData(newGameForm);
  const gameName = formData.get('game_name').trim();
  const managerName = formData.get('manager_name').trim();
  const selectedTeam = formData.get('team');
  if (!gameName || !managerName || !selectedTeam) return;
  let payload = {};
  if (selectedTeam === 'create-new') {
    payload = {
      new_team: {
        name: formData.get('new_team_name').trim(),
        prev_div: Number(formData.get('new_team_prev_div')),
        prev_pos: Number(formData.get('new_team_prev_pos')),
        color: formData.get('new_team_color'),
        country: formData.get('new_team_country'),
      },
    };
  } else {
    payload = { selected_team: selectedTeam };
  }
  state.dashboard = await callBridge('start_new_game', {
    game_name: gameName,
    manager_name: managerName,
    ...payload,
  });
  await refreshGameState();
  await autoSaveGame();
  showView('game');
  renderNav();
  setNav('squad');
}

async function loadSavedGame(key) {
  const save = state.saves[key];
  if (!save) return;
  state.dashboard = await callBridge('load_game_from_blob', { blob: save.blob });
  await refreshGameState();
  showView('game');
  renderNav();
  setNav('squad');
}

async function deleteSavedGame(key) {
  const confirmed = await confirmAction('Delete save', 'Do you really want to delete this career?');
  if (!confirmed) return;
  delete state.saves[key];
  persistSaves();
  renderSavedGames();
}

function initEventListeners() {
  document.getElementById('btn-start-new').addEventListener('click', () => {
    showView('newGame');
  });
  document.getElementById('btn-load').addEventListener('click', () => {
    renderSavedGames();
    showView('loadGame');
  });
  document.getElementById('back-to-start').addEventListener('click', () => showView('start'));
  document.getElementById('back-to-start-from-load').addEventListener('click', () => showView('start'));
  teamSelectEl.addEventListener('change', toggleNewTeamFields);
  newGameForm.addEventListener('submit', handleNewGameSubmit);
  savedGamesContainer.addEventListener('click', (event) => {
    const target = event.target.closest('button[data-action]');
    if (!target) return;
    const key = target.dataset.key;
    if (target.dataset.action === 'load') {
      loadSavedGame(key);
    } else if (target.dataset.action === 'delete') {
      deleteSavedGame(key);
    }
  });
  document.getElementById('save-game').addEventListener('click', async () => {
    await autoSaveGame();
    await infoDialog('Saved', 'Your progress is safely stored in this browser.');
  });
  document.getElementById('open-manager').addEventListener('click', () => setNav('manager'));
}

async function confirmAction(title, message) {
  return new Promise((resolve) => {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal">
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="actions">
          <button class="ghost" id="modal-cancel">Cancel</button>
          <button class="primary" id="modal-confirm">Confirm</button>
        </div>
      </div>
    `;
    container.classList.add('active');
    container.querySelector('#modal-cancel').addEventListener('click', () => {
      container.classList.remove('active');
      resolve(false);
    });
    container.querySelector('#modal-confirm').addEventListener('click', () => {
      container.classList.remove('active');
      resolve(true);
    });
  });
}

async function infoDialog(title, message) {
  return new Promise((resolve) => {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal">
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="actions">
          <button class="primary" id="modal-ok">OK</button>
        </div>
      </div>
    `;
    container.classList.add('active');
    container.querySelector('#modal-ok').addEventListener('click', () => {
      container.classList.remove('active');
      resolve();
    });
  });
}

async function init() {
  try {
    await loadEngine();
    state.metadata = await callBridge('get_new_game_metadata');
    state.saves = loadSaves();
    populateNewGameForm();
    renderSavedGames();
    initEventListeners();
    showView('start');
  } catch (err) {
    console.error(err);
    await infoDialog('Error', 'Failed to initialise the game engine. Please refresh the page.');
  }
}

init();
