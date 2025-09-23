'use client';

import { useMemo, useState } from 'react';
import type { Player, Team } from '@/game';
import type { OperationResult } from '@/hooks/useGameEngine';

interface SquadBoardProps {
  team: Team;
  allowedTactics: number[][];
  currentTactic: number[];
  onSetTactic: (tactic: number[]) => OperationResult;
  onSwapPlayers: (playerA: Player, playerB: Player) => OperationResult;
  onFeedback: (result: OperationResult) => void;
}

const STATUS_CONFIG: Array<{ label: string; status: number; description: string }> = [
  { label: 'Starting XI', status: 0, description: 'Players on the pitch.' },
  { label: 'Bench', status: 1, description: 'Available substitutes.' },
  { label: 'Reserves', status: 2, description: 'Outside the matchday squad.' }
];

function tacticLabel(tactic: number[]): string {
  return tactic.join('-');
}

function positionLabel(position: number): string {
  if (position === 0) return 'GK';
  if (position === 1) return 'DF';
  if (position === 2) return 'MF';
  return 'FW';
}

export function SquadBoard({
  team,
  allowedTactics,
  currentTactic,
  onSetTactic,
  onSwapPlayers,
  onFeedback
}: SquadBoardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const tacticOptions = useMemo(() => {
    const unique = new Map<string, number[]>();
    allowedTactics.forEach((tactic) => {
      unique.set(tacticLabel(tactic), tactic);
    });
    return Array.from(unique.entries()).map(([label, tactic]) => ({ label, tactic }));
  }, [allowedTactics]);

  const currentTacticLabel = currentTactic.length > 0 ? tacticLabel(currentTactic) : 'Auto';

  const groupedPlayers = STATUS_CONFIG.map((config) => ({
    ...config,
    players: team.players
      .filter((player) => player.playingStatus === config.status)
      .slice()
      .sort((a, b) => b.skill - a.skill)
  }));

  const handleSelect = (player: Player) => {
    if (!selectedPlayer) {
      setSelectedPlayer(player);
      return;
    }
    if (selectedPlayer === player) {
      setSelectedPlayer(null);
      return;
    }
    const result = onSwapPlayers(selectedPlayer, player);
    onFeedback(result);
    setSelectedPlayer(null);
  };

  const handleTacticClick = (tactic: number[]) => {
    const result = onSetTactic(tactic);
    onFeedback(result);
    setSelectedPlayer(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-subtle">Formation</h3>
          <p className="text-lg font-semibold text-white">Current: {currentTacticLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tacticOptions.map(({ label, tactic }) => {
            const active = label === currentTacticLabel;
            return (
              <button
                key={label}
                onClick={() => handleTacticClick(tactic)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  active ? 'bg-accent/90 text-midnight' : 'border border-white/20 text-subtle hover:border-accent hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {groupedPlayers.map((group) => (
          <div key={group.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-accent">{group.label}</h3>
                <p className="text-xs text-subtle">{group.description}</p>
              </div>
              <span className="text-xs text-subtle">{group.players.length} players</span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {group.players.map((player) => {
                const isSelected = selectedPlayer === player;
                const unavailable = !player.matchAvailable();
                return (
                  <button
                    key={`${player.name}-${player.age}-${player.position}`}
                    onClick={() => handleSelect(player)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
                      isSelected
                        ? 'border-accent bg-accent/20 text-white'
                        : 'border-white/10 bg-white/5 text-subtle hover:border-accent hover:text-white'
                    } ${unavailable ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-midnight/70 px-2 py-1 text-xs font-semibold text-accent">
                        {positionLabel(player.position)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{player.name}</p>
                        <p className="text-xs text-subtle">
                          Skill {player.skill.toFixed(1)} · Age {player.age} · Wage €{player.salary.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-subtle">
                      {player.injured() ? 'Injured' : player.matchAvailable() ? 'Available' : 'Unavailable'}
                    </div>
                  </button>
                );
              })}
              {group.players.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-subtle">
                  No players in this group.
                </p>
              )}
            </div>
            <p className="mt-3 text-[0.7rem] text-subtle">
              Tap once to select a player, then tap another player to swap their match status.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
