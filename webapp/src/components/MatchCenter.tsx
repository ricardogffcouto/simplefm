'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Game, Match, Player, Team } from '@/game';
import type { MatchEvent, MatchPopup, OperationResult } from '@/hooks/useGameEngine';
import { displayRating } from '@/utils/ratings';

interface MatchCenterProps {
  game: Game;
  team: Team;
  liveMatch: Match | null;
  lastMatch: Match | null;
  isMatchLive: boolean;
  autoPlaying: boolean;
  timeline: MatchEvent[];
  onStartLiveMatch: () => OperationResult;
  onToggleAutoPlay: () => OperationResult;
  onFinishLiveMatch: () => OperationResult;
  onMakeSubstitution: (playerOut: Player, playerIn: Player) => OperationResult;
  onFeedback: (result: OperationResult) => void;
  matchPopup: MatchPopup | null;
  onAcknowledgePopup: () => void;
}

function formatScore(match: Match | null): string {
  if (!match) {
    return '—';
  }
  return `${match.teams[0].name} ${match.score[0]} - ${match.score[1]} ${match.teams[1].name}`;
}

export function MatchCenter({
  game,
  team,
  liveMatch,
  lastMatch,
  isMatchLive,
  autoPlaying,
  timeline,
  onStartLiveMatch,
  onToggleAutoPlay,
  onFinishLiveMatch,
  onMakeSubstitution,
  onFeedback,
  matchPopup,
  onAcknowledgePopup
}: MatchCenterProps) {
  const [subOut, setSubOut] = useState<Player | null>(null);
  const [subIn, setSubIn] = useState<Player | null>(null);
  const [finishReady, setFinishReady] = useState(false);

  const nextMatch = useMemo(() => team.nextMatch(game.week), [team, game.week]);
  const nextOpponentName = useMemo(() => {
    if (!nextMatch) {
      return null;
    }
    const [home, away] = nextMatch.teams;
    return home === team ? away.name : home.name;
  }, [nextMatch, team]);
  const activeMatch = liveMatch ?? lastMatch ?? nextMatch;
  const matchFinished = !!liveMatch && liveMatch.finished;

  useEffect(() => {
    if (matchFinished) {
      setFinishReady(false);
      const timeout = setTimeout(() => setFinishReady(true), 1000);
      return () => clearTimeout(timeout);
    }
    setFinishReady(false);
    return undefined;
  }, [matchFinished]);

  const starters = team.players
    .filter((player) => player.playingStatus === 0)
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  const bench = team.players
    .filter((player) => player.playingStatus === 1)
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));

  const renderedTimeline: MatchEvent[] = useMemo(() => {
    if (liveMatch) {
      return timeline;
    }
    if (!lastMatch) {
      return [];
    }
    return lastMatch.goalscorers.map((goal) => ({
      minute: goal.minute,
      type: 'goal',
      team: goal.team.name,
      description: `${goal.team.name} goal! ${goal.player.name}`
    }));
  }, [liveMatch, timeline, lastMatch]);

  const handleStart = () => {
    onFeedback(onStartLiveMatch());
  };

  const handleToggleAutoPlay = () => {
    onFeedback(onToggleAutoPlay());
  };

  const handleFinish = () => {
    onFeedback(onFinishLiveMatch());
    setSubOut(null);
    setSubIn(null);
  };

  const commitSubstitution = (playerOut: Player, playerIn: Player) => {
    const result = onMakeSubstitution(playerOut, playerIn);
    onFeedback(result);
    if (result.success) {
      setSubOut(null);
      setSubIn(null);
    }
  };

  const selectOut = (player: Player) => {
    if (subOut === player) {
      setSubOut(null);
      return;
    }
    setSubOut(player);
    if (subIn) {
      commitSubstitution(player, subIn);
    }
  };

  const selectIn = (player: Player) => {
    if (subIn === player) {
      setSubIn(null);
      return;
    }
    setSubIn(player);
    if (subOut) {
      commitSubstitution(subOut, player);
    }
  };

  const minuteLabel = liveMatch ? `Minute ${liveMatch.minutes}` : nextMatch ? `Week ${game.week + 1}` : 'Match finished';

  const kickoffAvailable = !isMatchLive && !matchFinished && !!nextMatch;
  const goalInterlude = matchPopup?.type === 'goal' && isMatchLive && !autoPlaying;

  let primaryLabel = 'Kick-off';
  let primaryDisabled = false;
  let primaryVariant: 'primary' | 'secondary' = 'primary';
  let controlHint = '';

  if (matchFinished) {
    primaryLabel = finishReady ? 'End match' : 'Full time';
    primaryDisabled = !finishReady;
    primaryVariant = 'primary';
    controlHint = finishReady
      ? 'Wrap up the fixture to continue your week.'
      : 'Final whistle! Preparing summary…';
  } else if (isMatchLive) {
    if (autoPlaying) {
      primaryLabel = 'Pause';
      primaryVariant = 'secondary';
      controlHint = 'Stop auto-play to pause the simulation.';
    } else {
      primaryLabel = 'Play';
      primaryVariant = 'primary';
      primaryDisabled = goalInterlude;
      controlHint = matchPopup?.type === 'halftime'
        ? 'Start the second half when ready.'
        : goalInterlude
        ? 'Celebrating the goal…'
        : 'Resume the live simulation.';
    }
  } else {
    primaryLabel = 'Kick-off';
    primaryVariant = 'primary';
    primaryDisabled = !kickoffAvailable;
    controlHint = kickoffAvailable
      ? `Play week ${game.week + 1} against ${nextOpponentName ?? 'your opponent'}.`
      : 'No fixture available this week.';
  }

  const primaryClass = `${
    primaryVariant === 'primary' ? 'kivy-button' : 'kivy-button kivy-button--secondary'
  } px-5 py-3 text-sm font-semibold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50`;

  const handlePrimaryAction = () => {
    if (matchFinished) {
      if (finishReady) {
        handleFinish();
      }
      return;
    }
    if (isMatchLive) {
      if (autoPlaying) {
        handleToggleAutoPlay();
      } else {
        if (matchPopup) {
          onAcknowledgePopup();
        }
        handleToggleAutoPlay();
      }
      return;
    }
    if (kickoffAvailable) {
      handleStart();
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/60 px-4 py-6">
      {matchPopup && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center pt-24">
          <div className="pointer-events-auto w-full max-w-xs rounded-2xl border-2 border-[#f5d767]/80 bg-[#1c1d25]/95 px-6 py-4 text-center shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[#f5d767]/80">
              {matchPopup.type === 'goal' ? 'Goal' : 'Half-time'}
            </p>
            <p className="mt-2 text-xl font-semibold text-white">{matchPopup.title}</p>
            {matchPopup.message && <p className="mt-3 text-sm text-white/80">{matchPopup.message}</p>}
            {matchPopup.type === 'halftime' && (
              <p className="mt-3 text-xs uppercase text-[#f5d767]/80">Press play when you&apos;re ready.</p>
            )}
          </div>
        </div>
      )}

      <div className="kivy-panel relative mx-auto w-full max-w-5xl">
        <header className="kivy-header flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#f5d767]">Match screen</p>
            <p className="text-lg font-semibold text-white">{formatScore(activeMatch)}</p>
            <p className="text-xs text-white/80">{minuteLabel}</p>
          </div>
          <div className="text-right text-xs uppercase tracking-[0.2em] text-white/70">
            {matchFinished ? 'Full time' : isMatchLive ? (autoPlaying ? 'Auto-play running' : 'Match paused') : 'Awaiting kick-off'}
          </div>
        </header>

        <div className="grid gap-4 px-6 py-6 lg:grid-cols-[2fr_1fr]">
          <section className="kivy-list p-4">
            <h3 className="text-base font-semibold uppercase tracking-wide">Timeline</h3>
            <div className="kivy-scroll mt-3 max-h-64 space-y-2 overflow-y-auto">
              {renderedTimeline.length === 0 && <p className="kivy-subtle text-sm">No notable events yet.</p>}
              {renderedTimeline.map((event, index) => (
                <div key={`${event.minute}-${event.team}-${index}`} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
                  <span className="font-semibold">{event.minute}&apos;</span> {event.description}
                </div>
              ))}
            </div>
          </section>

          <section className="kivy-list flex flex-col gap-3 p-4 text-sm">
            <h3 className="text-base font-semibold uppercase tracking-wide">Match control</h3>
            <button type="button" className={primaryClass} onClick={handlePrimaryAction} disabled={primaryDisabled}>
              {primaryLabel}
            </button>
            <p className="kivy-subtle text-xs">{controlHint}</p>
          </section>
        </div>

        <div className="grid gap-4 px-6 pb-6 lg:grid-cols-2">
          <section className="kivy-list p-4">
            <h3 className="text-base font-semibold uppercase tracking-wide">On the pitch</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {starters.map((player) => {
                const selected = subOut === player;
                return (
                  <button
                    key={`starter-${player.name}-${player.age}`}
                    onClick={() => selectOut(player)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm ${
                      selected ? 'border-[#f5d767] bg-[#f5d767]/40' : 'border-black/15 bg-white hover:border-[#f5d767]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{player.name}</span>
                      <span>{player.posToStr()}</span>
                    </div>
                    <p className="kivy-subtle">Skill {displayRating(player.skill)} · Age {player.age}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="kivy-list p-4">
            <h3 className="text-base font-semibold uppercase tracking-wide">Bench</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {bench.map((player) => {
                const selected = subIn === player;
                return (
                  <button
                    key={`bench-${player.name}-${player.age}`}
                    onClick={() => selectIn(player)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm ${
                      selected ? 'border-[#f5d767] bg-[#f5d767]/40' : 'border-black/15 bg-white hover:border-[#f5d767]'
                    } ${player.injured() ? 'opacity-60' : ''}`}
                    disabled={player.injured()}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{player.name}</span>
                      <span>{player.posToStr()}</span>
                    </div>
                    <p className="kivy-subtle">Skill {displayRating(player.skill)} · Contract {player.contract} weeks</p>
                  </button>
                );
              })}
              {bench.length === 0 && <p className="kivy-subtle text-sm">No substitutes available.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
