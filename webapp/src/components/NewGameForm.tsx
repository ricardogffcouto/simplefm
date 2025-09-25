'use client';

import { useMemo, useState, type SVGProps } from 'react';
import { COLORS, COMPETITION, COUNTRIES } from '@/game';
import type { NewGamePayload } from '@/hooks/useGameEngine';

const DEFAULT_TEAM_OPTION = 'Create new team';

function BackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" {...props}>
      <rect x="6" y="6" width="52" height="52" rx="8" fill="#f0f0f0" stroke="#1f1f1f" strokeWidth="4" />
      <path
        d="M30 19 16 32l14 13"
        fill="none"
        stroke="#1f1f1f"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 32h16"
        fill="none"
        stroke="#1f1f1f"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" {...props}>
      <rect x="6" y="6" width="52" height="52" rx="12" fill="#d1eacd" stroke="#1f1f1f" strokeWidth="4" />
      <path
        d="M22 34.5 30.5 43 46 25"
        fill="none"
        stroke="#1f1f1f"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getContrastColor(hexColor: string) {
  const sanitized = hexColor.replace('#', '');
  const expanded =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : sanitized;
  const red = parseInt(expanded.slice(0, 2), 16);
  const green = parseInt(expanded.slice(2, 4), 16);
  const blue = parseInt(expanded.slice(4, 6), 16);
  const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;
  return luminance > 180 ? '#111111' : '#f6f6f6';
}

interface Props {
  availableTeams: string[];
  onStart: (payload: NewGamePayload) => void;
  onCancel: () => void;
}

export function NewGameForm({ availableTeams, onStart, onCancel }: Props) {
  const teamOptions = useMemo(() => [DEFAULT_TEAM_OPTION, ...availableTeams], [availableTeams]);

  const [gameName, setGameName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>(DEFAULT_TEAM_OPTION);
  const [customName, setCustomName] = useState('');
  const [customCountry, setCustomCountry] = useState<string>(COUNTRIES[0]?.id ?? 'Eng');
  const [customColor, setCustomColor] = useState<string>(COLORS[0]?.hex ?? '#485C96');
  const [customColorName, setCustomColorName] = useState<string>(COLORS[0]?.name ?? 'Blue');
  const [customDivision, setCustomDivision] = useState(1);
  const [customPosition, setCustomPosition] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const useCustomTeam = selectedTeam === DEFAULT_TEAM_OPTION;
  const customColorText = useMemo(() => getContrastColor(customColor), [customColor]);

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
    <form onSubmit={submit} className="kivy-new-game-form" aria-label="New game form">
      <div className="kivy-new-game-panel">
        <header className="kivy-main-header">New Game</header>

        <div className="kivy-form-row">
          <div className="kivy-light-header">Game name</div>
          <div className="kivy-field">
            <input
              value={gameName}
              onChange={(event) => {
                resetError();
                setGameName(event.target.value);
              }}
              placeholder="Max 16 char, only letters and numbers"
              maxLength={16}
              className="kivy-input"
            />
          </div>
        </div>

        <div className="kivy-form-row">
          <div className="kivy-light-header">Manager name</div>
          <div className="kivy-field">
            <input
              value={managerName}
              onChange={(event) => {
                resetError();
                setManagerName(event.target.value);
              }}
              placeholder="Max 16 char, only letters and numbers"
              maxLength={16}
              className="kivy-input"
            />
          </div>
        </div>

        <div className="kivy-form-row">
          <div className="kivy-light-header">Team</div>
          <div className="kivy-field">
            <select
              value={selectedTeam}
              onChange={(event) => {
                setSelectedTeam(event.target.value);
                resetError();
              }}
              className="kivy-select"
            >
              {teamOptions.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>
        </div>

        {useCustomTeam && (
          <div className="kivy-subpanel" aria-label="Create new team fields">
            <div className="kivy-form-row">
              <div className="kivy-light-header">Name</div>
              <div className="kivy-field">
                <input
                  value={customName}
                  onChange={(event) => {
                    setCustomName(event.target.value);
                    resetError();
                  }}
                  placeholder="Max 16 char, only letters and numbers"
                  maxLength={16}
                  className="kivy-input"
                />
              </div>
            </div>

            <div className="kivy-form-row">
              <div className="kivy-light-header">Color</div>
              <div className="kivy-field">
                <select
                  value={customColorName}
                  onChange={(event) => {
                    const color = COLORS.find((entry) => entry.name === event.target.value);
                    if (color) {
                      setCustomColor(color.hex);
                      setCustomColorName(color.name);
                    }
                  }}
                  className="kivy-select"
                  style={{ background: customColor, color: customColorText }}
                >
                  {COLORS.map((color) => (
                    <option key={color.name} value={color.name}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="kivy-form-row">
              <div className="kivy-light-header">Country</div>
              <div className="kivy-field">
                <select
                  value={customCountry}
                  onChange={(event) => setCustomCountry(event.target.value)}
                  className="kivy-select"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="kivy-section-header">Division and position</div>

            <div className="kivy-form-row kivy-form-row--split">
              <div className="kivy-light-header">Div</div>
              <div className="kivy-field">
                <select
                  value={customDivision}
                  onChange={(event) => setCustomDivision(Number(event.target.value))}
                  className="kivy-select"
                >
                  {Array.from({ length: COMPETITION['TOTAL_NUMBER_OF_DIVISIONS'] }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="kivy-light-header">Pos</div>
              <div className="kivy-field">
                <select
                  value={customPosition}
                  onChange={(event) => setCustomPosition(Number(event.target.value))}
                  className="kivy-select"
                >
                  {Array.from({ length: COMPETITION['TEAMS PER DIVISION'] }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {error && <div className="kivy-error" role="alert">{error}</div>}

        <div className="kivy-form-spacer" aria-hidden="true" />

        <footer className="kivy-form-footer">
          <button type="button" className="kivy-action-button kivy-action-button--back" onClick={onCancel}>
            <BackIcon />
            <span>Back</span>
          </button>
          <button type="submit" className="kivy-action-button kivy-action-button--primary">
            <CheckIcon />
            <span>Create Game</span>
          </button>
        </footer>
      </div>
    </form>
  );
}
