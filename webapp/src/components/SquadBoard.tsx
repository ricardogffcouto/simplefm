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
  { label: 'Starting XI', status: 0, description: 'Players currently selected for the match.' },
  { label: 'Bench', status: 1, description: 'Players available as substitutes.' },
  { label: 'Reserves', status: 2, description: 'Players outside the matchday squad.' }
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

export function SquadBoard({ team, allowedTactics, currentTactic, onSetTactic, onSwapPlayers, onFeedback }: SquadBoardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const tacticOptions = useMemo(() => {
    const unique = new Map<string, number[]>();
    allowedTactics.forEach((tactic) => {
      unique.set(tacticLabel(tactic), tactic);
    });
    return Array.from(unique.entries()).map(([label, tactic]) => ({ label, tactic }));
  }, [allowedTactics]);

  const groupedPlayers = STATUS_CONFIG.map((config) => ({
    ...config,
    players: team.players
      .filter((player) => player.playingStatus === config.status)
      .slice()
      .sort((a, b) => b.skill - a.skill)
  }));

  const currentTacticLabel = useMemo(() => {
    const label = tacticLabel(currentTactic);
    if (tacticOptions.some((option) => option.label === label)) {
      return label;
    }
    return tacticOptions[0]?.label ?? '';
  }, [currentTactic, tacticOptions]);

  const handleTacticChange = (label: string) => {
    const entry = tacticOptions.find((option) => option.label === label);
    if (!entry) {
      return;
    }
    const result = onSetTactic(entry.tactic);
    onFeedback(result);
  };

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

  return (
    <div className="flex flex-col gap-4">
      <div className="kivy-list flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold uppercase tracking-wide">Formation</h3>
          <p className="kivy-subtle text-sm">Select a tactic to organise your matchday squad.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide">Tactic</label>
          <select
            value={currentTacticLabel}
            onChange={(event) => handleTacticChange(event.target.value)}
            className="rounded-lg border-2 border-black/15 bg-white px-3 py-2 text-sm"
          >
            {tacticOptions.map(({ label }) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {groupedPlayers.map((group) => (
          <div key={group.label} className="kivy-list p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-semibold uppercase tracking-wide">{group.label}</h4>
                <p className="kivy-subtle text-xs">{group.description}</p>
              </div>
              <span className="text-xs font-semibold text-black/60">{group.players.length}</span>
            </div>
            <div className="kivy-scroll mt-3 max-h-72 space-y-2 overflow-y-auto">
              {group.players.map((player) => {
                const isSelected = selectedPlayer === player;
                const unavailable = !player.matchAvailable();
                return (
                  <button
                    key={`${player.name}-${player.age}-${player.position}`}
                    onClick={() => handleSelect(player)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      isSelected ? 'border-[#f5d767] bg-[#f5d767]/40' : 'border-black/15 bg-white hover:border-[#f5d767]'
                    } ${unavailable ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{player.name}</span>
                      <span>{positionLabel(player.position)}</span>
                    </div>
                    <p className="kivy-subtle text-xs">
                      Skill {player.skill.toFixed(1)} · Age {player.age} · Wage €{player.salary.toLocaleString()}
                    </p>
                    <p className="text-[0.7rem] text-black/60">
                      {player.injured() ? 'Injured' : player.matchAvailable() ? 'Available' : 'Unavailable'}
                    </p>
                  </button>
                );
              })}
              {group.players.length === 0 && (
                <p className="kivy-subtle text-sm">No players in this group.</p>
              )}
            </div>
            <p className="kivy-subtle mt-3 text-xs">
              Tap once to select a player, then tap another player to swap their match status.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
