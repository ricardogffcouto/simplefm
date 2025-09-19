'use client';

import { Fragment } from 'react';
import type { Game, Match, Team, Player } from '@/game';
import type { TabKey } from '@/hooks/useGameEngine';

interface Props {
  game: Game;
  humanTeam: Team;
  currentMatch: Match | null;
  rosterByPosition: Array<{ label: string; players: Player[] }>;
  leagueTable: Array<{
    position: number;
    name: string;
    points: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  }>;
  weekNews: string[];
  selectedTab: TabKey;
  setSelectedTab: (tab: TabKey) => void;
  onPlayMatch: () => void;
  onSimulateWeek: () => void;
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'team', label: 'Squad' },
  { key: 'match', label: 'Matchday' },
  { key: 'league', label: 'League' },
  { key: 'finance', label: 'Finances' },
  { key: 'news', label: 'Weekly news' }
];

export function GameDashboard({
  game,
  humanTeam,
  currentMatch,
  rosterByPosition,
  leagueTable,
  weekNews,
  selectedTab,
  setSelectedTab,
  onPlayMatch,
  onSimulateWeek
}: Props) {
  const nextMatch = humanTeam.nextMatch(game.week);
  const nextOpponent = nextMatch ? humanTeam.nextOpponent(game.week) : null;
  const seasonHeader = `Season ${game.season + 1} · Week ${game.week + 1}`;

  const headerGradient = `linear-gradient(135deg, rgba(245,216,103,0.15), rgba(255,255,255,0.05))`;

  return (
    <section className="flex w-full max-w-5xl flex-col gap-6">
      <header className="card-surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="h-16 w-16 rounded-2xl border border-white/20"
            style={{ background: headerGradient }}
          >
            <div
              className="h-full w-full rounded-2xl"
              style={{
                background: typeof humanTeam.color === 'string' ? humanTeam.color : '#1a5c2b'
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">{humanTeam.name}</h1>
            <p className="text-sm text-subtle">
              {seasonHeader} · {humanTeam.division?.name ?? 'Friendly league'}
            </p>
            <p className="text-xs text-subtle">
              Fans morale: {Math.round(humanTeam.fanHappiness)} · Balance: €{humanTeam.money.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:text-right">
          <span className="text-xs uppercase tracking-wide text-subtle">Next opponent</span>
          {nextOpponent ? (
            <div className="text-lg font-semibold text-accent">{nextOpponent.name}</div>
          ) : (
            <div className="text-lg font-semibold text-accent">Season complete</div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onPlayMatch}
              disabled={!nextMatch}
              className="rounded-full bg-accent/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-midnight transition hover:bg-accent disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
            >
              Play week
            </button>
            <button
              onClick={onSimulateWeek}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-accent hover:text-accent"
            >
              Quick sim
            </button>
          </div>
        </div>
      </header>

      <nav className="card-surface nav-glow flex items-center justify-between rounded-full px-4 py-2 text-xs uppercase text-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
            className={`rounded-full px-3 py-2 font-semibold transition ${
              tab.key === selectedTab ? 'bg-accent/80 text-midnight' : 'hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="card-surface min-h-[320px] p-6">
        {selectedTab === 'team' && (
          <div className="space-y-4">
            {rosterByPosition.map(({ label, players }) => (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-accent">
                  <span>{label}</span>
                  <span>{players.length} players</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10 text-sm">
                    <thead className="bg-white/5 text-xs uppercase text-subtle">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Skill</th>
                        <th className="px-3 py-2 text-left">Age</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Wage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {players.map((player) => (
                        <tr key={`${player.name}-${player.age}`} className="hover:bg-white/5">
                          <td className="px-3 py-2 text-white">{player.name}</td>
                          <td className="px-3 py-2 text-accent">{player.skill.toFixed(1)}</td>
                          <td className="px-3 py-2 text-subtle">{player.age}</td>
                          <td className="px-3 py-2 text-subtle">
                            {player.playingStatus === 0 ? 'Starting XI' : player.playingStatus === 1 ? 'Bench' : 'Reserve'}
                            {player.injured() ? ' · Injured' : ''}
                          </td>
                          <td className="px-3 py-2 text-subtle">€{player.salary.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'match' && (
          <div className="space-y-4">
            {currentMatch ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-xs uppercase tracking-wide text-subtle">Final score</span>
                  <div className="flex items-center gap-4 text-3xl font-semibold text-white">
                    <span>{currentMatch.teams[0].name}</span>
                    <span className="rounded-full bg-accent/80 px-4 py-1 text-midnight">
                      {currentMatch.score[0]} - {currentMatch.score[1]}
                    </span>
                    <span>{currentMatch.teams[1].name}</span>
                  </div>
                  <p className="text-xs text-subtle">
                    Possession: {currentMatch.ballPossession()[0]}% · Shots: {currentMatch.goalscorers.length}
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  {currentMatch.goalscorers.map((goal, index) => (
                    <div key={`${goal.player.name}-${index}`} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2 text-sm text-white/80">
                      <span>{goal.minute}&#39; · {goal.team.name}</span>
                      <span>{goal.player.name}</span>
                    </div>
                  ))}
                  {currentMatch.goalscorers.length === 0 && (
                    <p className="text-center text-sm text-subtle">No goals scored this week.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-subtle">
                <p className="text-sm">No match played yet. Use “Play week” to simulate the upcoming fixture.</p>
              </div>
            )}
            {nextMatch && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-left text-sm text-subtle">
                  <div className="text-xs uppercase tracking-wide">Match preview</div>
                  <div className="mt-2 text-lg font-semibold text-white">{humanTeam.name} vs {nextOpponent?.name}</div>
                  <p className="mt-2">Home advantage: {nextMatch.teams[0] === humanTeam ? 'Yes' : 'No'}</p>
                  <p>Suggested tactic: {humanTeam.currentTactic().join('-')}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-subtle">
                  <div className="text-xs uppercase tracking-wide">Weekly objectives</div>
                  <ul className="mt-2 space-y-1">
                    <li>Maintain fan happiness above 50</li>
                    <li>Keep wages under €{humanTeam.financesWeeklyExpense().toLocaleString()}</li>
                    <li>Scout transfer list for upgrades</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'league' && (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5 text-xs uppercase text-subtle">
                <tr>
                  <th className="px-3 py-2 text-left">Pos</th>
                  <th className="px-3 py-2 text-left">Club</th>
                  <th className="px-3 py-2 text-left">Pts</th>
                  <th className="px-3 py-2 text-left">W</th>
                  <th className="px-3 py-2 text-left">D</th>
                  <th className="px-3 py-2 text-left">L</th>
                  <th className="px-3 py-2 text-left">GF</th>
                  <th className="px-3 py-2 text-left">GA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leagueTable.map((row) => (
                  <tr
                    key={row.name}
                    className={`${row.name === humanTeam.name ? 'bg-accent/10 text-white' : 'text-subtle'} hover:bg-white/5`}
                  >
                    <td className="px-3 py-2 font-semibold text-accent">{row.position}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.points}</td>
                    <td className="px-3 py-2">{row.wins}</td>
                    <td className="px-3 py-2">{row.draws}</td>
                    <td className="px-3 py-2">{row.losses}</td>
                    <td className="px-3 py-2">{row.goalsFor}</td>
                    <td className="px-3 py-2">{row.goalsAgainst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedTab === 'finance' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-accent">Weekly balance</h3>
              <ul className="mt-3 space-y-2 text-sm text-subtle">
                {Object.entries(humanTeam.weeklyFinances).map(([key, value]) => (
                  <li key={key} className="flex justify-between">
                    <span>{key}</span>
                    <span className={value >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                      €{value.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-accent">Season finances</h3>
              <ul className="mt-3 space-y-2 text-sm text-subtle">
                {Object.entries(humanTeam.yearlyFinances).map(([key, value]) => (
                  <li key={key} className="flex justify-between">
                    <span>{key}</span>
                    <span className={value >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                      €{value.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {selectedTab === 'news' && (
          <div className="space-y-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-subtle">
              <h3 className="text-sm font-semibold text-accent">Weekly briefing</h3>
              {weekNews.length ? (
                <ul className="mt-2 space-y-1">
                  {weekNews.map((item, index) => (
                    <li key={`${item}-${index}`} className="rounded-xl bg-white/5 px-3 py-2 text-white/80">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">No new updates from the press office yet.</p>
              )}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-subtle">
              <h3 className="text-sm font-semibold text-accent">Long term outlook</h3>
              <p className="mt-2">
                Keep your supporters engaged by averaging at least {humanTeam.seasonPointsPerWeek.toFixed(2)} points per week.
                Avoid slipping below position {humanTeam.minPosPerSeasonPointsPerWeek()} to stay aligned with the board&#39;s plan.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
