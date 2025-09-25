'use client';

import type { Manager } from '@/game';

interface ManagerStatsPanelProps {
  manager: Manager | null;
  onClose: () => void;
}

export function ManagerStatsPanel({ manager, onClose }: ManagerStatsPanelProps) {
  if (!manager) {
    return (
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="kivy-list p-6 text-sm">
          <p>No human manager is currently assigned to this club.</p>
        </div>
        <div className="flex justify-end">
          <button type="button" className="kivy-button kivy-button--secondary" onClick={onClose}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const order = manager.careerStatsOrder();
  const careerStats = manager.careerStats();
  const yearlyStats = manager.yearlyStats.slice().reverse();

  return (
    <div className="flex h-full flex-col gap-4">
      <section className="kivy-list p-4">
        <h3 className="text-base font-semibold uppercase tracking-wide">Career stats</h3>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {order.map((label) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-2">
              <span className="font-semibold">{label}</span>
              <span>{careerStats[label as keyof typeof careerStats]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="kivy-list p-4">
        <h3 className="text-base font-semibold uppercase tracking-wide">Yearly stats</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-1 text-left text-sm">
            <thead>
              <tr className="bg-white/70">
                <th className="px-3 py-2">Season</th>
                <th className="px-3 py-2">Division</th>
                <th className="px-3 py-2">Pos</th>
                <th className="px-3 py-2">Pts</th>
                <th className="px-3 py-2">W</th>
                <th className="px-3 py-2">D</th>
                <th className="px-3 py-2">L</th>
                <th className="px-3 py-2">GF</th>
                <th className="px-3 py-2">GA</th>
              </tr>
            </thead>
            <tbody>
              {yearlyStats.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-4 text-center text-sm">
                    No completed seasons yet.
                  </td>
                </tr>
              )}
              {yearlyStats.map((season, index) => (
                <tr key={`${season.div}-${index}`} className="bg-white/80">
                  <td className="px-3 py-2">{yearlyStats.length - index}</td>
                  <td className="px-3 py-2">{season.div}</td>
                  <td className="px-3 py-2">{season.pos}</td>
                  <td className="px-3 py-2">{season.pts}</td>
                  <td className="px-3 py-2">{season.Wins}</td>
                  <td className="px-3 py-2">{season.Draws}</td>
                  <td className="px-3 py-2">{season.Losses}</td>
                  <td className="px-3 py-2">{season['Goals For']}</td>
                  <td className="px-3 py-2">{season['Goals Against']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" className="kivy-button kivy-button--secondary" onClick={onClose}>
          Back
        </button>
      </div>
    </div>
  );
}
