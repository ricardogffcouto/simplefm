'use client';

import type { PostMatchSummary } from '@/hooks/postMatchSummary';

interface Props {
  summary: PostMatchSummary;
  onClose: () => void;
}

const trainingColors: Record<PostMatchSummary['training'][number]['label'], string> = {
  '': 'text-subtle',
  '++': 'text-emerald-300',
  '+': 'text-emerald-200',
  '-': 'text-amber-200',
  '--': 'text-red-300'
};

export function PostMatchSummaryModal({ summary, onClose }: Props) {
  const { match, training, finances, news, table } = summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/80 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
        <div className="flex flex-col gap-5">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Week {summary.week} summary</h2>
              <p className="text-xs text-subtle">
                Season {summary.season} · Fan happiness {Math.round(summary.fanHappiness)} · Balance €
                {summary.balance.toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-accent/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-midnight transition hover:bg-accent"
            >
              Continue
            </button>
          </header>

          {match ? (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-subtle">Result</p>
                  <p className="text-lg font-semibold text-white">
                    {match.home} {match.score[0]} - {match.score[1]} {match.away}
                  </p>
                  <p className="text-xs text-subtle">
                    {match.venue} · {match.result}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-midnight/60 px-3 py-2 text-xs text-subtle">
                  <p>Goals</p>
                  {match.scorers.length === 0 ? (
                    <p className="mt-1 text-white/70">No goals recorded.</p>
                  ) : (
                    <ul className="mt-1 space-y-1 text-white/80">
                      {match.scorers.map((goal, index) => (
                        <li key={`${goal.minute}-${goal.team}-${index}`}>
                          <span className="text-accent">{goal.minute}&apos;</span> {goal.scorer} ({goal.team})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-subtle">
              No fixture took place this week. Your staff still processed contracts, finances and training.
            </section>
          )}

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-accent">Training highlights</h3>
              {training.length === 0 ? (
                <p className="mt-3 text-xs text-subtle">No notable training changes this week.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-xs text-subtle">
                  {training.map((item) => (
                    <li
                      key={`${item.player}-${item.position}-${item.amount}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-midnight/60 px-3 py-2"
                    >
                      <span className="text-white">
                        {item.player} · {item.position}
                      </span>
                      <span className={`${trainingColors[item.label]} font-semibold`}>
                        {item.label} ({item.amount.toFixed(2)})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-accent">Finances</h3>
              {finances.length === 0 ? (
                <p className="mt-3 text-xs text-subtle">No financial movement recorded this week.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-xs text-subtle">
                  {finances.map((line) => (
                    <li key={line.label} className="flex items-center justify-between rounded-2xl bg-midnight/60 px-3 py-2">
                      <span className="text-white">{line.label}</span>
                      <span className={line.amount >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                        €{line.amount.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-accent">League table</h3>
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs text-subtle">
                <thead className="bg-white/5 uppercase">
                  <tr>
                    <th className="px-3 py-2">Pos</th>
                    <th className="px-3 py-2">Club</th>
                    <th className="px-3 py-2">Pts</th>
                    <th className="px-3 py-2">GD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {table.map((row) => (
                    <tr
                      key={`${row.position}-${row.name}`}
                      className={row.highlight ? 'bg-accent/20 text-white' : 'text-subtle hover:bg-white/5'}
                    >
                      <td className="px-3 py-2 font-semibold text-accent">{row.position}</td>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.points}</td>
                      <td className="px-3 py-2">{row.goalDifference}</td>
                    </tr>
                  ))}
                  {table.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-subtle">
                        League standings unavailable this week.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-accent">Club news</h3>
            {news.length === 0 ? (
              <p className="mt-3 text-xs text-subtle">The press office had nothing to report.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-xs text-subtle">
                {news.map((item, index) => (
                  <li key={`${item}-${index}`} className="rounded-2xl bg-midnight/60 px-3 py-2 text-white/80">
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
