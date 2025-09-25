'use client';

import { useMemo, useState } from 'react';
import { COLORS, COMPETITION, COUNTRIES } from '@/game';
import type { NewGamePayload } from '@/hooks/useGameEngine';

interface Props {
  availableTeams: string[];
  onStart: (payload: NewGamePayload) => void;
  onCancel: () => void;
}

export function NewGameForm({ availableTeams, onStart, onCancel }: Props) {
  const teamOptions = useMemo(() => ['Create new team', ...availableTeams], [availableTeams]);

  const [gameName, setGameName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('Create new team');
  const [customName, setCustomName] = useState('');
  const [customCountry, setCustomCountry] = useState<string>(COUNTRIES[0]?.id ?? 'Eng');
  const [customColor, setCustomColor] = useState<string>(COLORS[0]?.hex ?? '#485C96');
  const [customColorName, setCustomColorName] = useState<string>(COLORS[0]?.name ?? 'Blue');
  const [customDivision, setCustomDivision] = useState(1);
  const [customPosition, setCustomPosition] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const useCustomTeam = selectedTeam === 'Create new team';

  const resetError = () => setError(null);

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
        setError('Please set a name for your new team.');
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
    <form onSubmit={submit} className="kivy-panel w-full max-w-4xl overflow-hidden">
      <header className="kivy-header px-6 py-4 text-center text-lg font-semibold uppercase tracking-[0.35em]">
        New Game
      </header>
      <div className="space-y-6 px-6 py-6">
        <div className="grid gap-3 sm:grid-cols-[0.85fr_1.15fr] sm:items-center">
          <label className="text-sm font-semibold uppercase tracking-wide">Game name</label>
          <input
            value={gameName}
            onChange={(event) => {
              resetError();
              setGameName(event.target.value);
            }}
            placeholder="Max 16 characters"
            maxLength={16}
            className="rounded-lg border-2 border-black/15 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-[0.85fr_1.15fr] sm:items-center">
          <label className="text-sm font-semibold uppercase tracking-wide">Manager name</label>
          <input
            value={managerName}
            onChange={(event) => {
              resetError();
              setManagerName(event.target.value);
            }}
            placeholder="Max 16 characters"
            maxLength={16}
            className="rounded-lg border-2 border-black/15 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-[0.85fr_1.15fr] sm:items-center">
          <label className="text-sm font-semibold uppercase tracking-wide">Team</label>
          <select
            value={selectedTeam}
            onChange={(event) => {
              setSelectedTeam(event.target.value);
              resetError();
            }}
            className="rounded-lg border-2 border-black/15 bg-white px-3 py-2 text-sm"
          >
            {teamOptions.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        {useCustomTeam && (
          <div className="rounded-2xl border-2 border-black/10 bg-white/90 p-4">
            <h3 className="text-base font-semibold uppercase tracking-wide">Create new team</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold uppercase tracking-wide">Name</span>
                <input
                  value={customName}
                  onChange={(event) => {
                    setCustomName(event.target.value);
                    resetError();
                  }}
                  placeholder="Max 16 characters"
                  maxLength={16}
                  className="rounded-lg border-2 border-black/15 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold uppercase tracking-wide">Country</span>
                <select
                  value={customCountry}
                  onChange={(event) => setCustomCountry(event.target.value)}
                  className="rounded-lg border-2 border-black/15 bg-white px-3 py-2 text-sm"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold uppercase tracking-wide">Division</span>
                <select
                  value={customDivision}
                  onChange={(event) => setCustomDivision(Number(event.target.value))}
                  className="rounded-lg border-2 border-black/15 bg-white px-3 py-2 text-sm"
                >
                  {Array.from({ length: COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold uppercase tracking-wide">Position</span>
                <select
                  value={customPosition}
                  onChange={(event) => setCustomPosition(Number(event.target.value))}
                  className="rounded-lg border-2 border-black/15 bg-white px-3 py-2 text-sm"
                >
                  {Array.from({ length: COMPETITION['TEAMS PER DIVISION'] }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-semibold uppercase tracking-wide">Team color</span>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full border-2 border-black/15" style={{ background: customColor }} />
                  <select
                    value={customColorName}
                    onChange={(event) => {
                      const color = COLORS.find((entry) => entry.name === event.target.value);
                      if (color) {
                        setCustomColor(color.hex);
                        setCustomColorName(color.name);
                      }
                    }}
                    className="flex-1 rounded-lg border-2 border-black/15 bg-white px-3 py-2 text-sm"
                  >
                    {COLORS.map((color) => (
                      <option key={color.name} value={color.name}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>
          </div>
        )}

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      </div>
      <footer className="kivy-footer flex items-center justify-end gap-3 px-6 py-4">
        <button type="button" className="kivy-button kivy-button--secondary" onClick={onCancel}>
          Back
        </button>
        <button type="submit" className="kivy-button">
          Create Game
        </button>
      </footer>
    </form>
  );
}
