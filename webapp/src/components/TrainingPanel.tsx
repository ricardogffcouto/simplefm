'use client';

import { useMemo } from 'react';
import type { Team } from '@/game';
import { trainingToStr } from '@/game/helpers';
import { displayRating } from '@/utils/ratings';
import { getTrainingIndicator } from '@/utils/training';

interface TrainingPanelProps {
  team: Team;
}

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
              <th className="px-3 py-2">Trend</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={`${player.name}-${player.age}-${player.position}`} className="bg-white/95">
                <td className="px-3 py-2 font-semibold text-black/80">{player.posToStr()}</td>
                <td className="px-3 py-2 font-semibold text-black/80">{player.name}</td>
                <td className="px-3 py-2 text-black/70">{player.age}</td>
                <td className="px-3 py-2 text-black/70">{displayRating(player.skill)}</td>
                {(() => {
                  const label = trainingToStr(player.weeklyTraining);
                  const indicator = getTrainingIndicator(label);
                  return (
                    <td className={`px-3 py-2 font-semibold ${indicator.className}`}>
                      <span aria-hidden="true">{indicator.icon}</span>
                      <span className="sr-only">{indicator.description}</span>
                    </td>
                  );
                })()}
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm">
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
