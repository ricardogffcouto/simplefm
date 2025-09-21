'use client';

import { useMemo } from 'react';
import type { Team } from '@/game';
import { trainingToStr, type TrainingDelta } from '@/game/helpers';

interface TrainingPanelProps {
  team: Team;
}

const trainingColors: Record<TrainingDelta | '·', string> = {
  '++': 'text-emerald-300',
  '+': 'text-emerald-200',
  '-': 'text-amber-200',
  '--': 'text-red-300',
  '': 'text-subtle',
  '·': 'text-subtle'
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
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-accent">Weekly training report</h3>
          <p className="text-xs text-subtle">Improvements and regressions based on match minutes.</p>
        </div>
        <span className="text-xs text-subtle">{players.length} players</span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left text-xs text-subtle">
          <thead className="bg-white/5 uppercase">
            <tr>
              <th className="px-3 py-2">Pos</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Age</th>
              <th className="px-3 py-2">Skill</th>
              <th className="px-3 py-2">Training</th>
              <th className="px-3 py-2">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {players.map((player) => (
              <tr key={`${player.name}-${player.age}-${player.position}`} className="hover:bg-white/5">
                <td className="px-3 py-2 text-white">{player.posToStr()}</td>
                <td className="px-3 py-2 text-white">{player.name}</td>
                <td className="px-3 py-2">{player.age}</td>
                <td className="px-3 py-2">{player.skill.toFixed(1)}</td>
                <td className="px-3 py-2">{player.weeklyTraining.toFixed(2)}</td>
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
                <td colSpan={6} className="px-3 py-6 text-center text-subtle">
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
