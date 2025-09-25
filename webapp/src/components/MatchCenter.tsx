'use client';

import { useMemo, useState } from 'react';
import type { Game, Match, Player, Team } from '@/game';
import type { MatchEvent, OperationResult } from '@/hooks/useGameEngine';

interface MatchCenterProps {
  game: Game;
  team: Team;
  liveMatch: Match | null;
  lastMatch: Match | null;
  isMatchLive: boolean;
  autoPlaying: boolean;
  timeline: MatchEvent[];
  onStartLiveMatch: () => OperationResult;
  onPlayMinute: () => OperationResult;
  onToggleAutoPlay: () => OperationResult;
  onFinishLiveMatch: () => OperationResult;
  onMakeSubstitution: (playerOut: Player, playerIn: Player) => OperationResult;
  onFeedback: (result: OperationResult) => void;
  onClose: () => void;
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
  onPlayMinute,
  onToggleAutoPlay,
  onFinishLiveMatch,
  onMakeSubstitution,
  onFeedback,
  onClose
}: MatchCenterProps) {
  const [subOut, setSubOut] = useState<Player | null>(null);
  const [subIn, setSubIn] = useState<Player | null>(null);

  const nextMatch = useMemo(() => team.nextMatch(game.week), [team, game.week]);
  const activeMatch = liveMatch ?? lastMatch ?? nextMatch;
  const matchInProgress = !!liveMatch && !liveMatch.finished;

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

  const handlePlayMinute = () => {
    onFeedback(onPlayMinute());
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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="kivy-panel w-full max-w-5xl overflow-hidden">
        <header className="kivy-header flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#f5d767]">Match screen</p>
            <p className="text-lg font-semibold text-white">{formatScore(activeMatch)}</p>
            <p className="text-xs text-white/80">{minuteLabel}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="kivy-button kivy-button--secondary px-4 py-2 text-xs" onClick={onClose}>
              Close
            </button>
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
            <h3 className="text-base font-semibold uppercase tracking-wide">Controls</h3>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="kivy-button px-4 py-2 text-xs disabled:opacity-50"
                onClick={handleStart}
                disabled={!nextMatch || isMatchLive}
              >
                Kick-off
              </button>
              <button
                type="button"
                className="kivy-button kivy-button--secondary px-4 py-2 text-xs disabled:opacity-50"
                onClick={handlePlayMinute}
                disabled={!matchInProgress}
              >
                Play minute
              </button>
              <button
                type="button"
                className="kivy-button kivy-button--secondary px-4 py-2 text-xs disabled:opacity-50"
                onClick={handleToggleAutoPlay}
                disabled={!matchInProgress && !autoPlaying}
              >
                {autoPlaying ? 'Pause auto-play' : 'Auto-play'}
              </button>
              <button
                type="button"
                className="kivy-button kivy-button--secondary px-4 py-2 text-xs disabled:opacity-50"
                onClick={handleFinish}
                disabled={!liveMatch || !liveMatch.finished}
              >
                Finish match
              </button>
            </div>
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
                    <p className="kivy-subtle">Skill {player.skill.toFixed(1)} · Age {player.age}</p>
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
                    <p className="kivy-subtle">Skill {player.skill.toFixed(1)} · Contract {player.contract} weeks</p>
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
