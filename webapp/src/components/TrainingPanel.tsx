'use client';

import { useMemo } from 'react';
import type { Team } from '@/game';
import { trainingToStr, type TrainingDelta } from '@/game/helpers';

interface TrainingPanelProps {
  team: Team;
}

const trainingColors: Record<TrainingDelta | '·', string> = {
  '++': 'text-emerald-700',
  '+': 'text-emerald-600',
  '-': 'text-amber-600',
  '--': 'text-red-600',
  '': 'text-black/60',
  '·': 'text-black/60'
};

export function TrainingPanel({ team }: TrainingPanelProps) {
  const players = useMemo(
    () =>
      team.players
        .slice()
        .sort((a, b) => a.position - b.position || b.skill - a.skill),
    [team.players]
  );

  return (
    <div className="kivy-list p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold uppercase tracking-wide">Weekly training report</h3>
          <p className="kivy-subtle text-sm">Improvements and regressions based on match minutes.</p>
        </div>
        <span className="text-xs font-semibold text-black/60">{players.length} players</span>
      </div>
      <div className="kivy-scroll mt-3 max-h-[26rem] overflow-y-auto">
        <table className="min-w-full border-separate border-spacing-y-1 text-left text-sm">
          <thead className="bg-white/80 text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Pos</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Age</th>
              <th className="px-3 py-2">Skill</th>
              <th className="px-3 py-2">Training</th>
              <th className="px-3 py-2">Trend</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={`${player.name}-${player.age}-${player.position}`} className="bg-white/95">
                <td className="px-3 py-2 font-semibold text-black/80">{player.posToStr()}</td>
                <td className="px-3 py-2 font-semibold text-black/80">{player.name}</td>
                <td className="px-3 py-2 text-black/70">{player.age}</td>
                <td className="px-3 py-2 text-black/70">{player.skill.toFixed(1)}</td>
                <td className="px-3 py-2 text-black/70">{player.weeklyTraining.toFixed(2)}</td>
                {(() => {
                  const label = trainingToStr(player.weeklyTraining);
                  const token: TrainingDelta | '·' = label === '' ? '·' : label;
                  return (
                    <td className={`px-3 py-2 font-semibold ${trainingColors[token]}`}>
                      {token}
                    </td>
                  );
                })()}
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm">
                  No training data recorded this week.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
