'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Game, Match, Player, Team } from '@/game';
import type { MatchEvent, OperationResult, TabKey } from '@/hooks/useGameEngine';
import type { PostMatchSummary } from '@/hooks/postMatchSummary';
import { SquadBoard } from './SquadBoard';
import { TrainingPanel } from './TrainingPanel';
import { TransferHub } from './TransferHub';
import { MatchCenter } from './MatchCenter';
import { ManagerStatsPanel } from './ManagerStatsPanel';
import { PostMatchSummaryModal } from './PostMatchSummary';

interface Props {
  game: Game;
  humanTeam: Team;
  currentMatch: Match | null;
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
  onResetCareer: () => void;
  postMatchSummary: PostMatchSummary | null;
  onDismissSummary: () => void;
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'team', label: 'Team' },
  { key: 'training', label: 'Training' },
  { key: 'transfers', label: 'Transfers' },
  { key: 'info', label: 'Information' },
  { key: 'league', label: 'League' }
];

export function GameDashboard({
  game,
  humanTeam,
  currentMatch,
  leagueTable,
  weekNews,
  selectedTab,
  setSelectedTab,
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
  onRenewContract,
  onResetCareer,
  postMatchSummary,
  onDismissSummary
}: Props) {
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'error' | 'info' } | null>(null);
  const [showMatchScreen, setShowMatchScreen] = useState(false);
  const [showManagerStats, setShowManagerStats] = useState(false);

  const nextOpponent = useMemo(() => humanTeam.nextOpponent(game.week), [humanTeam, game.week]);

  useEffect(() => {
    if (postMatchSummary) {
      setShowMatchScreen(false);
      setSelectedTab('info');
    }
  }, [postMatchSummary, setSelectedTab]);

  const showFeedback = (result: OperationResult | string | void, fallbackTone: 'success' | 'error' | 'info' = 'info') => {
    if (!result) {
      return;
    }
    if (typeof result === 'string') {
      setFeedback({ message: result, tone: fallbackTone });
      return;
    }
    setFeedback({ message: result.message, tone: result.success ? 'success' : 'error' });
  };

  const footerButtonClass = (active: boolean) =>
    `rounded-full border-2 border-black/20 px-3 py-2 text-sm font-semibold uppercase tracking-wide transition ${
      active ? 'bg-[#f5d767] text-black' : 'bg-white text-black hover:bg-[#f7e48f]'
    }`;

  const renderTeamScreen = () => (
    <div className="flex h-full flex-col gap-4">
      <SquadBoard
        team={humanTeam}
        allowedTactics={allowedTactics}
        currentTactic={currentTactic}
        onSetTactic={(tactic) => {
          const result = onSetTactic(tactic);
          showFeedback(result);
          return result;
        }}
        onSwapPlayers={(a, b) => {
          const result = onSwapPlayers(a, b);
          showFeedback(result);
          return result;
        }}
        onFeedback={showFeedback}
      />
      <div className="flex flex-col gap-2 rounded-2xl border-2 border-black/15 bg-white/95 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Next opponent</p>
          <p className="kivy-subtle">
            {nextOpponent ? `${nextOpponent.name} · Week ${game.week + 1}` : 'Season complete'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="kivy-button px-6 py-2 text-xs"
            onClick={() => setShowMatchScreen(true)}
          >
            Go to match screen
          </button>
        </div>
      </div>
    </div>
  );

  const renderInfoScreen = () => (
    <div className="flex h-full flex-col gap-4 text-sm">
      <section className="kivy-list p-4">
        <h3 className="text-base font-semibold uppercase tracking-wide">Finances</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-semibold">Weekly balance</h4>
            <ul className="mt-2 space-y-1">
              {Object.entries(humanTeam.weeklyFinances).map(([label, value]) => (
                <li key={label} className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-1">
                  <span>{label}</span>
                  <span className={value >= 0 ? 'text-emerald-600' : 'text-red-600'}>€{value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Season finances</h4>
            <ul className="mt-2 space-y-1">
              {Object.entries(humanTeam.yearlyFinances).map(([label, value]) => (
                <li key={label} className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-1">
                  <span>{label}</span>
                  <span className={value >= 0 ? 'text-emerald-600' : 'text-red-600'}>€{value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="kivy-list p-4">
        <h3 className="text-base font-semibold uppercase tracking-wide">Weekly news</h3>
        {weekNews.length === 0 ? (
          <p className="kivy-subtle mt-2">No press updates were recorded this week.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {weekNews.map((item, index) => (
              <li key={`${item}-${index}`} className="rounded-lg border border-black/10 bg-white px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="kivy-list p-4">
        <h3 className="text-base font-semibold uppercase tracking-wide">Board expectations</h3>
        <p className="kivy-subtle mt-2">
          Maintain an average of {humanTeam.seasonPointsPerWeek.toFixed(2)} points per week. Stay above position{' '}
          {humanTeam.minPosPerSeasonPointsPerWeek()} to keep the board satisfied.
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <button type="button" className="kivy-button" onClick={onSimulateWeek}>
            Continue week
          </button>
        </div>
      </section>
    </div>
  );

  const renderLeagueScreen = () => (
    <div className="kivy-list overflow-hidden">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/80 text-xs uppercase">
          <tr>
            <th className="px-3 py-2">Pos</th>
            <th className="px-3 py-2">Club</th>
            <th className="px-3 py-2">Pts</th>
            <th className="px-3 py-2">W</th>
            <th className="px-3 py-2">D</th>
            <th className="px-3 py-2">L</th>
            <th className="px-3 py-2">GF</th>
            <th className="px-3 py-2">GA</th>
          </tr>
        </thead>
        <tbody>
          {leagueTable.map((row) => (
            <tr key={row.name} className={row.name === humanTeam.name ? 'bg-[#f5d767]/60 font-semibold' : 'bg-white/90'}>
              <td className="px-3 py-2">{row.position}</td>
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
  );

  const renderContent = () => {
    if (showManagerStats) {
      return <ManagerStatsPanel manager={humanTeam.manager} onClose={() => setShowManagerStats(false)} />;
    }

    switch (selectedTab) {
      case 'team':
        return renderTeamScreen();
      case 'training':
        return <TrainingPanel team={humanTeam} />;
      case 'transfers':
        return (
          <TransferHub
            team={humanTeam}
            onRefresh={() => {
              const result = onRefreshTransferList();
              showFeedback(result);
              return result;
            }}
            onBuy={(player) => {
              const result = onBuyPlayer(player);
              showFeedback(result);
              return result;
            }}
            onSell={(player) => {
              const result = onSellPlayer(player);
              showFeedback(result);
              return result;
            }}
            onRenew={(player) => {
              const result = onRenewContract(player);
              showFeedback(result);
              return result;
            }}
            onFeedback={showFeedback}
          />
        );
      case 'info':
        return renderInfoScreen();
      case 'league':
        return renderLeagueScreen();
      default:
        return null;
    }
  };

  return (
    <section className="kivy-panel flex w-full flex-col overflow-hidden">
      <header className="kivy-header flex items-center gap-4 px-5 py-4">
        <button
          type="button"
          className="kivy-button kivy-button--secondary px-6 py-2 text-xs"
          onClick={() => setShowManagerStats((value) => !value)}
        >
          {showManagerStats ? 'Back to club' : 'Manager stats'}
        </button>
        <div className="flex flex-1 flex-col items-center">
          <span className="text-xs uppercase tracking-[0.35em] text-[#f5d767]">{game.name}</span>
          <span className="text-lg font-semibold text-white">{humanTeam.name}</span>
          <span className="text-xs text-white/80">
            Season {game.season + 1} · Week {game.week + 1}
          </span>
        </div>
        <div className="text-right text-xs text-white">
          <p>Fans: {Math.round(humanTeam.fanHappiness)}</p>
          <p>Balance: €{humanTeam.money.toLocaleString()}</p>
        </div>
      </header>

      {feedback && (
        <div
          className={`px-5 py-3 text-sm ${
            feedback.tone === 'success'
              ? 'text-emerald-700'
              : feedback.tone === 'error'
              ? 'text-red-700'
              : 'text-[#2b2b2b]'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <div className="flex-1 overflow-y-auto kivy-scroll">
          {renderContent()}
        </div>

        {!showManagerStats && (
          <>
            <footer className="kivy-footer grid grid-cols-2 gap-3 rounded-2xl px-4 py-3 sm:grid-cols-5">
              {tabs.map((tab) => (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key)}
                  className={footerButtonClass(tab.key === selectedTab)}
                >
                  {tab.label}
                </button>
              ))}
            </footer>
            <div className="px-4 pb-4 text-right">
              <button type="button" className="text-xs font-semibold uppercase tracking-wide text-black/60" onClick={onResetCareer}>
                Quit to menu
              </button>
            </div>
          </>
        )}
      </div>

      {showMatchScreen && (
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
          onFeedback={showFeedback}
          onClose={() => setShowMatchScreen(false)}
        />
      )}

      {postMatchSummary && <PostMatchSummaryModal summary={postMatchSummary} onClose={onDismissSummary} />}
    </section>
  );
}
