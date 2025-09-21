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
  onQuickMatch: () => void;
  onQuickWeek: () => void;
  onFeedback: (result: OperationResult) => void;
}

function formatScore(match: Match | null, club: Team): string {
  if (!match) {
    return '—';
  }
  const [home, away] = match.score;
  const homeClub = match.teams[0];
  return homeClub === club ? `${home} - ${away}` : `${away} - ${home}`;
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
  onQuickMatch,
  onQuickWeek,
  onFeedback
}: MatchCenterProps) {
  const [subOut, setSubOut] = useState<Player | null>(null);
  const [subIn, setSubIn] = useState<Player | null>(null);

  const nextMatch = useMemo(() => team.nextMatch(game.week), [team, game.week]);
  const nextOpponent = useMemo(() => team.nextOpponent(game.week), [team, game.week]);

  const matchInProgress = liveMatch && !liveMatch.finished;
  const activeMatch = liveMatch ?? lastMatch;

  const possession = activeMatch ? activeMatch.ballPossession() : [50, 50];

  const starters = team.players
    .filter((player) => player.playingStatus === 0)
    .sort((a, b) => b.skill - a.skill);
  const bench = team.players
    .filter((player) => player.playingStatus === 1)
    .sort((a, b) => b.skill - a.skill);

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
      description: `${goal.team.name} goal! ${goal.player.name} scores.`
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

  const handleFinishWeek = () => {
    onFeedback(onFinishLiveMatch());
    setSubIn(null);
    setSubOut(null);
  };

  const commitSubstitution = (playerOut: Player, playerIn: Player) => {
    const result = onMakeSubstitution(playerOut, playerIn);
    onFeedback(result);
    if (result.success) {
      setSubIn(null);
      setSubOut(null);
    }
  };

  const handleSubOutSelect = (player: Player) => {
    if (subOut === player) {
      setSubOut(null);
      return;
    }
    setSubOut(player);
    if (subIn) {
      commitSubstitution(player, subIn);
    }
  };

  const handleSubInSelect = (player: Player) => {
    if (subIn === player) {
      setSubIn(null);
      return;
    }
    setSubIn(player);
    if (subOut) {
      commitSubstitution(subOut, player);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-subtle">Match centre</h3>
              <p className="text-lg font-semibold text-white">
                {liveMatch ? `Minute ${liveMatch.minutes}` : `Season ${game.season + 1} · Week ${game.week + 1}`}
              </p>
              <p className="text-xs text-subtle">
                {nextOpponent ? `Next opponent: ${nextOpponent.name}` : 'Season complete'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleStart}
                disabled={!nextMatch || (!!liveMatch && !liveMatch.finished)}
                className="rounded-full bg-accent/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-midnight transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
              >
                Start live match
              </button>
              <button
                onClick={onQuickMatch}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-accent hover:text-accent"
              >
                Quick play week
              </button>
              <button
                onClick={onQuickWeek}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-accent hover:text-accent"
              >
                Simulate all
              </button>
            </div>
          </div>

          {activeMatch && (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-midnight/40 p-4 text-center text-white">
                <div className="text-xs uppercase tracking-wide text-subtle">
                  {liveMatch ? `Minute ${liveMatch.minutes}` : 'Final score'}
                </div>
                <div className="mt-2 text-3xl font-semibold">
                  {activeMatch.teams[0].name} {activeMatch.score[0]} - {activeMatch.score[1]} {activeMatch.teams[1].name}
                </div>
                <div className="mt-2 text-xs text-subtle">
                  Possession: {possession[0]}% · Goals: {activeMatch.goalscorers.length}
                </div>
              </div>
              {liveMatch ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handlePlayMinute}
                      disabled={!matchInProgress}
                      className="rounded-full bg-accent/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-midnight transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
                    >
                      Play minute
                    </button>
                    <button
                      onClick={handleToggleAutoPlay}
                      disabled={!matchInProgress && !autoPlaying}
                      className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
                    >
                      {autoPlaying ? 'Pause auto-play' : 'Auto-play'}
                    </button>
                    <button
                      onClick={handleFinishWeek}
                      disabled={!liveMatch.finished}
                      className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
                    >
                      Finish week
                    </button>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-subtle">Starters</div>
                      <div className="mt-2 flex flex-col gap-2">
                        {starters.map((player) => (
                          <button
                            key={`starter-${player.name}-${player.age}`}
                            onClick={() => handleSubOutSelect(player)}
                            className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                              subOut === player
                                ? 'border-accent bg-accent/20 text-white'
                                : 'border-white/10 bg-white/5 text-subtle hover:border-accent hover:text-white'
                            }`}
                          >
                            {player.name} · {player.posToStr()} · {player.skill.toFixed(1)}
                          </button>
                        ))}
                        {starters.length === 0 && <p className="text-xs text-subtle">No active starters.</p>}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-subtle">Bench</div>
                      <div className="mt-2 flex flex-col gap-2">
                        {bench.map((player) => (
                          <button
                            key={`bench-${player.name}-${player.age}`}
                            onClick={() => handleSubInSelect(player)}
                            className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                              subIn === player
                                ? 'border-accent bg-accent/20 text-white'
                                : 'border-white/10 bg-white/5 text-subtle hover:border-accent hover:text-white'
                            }`}
                          >
                            {player.name} · {player.posToStr()} · {player.skill.toFixed(1)}
                          </button>
                        ))}
                        {bench.length === 0 && <p className="text-xs text-subtle">Bench empty.</p>}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-subtle">
                  Start a live match to make substitutions and control the tempo minute by minute.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-accent">Latest fixture</h3>
            <p className="mt-2 text-sm text-subtle">
              {lastMatch
                ? `${lastMatch.teams[0].name} vs ${lastMatch.teams[1].name} · ${formatScore(lastMatch, team)}`
                : 'No matches played yet.'}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-accent">Timeline</h3>
            <div className="mt-2 space-y-2 text-xs text-subtle">
              {renderedTimeline.length === 0 && <p>No notable events yet.</p>}
              {renderedTimeline.map((event, index) => (
                <div key={`${event.type}-${event.minute}-${index}`} className="rounded-xl bg-white/5 px-3 py-2 text-white/80">
                  <span className="font-semibold text-accent">{event.minute}&apos; · {event.team}</span> — {event.description}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
