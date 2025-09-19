'use client';

import { useMemo, useState } from 'react';
import { COLORS, COMPETITION, COUNTRIES } from '@/game';
import type { NewGamePayload } from '@/hooks/useGameEngine';

interface Props {
  availableTeams: string[];
  onStart: (payload: NewGamePayload) => void;
}

export function NewGameForm({ availableTeams, onStart }: Props) {
  const [gameName, setGameName] = useState('My Federation');
  const [managerName, setManagerName] = useState('Manager');
  const [selectedTeam, setSelectedTeam] = useState<string>(availableTeams[0] ?? '');
  const [customName, setCustomName] = useState('');
  const [customCountry, setCustomCountry] = useState(COUNTRIES[0]?.id ?? 'Eng');
  const [customColor, setCustomColor] = useState(COLORS[0]?.hex ?? '#485C96');
  const [customDivision, setCustomDivision] = useState(1);
  const [customPosition, setCustomPosition] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const useCustomTeam = selectedTeam === 'Create custom club';

  const teamOptions = useMemo(
    () => ['Create custom club', ...availableTeams],
    [availableTeams]
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!gameName.trim()) {
      setError('Game name cannot be empty.');
      return;
    }
    if (!managerName.trim()) {
      setError('Manager name cannot be empty.');
      return;
    }

    if (useCustomTeam) {
      if (!customName.trim()) {
        setError('Custom club requires a name.');
        return;
      }
      onStart({
        gameName,
        managerName,
        teamName: customName,
        customTeam: {
          name: customName,
          color: customColor,
          country: customCountry,
          division: customDivision,
          position: customPosition
        }
      });
      setError(null);
    } else {
      onStart({
        gameName,
        managerName,
        teamName: selectedTeam,
        customTeam: null
      });
      setError(null);
    }
  };

  return (
    <form onSubmit={submit} className="card-surface w-full max-w-xl space-y-6 p-6 sm:p-10">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-accent">Take over a club</h2>
        <p className="text-subtle text-sm">
          Craft your legacy with a modern experience inspired by the golden age of online football managers.
        </p>
      </div>
      <div className="grid gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-subtle">Game name</span>
          <input
            value={gameName}
            onChange={(event) => setGameName(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            placeholder="Weekend Warriors"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-subtle">Manager name</span>
          <input
            value={managerName}
            onChange={(event) => setManagerName(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            placeholder="Alex F."
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-subtle">Select club</span>
          <select
            value={selectedTeam}
            onChange={(event) => setSelectedTeam(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
          >
            {teamOptions.map((team) => (
              <option key={team} value={team} className="bg-midnight">
                {team}
              </option>
            ))}
          </select>
        </label>
      </div>

      {useCustomTeam && (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur">
          <h3 className="text-lg font-semibold text-accent">Custom club</h3>
          <p className="text-xs text-subtle">Choose your identity, formation placement and home colors.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-subtle">Club name</span>
              <input
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                placeholder="Greendale Rovers"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-subtle">Country</span>
              <select
                value={customCountry}
                onChange={(event) => setCustomCountry(event.target.value)}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              >
                {COUNTRIES.map((country) => (
                  <option key={country.id} value={country.id} className="bg-midnight">
                    {country.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-subtle">Division</span>
              <select
                value={customDivision}
                onChange={(event) => setCustomDivision(Number(event.target.value))}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              >
                {Array.from({ length: COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value} className="bg-midnight">
                    League {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-subtle">Previous position</span>
              <select
                value={customPosition}
                onChange={(event) => setCustomPosition(Number(event.target.value))}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
              >
                {Array.from({ length: COMPETITION['TEAMS PER DIVISION'] }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value} className="bg-midnight">
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs uppercase tracking-wide text-subtle">Primary color</span>
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-full border border-white/20"
                  style={{ background: customColor }}
                />
                <select
                  value={customColor}
                  onChange={(event) => setCustomColor(event.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
                >
                  {COLORS.map((color) => (
                    <option key={color.name} value={color.hex} className="bg-midnight">
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
        </div>
      )}

      {error && <p className="text-sm font-medium text-red-400">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-full bg-accent/90 py-3 text-sm font-semibold uppercase tracking-wider text-midnight transition hover:bg-accent"
      >
        Start my journey
      </button>
    </form>
  );
}
