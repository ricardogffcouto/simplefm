'use client';

import type { PostMatchSummary } from '@/hooks/postMatchSummary';

interface Props {
  summary: PostMatchSummary;
  onClose: () => void;
}

const trainingColors: Record<PostMatchSummary['training'][number]['label'], string> = {
  '': 'text-black/70',
  '++': 'text-emerald-700',
  '+': 'text-emerald-600',
  '-': 'text-amber-600',
  '--': 'text-red-600'
};

export function PostMatchSummaryModal({ summary, onClose }: Props) {
  const { match, training, finances, news, table } = summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="kivy-panel w-full max-w-4xl overflow-hidden">
        <header className="kivy-header flex items-center justify-between px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold uppercase tracking-[0.3em]">Week {summary.week} summary</h2>
            <p className="text-xs text-white/80">
              Season {summary.season} · Fan happiness {Math.round(summary.fanHappiness)} · Balance €
              {summary.balance.toLocaleString()}
            </p>
          </div>
          <button type="button" className="kivy-button px-6 py-2 text-xs" onClick={onClose}>
            Continue
          </button>
        </header>

        <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
          <section className="kivy-list p-4 md:col-span-2">
            <h3 className="text-base font-semibold uppercase tracking-wide">Match</h3>
            {match ? (
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xl font-semibold text-black">{match.home} {match.score[0]} - {match.score[1]} {match.away}</p>
                  <p className="kivy-subtle text-sm">
                    {match.venue} · {match.result}
                  </p>
                </div>
                <div className="kivy-list kivy-panel--flat border border-black/10 bg-white px-3 py-2 text-sm">
                  <p className="font-semibold">Goals</p>
                  {match.scorers.length === 0 ? (
                    <p className="kivy-subtle text-xs">No goals recorded.</p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-xs">
                      {match.scorers.map((goal, index) => (
                        <li key={`${goal.minute}-${goal.team}-${index}`}>
                          <span className="font-semibold text-black/80">{goal.minute}&apos;</span> {goal.scorer} ({goal.team})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <p className="kivy-subtle mt-3 text-sm">No fixture took place this week. Staff still processed finances and training.</p>
            )}
          </section>

          <section className="kivy-list p-4">
            <h3 className="text-base font-semibold uppercase tracking-wide">Training highlights</h3>
            {training.length === 0 ? (
              <p className="kivy-subtle mt-2 text-sm">No notable training changes this week.</p>
            ) : (
              <ul className="kivy-scroll mt-3 max-h-40 space-y-2 overflow-y-auto text-sm">
                {training.map((item) => (
                  <li
                    key={`${item.player}-${item.position}-${item.amount}`}
                    className="rounded-lg border border-black/15 bg-white px-3 py-2 flex items-center justify-between"
                  >
                    <span>{item.player} · {item.position}</span>
                    <span className={`${trainingColors[item.label]} font-semibold`}>
                      {item.label} ({item.amount.toFixed(2)})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="kivy-list p-4">
            <h3 className="text-base font-semibold uppercase tracking-wide">Finances</h3>
            {finances.length === 0 ? (
              <p className="kivy-subtle mt-2 text-sm">No financial movement recorded this week.</p>
            ) : (
              <ul className="kivy-scroll mt-3 max-h-40 space-y-2 overflow-y-auto text-sm">
                {finances.map((line) => (
                  <li key={line.label} className="rounded-lg border border-black/15 bg-white px-3 py-2 flex items-center justify-between">
                    <span>{line.label}</span>
                    <span className={line.amount >= 0 ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'}>
                      €{line.amount.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="kivy-list p-4">
            <h3 className="text-base font-semibold uppercase tracking-wide">League table</h3>
            <div className="kivy-scroll mt-3 max-h-48 overflow-y-auto">
              <table className="min-w-full border-separate border-spacing-y-1 text-left text-xs">
                <thead className="bg-white/80 uppercase">
                  <tr>
                    <th className="px-3 py-2">Pos</th>
                    <th className="px-3 py-2">Club</th>
                    <th className="px-3 py-2">Pts</th>
                    <th className="px-3 py-2">GD</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((row) => (
                    <tr key={`${row.position}-${row.name}`} className={row.highlight ? 'bg-[#f5d767]/60 font-semibold' : 'bg-white/95'}>
                      <td className="px-3 py-2">{row.position}</td>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.points}</td>
                      <td className="px-3 py-2">{row.goalDifference}</td>
                    </tr>
                  ))}
                  {table.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-sm">
                        League standings unavailable this week.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="kivy-list p-4 md:col-span-2">
            <h3 className="text-base font-semibold uppercase tracking-wide">Club news</h3>
            {news.length === 0 ? (
              <p className="kivy-subtle mt-2 text-sm">The press office had nothing to report.</p>
            ) : (
              <ul className="kivy-scroll mt-3 max-h-40 space-y-2 overflow-y-auto text-sm">
                {news.map((item, index) => (
                  <li key={`${item}-${index}`} className="rounded-lg border border-black/15 bg-white px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
