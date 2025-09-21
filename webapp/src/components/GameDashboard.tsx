'use client';

import { useMemo, useState } from 'react';
import type { Game, Match, Player, Team } from '@/game';
import type { MatchEvent, OperationResult, TabKey } from '@/hooks/useGameEngine';
import { SquadBoard } from './SquadBoard';
import { MatchCenter } from './MatchCenter';
import { TransferHub } from './TransferHub';
import { TrainingPanel } from './TrainingPanel';

interface Props {
  game: Game;
  humanTeam: Team;
  currentMatch: Match | null;
  weekNews: string[];
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
  selectedTab: TabKey;
  setSelectedTab: (tab: TabKey) => void;
  onPlayMatch: () => void;
  onSimulateWeek: () => void;
  allowedTactics: number[][];
  currentTactic: number[];
  onSetTactic: (tactic: number[]) => OperationResult;
  onSwapPlayers: (playerA: Player, playerB: Player) => OperationResult;
  liveMatch: Match | null;
  isMatchLive: boolean;
  matchTimeline: MatchEvent[];
  autoPlaying: boolean;
  onStartLiveMatch: () => OperationResult;
  onPlayMinute: () => OperationResult;
  onToggleAutoPlay: () => OperationResult;
  onFinishLiveMatch: () => OperationResult;
  onMakeSubstitution: (playerOut: Player, playerIn: Player) => OperationResult;
  onRefreshTransferList: () => OperationResult;
  onBuyPlayer: (player: Player) => OperationResult;
  onSellPlayer: (player: Player) => OperationResult;
  onRenewContract: (player: Player) => OperationResult;
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'team', label: 'Squad' },
  { key: 'match', label: 'Matchday' },
  { key: 'transfers', label: 'Transfers' },
  { key: 'training', label: 'Training' },
  { key: 'league', label: 'League' },
  { key: 'finance', label: 'Finances' },
  { key: 'news', label: 'Weekly news' }
];

export function GameDashboard({
  game,
  humanTeam,
  currentMatch,
  weekNews,
  leagueTable,
  selectedTab,
  setSelectedTab,
  onPlayMatch,
  onSimulateWeek,
  allowedTactics,
  currentTactic,
  onSetTactic,
  onSwapPlayers,
  liveMatch,
  isMatchLive,
  matchTimeline,
  autoPlaying,
  onStartLiveMatch,
  onPlayMinute,
  onToggleAutoPlay,
  onFinishLiveMatch,
  onMakeSubstitution,
  onRefreshTransferList,
  onBuyPlayer,
  onSellPlayer,
  onRenewContract
}: Props) {
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const nextOpponent = useMemo(() => humanTeam.nextOpponent(game.week), [humanTeam, game.week]);

  const showFeedback = (result: OperationResult | string, type: 'success' | 'error' | 'info' = 'info') => {
    if (typeof result === 'string') {
      setFeedback({ message: result, type });
    } else {
      setFeedback({ message: result.message, type: result.success ? 'success' : 'error' });
    }
  };

  const handleQuickMatch = () => {
    onPlayMatch();
    showFeedback('Played the upcoming fixture using quick simulation. Check the news tab for details.');
  };

  const handleSimulateWeek = () => {
    onSimulateWeek();
    showFeedback('Advanced the season by one week.');
  };

  return (
    <section className="flex w-full max-w-5xl flex-col gap-6">
      <header className="card-surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl border border-white/20" style={{ background: 'linear-gradient(135deg, rgba(245,216,103,0.15), rgba(255,255,255,0.05))' }}>
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
              Season {game.season + 1} · Week {game.week + 1} · {humanTeam.division?.name ?? 'Friendly league'}
            </p>
            <p className="text-xs text-subtle">
              Fans morale: {Math.round(humanTeam.fanHappiness)} · Balance: €{humanTeam.money.toLocaleString()}
            </p>
            <p className="text-xs text-subtle">
              Next opponent: {nextOpponent ? nextOpponent.name : 'Season complete'}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:text-right">
          <span className="text-xs uppercase tracking-wide text-subtle">Fast actions</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleQuickMatch}
              className="rounded-full bg-accent/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-midnight transition hover:bg-accent"
            >
              Quick play week
            </button>
            <button
              onClick={handleSimulateWeek}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-accent hover:text-accent"
            >
              Simulate all
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

      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
              : feedback.type === 'error'
              ? 'border-red-400/30 bg-red-500/10 text-red-200'
              : 'border-white/20 bg-white/5 text-subtle'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="card-surface min-h-[320px] p-6">
        {selectedTab === 'team' && (
          <SquadBoard
            team={humanTeam}
            allowedTactics={allowedTactics}
            currentTactic={currentTactic}
            onSetTactic={onSetTactic}
            onSwapPlayers={onSwapPlayers}
            onFeedback={showFeedback}
          />
        )}

        {selectedTab === 'match' && (
          <MatchCenter
            game={game}
            team={humanTeam}
            liveMatch={liveMatch}
            lastMatch={currentMatch}
            isMatchLive={isMatchLive}
            autoPlaying={autoPlaying}
            timeline={matchTimeline}
            onStartLiveMatch={onStartLiveMatch}
            onPlayMinute={onPlayMinute}
            onToggleAutoPlay={onToggleAutoPlay}
            onFinishLiveMatch={onFinishLiveMatch}
            onMakeSubstitution={onMakeSubstitution}
            onQuickMatch={handleQuickMatch}
            onQuickWeek={handleSimulateWeek}
            onFeedback={showFeedback}
          />
        )}

        {selectedTab === 'transfers' && (
          <TransferHub
            team={humanTeam}
            onRefresh={onRefreshTransferList}
            onBuy={onBuyPlayer}
            onSell={onSellPlayer}
            onRenew={onRenewContract}
            onFeedback={showFeedback}
          />
        )}

        {selectedTab === 'training' && <TrainingPanel team={humanTeam} />}

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
                    <span className={value >= 0 ? 'text-emerald-300' : 'text-red-300'}>€{value.toLocaleString()}</span>
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
                    <span className={value >= 0 ? 'text-emerald-300' : 'text-red-300'}>€{value.toLocaleString()}</span>
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
                Avoid slipping below position {humanTeam.minPosPerSeasonPointsPerWeek()} to stay aligned with the board's plan.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
